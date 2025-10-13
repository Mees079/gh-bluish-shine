# 📖 HANDLEIDING - Game Hoofddorp Donatie Shop

## 🎯 Snelstart: Hoe gebruik je deze shop?

### 1. 📦 PRODUCTEN TOEVOEGEN OF AANPASSEN

**Waar:** `src/data/products.ts`

#### Stap 1: Foto's toevoegen
- Plaats je foto's in de map: `src/assets/`
- Geef ze duidelijke namen zoals: `lamborghini.jpg`, `ar15.jpg`, etc.

#### Stap 2: Foto importeren
Bovenaan het bestand `products.ts` voeg je toe:
```typescript
import mijnFoto from "@/assets/mijn-foto-naam.jpg";
```

#### Stap 3: Product toevoegen
Kopieer een bestaand product en pas het aan:
```typescript
{
  id: "unieke-naam-123",              // Moet uniek zijn!
  name: "Mijn Product Naam",          // Naam die getoond wordt
  images: [mijnFoto, andereFoto],     // Meerdere foto's mogelijk
  price: "€25,00",                    // Prijs
  description: "Korte beschrijving",  // Tekst onder de foto
  details: "Lange uitgebreide uitleg" // Tekst in de popup
}
```

#### Stap 4: Product verwijderen
- Verwijder gewoon het hele blok tussen de `{ }` van dat product
- Vergeet de komma niet na elk product behalve de laatste!

### 2. 🏷️ CATEGORIEËN (KOPJES) TOEVOEGEN

**Waar:** `src/components/Sidebar.tsx`

#### Stap 1: Nieuwe categorie naam toevoegen
Zoek regel 4 en voeg je categorie toe:
```typescript
export type Category = "voertuigen" | "wapens" | "items" | "vip" | "jouw-nieuwe-categorie";
```

#### Stap 2: Icoon importeren (optioneel)
Regel 1 - kies een icoon van: https://lucide.dev/icons
```typescript
import { Car, Sword, Package, Crown, JouwIconNaam } from "lucide-react";
```

#### Stap 3: Categorie button toevoegen
In de `categories` array (rond regel 11), voeg toe:
```typescript
{ id: "jouw-nieuwe-categorie" as Category, label: "Mooie Naam", icon: JouwIconNaam },
```

#### Stap 4: Producten toevoegen aan nieuwe categorie
In `src/data/products.ts` voeg je toe:
```typescript
"jouw-nieuwe-categorie": [
  {
    id: "product-1",
    name: "Product Naam",
    images: [foto],
    price: "€10,00",
    description: "Korte tekst",
    details: "Lange tekst"
  },
],
```

### 3. 🎨 KLEUREN EN STIJL AANPASSEN

**Waar:** `src/index.css`

Zoek naar `:root` en pas de waardes aan:
```css
--primary: 220 100% 60%;  /* Hoofd kleur (blauw) */
--background: 0 0% 5%;    /* Achtergrond kleur (zwart) */
```

### 4. 🔗 DISCORD LINK AANPASSEN

**Waar:** `src/components/ProductModal.tsx`

Zoek naar regel 55 en pas de URL aan:
```typescript
href="https://discord.gg/JOUW-CODE"
```

---

## ❓ Veelgestelde Vragen

**Q: Hoe voeg ik meerdere foto's toe aan een product?**
A: In het `images: []` veld, voeg meerdere foto's toe gescheiden door komma's:
```typescript
images: [foto1, foto2, foto3]
```

**Q: Mijn categorie werkt niet?**
A: Controleer of je:
1. De category type hebt toegevoegd (Sidebar.tsx regel 4)
2. De button hebt toegevoegd in categories array
3. De producten hebt toegevoegd in products.ts met EXACT dezelfde naam

**Q: Hoe verander ik de winkel naam?**
A: In `src/components/Sidebar.tsx` regel 22 verander je "Game Hoofddorp"

**Q: Krijg ik fouten in de code?**
A: Check altijd:
- Of alle komma's op de juiste plek staan
- Of alle haakjes gesloten zijn `{ }` en `[ ]`
- Of je geen spaties hebt in id namen (gebruik `-` in plaats van spaties)

---

## 🆘 Hulp Nodig?

Als je vast loopt, kijk dan of:
1. ✅ Je alle bestanden hebt opgeslagen
2. ✅ Er geen rode foutmeldingen zijn
3. ✅ Je de juiste bestandsnamen hebt gebruikt

**Veel succes met je donatie shop! 🎮**