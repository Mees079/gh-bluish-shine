import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });

    const { image_base64, expected_username } = await req.json();
    if (!image_base64 || !expected_username) return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers: cors });

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "AI niet geconfigureerd" }), { status: 500, headers: cors });

    const dataUrl = image_base64.startsWith("data:") ? image_base64 : `data:image/png;base64,${image_base64}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Je controleert of een Roblox username zichtbaar is in een TAB-screenshot uit Roblox. Antwoord ALLEEN met JSON: {\"found\": true|false, \"reason\": \"...\"}" },
          { role: "user", content: [
            { type: "text", text: `Is de Roblox username "${expected_username}" duidelijk zichtbaar op deze foto? Vergelijk hoofdletterongevoelig.` },
            { type: "image_url", image_url: { url: dataUrl } },
          ]},
        ],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "AI rate limit, probeer opnieuw" }), { status: 429, headers: cors });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits op" }), { status: 402, headers: cors });

    const j = await r.json();
    const content = j.choices?.[0]?.message?.content || "";
    let parsed: any = { found: false, reason: "AI gaf geen geldig antwoord" };
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch {}

    return new Response(JSON.stringify(parsed), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
