import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const secret = req.headers.get("x-meos-secret");
    if (!secret || secret !== Deno.env.get("MEOS_ROBLOX_SECRET")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
    }
    const body = await req.json();
    const { location, type = "overval", details, status } = body;
    if (!location) return new Response(JSON.stringify({ error: "location required" }), { status: 400, headers: cors });

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Find or create location
    let { data: loc } = await supa.from("meos_locations").select("*").eq("name", location).maybeSingle();
    if (!loc) {
      const { data: newLoc } = await supa.from("meos_locations").insert({ name: location }).select().single();
      loc = newLoc;
    }

    const newStatus = status || (type === "overval" ? "onder_aanval" : "intact");
    await supa.from("meos_locations").update({ status: newStatus, last_signal_at: new Date().toISOString() }).eq("id", loc.id);

    if (type === "overval" || type === "incident") {
      await supa.from("meos_incidents").insert({
        location_id: loc.id,
        location_name: loc.name,
        type,
        details: details || null,
        status: "active",
      });
    } else if (type === "resolved") {
      await supa.from("meos_incidents").update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("location_id", loc.id).eq("status", "active");
      await supa.from("meos_locations").update({ status: "intact" }).eq("id", loc.id);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
