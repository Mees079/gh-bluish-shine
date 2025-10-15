import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const CategoriesManager = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');
    
    if (data) setCategories(data);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const categoryData = {
      name: formData.get('name') as string,
      label: formData.get('label') as string,
      icon: formData.get('icon') as string,
    };

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);
        if (error) throw error;
      }

      toast({
        title: "Opgeslagen!",
        description: `Categorie ${editingCategory ? 'bijgewerkt' : 'toegevoegd'}`,
      });
      setDialogOpen(false);
      setEditingCategory(null);
      loadCategories();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze categorie wilt verwijderen?')) return;

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    } else {
      toast({
        title: "Verwijderd",
        description: "Categorie verwijderd",
      });
      loadCategories();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Categorieën Beheer</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCategory(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Categorie Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Categorie Bewerken' : 'Nieuwe Categorie'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="name">Naam (code)</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="bijv: voertuigen"
                  defaultValue={editingCategory?.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="label">Label (weergave)</Label>
                <Input
                  id="label"
                  name="label"
                  placeholder="bijv: Voertuigen"
                  defaultValue={editingCategory?.label}
                  required
                />
              </div>
              <div>
                <Label htmlFor="icon">Icoon (Lucide naam)</Label>
                <Input
                  id="icon"
                  name="icon"
                  placeholder="bijv: Car"
                  defaultValue={editingCategory?.icon}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Zie <a href="https://lucide.dev" target="_blank" className="underline">lucide.dev</a> voor icoon namen
                </p>
              </div>
              <Button type="submit" className="w-full">Opslaan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {categories.map((category) => (
          <div key={category.id} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h4 className="font-semibold">{category.label}</h4>
              <p className="text-sm text-muted-foreground">Code: {category.name}</p>
              <p className="text-sm text-muted-foreground">Icoon: {category.icon}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingCategory(category);
                  setDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(category.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
