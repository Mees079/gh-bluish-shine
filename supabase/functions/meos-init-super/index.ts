import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const email = "hdrp@meos.hdrp.local";
    const username = "HDRP";
    const password = "Mees";

    const { data: existing } = await supa.from("meos_profiles").select("user_id").eq("roblox_username", username).maybeSingle();
    if (existing) return new Response(JSON.stringify({ ok: true, status: "exists" }), { headers: { ...cors, "Content-Type": "application/json" } });

    const { data: created, error: cErr } = await supa.auth.admin.createUser({ email, password, email_confirm: true });
    if (cErr || !created.user) return new Response(JSON.stringify({ error: cErr?.message }), { status: 500, headers: cors });
    const uid = created.user.id;
    await supa.from("meos_profiles").insert({ user_id: uid, roblox_username: username, must_change_password: false });
    // Give all MEOS roles
    const roles = ["meos_politie", "meos_dsi", "meos_commandant", "meos_hulpdiensten", "meos_bestuur"];
    for (const r of roles) await supa.from("user_roles").insert({ user_id: uid, role: r });

    return new Response(JSON.stringify({ ok: true, status: "created" }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
