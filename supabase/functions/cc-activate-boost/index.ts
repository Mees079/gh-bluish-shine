import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!auth) return new Response(JSON.stringify({ error: "no auth" }), { status: 401, headers: cors });

    const url = Deno.env.get("SUPABASE_URL")!;
    const svc = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${auth}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: cors });

    const { inventory_id } = await req.json();
    if (!inventory_id) return new Response(JSON.stringify({ error: "inventory_id vereist" }), { status: 400, headers: cors });

    const { data: creator } = await svc.from("cc_creators").select("id,user_id").eq("user_id", user.id).maybeSingle();
    if (!creator) return new Response(JSON.stringify({ error: "Geen creator profiel" }), { status: 400, headers: cors });

    const { data: inv } = await svc.from("cc_boost_inventory").select("*").eq("id", inventory_id).maybeSingle();
    if (!inv) return new Response(JSON.stringify({ error: "Boost niet gevonden" }), { status: 404, headers: cors });
    if (inv.creator_id !== creator.id) return new Response(JSON.stringify({ error: "Geen toegang" }), { status: 403, headers: cors });
    if (inv.activated_at) return new Response(JSON.stringify({ error: "Boost is al geactiveerd" }), { status: 400, headers: cors });

    const endsAt = new Date(Date.now() + inv.duration_minutes * 60 * 1000);
    const { data: boost, error: bErr } = await svc.from("cc_boosts").insert({
      creator_id: creator.id,
      label: inv.label,
      multiplier: inv.multiplier,
      ends_at: endsAt.toISOString(),
      source: "inventory",
      points_spent: inv.points_spent,
    }).select().maybeSingle();
    if (bErr || !boost) return new Response(JSON.stringify({ error: "Activeren mislukt" }), { status: 500, headers: cors });

    await svc.from("cc_boost_inventory").update({
      activated_at: new Date().toISOString(),
      boost_id: boost.id,
    }).eq("id", inv.id);

    return new Response(JSON.stringify({ ok: true, boost }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
