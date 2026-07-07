import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const email = "hdrp@cc.hdrp.local";
    const password = "Mees";

    // Find or create user
    let userId: string | null = null;
    const { data: list } = await supa.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u: any) => u.email === email);
    if (existing) {
      userId = existing.id;
      await supa.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    } else {
      const { data: created, error } = await supa.auth.admin.createUser({ email, password, email_confirm: true });
      if (error || !created.user) return new Response(JSON.stringify({ error: error?.message }), { status: 500, headers: cors });
      userId = created.user.id;
    }

    // Ensure creator profile
    const { data: cr } = await supa.from("cc_creators").select("id").eq("twitch_username", "hdrp").maybeSingle();
    if (!cr) {
      await supa.from("cc_creators").insert({ user_id: userId, twitch_username: "hdrp", display_name: "HDRP" });
    } else {
      await supa.from("cc_creators").update({ user_id: userId }).eq("id", cr.id);
    }

    // Ensure all relevant roles
    const roles = ["head_content_creator", "content_creator", "super_admin", "admin"];
    for (const r of roles) {
      await supa.from("user_roles").upsert({ user_id: userId, role: r as any }, { onConflict: "user_id,role" });
    }

    return new Response(JSON.stringify({ ok: true, email, password }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
