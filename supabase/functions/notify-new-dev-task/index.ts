// Sends a Discord notification when a new developer task is created
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEBHOOK_URL = "https://discord.com/api/webhooks/1499705430627061924/ZAx9cusFFQFQ8zNmdb4okBZ6noinlL_7h6ONp5Wj7xrQWOUGOcY17500XXwfsioZlgkj";
const ROLE_ID = "1323375204822417408";

interface Payload {
  task_id: string;
  title: string;
  description?: string | null;
  deadline?: string | null;
  payment_amount?: number | null;
  payment_currency?: string | null;
  task_url: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;

    if (!body?.title || !body?.task_id) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fields: any[] = [];
    if (body.payment_amount != null) {
      const sym = body.payment_currency === 'ROBUX' ? 'R$' : '€';
      fields.push({ name: '💰 Beloning', value: `**${sym}${body.payment_amount}**`, inline: true });
    }
    if (body.deadline) {
      fields.push({ name: '📅 Deadline', value: new Date(body.deadline).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }), inline: true });
    }
    fields.push({ name: '🔗 Taak', value: `[Open in Developer Portal](${body.task_url})`, inline: false });

    const embed = {
      title: `🛠️ Nieuwe Developer Taak`,
      description: `**${body.title}**${body.description ? `\n\n${body.description.slice(0, 400)}${body.description.length > 400 ? '…' : ''}` : ''}`,
      color: 0x3b82f6,
      fields,
      footer: { text: 'HDRP Developer Portal' },
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `<@&${ROLE_ID}> — Er staat een nieuwe taak open!`,
        allowed_mentions: { roles: [ROLE_ID] },
        embeds: [embed],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord webhook failed [${res.status}]: ${text}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('notify-new-dev-task error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
