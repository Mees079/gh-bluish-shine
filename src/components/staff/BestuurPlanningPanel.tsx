import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  GripVertical,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";

interface StaffProfile {
  user_id: string;
  username: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduled_date: string;
  assigned_to: string | null;
  created_by: string | null;
  priority: string;
  created_at: string;
}

interface Props {
  currentUserId: string;
  staffProfiles: StaffProfile[];
  onClose: () => void;
}

const PRIORITY_META: Record<string, { label: string; ring: string; dot: string }> = {
  low:    { label: "Laag",    ring: "border-slate-700",         dot: "bg-slate-500" },
  normal: { label: "Normaal", ring: "border-[#1f2937]",         dot: "bg-[#00ff88]" },
  high:   { label: "Hoog",    ring: "border-amber-500/40",      dot: "bg-amber-400" },
  urgent: { label: "Urgent",  ring: "border-red-500/50",        dot: "bg-red-500" },
};

const STATUS_META: Record<string, { label: string; color: string; Icon: any }> = {
  open:        { label: "Open",        color: "text-slate-300",  Icon: Circle },
  in_progress: { label: "Bezig",       color: "text-amber-300",  Icon: Clock },
  done:        { label: "Voltooid",    color: "text-emerald-300", Icon: CheckCircle2 },
};

export const BestuurPlanningPanel = ({ currentUserId, staffProfiles, onClose }: Props) => {
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Task | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Quick add per day
  const [addOpen, setAddOpen] = useState<string | null>(null);
  const [addTitle, setAddTitle] = useState("");
  const [addAssignee, setAddAssignee] = useState("");
  const [addPriority, setAddPriority] = useState("normal");

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    load();
    const channel = supabase
      .channel("bestuur-planning-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_tasks" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [weekStart]);

  const load = async () => {
    setLoading(true);
    const startDate = format(weekStart, "yyyy-MM-dd");
    const endDate = format(addDays(weekStart, 6), "yyyy-MM-dd");
    const { data } = await supabase
      .from("staff_tasks")
      .select("*")
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("created_at");
    setTasks((data as Task[]) || []);
    setLoading(false);
  };

  const tasksFor = (d: Date) => {
    const ds = format(d, "yyyy-MM-dd");
    return tasks.filter(t => t.scheduled_date === ds);
  };

  const usernameOf = (uid: string | null) =>
    uid ? (staffProfiles.find(p => p.user_id === uid)?.username || "?") : "Niemand";

  // ---- DnD ----
  const onDragStart = (id: string) => setDraggedId(id);
  const onDragEnd = () => { setDraggedId(null); setDragOverDate(null); };
  const onDragOver = (e: React.DragEvent, ds: string) => {
    e.preventDefault();
    setDragOverDate(ds);
  };
  const onDrop = async (e: React.DragEvent, ds: string) => {
    e.preventDefault();
    setDragOverDate(null);
    if (!draggedId) return;
    const task = tasks.find(t => t.id === draggedId);
    if (!task || task.scheduled_date === ds) { setDraggedId(null); return; }
    // optimistic
    setTasks(prev => prev.map(t => t.id === draggedId ? { ...t, scheduled_date: ds } : t));
    setDraggedId(null);
    const { error } = await supabase.from("staff_tasks").update({ scheduled_date: ds }).eq("id", task.id);
    if (error) {
      toast({ variant: "destructive", title: "Fout bij verplaatsen", description: error.message });
      load();
    } else {
      toast({ title: "Verplaatst", description: `${task.title} → ${format(parseISO(ds), "EEEE d MMM", { locale: nl })}` });
    }
  };

  // ---- Quick add ----
  const submitQuickAdd = async (ds: string) => {
    if (!addTitle.trim()) { toast({ variant: "destructive", title: "Titel is verplicht" }); return; }
    const { error } = await supabase.from("staff_tasks").insert({
      title: addTitle.trim(),
      scheduled_date: ds,
      assigned_to: addAssignee || null,
      priority: addPriority,
      created_by: currentUserId,
    });
    if (error) { toast({ variant: "destructive", title: "Fout", description: error.message }); return; }
    setAddTitle(""); setAddAssignee(""); setAddPriority("normal"); setAddOpen(null);
    load();
  };

  // ---- Edit / Delete ----
  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("staff_tasks").update({
      title: editing.title,
      description: editing.description,
      assigned_to: editing.assigned_to,
      priority: editing.priority,
      status: editing.status,
      scheduled_date: editing.scheduled_date,
    }).eq("id", editing.id);
    if (error) { toast({ variant: "destructive", title: "Fout", description: error.message }); return; }
    toast({ title: "Opgeslagen" });
    setEditing(null);
    load();
  };

  const deleteTask = async (t: Task) => {
    if (!confirm(`'${t.title}' verwijderen?`)) return;
    const { error } = await supabase.from("staff_tasks").delete().eq("id", t.id);
    if (error) { toast({ variant: "destructive", title: "Fout", description: error.message }); return; }
    toast({ title: "Verwijderd" });
    setEditing(null);
    load();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050a14]/95 backdrop-blur-md overflow-auto">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-[#1f2937] bg-[#0a0e1a]/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00ff88]/10 rounded-xl flex items-center justify-center border border-[#00ff88]/30">
              <CalendarIcon className="h-5 w-5 text-[#00ff88]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Planning Beheer</h2>
              <p className="text-xs text-[#6b7280]">Sleep taken tussen dagen om te verplaatsen</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekStart(prev => subWeeks(prev, 1))}
              className="p-2 text-[#6b7280] hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors"
            ><ChevronLeft className="h-4 w-4" /></button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-3 py-1.5 text-xs text-[#00ff88] hover:bg-[#00ff88]/10 rounded-md transition-colors"
            >Vandaag</button>
            <span className="text-sm text-white font-medium px-2 min-w-[160px] text-center">
              {format(weekStart, "d MMM", { locale: nl })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: nl })}
            </span>
            <button
              onClick={() => setWeekStart(prev => addWeeks(prev, 1))}
              className="p-2 text-[#6b7280] hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors"
            ><ChevronRight className="h-4 w-4" /></button>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#6b7280] hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors"
          >
            <X className="h-4 w-4" /> Sluiten
          </button>
        </div>
      </header>

      {/* 7-day grid */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {days.map(day => {
              const ds = format(day, "yyyy-MM-dd");
              const dayTasks = tasksFor(day);
              const isOver = dragOverDate === ds;
              const today = isToday(day);
              return (
                <div
                  key={ds}
                  onDragOver={(e) => onDragOver(e, ds)}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={(e) => onDrop(e, ds)}
                  className={`flex flex-col rounded-xl border transition-all min-h-[300px] ${
                    isOver
                      ? "border-[#00ff88] bg-[#00ff88]/5 shadow-[0_0_20px_rgba(0,255,136,0.15)]"
                      : today
                        ? "border-[#00ff88]/30 bg-[#00ff88]/[0.02]"
                        : "border-[#1f2937] bg-[#111827]/40"
                  }`}
                >
                  {/* Day header */}
                  <div className="p-3 border-b border-[#1f2937] flex items-center justify-between">
                    <div>
                      <div className={`text-xs uppercase tracking-wide ${today ? "text-[#00ff88]" : "text-[#6b7280]"}`}>
                        {format(day, "EEEE", { locale: nl })}
                      </div>
                      <div className="text-lg font-bold text-white leading-none">
                        {format(day, "d MMM", { locale: nl })}
                      </div>
                    </div>
                    <span className="text-xs text-[#6b7280] bg-[#1f2937] rounded-full px-2 py-0.5">
                      {dayTasks.length}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="flex-1 p-2 space-y-2">
                    {dayTasks.map(t => {
                      const pm = PRIORITY_META[t.priority] || PRIORITY_META.normal;
                      const sm = STATUS_META[t.status] || STATUS_META.open;
                      const dragging = draggedId === t.id;
                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={() => onDragStart(t.id)}
                          onDragEnd={onDragEnd}
                          onClick={() => setEditing(t)}
                          className={`group relative cursor-grab active:cursor-grabbing bg-[#0a0e1a] border ${pm.ring} rounded-lg p-2.5 hover:border-[#00ff88]/40 transition-all ${dragging ? "opacity-40" : ""}`}
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-[#374151] mt-0.5 flex-shrink-0 group-hover:text-[#6b7280]" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${pm.dot}`} />
                                <h4 className={`text-sm font-medium text-white truncate ${t.status === "done" ? "line-through opacity-60" : ""}`}>
                                  {t.title}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                <span className={`flex items-center gap-1 ${sm.color}`}>
                                  <sm.Icon className="h-3 w-3" /> {sm.label}
                                </span>
                                {t.assigned_to && (
                                  <span className="text-[#6b7280] bg-[#1f2937] rounded px-1.5 py-0.5">
                                    {usernameOf(t.assigned_to)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Quick add */}
                    {addOpen === ds ? (
                      <div className="bg-[#0a0e1a] border border-[#00ff88]/30 rounded-lg p-2 space-y-2">
                        <input
                          autoFocus
                          value={addTitle}
                          onChange={e => setAddTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") submitQuickAdd(ds); if (e.key === "Escape") setAddOpen(null); }}
                          placeholder="Titel..."
                          className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded px-2 py-1.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#00ff88]/50"
                        />
                        <div className="flex gap-1.5">
                          <select
                            value={addAssignee}
                            onChange={e => setAddAssignee(e.target.value)}
                            className="flex-1 bg-[#0a0e1a] border border-[#1f2937] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-[#00ff88]/50"
                            style={{ colorScheme: "dark" }}
                          >
                            <option value="">Niemand</option>
                            {staffProfiles.map(p => (
                              <option key={p.user_id} value={p.user_id}>{p.username}</option>
                            ))}
                          </select>
                          <select
                            value={addPriority}
                            onChange={e => setAddPriority(e.target.value)}
                            className="bg-[#0a0e1a] border border-[#1f2937] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-[#00ff88]/50"
                            style={{ colorScheme: "dark" }}
                          >
                            {Object.entries(PRIORITY_META).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => submitQuickAdd(ds)}
                            className="flex-1 bg-[#00ff88]/15 text-[#00ff88] hover:bg-[#00ff88]/25 text-xs font-medium py-1.5 rounded"
                          >Toevoegen</button>
                          <button
                            onClick={() => { setAddOpen(null); setAddTitle(""); }}
                            className="px-2 text-xs text-[#6b7280] hover:text-white"
                          >Annuleer</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddOpen(ds)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-[#374151] hover:text-[#00ff88] hover:bg-[#00ff88]/5 rounded-lg border border-dashed border-[#1f2937] hover:border-[#00ff88]/30 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Taak
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a0e1a] border border-[#1f2937] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]">
              <h3 className="text-base font-bold text-white">Taak bewerken</h3>
              <button onClick={() => setEditing(null)} className="text-[#6b7280] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-[#6b7280] mb-1.5 block">Titel</label>
                <input
                  value={editing.title}
                  onChange={e => setEditing({ ...editing, title: e.target.value })}
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-1.5 block">Beschrijving</label>
                <textarea
                  rows={3}
                  value={editing.description || ""}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1.5 block">Datum</label>
                  <input
                    type="date"
                    value={editing.scheduled_date}
                    onChange={e => setEditing({ ...editing, scheduled_date: e.target.value })}
                    className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1.5 block">Status</label>
                  <select
                    value={editing.status}
                    onChange={e => setEditing({ ...editing, status: e.target.value })}
                    className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
                    style={{ colorScheme: "dark" }}
                  >
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1.5 block">Toegewezen aan</label>
                  <select
                    value={editing.assigned_to || ""}
                    onChange={e => setEditing({ ...editing, assigned_to: e.target.value || null })}
                    className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="">Niemand</option>
                    {staffProfiles.map(p => (
                      <option key={p.user_id} value={p.user_id}>{p.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1.5 block">Prioriteit</label>
                  <select
                    value={editing.priority}
                    onChange={e => setEditing({ ...editing, priority: e.target.value })}
                    className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
                    style={{ colorScheme: "dark" }}
                  >
                    {Object.entries(PRIORITY_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-5 border-t border-[#1f2937]">
              <button
                onClick={() => deleteTask(editing)}
                className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors"
              ><Trash2 className="h-4 w-4" /> Verwijderen</button>
              <div className="flex gap-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-[#6b7280] hover:text-white">Annuleren</button>
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-1.5 bg-[#00ff88] hover:bg-[#00ff88]/90 text-[#0a0e1a] text-sm font-semibold px-4 py-2 rounded-lg"
                ><Save className="h-4 w-4" /> Opslaan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
