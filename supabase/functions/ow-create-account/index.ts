import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

function emailFor(u: string) { return `${u.toLowerCase().replace(/[^a-z0-9_]/g, "")}@onderwereld.hdrp.local`; }
function tempPass() { return "Ow" + Math.random().toString(36).slice(2, 10) + "!"; }

const VALID_ROLES = ["onderwereld_proef", "onderwereld_coordinator", "onderwereld_hoofd"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });

    const { data: isHoofd } = await supa.rpc("is_onderwereld_hoofd", { _user_id: user.id });
    if (!isHoofd) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: cors });

    const { login_username, display_name, role } = await req.json();
    if (!login_username || !display_name || !role) return new Response(JSON.stringify({ error: "velden vereist" }), { status: 400, headers: cors });
    if (!VALID_ROLES.includes(role)) return new Response(JSON.stringify({ error: "ongeldige rol" }), { status: 400, headers: cors });

    const email = emailFor(login_username);
    const password = tempPass();
    const { data: created, error: cErr } = await supa.auth.admin.createUser({ email, password, email_confirm: true });
    if (cErr || !created.user) return new Response(JSON.stringify({ error: cErr?.message }), { status: 500, headers: cors });
    const uid = created.user.id;

    await supa.from("user_roles").insert({ user_id: uid, role });
    await supa.from("ow_profiles").insert({ user_id: uid, display_name });

    return new Response(JSON.stringify({ ok: true, temp_password: password, login_username, email }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
