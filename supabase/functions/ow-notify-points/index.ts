import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { gang_id, scenario_key, scenario_time, clip_url, base_points, effective_points, boost_multiplier, entered_by_name } = await req.json();
    const webhook = Deno.env.get('OW_DISCORD_WEBHOOK');
    if (!webhook) return new Response(JSON.stringify({ error: 'no webhook' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: gang } = await supabase.from('ow_gangs').select('name, logo_url, total_points, level').eq('id', gang_id).maybeSingle();
    const { data: scen } = await supabase.from('ow_scenarios').select('label').eq('key', scenario_key).maybeSingle();

    let logoUrl: string | null = null;
    if (gang?.logo_url) {
      const { data: signed } = await supabase.storage.from('onderwereld-logos').createSignedUrl(gang.logo_url, 60 * 60 * 24);
      logoUrl = signed?.signedUrl || null;
    }

    const boostActive = (boost_multiplier || 1) > 1;
    const timeStr = new Date(scenario_time).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Amsterdam' });

    const embed: any = {
      title: '💰 Nieuwe punten ingevoerd',
      description: `**${gang?.name || 'Onbekende gang'}** heeft punten ontvangen`,
      color: boostActive ? 0xf59e0b : 0x00ff88,
      fields: [
        { name: '🎯 Scenario', value: scen?.label || scenario_key, inline: true },
        { name: '⭐ Punten', value: `**+${effective_points}** ${boostActive ? `(${base_points} × ${boost_multiplier})` : ''}`, inline: true },
        { name: '👤 Ingevoerd door', value: entered_by_name || 'Onbekend', inline: true },
        { name: '🕐 Scenario tijdstip', value: timeStr, inline: true },
        { name: '📊 Totaal gang', value: `${gang?.total_points || 0} pt · LVL ${gang?.level || 1}`, inline: true },
        { name: '⚡ Boost', value: boostActive ? `Actief ×${boost_multiplier}` : 'Geen', inline: true },
        { name: '🎬 Clip', value: clip_url ? `[Bekijk clip](${clip_url})` : '—', inline: false },
      ],
      footer: { text: `HDRP · Onderwereld · ${gang?.name || ''}` },
      timestamp: new Date().toISOString(),
    };
    if (logoUrl) embed.thumbnail = { url: logoUrl };

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
