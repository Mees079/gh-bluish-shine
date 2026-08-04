// Stuurt sollicitatie-events door naar de BotGhost / Discord webhook
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EventType = 'submitted' | 'accepted' | 'rejected' | 'deleted';

interface Payload {
  event: EventType;
  team: string;
  name: string;
  discord_name: string;
  discord_id?: string | null;
  roblox_name: string;
  age?: string | null;
  answers?: Record<string, string>;
  reviewer?: string | null;
  application_id?: string;
}

const TEAM_LABELS: Record<string, string> = {
  staff: 'Staff team',
  development: 'Development team',
  contentcreator: 'Content creator team',
};

const EVENT_META: Record<EventType, { title: string; color: number }> = {
  submitted: { title: '📥 Nieuwe sollicitatie', color: 0x337aff },
  accepted: { title: '✅ Sollicitatie geaccepteerd', color: 0x22c55e },
  rejected: { title: '❌ Sollicitatie afgewezen', color: 0xef4444 },
  deleted: { title: '🗑️ Sollicitatie verwijderd', color: 0x6b7280 },
};

const truncate = (value: string, max = 1000) =>
  value.length > max ? `${value.slice(0, max - 3)}...` : value;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    if (!body?.event || !body?.name) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Nieuwe sollicitatie -> eigen webhook, beoordeling (goedgekeurd/afgewezen) -> andere webhook
    const webhookUrl =
      body.event === 'submitted'
        ? Deno.env.get('BOTGHOST_WEBHOOK_NEW')
        : Deno.env.get('BOTGHOST_WEBHOOK_ACCEPTED');

    if (!webhookUrl) {
      console.warn(`Webhook secret ontbreekt voor event ${body.event}`);
      return new Response(JSON.stringify({ success: false, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const meta = EVENT_META[body.event] ?? EVENT_META.submitted;

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: 'Team', value: TEAM_LABELS[body.team] ?? body.team, inline: true },
      { name: 'Naam', value: body.name, inline: true },
      { name: 'Leeftijd', value: body.age || '-', inline: true },
      { name: 'Discord', value: body.discord_name || '-', inline: true },
      { name: 'Discord ID', value: body.discord_id || '-', inline: true },
      { name: 'Roblox', value: body.roblox_name || '-', inline: true },
    ];

    if (body.reviewer) {
      fields.push({ name: 'Behandeld door', value: body.reviewer, inline: true });
    }

    if (body.event === 'submitted' && body.answers) {
      Object.entries(body.answers)
        .slice(0, 15)
        .forEach(([question, answer]) => {
          if (!answer) return;
          fields.push({ name: truncate(question, 250), value: truncate(String(answer)) });
        });
    }

    const apiKey = Deno.env.get('BOTGHOST_API_KEY');

    const variables = [
      { name: 'event', variable: '{event}', value: body.event },
      { name: 'team', variable: '{team}', value: TEAM_LABELS[body.team] ?? body.team },
      { name: 'name', variable: '{name}', value: body.name },
      { name: 'age', variable: '{age}', value: body.age ?? '-' },
      { name: 'discord_name', variable: '{discord_name}', value: body.discord_name ?? '-' },
      { name: 'discord_id', variable: '{discord_id}', value: body.discord_id ?? '-' },
      { name: 'roblox_name', variable: '{roblox_name}', value: body.roblox_name ?? '-' },
      { name: 'reviewer', variable: '{reviewer}', value: body.reviewer ?? '-' },
      { name: 'application_id', variable: '{application_id}', value: body.application_id ?? '-' },
    ];

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: apiKey } : {}),
      },
      body: JSON.stringify({
        variables,
        embeds: [
          {
            title: meta.title,
            color: meta.color,
            fields,
            footer: { text: 'HDRP Sollicitatiesysteem' },
            timestamp: new Date().toISOString(),
          },
        ],
        // Extra platte velden zodat BotGhost variabelen makkelijk kan uitlezen
        event: body.event,
        team: body.team,
        name: body.name,
        discord_name: body.discord_name,
        discord_id: body.discord_id ?? null,
        roblox_name: body.roblox_name,
        application_id: body.application_id ?? null,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Webhook failed [${res.status}]: ${text}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('notify-application error:', e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
