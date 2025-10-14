import { Car, Sword, Package, Crown, Users, Target, CarFront, Bomb, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

// ===================================================================
// CATEGORIEËN CONFIGURATIE - Hier voeg je nieuwe kopjes toe!
// ===================================================================
// 
// HOE EEN CATEGORIE TOEVOEGEN:
// 1. Voeg de naam toe aan de Category type hieronder (bijv. | "huizen")
// 2. Voeg een button toe in de categories array
// 3. Voeg producten toe in src/data/products.ts met dezelfde naam
// 
// Iconen vind je op: https://lucide.dev/icons
// ===================================================================

export type Category = "Aankoop pakketen" | "specialisaties" | "Voertuigen" | "Voertuig pakketen"| "Wapens" | "Wapen pakketen" | "Mystery's";

interface SidebarProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

// Voeg hier nieuwe categorie buttons toe met passende iconen
const categories = [
  { id: "Aankoop pakketen" as Category, label: "Aankoop Pakketen", icon: Package },
  { id: "specialisaties" as Category, label: "Specialisaties", icon: Target },
  { id: "Voertuigen" as Category, label: "Voertuigen", icon: Car },
  { id: "Voertuig pakketen" as Category, label: "Voertuig Pakketen", icon: CarFront },
  { id: "Wapens" as Category, label: "Wapens", icon: Sword },
  { id: "Wapen pakketen" as Category, label: "Wapen Pakketen", icon: Bomb },
  { id: "Mystery's" as Category, label: "Mystery's", icon: Gift },
  // NIEUWE CATEGORIE TOEVOEGEN? Kopieer een regel hierboven en pas aan!
  // Voorbeeld: { id: "huizen" as Category, label: "Huizen", icon: Home },
];

export const Sidebar = ({ activeCategory, onCategoryChange }: SidebarProps) => {
  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border p-6 flex flex-col gap-4">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2">HDRP Hoofddorp roleplay</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Aankoop preview</p>
      </div>

      <nav className="flex flex-col gap-3">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isActive ? "glow" : "outline"}
              className="w-full justify-start gap-3 text-sm sm:text-base h-11"
              onClick={() => onCategoryChange(category.id)}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">{category.label}</span>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
};
