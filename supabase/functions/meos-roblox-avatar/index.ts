const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { username } = await req.json();
    if (!username) return new Response(JSON.stringify({ error: "username vereist" }), { status: 400, headers: cors });

    // Get user id by name
    const r = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });
    const j = await r.json();
    const u = j.data?.[0];
    if (!u) return new Response(JSON.stringify({ error: "Speler niet gevonden" }), { status: 404, headers: cors });

    // Headshot
    const a = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${u.id}&size=420x420&format=Png`);
    const aj = await a.json();
    const avatar = aj.data?.[0]?.imageUrl || null;

    return new Response(JSON.stringify({
      id: String(u.id), name: u.name, displayName: u.displayName, avatar_url: avatar,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
});
