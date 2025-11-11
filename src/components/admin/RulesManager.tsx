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
import { Separator } from "@/components/ui/separator";

interface RulesSection {
  id: string;
  title: string;
  content: string;
  icon: string;
  display_order: number;
  active: boolean;
  subsections: Array<{
    title: string;
    content: string;
  }>;
  show_as_accordion: boolean;
}

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
        <p className="text-xs text-muted-foreground line-clamp-1">{section.content}</p>
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
    subsections: [] as Array<{title: string; content: string}>,
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
          ? section.subsections as unknown as Array<{title: string; content: string}>
          : [],
      })) as RulesSection[];
      setSections(parsed);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Titel en content zijn verplicht");
      return;
    }

    if (editingSection) {
      // Update existing
      const { error } = await supabase
        .from('rules_sections')
        .update({
          title: formData.title,
          content: formData.content,
          icon: formData.icon,
          subsections: formData.subsections,
          show_as_accordion: formData.show_as_accordion,
        })
        .eq('id', editingSection.id);

      if (error) {
        toast.error("Fout bij updaten");
        return;
      }
      toast.success("Sectie bijgewerkt");
    } else {
      // Create new
      const { error } = await supabase
        .from('rules_sections')
        .insert({
          title: formData.title,
          content: formData.content,
          icon: formData.icon,
          display_order: sections.length,
          subsections: formData.subsections,
          show_as_accordion: formData.show_as_accordion,
        });

      if (error) {
        toast.error("Fout bij toevoegen");
        return;
      }
      toast.success("Sectie toegevoegd");
    }

    setDialogOpen(false);
    setEditingSection(null);
    setFormData({ title: "", content: "", icon: "📋", subsections: [], show_as_accordion: false });
    loadSections();
  };

  const handleEdit = (section: RulesSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      content: section.content,
      icon: section.icon,
      subsections: section.subsections || [],
      show_as_accordion: section.show_as_accordion || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
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

      // Update display_order in database
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

  const addSubsection = () => {
    setFormData({
      ...formData,
      subsections: [...formData.subsections, { title: "", content: "" }]
    });
  };

  const removeSubsection = (index: number) => {
    setFormData({
      ...formData,
      subsections: formData.subsections.filter((_, i) => i !== index)
    });
  };

  const updateSubsection = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...formData.subsections];
    updated[index][field] = value;
    setFormData({
      ...formData,
      subsections: updated
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Regels Beheren</CardTitle>
          <CardDescription>Beheer alle regel secties van je server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Hoofd Content</Label>
              <p className="text-xs text-muted-foreground">
                Gebruik # voor kopjes, ## voor subkopjes. Elke regel wordt automatisch geformatteerd.
              </p>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="# Hoofdkop&#10;Alinea tekst hier...&#10;&#10;## Subkop&#10;Meer tekst..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Subsecties</Label>
                  <p className="text-xs text-muted-foreground">
                    Voeg gedetailleerde subsecties toe voor uitgebreide regels
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Als Accordion</Label>
                  <Switch
                    checked={formData.show_as_accordion}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_as_accordion: checked })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {formData.subsections.map((subsection, idx) => (
                  <Card key={idx} className="p-4 bg-muted/50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Subsectie {idx + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubsection(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Subsectie titel"
                        value={subsection.title}
                        onChange={(e) => updateSubsection(idx, 'title', e.target.value)}
                      />
                      <Textarea
                        placeholder="Subsectie content (# en ## worden ondersteund)"
                        value={subsection.content}
                        onChange={(e) => updateSubsection(idx, 'content', e.target.value)}
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  onClick={addSubsection}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Subsectie Toevoegen
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                {editingSection ? "Bijwerken" : "Toevoegen"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDialogOpen(false);
                  setEditingSection(null);
                  setFormData({ title: "", content: "", icon: "📋", subsections: [], show_as_accordion: false });
                }}
              >
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
