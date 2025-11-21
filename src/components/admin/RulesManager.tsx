import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Subsection {
  title: string;
  content: string;
  subsections?: Subsection[];
}

interface RulesSection {
  id: string;
  title: string;
  content: string;
  icon: string;
  display_order: number;
  active: boolean;
  subsections: Subsection[];
  show_as_accordion: boolean;
}

interface SubsectionEditorProps {
  subsection: Subsection;
  path: number[];
  onUpdate: (path: number[], field: 'title' | 'content' | 'subsections', value: string | Subsection[]) => void;
  onRemove: (path: number[]) => void;
  onAddNested: (path: number[]) => void;
  level: number;
}

const SortableSubsectionEditor = ({ 
  subsection, 
  path, 
  onUpdate, 
  onRemove, 
  onAddNested, 
  level,
  id
}: SubsectionEditorProps & { id: string }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`p-4 ${level === 0 ? 'bg-muted/50' : 'bg-background'}`} style={{ marginLeft: `${level * 1}rem` }}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Label className="text-sm font-semibold">
                {subsection.title || 'Nieuwe regel'}
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddNested(path)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Subregel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(path)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {isExpanded && (
            <>
              <Input
                placeholder="Regel titel (bijvoorbeeld: Respecteer andere spelers)"
                value={subsection.title}
                onChange={(e) => onUpdate(path, 'title', e.target.value)}
              />
              <Textarea
                placeholder="Regel beschrijving/uitleg. Gebruik # voor kopjes. Geen nummering nodig!"
                value={subsection.content}
                onChange={(e) => onUpdate(path, 'content', e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
              
              {subsection.subsections && subsection.subsections.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <DndContext
                    sensors={useSensors(
                      useSensor(PointerSensor),
                      useSensor(KeyboardSensor, {
                        coordinateGetter: sortableKeyboardCoordinates,
                      })
                    )}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => {
                      const { active, over } = event;
                      if (active.id !== over.id && subsection.subsections) {
                        const oldIndex = subsection.subsections.findIndex((_, i) => `${id}-${i}` === active.id);
                        const newIndex = subsection.subsections.findIndex((_, i) => `${id}-${i}` === over.id);
                        const reordered = arrayMove(subsection.subsections, oldIndex, newIndex);
                        // Update parent with reordered subsections
                        onUpdate(path, 'subsections' as any, reordered as any);
                      }
                    }}
                  >
                    <SortableContext
                      items={subsection.subsections.map((_, i) => `${id}-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {subsection.subsections.map((sub, idx) => (
                        <SortableSubsectionEditor
                          key={`${id}-${idx}`}
                          id={`${id}-${idx}`}
                          subsection={sub}
                          path={[...path, idx]}
                          onUpdate={onUpdate}
                          onRemove={onRemove}
                          onAddNested={onAddNested}
                          level={level + 1}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

const SortableRuleItem = ({ 
  section, 
  onEdit, 
  onDelete, 
  onToggle 
}: { 
  section: RulesSection; 
  onEdit: (section: RulesSection) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-2xl">{section.icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{section.title}</p>
        <p className="text-xs text-muted-foreground">
          {section.subsections?.length || 0} regels
        </p>
      </div>
      <Switch
        checked={section.active}
        onCheckedChange={(checked) => onToggle(section.id, checked)}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => onEdit(section)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        onClick={() => onDelete(section.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const RulesManager = () => {
  const [sections, setSections] = useState<RulesSection[]>([]);
  const [editingSection, setEditingSection] = useState<RulesSection | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    icon: "📋",
    subsections: [] as Subsection[],
    show_as_accordion: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    const { data } = await supabase
      .from('rules_sections')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (data) {
      const parsed = data.map(section => ({
        ...section,
        subsections: Array.isArray(section.subsections) 
          ? section.subsections as unknown as Subsection[]
          : [],
      })) as RulesSection[];
      setSections(parsed);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error("Titel is verplicht");
      return;
    }

    const data = {
      title: formData.title,
      content: formData.content || "",
      icon: formData.icon,
      subsections: formData.subsections as any,
      show_as_accordion: formData.show_as_accordion,
    };

    if (editingSection) {
      const { error } = await supabase
        .from('rules_sections')
        .update(data as any)
        .eq('id', editingSection.id);

      if (error) {
        toast.error("Fout bij updaten");
        return;
      }
      toast.success("Sectie bijgewerkt");
    } else {
      const { error } = await supabase
        .from('rules_sections')
        .insert([{ 
          ...data, 
          display_order: sections.length,
          active: true
        } as any]);

      if (error) {
        toast.error("Fout bij toevoegen");
        return;
      }
      toast.success("Sectie toegevoegd");
    }

    setDialogOpen(false);
    loadSections();
  };

  const handleEdit = (section: RulesSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      content: section.content,
      icon: section.icon,
      subsections: section.subsections,
      show_as_accordion: section.show_as_accordion,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze sectie wilt verwijderen?")) return;

    const { error } = await supabase
      .from('rules_sections')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Fout bij verwijderen");
      return;
    }

    toast.success("Sectie verwijderd");
    loadSections();
  };

  const handleToggle = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('rules_sections')
      .update({ active })
      .eq('id', id);

    if (error) {
      toast.error("Fout bij updaten status");
      return;
    }

    loadSections();
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(sections, oldIndex, newIndex);
      setSections(newOrder);

      for (let i = 0; i < newOrder.length; i++) {
        await supabase
          .from('rules_sections')
          .update({ display_order: i })
          .eq('id', newOrder[i].id);
      }

      toast.success("Volgorde bijgewerkt");
    }
  };

  const handleNewSection = () => {
    setEditingSection(null);
    setFormData({ title: "", content: "", icon: "📋", subsections: [], show_as_accordion: false });
    setDialogOpen(true);
  };

  const addSubsection = (path: number[] = []) => {
    const updated = [...formData.subsections];
    
    if (path.length === 0) {
      updated.push({ title: "", content: "", subsections: [] });
    } else {
      let target: any = updated;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]].subsections;
      }
      if (!target[path[path.length - 1]].subsections) {
        target[path[path.length - 1]].subsections = [];
      }
      target[path[path.length - 1]].subsections.push({ title: "", content: "", subsections: [] });
    }
    
    setFormData({ ...formData, subsections: updated });
  };

  const removeSubsection = (path: number[]) => {
    const updated = [...formData.subsections];
    
    if (path.length === 1) {
      updated.splice(path[0], 1);
    } else {
      let target: any = updated;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]].subsections;
      }
      target.splice(path[path.length - 1], 1);
    }
    
    setFormData({ ...formData, subsections: updated });
  };

  const updateSubsection = (path: number[], field: 'title' | 'content' | 'subsections', value: string | Subsection[]) => {
    const updated = [...formData.subsections];
    let target: any = updated;
    
    for (let i = 0; i < path.length - 1; i++) {
      target = target[path[i]].subsections;
    }
    
    if (field === 'subsections') {
      target[path[path.length - 1]][field] = value;
    } else {
      target[path[path.length - 1]][field] = value;
    }
    
    setFormData({ ...formData, subsections: updated });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Regels Beheren</CardTitle>
          <CardDescription>Beheer alle regel secties van je server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">💡 Tips:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Sleep regels om de volgorde te wijzigen</li>
                <li>Gebruik GEEN nummering (1., 2., etc.) - de site nummert automatisch</li>
                <li>Typ gewoon "Respecteer andere spelers" in plaats van "1. Respecteer andere spelers"</li>
                <li>Gebruik # in de beschrijving voor kopjes (# Groot, ## Medium, ### Klein)</li>
              </ul>
            </div>
          </Card>

          <Button onClick={handleNewSection} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Regel Sectie
          </Button>

          <div className="space-y-2">
            <Label>Regel Secties (sleep om volgorde te wijzigen)</Label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section) => (
                  <SortableRuleItem
                    key={section.id}
                    section={section}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nog geen regel secties toegevoegd
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Sectie Bewerken" : "Nieuwe Sectie"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 space-y-2">
                <Label>Icon (Emoji)</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📋"
                  className="text-2xl text-center"
                />
              </div>
              <div className="col-span-3 space-y-2">
                <Label>Titel</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Algemene Regels"
                />
                <Label>Beschrijving (kaart-tekst onder de titel)</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Korte introductie of samenvatting die op de regels-kaart wordt getoond"
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Regels</Label>
                  <p className="text-xs text-muted-foreground">
                    Voeg regels toe met geneste subregels
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    if (active.id !== over.id) {
                      const oldIndex = formData.subsections.findIndex((_, i) => `subsection-${i}` === active.id);
                      const newIndex = formData.subsections.findIndex((_, i) => `subsection-${i}` === over.id);
                      const reordered = arrayMove(formData.subsections, oldIndex, newIndex);
                      setFormData({ ...formData, subsections: reordered });
                      toast.success("Volgorde bijgewerkt");
                    }
                  }}
                >
                  <SortableContext
                    items={formData.subsections.map((_, i) => `subsection-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {formData.subsections.map((subsection, idx) => (
                      <SortableSubsectionEditor
                        key={`subsection-${idx}`}
                        id={`subsection-${idx}`}
                        subsection={subsection}
                        path={[idx]}
                        onUpdate={updateSubsection}
                        onRemove={removeSubsection}
                        onAddNested={addSubsection}
                        level={0}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                <Button
                  variant="outline"
                  onClick={() => addSubsection([])}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Regel
                </Button>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuleren
              </Button>
              <Button onClick={handleSubmit}>
                {editingSection ? "Bijwerken" : "Toevoegen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
