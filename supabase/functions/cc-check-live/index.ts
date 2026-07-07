import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

const secondsBetween = (from: string, to: Date) => Math.max(0, Math.floor((to.getTime() - new Date(from).getTime()) / 1000));

async function syncCreatorTotal(supa: any, creatorId: string) {
  const { data: sessions, error } = await supa
    .from("cc_live_sessions")
    .select("duration_seconds")
    .eq("creator_id", creatorId);

  if (error) throw error;

  const total = (sessions || []).reduce((sum: number, session: { duration_seconds: number | null }) => sum + (session.duration_seconds || 0), 0);
  await supa.from("cc_creators").update({ total_seconds: total }).eq("id", creatorId);
  return total;
}

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
    // Active room indicators in the embedded JSON blob. "LIVE has ended"
    // appears in the JS bundle regardless of state, so only trust the
    // structured markers.
    const hasRoomId = /"roomId":"\d{5,}"/.test(html) || /"liveRoomId":"\d+"/.test(html);
    const statusLive = /"status":\s*2\b/.test(html) || /"isLive":true/i.test(html);
    const live = hasRoomId && statusLive;
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
    const { data: creators, error: creatorsError } = await supa.from("cc_creators").select("*").eq("is_active", true);
    if (creatorsError) throw creatorsError;

    const nowIso = new Date().toISOString();
    const { data: activeBoosts } = await supa
      .from("cc_boosts")
      .select("*")
      .lte("starts_at", nowIso)
      .gt("ends_at", nowIso);

    const boostsFor = (creatorId: string) => (activeBoosts || []).filter(
      (b: any) => b.creator_id === null || b.creator_id === creatorId
    );
    const effectiveFor = (creatorId: string) => {
      const bs = boostsFor(creatorId);
      const mult = bs.reduce((m: number, b: any) => m * Number(b.multiplier || 1), 1);
      const intervals = bs.map((b: any) => b.interval_seconds).filter((n: any) => typeof n === "number" && n > 0);
      const interval = intervals.length ? Math.min(900, ...intervals) : 900;
      return { mult: mult > 0 ? mult : 1, interval };
    };

    const results: any[] = [];
    for (const c of creators || []) {
      const { live: tiktokLive, title } = await isLive(c.twitch_username);
      const now = new Date();
      // Only count as "live for tracking" if also in-game (fresh ping within 10 min)
      const ingameFresh = c.is_in_game && c.last_ingame_ping_at &&
        (now.getTime() - new Date(c.last_ingame_ping_at).getTime()) < 10 * 60 * 1000;
      const live = tiktokLive && !!ingameFresh;
      let totalSeconds = c.total_seconds || 0;

      if (live && !c.is_currently_live) {
        await supa.from("cc_live_sessions").insert({ creator_id: c.id, started_at: now.toISOString(), stream_title: title });
        await supa.from("cc_creators").update({ is_currently_live: true, last_checked_at: now.toISOString() }).eq("id", c.id);
      } else if (!live && c.is_currently_live) {
        const { data: open } = await supa.from("cc_live_sessions").select("*").eq("creator_id", c.id).is("ended_at", null).order("started_at", { ascending: false }).limit(1).maybeSingle();
        if (open) {
          const dur = secondsBetween(open.started_at, now);
          await supa.from("cc_live_sessions").update({ ended_at: now.toISOString(), duration_seconds: dur }).eq("id", open.id);
          totalSeconds = await syncCreatorTotal(supa, c.id);
          await supa.from("cc_creators").update({
            is_currently_live: false,
            last_checked_at: now.toISOString(),
            total_seconds: totalSeconds,
          }).eq("id", c.id);
        } else {
          await supa.from("cc_creators").update({ is_currently_live: false, last_checked_at: now.toISOString() }).eq("id", c.id);
        }
      } else if (live && c.is_currently_live) {
        const { data: open } = await supa.from("cc_live_sessions").select("*").eq("creator_id", c.id).is("ended_at", null).order("started_at", { ascending: false }).limit(1).maybeSingle();
        if (open) {
          const dur = secondsBetween(open.started_at, now);
          await supa.from("cc_live_sessions").update({ duration_seconds: dur }).eq("id", open.id);
          totalSeconds = await syncCreatorTotal(supa, c.id);
        } else {
          await supa.from("cc_live_sessions").insert({ creator_id: c.id, started_at: now.toISOString(), stream_title: title });
          totalSeconds = await syncCreatorTotal(supa, c.id);
        }
        await supa.from("cc_creators").update({ last_checked_at: now.toISOString(), total_seconds: totalSeconds }).eq("id", c.id);
      } else {
        await supa.from("cc_creators").update({ last_checked_at: now.toISOString() }).eq("id", c.id);
      }

      // ---- Punten met boosts ----
      const eff = effectiveFor(c.id);
      let points = c.points || 0;
      let lastAward = c.last_point_awarded_at ? new Date(c.last_point_awarded_at) : null;
      if (live) {
        if (!lastAward) {
          lastAward = now;
          await supa.from("cc_creators").update({ last_point_awarded_at: now.toISOString() }).eq("id", c.id);
        } else {
          const elapsed = Math.floor((now.getTime() - lastAward.getTime()) / 1000);
          const blocks = Math.floor(elapsed / eff.interval);
          if (blocks >= 1) {
            const earned = Math.floor(blocks * eff.mult);
            points += earned;
            const advanced = new Date(lastAward.getTime() + blocks * eff.interval * 1000);
            await supa.from("cc_creators").update({
              points,
              last_point_awarded_at: advanced.toISOString(),
            }).eq("id", c.id);
          }
        }
      } else if (lastAward) {
        await supa.from("cc_creators").update({ last_point_awarded_at: null }).eq("id", c.id);
      }

      results.push({ user: c.twitch_username, tiktok_live: tiktokLive, in_game: !!ingameFresh, counted: live, total_seconds: totalSeconds, points, mult: eff.mult, interval_seconds: eff.interval });
    }
    return new Response(JSON.stringify({ ok: true, results }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
