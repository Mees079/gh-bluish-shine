# HDRP Content Creator – Roblox script

Dit script laat de HDRP-backend weten welke content creators op dit moment in de
game zitten. De backend telt daarna elke **15 minuten** dat een creator
**tegelijk TikTok LIVE is EN in-game zit** als **1 punt**. Die punten kunnen
creators in de site inwisselen voor beloningen (ze krijgen een unieke code, die
leveren ze in via een Discord ticket, en een Head Content Creator wisselt hem
in op de site).

## Waar zet je het script?

Roblox Studio → **Explorer** → rechtsklik op **`ServerScriptService`** →
**Insert Object → Script** → hernoem naar `HDRP_CC_Presence` en plak de code
hieronder.

> Zet NIET in `StarterPlayerScripts` of `Workspace`. Het moet in
> `ServerScriptService` staan zodat de server de HTTP-request doet.

### Voorbereiding (één keer)

1. **Roblox Creator Hub** → jouw game → **Game Settings** → **Security** →
   zet **`Allow HTTP Requests` op ON**.
2. Zet in het script `SECRET = "..."` op dezelfde waarde als de
   `MEOS_ROBLOX_SECRET` die je al gebruikt voor andere HDRP scripts.

### Script

```lua
-- HDRP_CC_Presence
-- Plaats: ServerScriptService
local HttpService = game:GetService("HttpService")
local Players     = game:GetService("Players")

local ENDPOINT = "https://houdpzneyagzirbtchde.supabase.co/functions/v1/cc-roblox-presence"
local SECRET   = "PLAK_HIER_JE_MEOS_ROBLOX_SECRET"
local INTERVAL = 300 -- seconden (5 minuten)

local function ping()
    local names = {}
    for _, p in ipairs(Players:GetPlayers()) do
        table.insert(names, p.Name)
    end

    local ok, err = pcall(function()
        HttpService:RequestAsync({
            Url = ENDPOINT,
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json",
                ["x-meos-secret"] = SECRET,
            },
            Body = HttpService:JSONEncode({ usernames = names }),
        })
    end)
    if not ok then warn("[HDRP CC presence] ", err) end
end

task.spawn(function()
    while true do
        ping()
        task.wait(INTERVAL)
    end
end)
```

## Hoe werkt het puntensysteem

- Elke minuut checkt de backend of iedere creator op TikTok LIVE staat.
- Elke 5 minuten meldt jouw Roblox-server wie er in-game is.
- Zodra een creator **beide** tegelijk is (TikTok LIVE **en** in-game met een
  ping < 10 min oud), telt de klok voor punten mee.
- Voor **elke 15 aaneengesloten minuten** van die combinatie krijgt de creator
  **1 punt**. Als hij offline gaat of de game verlaat, stopt de klok en start
  hij weer bij 0 zodra hij terugkomt.

## Beloningen kopen (kant van de creator)

1. Ga naar `/contentcreator` en log in.
2. In **Puntenshop** zie je alle beloningen met hun prijs (bv. `4 pt`).
3. Klik op **Koop**. Punten worden meteen afgeschreven en je krijgt een unieke
   code te zien (bv. `CC-A7Q9-K3XM`).
4. Maak een **Aankoop ticket** in Discord aan en plak je code erin.

## Product uitreiken (kant van Head CC)

1. Ga naar `/contentcreator` en scroll naar **Code inwisselen (Head CC)**.
2. Vul de code in die de creator in het ticket stuurde.
3. Je ziet welk product je moet geven en de Roblox-naam van de creator.
4. De code wordt automatisch als **ingewisseld** gemarkeerd — hij is daarna
   niet meer bruikbaar.
