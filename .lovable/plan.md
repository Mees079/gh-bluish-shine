
# Onderwereld Panel — /onderwereld

Een compleet nieuw sub-panel (site-in-site) voor het bijhouden van gang-activiteit binnen HDRP, met eigen donker thema, dropdown navigatie en achtergrond-vibes (wapens/geld/gangs).

## Rollen

Drie nieuwe rollen worden toegevoegd aan `app_role`:

| Rol | Punten invoeren | Punten verwijderen | Boosts | Waarschuwingen | Gangs beheren | Accounts beheren |
|---|---|---|---|---|---|---|
| `onderwereld_proef` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `onderwereld_coordinator` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `onderwereld_hoofd` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Routes & Layout

- `/onderwereld` — login (wachtwoord: **Mees** + gebruikersnaam, zelfde stijl als andere sub-panels)
- `/onderwereld/dashboard` — site-in-site met **sidebar dropdown-nav**:
  - 🏠 **Overzicht** — "Welkom {naam}", stats, meldingen, spoed-alerts
  - 👥 **Gangs** (dropdown) — Alle gangs · Nieuwe gang (hoofd) · Per gang details
  - ➕ **Punten invoeren**
  - 📜 **Recent toegevoegde punten**
  - ⚡ **Boosts** — actieve boost + nieuwe boost aanmaken
  - ⚠️ **Waarschuwingen** — inactiviteit + handmatig uitdelen
  - 📬 **Inbox** — meldingen + team chat
  - 👤 **Mijn account** — profielfoto + wachtwoord
  - 🛡️ **Accounts** (alleen hoofd) — aanmaken/verwijderen

**Thema:** puur zwart/antraciet achtergrond, witte letters, rode/goud accenten. Achtergrond: subtiele SVG patronen van wapens/geldstapels/gang-iconografie met lage opacity, plus vignet. Card-based layout met glassmorphism.

## Gang levels

6 levels met stijgende drempels (cumulatief totaal punten):

| Level | Nodig voor volgend level | Cumulatief |
|---|---|---|
| 1 → 2 | 200 | 200 |
| 2 → 3 | 350 | 550 |
| 3 → 4 | 550 | 1100 |
| 4 → 5 | 800 | 1900 |
| 5 → 6 | 1150 | 3050 |
| 6 | max | — |

Progress bar per gang toont voortgang naar volgend level.

## Scenario's (vaste lijst, hardcoded punten)

- Plofkraak / hit and run — 1 pt
- Algemene gijzeling — 2 pt
- Bank overval — 3 pt
- Juwelier — 6 pt
- Museum — 8 pt

## Boosts

Multipliers: x2, x3, x4, x5. Velden: multiplier, start (nu of custom datetime), duur (uren). Bij invoer van punten wordt gekeken of `tijdstip_scenario` binnen een actieve boost valt → punten worden vermenigvuldigd (opgeslagen als effectieve `points` + `boost_multiplier` voor transparantie).

## Inactiviteit

- Wekelijkse check (maandag 00:00 → maandag 00:00, Europe/Amsterdam)
- < 50 punten in die week → automatische inactiviteit-warn
- Verschijnt in inbox van iedereen
- Als gang de week erna weer 50+ haalt → warn valt automatisch weg (marked resolved)
- Hoofd kan met de hand verwijderen
- Bij 3 actieve warns → spoed-melding in ieders inbox

Draait via `pg_cron` job die dagelijks checkt of het maandag is en dan de vorige-week evaluatie doet.

## Handmatige waarschuwingen

Hoofd geeft warn met tekst → landt in ieders inbox als "Gang X heeft waarschuwing gekregen: …"

## Inbox / Team chat

- Systeem-meldingen (inactiviteit, spoed, handmatige warns, boost gestart, etc.)
- Team chat kanaal waar alle onderwereld-leden kunnen berichten sturen
- Realtime via Supabase channels
- Unread teller in sidebar

## Database schema

Nieuwe tabellen (allemaal met GRANTs + RLS):

- `ow_gangs` — id, name, logo_url, level (1-6), total_points, created_by, created_at
- `ow_scenarios` — vaste seed data (naam, base_points)
- `ow_point_entries` — id, gang_id, scenario_key, scenario_time, clip_url, base_points, effective_points, boost_multiplier, entered_by, created_at
- `ow_boosts` — id, multiplier, starts_at, ends_at, created_by, created_at
- `ow_warnings` — id, gang_id, type ('inactivity'|'manual'), reason, week_start, resolved_at, issued_by, created_at
- `ow_inbox_messages` — id, kind ('system'|'chat'|'urgent'), body, gang_id (nullable), author_id (nullable), created_at
- `ow_profiles` — user_id, display_name, avatar_url
- Logo storage bucket: `onderwereld-logos` (public), avatars: `onderwereld-avatars` (public)

Nieuwe rol-check functies: `is_onderwereld(_uid)`, `is_onderwereld_coordinator(_uid)`, `is_onderwereld_hoofd(_uid)`.

Trigger op `ow_point_entries` insert → herbereken `ow_gangs.total_points` + `level`.

## Edge functions

- `ow-create-account` (hoofd only) — maakt user + role
- `ow-delete-account` (hoofd only)
- `ow-weekly-inactivity-check` — cron (dagelijks 00:05), evalueert vorige week op maandag
- `ow-init-password` — helper voor default Mees password bij eerste account

## Techniek details

- Login stijl gelijk aan `/meos` / `/contentcreator` (username → `username@onderwereld.local` + wachtwoord)
- Alle mutaties client-side via supabase-js met RLS als vangnet
- Punten-invoer + boost berekening gebeurt server-side in een RPC om race conditions te voorkomen
- Sidebar collapsible met dropdown groups per shadcn sidebar patroon

## Bestanden die aangemaakt worden

- `src/pages/OnderwereldLogin.tsx`
- `src/pages/OnderwereldDashboard.tsx` (layout + routing tussen tabs)
- `src/components/onderwereld/OnderwereldSidebar.tsx`
- `src/components/onderwereld/OverviewPanel.tsx`
- `src/components/onderwereld/GangsPanel.tsx`
- `src/components/onderwereld/GangDetail.tsx`
- `src/components/onderwereld/PointsEntryPanel.tsx`
- `src/components/onderwereld/RecentPointsPanel.tsx`
- `src/components/onderwereld/BoostsPanel.tsx`
- `src/components/onderwereld/WarningsPanel.tsx`
- `src/components/onderwereld/InboxPanel.tsx`
- `src/components/onderwereld/AccountsPanel.tsx`
- `src/components/onderwereld/AccountSettingsPanel.tsx`
- `src/components/onderwereld/theme.css` (donker + achtergrond patronen)
- `supabase/functions/ow-create-account/index.ts`
- `supabase/functions/ow-delete-account/index.ts`
- `supabase/functions/ow-weekly-inactivity-check/index.ts`
- Nieuwe migration voor tabellen/rollen/functies/policies/GRANTs + seed scenarios + cron job
- Route toevoegen in `App.tsx`

## Vragen voor bevestiging

1. **Default account**: Ik maak automatisch een `mees` account met wachtwoord `Mees` als hoofd-onderwereld-coordinator bij eerste laden (net als de andere panels). OK?
2. **Achtergrond**: SVG patronen (wapens, geldbriefjes, dobbelstenen, kettingen) met ~5% opacity op zwart, geen zware foto's. Wil je i.p.v. patronen een echte donkere foto op de achtergrond (bv. gegenereerde afbeelding van een donkere steeg / geldstapel)?
3. **Gang levels drempels** hierboven — akkoord met die getallen?

Reageer met "ga" om te bouwen, of geef aan wat je anders wil.
