import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

// Roblox game posts here every ~5 min with the list of usernames currently in-game.
// Body: { usernames: ["Player1","Player2"] }
// Header: x-meos-secret: <MEOS_ROBLOX_SECRET>
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const secret = req.headers.get("x-meos-secret");
    if (!secret || secret !== Deno.env.get("MEOS_ROBLOX_SECRET")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
    }
    const body = await req.json().catch(() => ({}));
    const list: string[] = Array.isArray(body?.usernames) ? body.usernames : [];
    const lower = new Set(list.map((s) => String(s).toLowerCase().trim()).filter(Boolean));

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: creators } = await supa.from("cc_creators").select("id, roblox_username").eq("is_active", true);

    const now = new Date().toISOString();
    let updated = 0;
    for (const c of creators || []) {
      if (!c.roblox_username) continue;
      const inGame = lower.has(String(c.roblox_username).toLowerCase().trim());
      const patch: Record<string, unknown> = { is_in_game: inGame };
      if (inGame) patch.last_ingame_ping_at = now;
      await supa.from("cc_creators").update(patch).eq("id", c.id);
      updated++;
    }
    return new Response(JSON.stringify({ ok: true, received: list.length, updated }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
