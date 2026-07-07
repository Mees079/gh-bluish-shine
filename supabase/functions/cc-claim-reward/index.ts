import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const genCode = () => {
  const s = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rnd = (n: number) => Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join("");
  return `CC-${rnd(4)}-${rnd(4)}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!auth) return new Response(JSON.stringify({ error: "no auth" }), { status: 401, headers: cors });

    const url = Deno.env.get("SUPABASE_URL")!;
    const svc = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${auth}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: cors });

    const { reward_id } = await req.json();
    if (!reward_id) return new Response(JSON.stringify({ error: "reward_id vereist" }), { status: 400, headers: cors });

    const { data: creator } = await svc.from("cc_creators").select("*").eq("user_id", user.id).maybeSingle();
    if (!creator) return new Response(JSON.stringify({ error: "Geen creator profiel" }), { status: 400, headers: cors });

    const { data: reward } = await svc.from("cc_rewards").select("*").eq("id", reward_id).eq("is_active", true).maybeSingle();
    if (!reward) return new Response(JSON.stringify({ error: "Beloning niet gevonden" }), { status: 404, headers: cors });

    const cost = reward.points_required || 0;
    if ((creator.points || 0) < cost) {
      return new Response(JSON.stringify({ error: `Niet genoeg punten (${creator.points}/${cost})` }), { status: 400, headers: cors });
    }

    // Deduct points first
    const { error: updErr } = await svc.from("cc_creators")
      .update({ points: (creator.points || 0) - cost })
      .eq("id", creator.id)
      .eq("points", creator.points); // optimistic concurrency
    if (updErr) return new Response(JSON.stringify({ error: "Puntenupdate mislukt" }), { status: 500, headers: cors });

    // Generate unique code (retry a few times if collision)
    let code = "";
    let inserted: any = null;
    for (let i = 0; i < 5; i++) {
      code = genCode();
      const { data, error } = await svc.from("cc_reward_claims").insert({
        creator_id: creator.id,
        reward_id: reward.id,
        code,
        points_spent: cost,
        status: "pending",
      }).select().maybeSingle();
      if (!error) { inserted = data; break; }
    }
    if (!inserted) {
      // rollback points
      await svc.from("cc_creators").update({ points: creator.points }).eq("id", creator.id);
      return new Response(JSON.stringify({ error: "Code genereren mislukt" }), { status: 500, headers: cors });
    }

    return new Response(JSON.stringify({ ok: true, code, claim: inserted }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
