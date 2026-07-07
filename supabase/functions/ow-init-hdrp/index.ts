import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const email = "hdrp@onderwereld.hdrp.local";
    const password = "Mees";

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

    await supa.from("ow_profiles").upsert({ user_id: userId, display_name: "HDRP" });

    const roles = ["onderwereld_hoofd", "onderwereld_coordinator", "onderwereld_proef"];
    for (const r of roles) {
      await supa.from("user_roles").upsert({ user_id: userId, role: r as any }, { onConflict: "user_id,role" });
    }

    return new Response(JSON.stringify({ ok: true, email, password }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
