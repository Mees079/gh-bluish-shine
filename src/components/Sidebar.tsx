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

export type Category = "voertuigen" | "wapens" | "items" | "vip";

interface SidebarProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

// Voeg hier nieuwe categorie buttons toe
const categories = [
  { id: "voertuigen" as Category, label: "Voertuigen", icon: Car },
  { id: "wapens" as Category, label: "Wapens", icon: Sword },
  { id: "items" as Category, label: "Items", icon: Package },
  { id: "vip" as Category, label: "VIP", icon: Crown },
  // NIEUWE CATEGORIE TOEVOEGEN? Kopieer een regel hierboven en pas aan!
  // Voorbeeld: { id: "huizen" as Category, label: "Huizen", icon: Home },
];

export const Sidebar = ({ activeCategory, onCategoryChange }: SidebarProps) => {
  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border p-6 flex flex-col gap-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Game Hoofddorp</h1>
        <p className="text-sm text-muted-foreground">Roleplay Donatie Shop</p>
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
