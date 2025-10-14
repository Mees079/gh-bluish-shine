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
  "Aankoop pakketen": [
    {
      id: "pakket-1",
      name: "Starter Pakket",
      images: [carImage, weaponImage],
      price: "€25,00",
      description: "Perfect startpakket voor beginners",
      details:
        "Dit complete startpakket bevat alles wat je nodig hebt om te beginnen. Inclusief basis voertuig, starter wapens, en essentiële items. Ideaal voor nieuwe spelers die snel willen starten.",
    },
    {
      id: "pakket-2",
      name: "Premium Pakket",
      images: [vipImage, carImage],
      price: "€50,00",
      description: "All-in-one premium ervaring",
      details:
        "Het ultieme pakket met premium voertuigen, exclusieve wapens en VIP status. Krijg directe toegang tot alles wat je nodig hebt voor de beste roleplay ervaring.",
    },
  ],
  "specialisaties": [
    {
      id: "spec-1",
      name: "Politie Specialisatie",
      images: [weaponImage, itemsImage],
      price: "€30,00",
      description: "Word een elite politieagent",
      details:
        "Complete politie uitrusting met tactical gear, politie voertuig toegang, en speciale bevoegdheden. Inclusief politie uniform, wapens en training.",
    },
    {
      id: "spec-2",
      name: "Medic Specialisatie",
      images: [itemsImage, vipImage],
      price: "€25,00",
      description: "Professionele medische training",
      details:
        "Volledige medische uitrusting en ambulance toegang. Inclusief geavanceerde medical kits, trauma training en exclusieve medic skins.",
    },
  ],
  "Voertuigen": [
    {
      id: "car-1",
      name: "Lamborghini Huracán",
      images: [carImage, carImage],
      price: "€50,00",
      description: "Ultra snelle sportwagen met neon underglow",
      details:
        "Deze prachtige Lamborghini Huracán is perfect voor de spelers die stijl en snelheid willen combineren. Met custom blauwe neon underglow en exclusieve tuning opties. Inclusief 100% motorupgrade, turbo en custom velgen.",
    },
    {
      id: "car-2",
      name: "Mercedes-AMG GT",
      images: [carImage, carImage],
      price: "€45,00",
      description: "Luxe sportwagen met premium afwerking",
      details:
        "De Mercedes-AMG GT combineert luxe met kracht. Deze auto is uitgerust met premium interieur, xenon verlichting en custom exhaust. Perfect voor zakelijke roleplays of voor de liefhebbers van Duitse engineering.",
    },
    {
      id: "car-3",
      name: "BMW M4",
      images: [carImage, carImage],
      price: "€40,00",
      description: "Sport sedan met race performance",
      details:
        "Een echte coureur's auto. De BMW M4 biedt ongeëvenaarde handling en acceleratie. Inclusief race chip tuning, sportuitlaat en custom spoiler. Ideaal voor street races en politie achtervolging.",
    },
  ],
  "Voertuig pakketen": [
    {
      id: "carpak-1",
      name: "Sport Car Collection",
      images: [carImage, carImage],
      price: "€120,00",
      description: "3 premium sportwagens in één pakket",
      details:
        "Krijg directe toegang tot onze top 3 sportwagens: Lamborghini Huracán, Mercedes-AMG GT, en BMW M4. Bespaar €15 ten opzichte van losse aankoop. Alle voertuigen volledig getuned.",
    },
    {
      id: "carpak-2",
      name: "Luxury Car Bundle",
      images: [carImage, carImage],
      price: "€90,00",
      description: "Premium luxe voertuigen collectie",
      details:
        "Exclusieve collectie van luxe voertuigen voor de zakelijke roleplay. Inclusief sedan, SUV en limousine. Perfect voor VIP characters en executives.",
    },
  ],
  "Wapens": [
    {
      id: "weapon-1",
      name: "Tactical AR-15",
      images: [weaponImage, weaponImage],
      price: "€25,00",
      description: "Zwaar aanvalsgeweer met blauwe neon",
      details:
        "Dit state-of-the-art tactical rifle is uitgerust met holografisch vizier, laser sight en blue neon accenten. Perfecte nauwkeurigheid op middellange afstand. Inclusief 3 magazijnen en tactical grip.",
    },
    {
      id: "weapon-2",
      name: "Desert Eagle .50",
      images: [weaponImage, weaponImage],
      price: "€15,00",
      description: "Krachtig handvuurwapen",
      details:
        "De iconische Desert Eagle met custom chrome afwerking. Hoge damage en imposante aanwezigheid. Inclusief extended magazine en laser sight. Perfect voor gang roleplay.",
    },
    {
      id: "weapon-3",
      name: "MP5 SMG",
      images: [weaponImage, weaponImage],
      price: "€20,00",
      description: "Tactisch machinegeweer",
      details:
        "Compacte en dodelijke MP5 met hoge vuursnelheid. Ideaal voor close-quarters combat. Inclusief reflex sight, foregrip en suppressor. Populair bij politie en special forces roleplay.",
    },
  ],
  "Wapen pakketen": [
    {
      id: "weappak-1",
      name: "Arsenal Pack",
      images: [weaponImage, weaponImage],
      price: "€50,00",
      description: "Complete wapencollectie",
      details:
        "Krijg alle beschikbare wapens in één pakket. Inclusief AR-15, Desert Eagle, MP5 en meer. Bespaar €10 ten opzichte van losse aankoop. Plus gratis munitie voor 1 maand.",
    },
    {
      id: "weappak-2",
      name: "Gang Starter Kit",
      images: [weaponImage, weaponImage],
      price: "€35,00",
      description: "Essential gang weaponry",
      details:
        "Basis wapenpakket voor gang roleplay. Inclusief handguns, machinegeweer en messen. Perfect voor beginnende gang members.",
    },
  ],
  "Mystery's": [
    {
      id: "mystery-1",
      name: "Mystery Box Gold",
      images: [vipImage, itemsImage],
      price: "€20,00",
      description: "Random premium item",
      details:
        "Ontvang een willekeurig premium item uit onze exclusieve collectie. Kans op zeldzame voertuigen, wapens, of VIP status. Elke box gegarandeerd minimaal €25 waarde.",
    },
    {
      id: "mystery-2",
      name: "Mystery Box Diamond",
      images: [vipImage, carImage],
      price: "€40,00",
      description: "Ultra rare premium rewards",
      details:
        "De ultieme mystery box met kans op extreem zeldzame items. Gegarandeerd minimaal €60 waarde. Mogelijke rewards: lifetime VIP, exclusive vehicles, limited edition wapens.",
    },
    {
      id: "mystery-3",
      name: "Weekly Mystery",
      images: [itemsImage, weaponImage],
      price: "€10,00",
      description: "Wekelijkse verrassing",
      details:
        "Elke week een nieuwe mystery box met wisselende inhoud. Perfect voor regelmatige spelers. Gegarandeerd minimaal €12 waarde.",
    },
  ],
};
