import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GripVertical, Search, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
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
          <div className="flex items-center gap-1 mt-1">
            {(category.icon || '').split(',').filter(Boolean).map((iconName: string, i: number) => {
              const Icon = (LucideIcons as any)[iconName.trim()] || LucideIcons.Package;
              return <Icon key={i} className="h-4 w-4 text-muted-foreground" />;
            })}
          </div>
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
  const [selectedIcons, setSelectedIcons] = useState<string[]>([]);
  const [iconSearch, setIconSearch] = useState("");
  const { toast } = useToast();

  const allIconNames = Object.keys(LucideIcons).filter(
    (name) => name !== 'default' && name !== 'createLucideIcon' && name !== 'icons' && typeof (LucideIcons as any)[name] === 'object' && (LucideIcons as any)[name]?.$$typeof
  );

  const filteredIcons = iconSearch.length >= 2
    ? allIconNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 20)
    : [];

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
      icon: selectedIcons.join(','),
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
          if (!open) {
            setEditingCategory(null);
            setSelectedIcons([]);
            setIconSearch("");
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCategory(null);
              setSelectedIcons([]);
              setIconSearch("");
            }}>
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
                <Label>Iconen</Label>
                {selectedIcons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {selectedIcons.map((iconName, i) => {
                      const Icon = (LucideIcons as any)[iconName] || LucideIcons.Package;
                      return (
                        <span key={i} className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                          <Icon className="h-4 w-4" />
                          {iconName}
                          <button type="button" onClick={() => setSelectedIcons(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <Input
                  placeholder="Zoek icoon... (bijv: Car)"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                />
                {filteredIcons.length > 0 && (
                  <div className="grid grid-cols-4 gap-1 mt-2 max-h-40 overflow-y-auto border rounded p-2">
                    {filteredIcons.map((name) => {
                      const Icon = (LucideIcons as any)[name];
                      const isSelected = selectedIcons.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          className={`flex flex-col items-center gap-1 p-2 rounded text-xs hover:bg-accent ${isSelected ? 'bg-primary/20 ring-1 ring-primary' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedIcons(prev => prev.filter(n => n !== name));
                            } else {
                              setSelectedIcons(prev => [...prev, name]);
                            }
                          }}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="truncate w-full text-center">{name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Zoek en klik om iconen toe te voegen. Zie <a href="https://lucide.dev" target="_blank" className="underline">lucide.dev</a> voor namen.
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
                  setSelectedIcons(cat.icon ? cat.icon.split(',').filter(Boolean) : []);
                  setIconSearch("");
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