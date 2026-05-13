import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

function emailFor(u: string) { return `${u.toLowerCase().replace(/[^a-z0-9]/g, "")}@meos.hdrp.local`; }
function tempPass() { return "Tmp" + Math.random().toString(36).slice(2, 10) + "!"; }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });

    const { data: roles } = await supa.from("user_roles").select("role").eq("user_id", user.id);
    const isHigh = roles?.some((r: any) => ["meos_dsi","meos_commandant","meos_hulpdiensten","meos_bestuur"].includes(r.role));
    if (!isHigh) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: cors });

    const { roblox_username, extra_roles = [] } = await req.json();
    if (!roblox_username) return new Response(JSON.stringify({ error: "roblox_username vereist" }), { status: 400, headers: cors });

    const email = emailFor(roblox_username);
    const password = tempPass();
    const { data: created, error: cErr } = await supa.auth.admin.createUser({ email, password, email_confirm: true });
    if (cErr || !created.user) return new Response(JSON.stringify({ error: cErr?.message }), { status: 500, headers: cors });
    const uid = created.user.id;
    await supa.from("meos_profiles").insert({ user_id: uid, roblox_username, must_change_password: true });
    await supa.from("user_roles").insert({ user_id: uid, role: "meos_politie" });
    for (const r of extra_roles) {
      if (["meos_dsi","meos_commandant","meos_hulpdiensten","meos_bestuur"].includes(r)) {
        await supa.from("user_roles").insert({ user_id: uid, role: r });
      }
    }
    return new Response(JSON.stringify({ ok: true, temp_password: password, email }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
