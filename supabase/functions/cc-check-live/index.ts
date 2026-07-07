import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

// Uses public decapi.me endpoint - no API key required.
async function isLive(username: string): Promise<{ live: boolean; title?: string }> {
  try {
    const r = await fetch(`https://decapi.me/twitch/uptime/${encodeURIComponent(username)}`);
    const txt = (await r.text()).trim();
    const offline = /offline/i.test(txt) || /not found/i.test(txt) || /no user/i.test(txt);
    if (offline) return { live: false };
    let title: string | undefined;
    try {
      const t = await fetch(`https://decapi.me/twitch/title/${encodeURIComponent(username)}`);
      title = (await t.text()).trim();
    } catch {}
    return { live: true, title };
  } catch {
    return { live: false };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: creators } = await supa.from("cc_creators").select("*").eq("is_active", true);
    const results: any[] = [];
    for (const c of creators || []) {
      const { live, title } = await isLive(c.twitch_username);
      const now = new Date();

      if (live && !c.is_currently_live) {
        // Start new session
        await supa.from("cc_live_sessions").insert({ creator_id: c.id, started_at: now.toISOString(), stream_title: title });
        await supa.from("cc_creators").update({ is_currently_live: true, last_checked_at: now.toISOString() }).eq("id", c.id);
      } else if (!live && c.is_currently_live) {
        // Close open session, add duration to total
        const { data: open } = await supa.from("cc_live_sessions").select("*").eq("creator_id", c.id).is("ended_at", null).order("started_at", { ascending: false }).limit(1).maybeSingle();
        if (open) {
          const dur = Math.max(0, Math.floor((now.getTime() - new Date(open.started_at).getTime()) / 1000));
          await supa.from("cc_live_sessions").update({ ended_at: now.toISOString(), duration_seconds: dur }).eq("id", open.id);
          await supa.from("cc_creators").update({
            is_currently_live: false,
            last_checked_at: now.toISOString(),
            total_seconds: (c.total_seconds || 0) + dur,
          }).eq("id", c.id);
        } else {
          await supa.from("cc_creators").update({ is_currently_live: false, last_checked_at: now.toISOString() }).eq("id", c.id);
        }
      } else if (live && c.is_currently_live) {
        // Update running session duration (approximate)
        const { data: open } = await supa.from("cc_live_sessions").select("*").eq("creator_id", c.id).is("ended_at", null).order("started_at", { ascending: false }).limit(1).maybeSingle();
        if (open) {
          const dur = Math.max(0, Math.floor((now.getTime() - new Date(open.started_at).getTime()) / 1000));
          await supa.from("cc_live_sessions").update({ duration_seconds: dur }).eq("id", open.id);
        }
        await supa.from("cc_creators").update({ last_checked_at: now.toISOString() }).eq("id", c.id);
      } else {
        await supa.from("cc_creators").update({ last_checked_at: now.toISOString() }).eq("id", c.id);
      }
      results.push({ user: c.twitch_username, live });
    }
    return new Response(JSON.stringify({ ok: true, results }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
