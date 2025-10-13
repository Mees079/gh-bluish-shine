import { Product } from "@/components/ProductCard";
import { Category } from "@/components/Sidebar";
import carImage from "@/assets/car-example.jpg";
import weaponImage from "@/assets/weapon-example.jpg";
import vipImage from "@/assets/vip-example.jpg";
import itemsImage from "@/assets/items-example.jpg";

// ===================================================================
// PRODUCTEN CONFIGURATIE - Makkelijk aan te passen!
// ===================================================================
// 
// HOE EEN PRODUCT TOEVOEGEN:
// 1. Voeg je foto's toe in de /src/assets/ map
// 2. Importeer de foto's bovenaan dit bestand
// 3. Kopieer een bestaand product en pas de gegevens aan
//
// VOORBEELD:
// {
//   id: "unieke-id",           // Moet uniek zijn
//   name: "Product Naam",      // Naam die getoond wordt
//   images: [foto1, foto2],    // Array met meerdere foto's
//   price: "€XX,XX",           // Prijs
//   description: "Korte tekst", // Korte beschrijving onder de foto
//   details: "Lange tekst",    // Uitgebreide beschrijving in popup
// }
// ===================================================================

export const products: Record<Category, Product[]> = {
  voertuigen: [
    {
      id: "car-1",
      name: "Lamborghini Huracán",
      images: [carImage, carImage], // Je kan meerdere foto's toevoegen
      price: "€50,00",
      description: "Ultra snelle sportwagen met neon underglow",
      details:
        "Deze prachtige Lamborghini Huracán is perfect voor de spelers die stijl en snelheid willen combineren. Met custom blauwe neon underglow en exclusieve tuning opties. Inclusief 100% motorupgrade, turbo en custom velgen. Maximale snelheid en handling voor de ultieme rijervaring in Hoofddorp.",
    },
    {
      id: "car-2",
      name: "Mercedes-AMG GT",
      images: [carImage],
      price: "€45,00",
      description: "Luxe sportwagen met premium afwerking",
      details:
        "De Mercedes-AMG GT combineert luxe met kracht. Deze auto is uitgerust met premium interieur, xenon verlichting en custom exhaust. Perfect voor zakelijke roleplays of voor de liefhebbers van Duitse engineering.",
    },
    {
      id: "car-3",
      name: "BMW M4",
      images: [carImage],
      price: "€40,00",
      description: "Sport sedan met race performance",
      details:
        "Een echte coureur's auto. De BMW M4 biedt ongeëvenaarde handling en acceleratie. Inclusief race chip tuning, sportuitlaat en custom spoiler. Ideaal voor street races en politie achtervolging.",
    },
  ],
  wapens: [
    {
      id: "weapon-1",
      name: "Tactical AR-15",
      images: [weaponImage, weaponImage],
      price: "€25,00",
      description: "Zwaar aanvalsgeweer met blauwe neon",
      details:
        "Dit state-of-the-art tactical rifle is uitgerust met holografisch vizier, laser sight en blue neon accenten. Perfecte nauwkeurigheid op middellange afstand. Inclusief 3 magazijnen en tactical grip. Alleen voor VIP+ leden beschikbaar.",
    },
    {
      id: "weapon-2",
      name: "Desert Eagle .50",
      images: [weaponImage],
      price: "€15,00",
      description: "Krachtig handvuurwapen",
      details:
        "De iconische Desert Eagle met custom chrome afwerking. Hoge damage en imposante aanwezigheid. Inclusief extended magazine en laser sight. Perfect voor gang roleplay.",
    },
    {
      id: "weapon-3",
      name: "MP5 SMG",
      images: [weaponImage],
      price: "€20,00",
      description: "Tactisch machinegeweer",
      details:
        "Compacte en dodelijke MP5 met hoge vuursnelheid. Ideaal voor close-quarters combat. Inclusief reflex sight, foregrip en suppressor. Populair bij politie en special forces roleplay.",
    },
  ],
  items: [
    {
      id: "item-1",
      name: "Tactical Backpack",
      images: [itemsImage],
      price: "€10,00",
      description: "Extra inventory space met stijl",
      details:
        "Deze premium tactical backpack biedt 50 extra inventory slots. Met LED verlichting en waterdichte compartimenten. Perfect voor lange expedities of als je veel items wilt dragen. Duurzaam en stijlvol.",
    },
    {
      id: "item-2",
      name: "Medic Kit Pro",
      images: [itemsImage],
      price: "€8,00",
      description: "Uitgebreide medische set",
      details:
        "Complete medische kit met 10x bandages, 5x medkits en 3x adrenaline shots. Onmisbaar voor lange roleplay sessies. Inclusief draagtas en snelle toegang shortcuts.",
    },
    {
      id: "item-3",
      name: "Lockpick Set Deluxe",
      images: [itemsImage],
      price: "€12,00",
      description: "Professional lockpicking tools",
      details:
        "Professionele lockpick set met verhoogde slagingskans. Inclusief 20 lockpicks en beginner tutorial. Ideaal voor criminal roleplay en heists. VIP krijgt extra success rate bonus.",
    },
  ],
  vip: [
    {
      id: "vip-1",
      name: "VIP Gold Status",
      images: [vipImage],
      price: "€30,00 / maand",
      description: "Premium roleplay ervaring",
      details:
        "Krijg toegang tot exclusieve voertuigen, wapens en locaties. VIP Gold biedt: custom chat tag, prioriteit in queue, 2x XP boost, exclusieve skins, en toegang tot VIP-only events. Plus €50.000 in-game geld per week en gratis spawn location teleport.",
    },
    {
      id: "vip-2",
      name: "VIP Diamond Status",
      images: [vipImage],
      price: "€50,00 / maand",
      description: "Ultimate premium ervaring",
      details:
        "Het ultieme VIP pakket met alle Gold voordelen plus: custom Discord role, eigen garage space, admin priority support, 3x XP boost, en alle toekomstige DLC content gratis. Inclusief €100.000 in-game geld per week en custom character skin.",
    },
    {
      id: "vip-3",
      name: "VIP Lifetime",
      images: [vipImage],
      price: "€250,00 eenmalig",
      description: "Levenslang VIP voordelen",
      details:
        "Eenmalige betaling voor permanente VIP Diamond status. Alle huidige en toekomstige VIP features voor altijd. Inclusief: custom server title, eigen radio station, unlimited respawns, en jouw naam in de server credits. Plus €500.000 starting cash.",
    },
  ],
};
