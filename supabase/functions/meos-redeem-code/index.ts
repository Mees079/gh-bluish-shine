import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function emailFor(username: string) {
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@meos.hdrp.local`;
}

function tempPass() {
  return "Tmp" + Math.random().toString(36).slice(2, 10) + "!";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { roblox_username, code } = await req.json();
    if (!roblox_username || !code) {
      return new Response(JSON.stringify({ error: "roblox_username en code vereist" }), { status: 400, headers: cors });
    }
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: codeRow } = await supa.from("meos_login_codes").select("*")
      .eq("code", code.toUpperCase()).eq("used", false).maybeSingle();

    if (!codeRow) return new Response(JSON.stringify({ error: "Ongeldige of gebruikte code" }), { status: 400, headers: cors });
    if (new Date(codeRow.expires_at) < new Date()) return new Response(JSON.stringify({ error: "Code verlopen" }), { status: 400, headers: cors });
    if (codeRow.roblox_username.toLowerCase() !== roblox_username.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Roblox naam komt niet overeen" }), { status: 400, headers: cors });
    }

    const email = emailFor(roblox_username);
    const password = tempPass();

    // Check if profile exists
    const { data: existingProfile } = await supa.from("meos_profiles").select("*")
      .eq("roblox_username", codeRow.roblox_username).maybeSingle();

    let userId: string;
    if (existingProfile) {
      userId = existingProfile.user_id;
      // Reset password to temp
      await supa.auth.admin.updateUserById(userId, { password });
      await supa.from("meos_profiles").update({ must_change_password: true }).eq("user_id", userId);
    } else {
      const { data: created, error: cErr } = await supa.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { roblox_username: codeRow.roblox_username },
      });
      if (cErr || !created.user) return new Response(JSON.stringify({ error: cErr?.message || "Account maken mislukt" }), { status: 500, headers: cors });
      userId = created.user.id;
      await supa.from("meos_profiles").insert({ user_id: userId, roblox_username: codeRow.roblox_username, must_change_password: true });
      await supa.from("user_roles").insert({ user_id: userId, role: "meos_politie" });
    }

    await supa.from("meos_login_codes").update({ used: true }).eq("id", codeRow.id);

    return new Response(JSON.stringify({ email, temp_password: password }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
