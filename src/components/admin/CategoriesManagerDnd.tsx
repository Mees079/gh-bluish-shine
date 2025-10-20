import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GripVertical, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCategoryProps {
  category: any;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
}

const SortableCategory = ({ category, onEdit, onDelete }: SortableCategoryProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-4 flex justify-between items-center bg-card"
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div>
          <h4 className="font-semibold">{category.label}</h4>
          <p className="text-sm text-muted-foreground">Code: {category.name}</p>
          <p className="text-sm text-muted-foreground">Icoon: {category.icon}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(category)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(category.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const CategoriesManager = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categories.findIndex((cat) => cat.id === active.id);
    const newIndex = categories.findIndex((cat) => cat.id === over.id);

    const newCategories = arrayMove(categories, oldIndex, newIndex);
    setCategories(newCategories);

    // Update display_order in database
    try {
      for (let i = 0; i < newCategories.length; i++) {
        await supabase
          .from('categories')
          .update({ display_order: i })
          .eq('id', newCategories[i].id);
      }
      toast({
        title: "Volgorde bijgewerkt",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
      loadCategories(); // Reload on error
    }
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
        const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.display_order)) : -1;
        const { error } = await supabase
          .from('categories')
          .insert({ ...categoryData, display_order: maxOrder + 1 });
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

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-xl font-semibold">Categorieën Beheer</h3>
        <div className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek categorieën..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}>
          <DialogTrigger asChild>
            <Button>
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

      <div className="text-sm text-muted-foreground mb-2">
        Sleep categorieën om de volgorde aan te passen
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredCategories.map(cat => cat.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-4">
            {filteredCategories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                onEdit={(cat) => {
                  setEditingCategory(cat);
                  setDialogOpen(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};