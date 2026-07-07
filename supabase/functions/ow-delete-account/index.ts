import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

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

    const { user_id } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: "user_id vereist" }), { status: 400, headers: cors });
    if (user_id === user.id) return new Response(JSON.stringify({ error: "kan jezelf niet verwijderen" }), { status: 400, headers: cors });

    const { error } = await supa.auth.admin.deleteUser(user_id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
