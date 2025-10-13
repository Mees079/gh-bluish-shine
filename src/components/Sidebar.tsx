import { Car, Sword, Package, Crown } from "lucide-react";
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

// Voeg hier nieuwe categorie buttons toe
const categories = [
  { id: "Aankoop pakketen" as Category, label: "Aankoop pakketen", icon: Car },
  { id: "specialisaties" as Category, label: "specialisaties", icon: Sword },
  { id: "voertuigen" as Category, label: "Voertuigen", icon: Car },
  { id: "Voertuig pakketen" as Category, label: "Voertuig pakketen", icon: Car },
  { id: "Wapens" as Category, label: "Wapens", icon: Package },
  { id: "Wapen pakketen" as Category, label: "Wapen pakketen", icon: Package },
  { id: "Mystery's" as Category, label: "Mystery's", icon: Crown },
  // NIEUWE CATEGORIE TOEVOEGEN? Kopieer een regel hierboven en pas aan!
  // Voorbeeld: { id: "huizen" as Category, label: "Huizen", icon: Home },
];

export const Sidebar = ({ activeCategory, onCategoryChange }: SidebarProps) => {
  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border p-6 flex flex-col gap-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-2">HDRP Hoofddorp roleplay</h1>
        <p className="text-sm text-muted-foreground">Aankooop preview</p>
      </div>

      <nav className="flex flex-col gap-3">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isActive ? "glow" : "secondary"}
              size="lg"
              onClick={() => onCategoryChange(category.id)}
              className="w-full justify-start rounded-full"
            >
              <Icon className="mr-3 h-5 w-5" />
              {category.label}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
};
