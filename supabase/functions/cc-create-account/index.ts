import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

function emailFor(u: string) { return `${u.toLowerCase().replace(/[^a-z0-9_]/g, "")}@cc.hdrp.local`; }
function tempPass() { return "Cc" + Math.random().toString(36).slice(2, 10) + "!"; }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });

    const { data: isHead } = await supa.rpc("is_head_content_creator", { _user_id: user.id });
    if (!isHead) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: cors });

    const { login_username, tiktok_username, roblox_username, display_name, is_head = false } = await req.json();
    if (!login_username) return new Response(JSON.stringify({ error: "login_username vereist" }), { status: 400, headers: cors });
    if (!tiktok_username) return new Response(JSON.stringify({ error: "tiktok_username vereist" }), { status: 400, headers: cors });
    if (!roblox_username) return new Response(JSON.stringify({ error: "roblox_username vereist" }), { status: 400, headers: cors });

    const email = emailFor(login_username);
    const password = tempPass();
    const { data: created, error: cErr } = await supa.auth.admin.createUser({ email, password, email_confirm: true });
    if (cErr || !created.user) return new Response(JSON.stringify({ error: cErr?.message }), { status: 500, headers: cors });
    const uid = created.user.id;

    await supa.from("user_roles").insert({ user_id: uid, role: is_head ? "head_content_creator" : "content_creator" });
    const { error: iErr } = await supa.from("cc_creators").insert({
      user_id: uid,
      login_username: login_username.toLowerCase(),
      twitch_username: tiktok_username.toLowerCase().replace(/^@/, ""),
      roblox_username: roblox_username.trim(),
      display_name: display_name || tiktok_username,
    });
    if (iErr) return new Response(JSON.stringify({ error: iErr.message }), { status: 500, headers: cors });

    return new Response(JSON.stringify({ ok: true, temp_password: password, login_username, email }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
