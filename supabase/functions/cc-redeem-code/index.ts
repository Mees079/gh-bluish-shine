import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const { data: isHead } = await svc.rpc("is_head_content_creator", { _user_id: user.id });
    if (!isHead) return new Response(JSON.stringify({ error: "Alleen Head Content Creators" }), { status: 403, headers: cors });

    const { code } = await req.json();
    if (!code) return new Response(JSON.stringify({ error: "code vereist" }), { status: 400, headers: cors });

    const { data: claim } = await svc
      .from("cc_reward_claims")
      .select("*, cc_creators(twitch_username, display_name, roblox_username), cc_rewards(title, description, points_required)")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (!claim) return new Response(JSON.stringify({ error: "Code niet gevonden" }), { status: 404, headers: cors });
    if (claim.redeemed_at) {
      return new Response(JSON.stringify({ error: `Code al ingewisseld op ${new Date(claim.redeemed_at).toLocaleString("nl-NL")}` }), { status: 400, headers: cors });
    }

    await svc.from("cc_reward_claims").update({
      redeemed_at: new Date().toISOString(),
      redeemed_by: user.id,
      status: "redeemed",
    }).eq("id", claim.id);

    return new Response(JSON.stringify({ ok: true, claim }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
