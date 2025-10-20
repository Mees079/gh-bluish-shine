# 🎮 Roblox Studio Code Redemption Scripts

## 📋 SETUP INSTRUCTIES

### Stap 1: HTTP Requests Inschakelen
1. Open **Game Settings** (Home → Game Settings)
2. Ga naar **Security** tab
3. Zet **"Allow HTTP Requests"** op **ON**
4. Klik **Save**

### Stap 2: Script 1 Plaatsen (GUI Handler)
**Locatie:** `StarterGui → PlayerGoal panel → Frame → LocalScript`
- Maak een **nieuwe LocalScript** aan in de Frame
- Kopieer de code van **Script 1** hieronder
- Deze regelt de GUI en API calls

### Stap 3: Script 2 Plaatsen (Product Handler)
**Locatie:** `ReplicatedStorage → ModuleScript`
- Maak een **nieuwe ModuleScript** aan in ReplicatedStorage
- **BELANGRIJK:** Noem het **exact** `ProductHandler`
- Kopieer de code van **Script 2** hieronder
- Hier pas je aan wat elk product doet

---

## 📜 SCRIPT 1: GUI Handler (LocalScript)

**Locatie:** StarterGui → PlayerGoal panel → Frame → LocalScript

```lua
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- ══════════════════════════════════════════════════
--              LOVABLE CLOUD API
-- ══════════════════════════════════════════════════
local API_URL = "https://houdpzneyagzirbtchde.supabase.co/functions/v1/claim-code"

-- ══════════════════════════════════════════════════
--              UI REFERENCES
-- ══════════════════════════════════════════════════
local frame = script.Parent
local codeInput = frame:WaitForChild("Code")
local redeemButton = frame:WaitForChild("Redeem")
local statusLabel = frame:WaitForChild("TextLabel")

-- ══════════════════════════════════════════════════
--              PRODUCT HANDLER
-- ══════════════════════════════════════════════════
local ProductHandler = require(game.ReplicatedStorage:WaitForChild("ProductHandler"))

-- ══════════════════════════════════════════════════
--              STATUS FEEDBACK
-- ══════════════════════════════════════════════════
local function updateStatus(message, color)
	statusLabel.Text = message
	statusLabel.TextColor3 = color or Color3.fromRGB(255, 255, 255)
	print("[Code System]", message)
end

-- ══════════════════════════════════════════════════
--              CODE CLAIM FUNCTIE
-- ══════════════════════════════════════════════════
local function claimCode(code)
	updateStatus("Code controleren...", Color3.fromRGB(255, 200, 0))
	redeemButton.Enabled = false
	
	local success, result = pcall(function()
		local data = {
			code = code,
			roblox_username = player.Name
		}
		
		local jsonData = HttpService:JSONEncode(data)
		
		local response = HttpService:PostAsync(
			API_URL,
			jsonData,
			Enum.HttpContentType.ApplicationJson,
			false
		)
		
		return HttpService:JSONDecode(response)
	end)
	
	if success then
		if result.success then
			print("\n" .. string.rep("═", 50))
			print("✅ CODE SUCCESVOL GECLAIMED!")
			print(string.rep("═", 50))
			print("👤 Speler: " .. player.Name)
			print("🎟️  Code: " .. code)
			print("📝 Bericht: " .. result.message)
			print(string.rep("═", 50) .. "\n")
			
			-- Geef alle producten
			for i, product in ipairs(result.products) do
				ProductHandler.GiveProduct(player, product)
			end
			
			print("\n" .. string.rep("═", 50))
			print("🎉 ALLE PRODUCTEN ZIJN GEGEVEN!")
			print(string.rep("═", 50) .. "\n")
			
			updateStatus("✓ Code geclaimed!", Color3.fromRGB(0, 255, 0))
			codeInput.Text = ""
			
			-- Sluit GUI na 3 seconden
			wait(3)
			frame.Parent.Enabled = false
		else
			warn("\n❌ CODE FOUT:", result.error)
			updateStatus("✗ " .. result.error, Color3.fromRGB(255, 0, 0))
		end
	else
		warn("\n❌ VERBINDINGSFOUT:", result)
		updateStatus("✗ Verbindingsfout", Color3.fromRGB(255, 0, 0))
	end
	
	redeemButton.Enabled = true
end

-- ══════════════════════════════════════════════════
--              EVENT HANDLERS
-- ══════════════════════════════════════════════════

-- Redeem button
redeemButton.MouseButton1Click:Connect(function()
	local code = codeInput.Text:upper():gsub("%s+", "")
	
	if code == "" or #code < 8 then
		updateStatus("✗ Voer een geldige code in", Color3.fromRGB(255, 0, 0))
		return
	end
	
	claimCode(code)
end)

-- Enter key
codeInput.FocusLost:Connect(function(enterPressed)
	if enterPressed then
		redeemButton.MouseButton1Click:Fire()
	end
end)

-- ══════════════════════════════════════════════════
--              INITIALIZATION
-- ══════════════════════════════════════════════════
updateStatus("Voer je code in", Color3.fromRGB(200, 200, 200))
print("\n🔧 Code Redemption System geladen voor " .. player.Name .. "\n")
```

---

## 📦 SCRIPT 2: Product Handler (ModuleScript)

**Locatie:** ReplicatedStorage → ModuleScript (naam: "ProductHandler")

```lua
local ProductHandler = {}

--[[
╔══════════════════════════════════════════════════════════╗
║                    PRODUCT HANDLER                        ║
║                                                           ║
║  Hier definieer je wat elk product doet.                 ║
║  Voor nu print het alleen, later kun je features         ║
║  activeren door de comments weg te halen.                ║
║                                                           ║
║  HOE TE GEBRUIKEN:                                        ║
║  1. Vind de functie van je product (bijv. GiveDiamondPack)║
║  2. Pas de print statements aan naar wat je wilt         ║
║  3. Later: verwijder -- voor regels die je wilt activeren║
╚══════════════════════════════════════════════════════════╝
]]

-- ══════════════════════════════════════════════════
--              STARTER PACK
-- ══════════════════════════════════════════════════
local function GiveStarterPack(player)
	print("\n" .. string.rep("━", 50))
	print("📦 STARTER PACK - " .. player.Name)
	print(string.rep("━", 50))
	
	-- ▼ CASH GEVEN (uitgeschakeld)
	print("💰 Zou +5000 Cash geven")
	-- local leaderstats = player:FindFirstChild("leaderstats")
	-- if leaderstats and leaderstats:FindFirstChild("Cash") then
	--     leaderstats.Cash.Value = leaderstats.Cash.Value + 5000
	-- end
	
	-- ▼ LEVEL GEVEN (uitgeschakeld)
	print("⭐ Zou Level 5 instellen")
	-- if leaderstats and leaderstats:FindFirstChild("Level") then
	--     leaderstats.Level.Value = math.max(leaderstats.Level.Value, 5)
	-- end
	
	-- ▼ TOOLS GEVEN (uitgeschakeld)
	print("🔧 Zou Starter Tools geven")
	-- local backpack = player:FindFirstChild("Backpack")
	-- if backpack then
	--     local tool = game.ReplicatedStorage.Tools.StarterGun:Clone()
	--     tool.Parent = backpack
	-- end
	
	print("✅ Starter Pack print compleet!")
	print(string.rep("━", 50) .. "\n")
end

-- ══════════════════════════════════════════════════
--              DIAMOND PACK
-- ══════════════════════════════════════════════════
local function GiveDiamondPack(player)
	print("\n" .. string.rep("━", 50))
	print("💎 DIAMOND PACK - " .. player.Name)
	print(string.rep("━", 50))
	
	-- ▼ DIAMONDS GEVEN (uitgeschakeld)
	print("💎 Zou +1000 Diamonds geven")
	-- local leaderstats = player:FindFirstChild("leaderstats")
	-- if leaderstats and leaderstats:FindFirstChild("Diamonds") then
	--     leaderstats.Diamonds.Value = leaderstats.Diamonds.Value + 1000
	-- end
	
	-- ▼ CASH GEVEN (uitgeschakeld)
	print("💰 Zou +25000 Cash geven")
	-- if leaderstats and leaderstats:FindFirstChild("Cash") then
	--     leaderstats.Cash.Value = leaderstats.Cash.Value + 25000
	-- end
	
	-- ▼ VIP BADGE GEVEN (uitgeschakeld)
	print("🌟 Zou VIP Badge geven")
	-- local badges = player:FindFirstChild("Badges")
	-- if badges then
	--     badges.VIP.Value = true
	-- end
	
	-- ▼ XP BOOST GEVEN (uitgeschakeld)
	print("⚡ Zou 2x XP Boost geven (24 uur)")
	-- player:SetAttribute("XPBoost", 2)
	-- player:SetAttribute("BoostExpiry", os.time() + 86400)
	
	print("✅ Diamond Pack print compleet!")
	print(string.rep("━", 50) .. "\n")
end

-- ══════════════════════════════════════════════════
--              FORD RAPTOR
-- ══════════════════════════════════════════════════
local function GiveFordRaptor(player)
	print("\n" .. string.rep("━", 50))
	print("🚗 FORD RAPTOR - " .. player.Name)
	print(string.rep("━", 50))
	
	-- ▼ VEHICLE TOEVOEGEN AAN GARAGE (uitgeschakeld)
	print("🏠 Zou Ford Raptor toevoegen aan garage")
	-- local vehicleFolder = player:FindFirstChild("OwnedVehicles")
	-- if vehicleFolder then
	--     if not vehicleFolder:FindFirstChild("FordRaptor") then
	--         local car = game.ReplicatedStorage.Vehicles.FordRaptor:Clone()
	--         car.Name = "FordRaptor"
	--         car.Parent = vehicleFolder
	--     else
	--         print("⚠️  Speler heeft dit voertuig al!")
	--     end
	-- end
	
	-- ▼ VEHICLE SPAWNEN (uitgeschakeld)
	print("🏁 Zou Ford Raptor spawnen bij speler")
	-- if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
	--     local spawnPos = player.Character.HumanoidRootPart.Position + Vector3.new(0, 5, 10)
	--     local spawnedCar = game.ReplicatedStorage.Vehicles.FordRaptor:Clone()
	--     spawnedCar:SetPrimaryPartCFrame(CFrame.new(spawnPos))
	--     spawnedCar.Parent = workspace.Vehicles
	-- end
	
	print("✅ Ford Raptor print compleet!")
	print(string.rep("━", 50) .. "\n")
end

-- ══════════════════════════════════════════════════
--              VIP STATUS
-- ══════════════════════════════════════════════════
local function GiveVIP(player)
	print("\n" .. string.rep("━", 50))
	print("👑 VIP STATUS - " .. player.Name)
	print(string.rep("━", 50))
	
	-- ▼ VIP ROLE GEVEN (uitgeschakeld)
	print("👑 Zou VIP Status activeren")
	-- player:SetAttribute("IsVIP", true)
	
	-- ▼ VIP MULTIPLIER GEVEN (uitgeschakeld)
	print("⚡ Zou 1.5x Cash & XP Multiplier geven")
	-- player:SetAttribute("VIPMultiplier", 1.5)
	
	-- ▼ VIP COSMETICS UNLLOCKEN (uitgeschakeld)
	print("🎨 Zou VIP Cosmetics unlocken")
	-- local cosmetics = player:FindFirstChild("Cosmetics")
	-- if cosmetics then
	--     cosmetics.VIPHat.Unlocked.Value = true
	--     cosmetics.VIPTrail.Unlocked.Value = true
	-- end
	
	-- ▼ VIP AREA TOEGANG (uitgeschakeld)
	print("🚪 Zou VIP Area toegang geven")
	-- player:SetAttribute("VIPAreaAccess", true)
	
	-- ▼ NAMETAG AANPASSEN (uitgeschakeld)
	print("🏷️  Zou VIP Nametag toevoegen")
	-- if player.Character and player.Character:FindFirstChild("Head") then
	--     -- Add VIP badge GUI above head
	-- end
	
	print("✅ VIP Status print compleet!")
	print(string.rep("━", 50) .. "\n")
end

-- ══════════════════════════════════════════════════
--              WEAPONS PACK
-- ══════════════════════════════════════════════════
local function GiveWeaponsPack(player)
	print("\n" .. string.rep("━", 50))
	print("🔫 WEAPONS PACK - " .. player.Name)
	print(string.rep("━", 50))
	
	-- ▼ ASSAULT RIFLE GEVEN (uitgeschakeld)
	print("🔫 Zou Assault Rifle geven")
	-- local backpack = player:FindFirstChild("Backpack")
	-- if backpack then
	--     local rifle = game.ReplicatedStorage.Weapons.AssaultRifle:Clone()
	--     rifle.Parent = backpack
	-- end
	
	-- ▼ PISTOL GEVEN (uitgeschakeld)
	print("🔫 Zou Pistol geven")
	-- if backpack then
	--     local pistol = game.ReplicatedStorage.Weapons.Pistol:Clone()
	--     pistol.Parent = backpack
	-- end
	
	-- ▼ KNIFE GEVEN (uitgeschakeld)
	print("🗡️  Zou Knife geven")
	-- if backpack then
	--     local knife = game.ReplicatedStorage.Weapons.Knife:Clone()
	--     knife.Parent = backpack
	-- end
	
	print("✅ Weapons Pack print compleet!")
	print(string.rep("━", 50) .. "\n")
end

-- ══════════════════════════════════════════════════
--         💡 NIEUW PRODUCT TOEVOEGEN 💡
-- ══════════════════════════════════════════════════
--[[
    STAPPEN OM EEN NIEUW PRODUCT TOE TE VOEGEN:
    
    1. Kopieer een bestaande functie (bijv. GiveDiamondPack)
    2. Hernoem de functie naar je nieuwe product
    3. Pas de print statements aan
    4. Voeg je product toe aan het routing systeem hieronder
    
    VOORBEELD:
    
    local function GiveMegaPack(player)
        print("\n" .. string.rep("━", 50))
        print("🎁 MEGA PACK - " .. player.Name)
        print(string.rep("━", 50))
        
        print("💰 Zou +100000 Cash geven")
        print("💎 Zou +5000 Diamonds geven")
        
        print("✅ Mega Pack print compleet!")
        print(string.rep("━", 50) .. "\n")
    end
    
    En voeg toe aan routing hieronder:
    elseif lowerName:find("mega pack") then
        GiveMegaPack(player)
]]

-- ══════════════════════════════════════════════════
--              PRODUCT ROUTING SYSTEEM
-- ══════════════════════════════════════════════════
--[[
    Dit systeem zoekt automatisch de juiste handler
    op basis van de product naam van de API.
    
    NIEUWE PRODUCTEN TOEVOEGEN:
    1. Maak eerst je functie hierboven
    2. Voeg dan een nieuwe elseif regel toe hieronder
    3. Gebruik :find() om flexibel te zoeken
]]

function ProductHandler.GiveProduct(player, productData)
	local productName = productData.name
	local lowerName = productName:lower()
	
	-- ▼ ROUTE NAAR DE JUISTE HANDLER
	if lowerName:find("starter pack") then
		GiveStarterPack(player)
		
	elseif lowerName:find("diamond pack") then
		GiveDiamondPack(player)
		
	elseif lowerName:find("ford raptor") or lowerName:find("raptor") then
		GiveFordRaptor(player)
		
	elseif lowerName:find("vip") then
		GiveVIP(player)
		
	elseif lowerName:find("weapon") then
		GiveWeaponsPack(player)
		
	-- ▼ VOEG HIER NIEUWE PRODUCTEN TOE
	-- elseif lowerName:find("mega pack") then
	--     GiveMegaPack(player)
	
	else
		-- ▼ ONBEKEND PRODUCT
		print("\n" .. string.rep("━", 50))
		print("⚠️  ONBEKEND PRODUCT")
		print(string.rep("━", 50))
		print("Naam:", productName)
		print("Beschrijving:", productData.description or "Geen")
		print("Details:", productData.details or "Geen")
		print("\n💡 TIP: Voeg dit product toe aan ProductHandler!")
		print(string.rep("━", 50) .. "\n")
	end
end

return ProductHandler
```

---

## 🎯 HOE TE GEBRUIKEN

### 1️⃣ Testen (huidige staat)
- Alles print alleen maar
- Geen echte items/cash worden gegeven
- Perfect voor testen!

### 2️⃣ Product Activeren (later)
Wanneer je klaar bent om echt items te geven:

1. Open **ProductHandler** script
2. Zoek de functie van je product (bijv. `GiveDiamondPack`)
3. Verwijder de `--` voor de regels die je wilt activeren
4. Test opnieuw

**Voorbeeld:**
```lua
-- VOOR (alleen printen):
print("💎 Zou +1000 Diamonds geven")
-- leaderstats.Diamonds.Value = leaderstats.Diamonds.Value + 1000

-- NA (echt geven):
print("💎 +1000 Diamonds gegeven!")
local leaderstats = player:FindFirstChild("leaderstats")
if leaderstats and leaderstats:FindFirstChild("Diamonds") then
    leaderstats.Diamonds.Value = leaderstats.Diamonds.Value + 1000
end
```

### 3️⃣ Nieuw Product Toevoegen

**Stap 1:** Kopieer een bestaande functie
```lua
local function GiveMyNewPack(player)
    print("\n" .. string.rep("━", 50))
    print("🎁 MY NEW PACK - " .. player.Name)
    print(string.rep("━", 50))
    
    print("💰 Zou iets doen")
    -- Je code hier later
    
    print("✅ My New Pack print compleet!")
    print(string.rep("━", 50) .. "\n")
end
```

**Stap 2:** Voeg toe aan routing (onderaan script)
```lua
elseif lowerName:find("my new pack") then
    GiveMyNewPack(player)
```

Done! 🎉

---

## 📊 OUTPUT VOORBEELD

Zo ziet het eruit wanneer je een code claaimt:

```
🔧 Code Redemption System geladen voor TestSpeler

══════════════════════════════════════════════════
✅ CODE SUCCESVOL GECLAIMED!
══════════════════════════════════════════════════
👤 Speler: TestSpeler
🎟️  Code: A7K9-X2M4-P1L8
📝 Bericht: Code succesvol geclaimed! Je ontvangt: Diamond Pack, Ford Raptor
══════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 DIAMOND PACK - TestSpeler
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 Zou +1000 Diamonds geven
💰 Zou +25000 Cash geven
🌟 Zou VIP Badge geven
⚡ Zou 2x XP Boost geven (24 uur)
✅ Diamond Pack print compleet!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚗 FORD RAPTOR - TestSpeler
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 Zou Ford Raptor toevoegen aan garage
🏁 Zou Ford Raptor spawnen bij speler
✅ Ford Raptor print compleet!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

══════════════════════════════════════════════════
🎉 ALLE PRODUCTEN ZIJN GEGEVEN!
══════════════════════════════════════════════════
```

---

## 🔧 TROUBLESHOOTING

### "ProductHandler not found"
- Check of het ModuleScript exact "ProductHandler" heet
- Check of het in ReplicatedStorage staat

### "HTTP 403 Forbidden"
- Ga naar Game Settings → Security
- Zet "Allow HTTP Requests" aan

### Code werkt niet
- Check of de code geldig is in je admin panel
- Check of de code nog niet geclaimed is
- Kijk in Output console voor error messages

### Geen output zichtbaar
- Zorg dat je Output console open hebt (View → Output)
- Check of scripts enabled zijn in je game

---

## ✅ CHECKLIST

- [ ] HTTP Requests ingeschakeld
- [ ] Script 1 in StarterGui → PlayerGoal panel → Frame → LocalScript
- [ ] Script 2 in ReplicatedStorage → ModuleScript (naam: "ProductHandler")
- [ ] Code gegenereerd in admin panel
- [ ] GUI werkt in Roblox Studio
- [ ] Output console open
- [ ] Code getest

---

**🎮 Veel succes met je Roblox game shop!**
