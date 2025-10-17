import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";

export interface Category {
  id: string;
  name: string;
  label: string;
  icon: string;
  display_order: number;
}

interface SidebarProps {
  activeCategory: string | null;
  onCategoryChange: (categoryId: string) => void;
}

export const Sidebar = ({ activeCategory, onCategoryChange }: SidebarProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');
    
    if (data) {
      setCategories(data);
      // Set eerste categorie als actief als er nog geen is
      if (!activeCategory && data.length > 0) {
        onCategoryChange(data[0].id);
      }
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Package;
  };

  const handleAdminClick = () => {
    window.dispatchEvent(new Event("open-admin"));
  };

  return (
    <aside className="w-full sm:w-64 min-h-auto sm:min-h-screen bg-card border-b sm:border-r sm:border-b-0 border-border p-4 sm:p-6 flex flex-col gap-2 sm:gap-4">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary mb-1 sm:mb-2">HDRP Hoofddorp roleplay</h1>
        <p className="text-xs text-muted-foreground">Aankoop preview</p>
      </div>

      <nav className="flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
        {categories.map((category) => {
          const Icon = getIconComponent(category.icon);
          const isActive = activeCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isActive ? "glow" : "outline"}
              className="flex-shrink-0 sm:flex-shrink sm:w-full justify-center sm:justify-start gap-2 sm:gap-3 text-xs sm:text-sm h-9 sm:h-11 px-3 sm:px-4"
              onClick={() => onCategoryChange(category.id)}
            >
              <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
              <span className="truncate hidden sm:inline">{category.label}</span>
              <span className="truncate sm:hidden text-[10px]">{category.label.split(' ')[0]}</span>
            </Button>
          );
        })}

        {/* Admin login button - alleen zichtbaar op mobiel */}
        <Button
          variant="default"
          className="flex-shrink-0 sm:hidden justify-center gap-2 text-xs h-9 px-3 bg-primary hover:bg-primary/90"
          onClick={handleAdminClick}
        >
          <Lock className="h-3 w-3 flex-shrink-0" />
          <span className="truncate text-[10px]">Admin</span>
        </Button>
      </nav>
    </aside>
  );
};
