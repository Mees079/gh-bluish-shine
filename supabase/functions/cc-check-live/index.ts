import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

// Check TikTok Live status by fetching the public /live page and looking for
// signals that a live room is active. This is a best-effort public check
// (no official API key required).
async function isLive(username: string): Promise<{ live: boolean; title?: string }> {
  const u = username.replace(/^@/, "");
  try {
    const r = await fetch(`https://www.tiktok.com/@${encodeURIComponent(u)}/live`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!r.ok) return { live: false };
    const html = await r.text();
    // If TikTok redirected to profile or shows "LIVE has ended" the room is not active.
    const ended = /LIVE has ended|LIVE is over|isn't live/i.test(html);
    if (ended) return { live: false };
    // Active room indicators in the embedded JSON blob.
    const liveMarkers = [
      /"status":\s*2/,          // room status = live
      /"liveRoomId":"\d+"/,
      /"roomId":"\d{5,}"/,
      /"isLive":true/i,
    ];
    const live = liveMarkers.some((re) => re.test(html));
    let title: string | undefined;
    const m = html.match(/"title":"([^"]{1,120})"/);
    if (m) title = m[1];
    return { live, title };
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
        await supa.from("cc_live_sessions").insert({ creator_id: c.id, started_at: now.toISOString(), stream_title: title });
        await supa.from("cc_creators").update({ is_currently_live: true, last_checked_at: now.toISOString() }).eq("id", c.id);
      } else if (!live && c.is_currently_live) {
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
