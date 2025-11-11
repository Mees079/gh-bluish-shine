import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Edit2 } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HomeStat {
  id: string;
  icon: string;
  label: string;
  value: string;
  display_order: number;
  active: boolean;
}

const SortableStatItem = ({ 
  stat, 
  onEdit, 
  onDelete, 
  onToggle 
}: { 
  stat: HomeStat; 
  onEdit: (stat: HomeStat) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{stat.label}</p>
        <p className="text-xs text-muted-foreground">{stat.value} • {stat.icon}</p>
      </div>
      <Switch
        checked={stat.active}
        onCheckedChange={(checked) => onToggle(stat.id, checked)}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => onEdit(stat)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        onClick={() => onDelete(stat.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const StatsManager = () => {
  const [stats, setStats] = useState<HomeStat[]>([]);
  const [editingStat, setEditingStat] = useState<HomeStat | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    icon: "Users",
    label: "",
    value: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data } = await supabase
      .from('home_stats')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (data) {
      setStats(data);
    }
  };

  const handleSave = async () => {
    if (!formData.label || !formData.value) {
      toast.error("Label en waarde zijn verplicht");
      return;
    }

    if (editingStat) {
      const { error } = await supabase
        .from('home_stats')
        .update({
          icon: formData.icon,
          label: formData.label,
          value: formData.value,
        })
        .eq('id', editingStat.id);

      if (error) {
        toast.error("Fout bij updaten");
        return;
      }
      toast.success("Stat bijgewerkt");
    } else {
      const { error } = await supabase
        .from('home_stats')
        .insert({
          icon: formData.icon,
          label: formData.label,
          value: formData.value,
          display_order: stats.length,
        });

      if (error) {
        toast.error("Fout bij toevoegen");
        return;
      }
      toast.success("Stat toegevoegd");
    }

    setDialogOpen(false);
    setEditingStat(null);
    setFormData({ icon: "Users", label: "", value: "" });
    loadStats();
  };

  const handleEdit = (stat: HomeStat) => {
    setEditingStat(stat);
    setFormData({
      icon: stat.icon,
      label: stat.label,
      value: stat.value,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('home_stats')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Fout bij verwijderen");
      return;
    }

    toast.success("Stat verwijderd");
    loadStats();
  };

  const handleToggle = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('home_stats')
      .update({ active })
      .eq('id', id);

    if (error) {
      toast.error("Fout bij updaten status");
      return;
    }

    loadStats();
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = stats.findIndex((s) => s.id === active.id);
      const newIndex = stats.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(stats, oldIndex, newIndex);
      setStats(newOrder);

      for (let i = 0; i < newOrder.length; i++) {
        await supabase
          .from('home_stats')
          .update({ display_order: i })
          .eq('id', newOrder[i].id);
      }

      toast.success("Volgorde bijgewerkt");
    }
  };

  const handleNewStat = () => {
    setEditingStat(null);
    setFormData({ icon: "Users", label: "", value: "" });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Homepage Statistieken</CardTitle>
          <CardDescription>Beheer de stats die in de hero sectie worden getoond</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleNewStat} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Stat
          </Button>

          <div className="space-y-2">
            <Label>Stats (sleep om volgorde te wijzigen)</Label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stats.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {stats.map((stat) => (
                  <SortableStatItem
                    key={stat.id}
                    stat={stat}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {stats.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nog geen stats toegevoegd
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStat ? "Stat Bewerken" : "Nieuwe Stat"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Users">👥 Users</SelectItem>
                  <SelectItem value="Server">🖥️ Server</SelectItem>
                  <SelectItem value="Shield">🛡️ Shield</SelectItem>
                  <SelectItem value="Zap">⚡ Zap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Actieve Community"
              />
            </div>
            <div className="space-y-2">
              <Label>Waarde</Label>
              <Input
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="500+"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                {editingStat ? "Bijwerken" : "Toevoegen"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDialogOpen(false);
                  setEditingStat(null);
                  setFormData({ icon: "Users", label: "", value: "" });
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
