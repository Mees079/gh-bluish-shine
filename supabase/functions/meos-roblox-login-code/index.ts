import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const secret = req.headers.get("x-meos-secret");
    if (!secret || secret !== Deno.env.get("MEOS_ROBLOX_SECRET")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
    }
    const { roblox_username } = await req.json();
    if (!roblox_username) return new Response(JSON.stringify({ error: "roblox_username required" }), { status: 400, headers: cors });

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const code = genCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await supa.from("meos_login_codes").insert({ code, roblox_username, expires_at: expires });

    return new Response(JSON.stringify({ code, expires_at: expires }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
