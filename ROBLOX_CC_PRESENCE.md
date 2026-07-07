# Roblox Content Creator Presence Script

Plaats dit in een **ServerScript** in `ServerScriptService`. Het stuurt elke 5 minuten
een lijst van alle spelers die op dat moment in de game zitten naar de HDRP backend.

De backend zet dan `is_in_game=true` voor de content creators die hij herkent. De
live-tijd telt alleen op als de creator **tegelijk TikTok live is EN in-game zit**.

### Vereisten (Roblox Studio)
- Game Settings → Security → **Allow HTTP Requests: ON**

### Script

```lua
local HttpService = game:GetService("HttpService")
local Players     = game:GetService("Players")

local ENDPOINT = "https://houdpzneyagzirbtchde.supabase.co/functions/v1/cc-roblox-presence"
local SECRET   = "PLAK_HIER_JE_MEOS_ROBLOX_SECRET" -- zelfde secret als andere HDRP scripts

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

-- Eerste ping meteen, daarna elke 5 minuten
task.spawn(function()
    while true do
        ping()
        task.wait(300)
    end
end)
```

Dat is alles. Zolang de server draait blijft hij pingen; als de speler de game verlaat
verdwijnt hij automatisch uit de volgende ping en zet de backend `is_in_game=false`.
