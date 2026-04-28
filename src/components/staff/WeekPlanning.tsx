import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, isToday, isSameDay, parseISO, max as dateMax, min as dateMin, differenceInCalendarDays, endOfWeek } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, User as UserIcon, CheckCircle2, Circle, FileText, X, ArrowRightLeft, Hand, Trash2, AlertTriangle, TrendingUp, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MINUTES_PER_DAY = 45;

interface AbsenceRecord {
  id: string;
  user_id: string;
  reason: string | null;
  start_date: string;
  end_date: string;
  active: boolean;
}

// Calculate required hours for a given week given an absence
const calculateRequiredHoursForWeek = (weekStartDate: Date, absStart: Date, absEnd: Date): number => {
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  const overlapStart = dateMax([absStart, weekStartDate]);
  const overlapEnd = dateMin([absEnd, weekEndDate]);
  let absentDays = 0;
  if (overlapStart <= overlapEnd) {
    absentDays = differenceInCalendarDays(overlapEnd, overlapStart) + 1;
  }
  const presentDays = Math.max(0, 7 - absentDays);
  return (presentDays * MINUTES_PER_DAY) / 60;
};

// Default required hours when not absent: 7 days × 45 min
const DEFAULT_REQUIRED_HOURS = (7 * MINUTES_PER_DAY) / 60; // 5.25h

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

interface TaskUpdate {
  id: string;
  task_id: string;
  user_id: string | null;
  message: string | null;
  file_url: string | null;
  created_at: string;
}

interface TaskRequest {
  id: string;
  task_id: string;
  requested_by: string;
  taken_by: string | null;
  request_type: string;
  message: string | null;
  status: string;
  created_at: string;
}

interface HourRow {
  rowId: string;
  personName: string;
  hours: string;
  afgemeld: boolean;
}

interface WeekPlanningProps {
  isBestuur: boolean;
  currentUserId: string;
  staffProfiles: StaffProfile[];
}

const createEmptyHourRow = (): HourRow => ({
  rowId: crypto.randomUUID(),
  personName: "",
  hours: "",
  afgemeld: false,
});

export const WeekPlanning = ({ isBestuur, currentUserId, staffProfiles }: WeekPlanningProps) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdate[]>([]);
  const [taskRequests, setTaskRequests] = useState<TaskRequest[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [addDate, setAddDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState("cannot_do");
  const [requestMessage, setRequestMessage] = useState("");
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursSubmitting, setHoursSubmitting] = useState(false);
  const [hourRows, setHourRows] = useState<HourRow[]>([createEmptyHourRow()]);
  const [hoursViewOnly, setHoursViewOnly] = useState(false);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const { toast } = useToast();

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [updateMessage, setUpdateMessage] = useState("");

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    loadTasks();
    loadTaskRequests();
    loadAbsences();
  }, [weekStart]);

  const loadAbsences = async () => {
    const { data } = await supabase.from('staff_absences').select('*').eq('active', true);
    setAbsences((data as AbsenceRecord[]) || []);
  };

  const loadTasks = async () => {
    setLoading(true);
    const startDate = format(weekStart, 'yyyy-MM-dd');
    const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('staff_tasks')
      .select('*')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('created_at');
    setTasks((data as Task[]) || []);
    setLoading(false);
  };

  const loadTaskRequests = async () => {
    const { data } = await supabase
      .from('staff_task_requests')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    setTaskRequests((data as TaskRequest[]) || []);
  };

  const loadTaskUpdates = async (taskId: string) => {
    const { data } = await supabase
      .from('staff_task_updates')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at');
    setTaskUpdates((data as TaskUpdate[]) || []);
  };

  const isHoursTask = (task: Task | null) => Boolean(task && task.title.trim().toLowerCase().startsWith('week uren'));

  const getTaskWeekStart = (task: Task) => format(
    startOfWeek(new Date(`${task.scheduled_date}T00:00:00`), { weekStartsOn: 1 }),
    'yyyy-MM-dd'
  );

  const closeHoursModal = () => {
    setShowHoursModal(false);
    setHourRows([createEmptyHourRow()]);
    setHoursViewOnly(false);
  };

  const handleAddWeekUren = async (day: Date) => {
    await supabase.from('staff_tasks').insert({
      title: 'Week uren',
      description: 'Vul de uren in van alle medewerkers voor deze week.',
      scheduled_date: format(day, 'yyyy-MM-dd'),
      assigned_to: newAssignedTo || null,
      created_by: currentUserId,
      priority: 'normal',
    });
    setNewAssignedTo("");
    setShowAddTask(false);
    setAddDate(null);
    loadTasks();
    toast({ title: 'Week uren taak aangemaakt' });
  };

  const handleAddTask = async () => {
    if (!newTitle || !addDate) return;
    await supabase.from('staff_tasks').insert({
      title: newTitle,
      description: newDescription || null,
      scheduled_date: format(addDate, 'yyyy-MM-dd'),
      assigned_to: newAssignedTo || null,
      created_by: currentUserId,
      priority: newPriority,
    });
    setNewTitle("");
    setNewDescription("");
    setNewAssignedTo("");
    setNewPriority("normal");
    setShowAddTask(false);
    setAddDate(null);
    loadTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Weet je zeker dat je deze taak wilt verwijderen?")) return;
    await supabase.from('staff_tasks').delete().eq('id', taskId);
    setSelectedTask(null);
    loadTasks();
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    await supabase.from('staff_tasks').update({ status: newStatus }).eq('id', task.id);
    loadTasks();
    if (selectedTask?.id === task.id) {
      setSelectedTask({ ...task, status: newStatus });
    }
  };

  const handleAddUpdate = async () => {
    if (!selectedTask || !updateMessage.trim()) return;
    await supabase.from('staff_task_updates').insert({
      task_id: selectedTask.id,
      user_id: currentUserId,
      message: updateMessage,
    });
    setUpdateMessage("");
    loadTaskUpdates(selectedTask.id);
  };

  const handleCreateRequest = async () => {
    if (!selectedTask) return;
    await supabase.from('staff_task_requests').insert({
      task_id: selectedTask.id,
      requested_by: currentUserId,
      request_type: requestType,
      message: requestMessage.trim() || null,
    });
    setShowRequestModal(false);
    setRequestMessage("");
    setRequestType("cannot_do");
    loadTaskRequests();
  };

  const handleTakeOverTask = async (request: TaskRequest) => {
    await supabase.from('staff_task_requests').update({ taken_by: currentUserId, status: 'taken' }).eq('id', request.id);
    await supabase.from('staff_tasks').update({ assigned_to: currentUserId }).eq('id', request.task_id);
    loadTasks();
    loadTaskRequests();
  };

  const openTask = (task: Task) => {
    setSelectedTask(task);
    loadTaskUpdates(task.id);
  };

  const getUsername = (userId: string | null) => {
    if (!userId) return "Niet toegewezen";
    return staffProfiles.find(p => p.user_id === userId)?.username || "Onbekend";
  };

  const handleClaimTask = async (task: Task) => {
    const { error } = await supabase.from('staff_tasks').update({ assigned_to: currentUserId }).eq('id', task.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Fout', description: error.message });
      return;
    }
    const updatedTask = { ...task, assigned_to: currentUserId };
    setTasks(prev => prev.map(item => item.id === task.id ? updatedTask : item));
    setSelectedTask(updatedTask);
    toast({ title: 'Taak toegewezen', description: 'De taak staat nu op jouw naam.' });
  };

  const openHoursEntry = async (task: Task, viewOnly = false) => {
    setShowHoursModal(true);
    setHoursLoading(true);
    setHoursViewOnly(viewOnly);

    const weekStartValue = getTaskWeekStart(task);
    const { data, error } = await supabase
      .from('staff_hours')
      .select('*')
      .eq('week_start', weekStartValue)
      .order('created_at');

    if (error) {
      setHoursLoading(false);
      toast({ variant: 'destructive', title: 'Fout', description: error.message });
      return;
    }

    const existingRows = (data || []).map((entry: any) => ({
      rowId: entry.id,
      personName: entry.person_name || '',
      hours: String(entry.hours),
      afgemeld: entry.notes === 'AFGEMELD',
    }));

    setHourRows(existingRows.length > 0 ? existingRows : [createEmptyHourRow()]);
    setHoursLoading(false);
  };

  // Match a typed name to a known absence (case-insensitive). Returns absence record or null.
  const findAbsenceForName = (name: string, weekStartValue: string): AbsenceRecord | null => {
    if (!name.trim()) return null;
    const lower = name.trim().toLowerCase();
    const weekStartDate = parseISO(`${weekStartValue}T00:00:00`);
    const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });

    return absences.find(a => {
      const profile = staffProfiles.find(p => p.user_id === a.user_id);
      const customMatch = a.reason?.match(/^\[([^\]]+)\]/);
      const matchesByProfile = profile && profile.username.toLowerCase() === lower;
      const matchesByCustom = customMatch && customMatch[1].toLowerCase() === lower;
      if (!matchesByProfile && !matchesByCustom) return false;
      const absStart = parseISO(a.start_date);
      const absEnd = parseISO(a.end_date);
      return absStart <= weekEndDate && absEnd >= weekStartDate;
    }) || null;
  };

  // Required hours for a person in this week (default 5.25h, less if absent)
  const getRequiredHoursForRow = (row: HourRow, weekStartValue: string): number => {
    const absence = findAbsenceForName(row.personName, weekStartValue);
    if (!absence) return DEFAULT_REQUIRED_HOURS;
    return calculateRequiredHoursForWeek(
      parseISO(`${weekStartValue}T00:00:00`),
      parseISO(absence.start_date),
      parseISO(absence.end_date)
    );
  };

  // Status: 'inactivity' | 'ok' | 'promotion' | null (afgemeld/leeg)
  const getRowStatus = (row: HourRow, weekStartValue: string): 'inactivity' | 'ok' | 'promotion' | null => {
    if (!row.personName.trim() || row.afgemeld) return null;
    const hours = parseFloat(row.hours);
    if (isNaN(hours) || hours === 0) return null;
    const required = getRequiredHoursForRow(row, weekStartValue);
    const inactivityThreshold = Math.min(5, required);
    if (hours < inactivityThreshold) return 'inactivity';
    if (hours > 7) return 'promotion';
    return 'ok';
  };

  const addHourRow = () => {
    setHourRows(prev => [...prev, createEmptyHourRow()]);
  };

  const updateHourRow = (rowId: string, field: 'personName' | 'hours' | 'afgemeld', value: string | boolean) => {
    const weekStartValue = selectedTask ? getTaskWeekStart(selectedTask) : '';
    setHourRows(prev => prev.map((row) => {
      if (row.rowId !== rowId) return row;
      if (field === 'afgemeld') {
        return { ...row, afgemeld: Boolean(value), hours: value ? '0' : row.hours };
      }
      const updated = { ...row, [field]: value };
      // Auto-set afgemeld when a typed name matches a known absence
      if (field === 'personName' && weekStartValue) {
        const absence = findAbsenceForName(value as string, weekStartValue);
        if (absence) {
          updated.afgemeld = true;
          updated.hours = '0';
        }
      }
      return updated;
    }));
  };

  const removeHourRow = (rowId: string) => {
    setHourRows(prev => prev.length === 1 ? [createEmptyHourRow()] : prev.filter(row => row.rowId !== rowId));
  };

  const handleHoursSubmit = async () => {
    if (!selectedTask) return;

    const filledRows = hourRows.filter(row => row.personName.trim());
    if (filledRows.length === 0) {
      toast({ variant: 'destructive', title: 'Geen namen ingevuld', description: 'Voeg minimaal één persoon toe.' });
      return;
    }

    setHoursSubmitting(true);

    try {
      const weekStartValue = getTaskWeekStart(selectedTask);

      // Delete existing entries for this week, then re-insert all
      await supabase.from('staff_hours').delete().eq('week_start', weekStartValue);

      const inserts = filledRows.map(row => ({
        user_id: currentUserId,
        submitted_by: currentUserId,
        person_name: row.personName.trim(),
        week_start: weekStartValue,
        hours: row.afgemeld ? 0 : (parseFloat(row.hours) || 0),
        notes: row.afgemeld ? 'AFGEMELD' : null,
      }));

      const { error } = await supabase.from('staff_hours').insert(inserts);
      if (error) throw error;

      toast({ title: 'Uren opgeslagen', description: 'De urenlijst is bijgewerkt.' });

      if (selectedTask.status === 'open') {
        await handleStatusChange(selectedTask, 'in_progress');
      }

      closeHoursModal();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Opslaan mislukt', description: error?.message || 'Kon niet opslaan.' });
    } finally {
      setHoursSubmitting(false);
    }
  };

  const getTasksForDay = (day: Date) => tasks.filter(t => isSameDay(new Date(t.scheduled_date + 'T00:00:00'), day));

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'border-red-500/50 bg-red-500/5';
      case 'normal': return 'border-[#00ff88]/30 bg-[#00ff88]/5';
      case 'low': return 'border-[#4b5563] bg-[#1f2937]/50';
      default: return 'border-[#374151]';
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'done': return <CheckCircle2 className="h-4 w-4 text-[#00ff88]" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-amber-400" />;
      default: return <Circle className="h-4 w-4 text-[#4b5563]" />;
    }
  };

  const relevantRequests = taskRequests.filter(r => tasks.some(t => t.id === r.task_id));

  // Determine who can enter hours for this task
  const canEnterHours = (task: Task | null) => Boolean(
    task && isHoursTask(task) && task.assigned_to === currentUserId
  );

  // Everyone can view hours
  const canViewHours = (task: Task | null) => Boolean(task && isHoursTask(task));

  return (
    <div className="space-y-6">
      {/* Open transfer requests banner */}
      {relevantRequests.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
            <ArrowRightLeft className="h-4 w-4" /> Overdrachtsverzoeken ({relevantRequests.length})
          </h3>
          <div className="space-y-2">
            {relevantRequests.map(r => {
              const task = tasks.find(t => t.id === r.task_id);
              return (
                <div key={r.id} className="flex items-center justify-between bg-[#1f2937]/50 rounded-lg p-3">
                  <div>
                    <p className="text-sm text-white">{task?.title || "Onbekende taak"}</p>
                    <p className="text-xs text-[#6b7280]">
                      {getUsername(r.requested_by)} kan deze taak {r.request_type === 'cannot_do' ? 'niet uitvoeren' : 'niet op tijd afronden'}
                      {r.message && ` — "${r.message}"`}
                    </p>
                  </div>
                  {r.requested_by !== currentUserId && (
                    <button onClick={() => handleTakeOverTask(r)} className="px-3 py-1.5 bg-[#00ff88]/10 text-[#00ff88] rounded-lg text-xs font-medium hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1">
                      <Hand className="h-3 w-3" /> Overnemen
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 hover:bg-[#1f2937] rounded-lg text-[#9ca3af] transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-white font-semibold">
          <Calendar className="h-5 w-5 text-[#00ff88]" />
          <span className="text-sm sm:text-base">Week {format(weekStart, 'w')} — {format(weekStart, 'd MMM', { locale: nl })} t/m {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: nl })}</span>
        </div>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 hover:bg-[#1f2937] rounded-lg text-[#9ca3af] transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          const today = isToday(day);
          return (
            <div key={day.toISOString()} className={`rounded-xl border p-3 min-h-[180px] transition-all ${today ? 'border-[#00ff88]/40 bg-[#00ff88]/5' : 'border-[#1f2937] bg-[#111827]/50'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wider ${today ? 'text-[#00ff88]' : 'text-[#6b7280]'}`}>{format(day, 'EEE', { locale: nl })}</p>
                  <p className={`text-lg font-bold ${today ? 'text-white' : 'text-[#9ca3af]'}`}>{format(day, 'd')}</p>
                </div>
                {isBestuur && (
                  <button onClick={() => { setAddDate(day); setShowAddTask(true); }} className="p-1 hover:bg-[#00ff88]/10 rounded text-[#00ff88]/50 hover:text-[#00ff88] transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {dayTasks.map(task => {
                  const isAssignedToMe = task.assigned_to === currentUserId;
                  const hasRequest = taskRequests.some(r => r.task_id === task.id);
                  return (
                    <button key={task.id} onClick={() => openTask(task)} className={`w-full text-left p-2 rounded-lg border transition-all hover:scale-[1.02] ${priorityColor(task.priority)} ${isAssignedToMe ? 'ring-1 ring-[#00ff88]/40' : ''} ${hasRequest ? 'ring-1 ring-amber-500/40' : ''}`}>
                      <div className="flex items-start gap-2">
                        {statusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${task.status === 'done' ? 'text-[#6b7280] line-through' : 'text-white'}`}>{task.title}</p>
                          {task.assigned_to && (
                            <p className="text-[10px] text-[#6b7280] mt-0.5 flex items-center gap-1">
                              <UserIcon className="h-2.5 w-2.5" />{getUsername(task.assigned_to)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {dayTasks.length === 0 && <p className="text-[10px] text-[#374151] text-center py-4">Geen taken</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddTask && addDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Taak Toevoegen</h3>
              <button onClick={() => { setShowAddTask(false); setAddDate(null); setNewTitle(""); setNewDescription(""); setNewAssignedTo(""); setNewPriority("normal"); }} className="text-[#6b7280] hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-[#00ff88] mb-4">{format(addDate, 'EEEE d MMMM yyyy', { locale: nl })}</p>

            {/* Quick action: Week uren */}
            <div className="mb-4 p-3 bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-xl">
              <p className="text-sm font-medium text-[#00ff88] mb-2 flex items-center gap-2"><Clock className="h-4 w-4" /> Snelactie</p>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-[#6b7280] mb-1 block">Toewijzen aan</label>
                  <select value={newAssignedTo} onChange={e => setNewAssignedTo(e.target.value)} className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff88]/50">
                    <option value="">Kies stafflid</option>
                    {staffProfiles.map(sp => (
                      <option key={sp.user_id} value={sp.user_id}>{sp.username}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => handleAddWeekUren(addDate)} className="px-4 py-2 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-sm font-semibold whitespace-nowrap">
                  + Week uren
                </button>
              </div>
            </div>

            <div className="relative flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-[#1f2937]" />
              <span className="text-xs text-[#4b5563]">of maak een gewone taak</span>
              <div className="flex-1 h-px bg-[#1f2937]" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[#9ca3af] text-sm mb-1 block">Titel *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Taaknaam" className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50" />
              </div>
              <div>
                <label className="text-[#9ca3af] text-sm mb-1 block">Beschrijving</label>
                <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Details over de taak..." rows={3} className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50 resize-none" />
              </div>
              <div>
                <label className="text-[#9ca3af] text-sm mb-1 block">Toewijzen aan</label>
                <select value={newAssignedTo} onChange={e => setNewAssignedTo(e.target.value)} className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50">
                  <option value="">Niet toewijzen</option>
                  {staffProfiles.map(sp => (
                    <option key={sp.user_id} value={sp.user_id}>{sp.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[#9ca3af] text-sm mb-1 block">Prioriteit</label>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50">
                  <option value="low">Laag</option>
                  <option value="normal">Normaal</option>
                  <option value="high">Hoog</option>
                </select>
              </div>
              <button onClick={handleAddTask} disabled={!newTitle} className="w-full bg-[#00ff88] hover:bg-[#00dd77] text-[#0a0e1a] font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50">Toevoegen</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{selectedTask.title}</h3>
              <div className="flex items-center gap-2">
                {isBestuur && (
                  <button onClick={() => handleDeleteTask(selectedTask.id)} className="text-red-400/50 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setSelectedTask(null)} className="text-[#6b7280] hover:text-white"><X className="h-5 w-5" /></button>
              </div>
            </div>

            {selectedTask.description && <p className="text-sm text-[#9ca3af] mb-4">{selectedTask.description}</p>}

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs px-2 py-1 rounded bg-[#1f2937] text-[#9ca3af]">{format(new Date(selectedTask.scheduled_date + 'T00:00:00'), 'EEEE d MMMM', { locale: nl })}</span>
              <span className={`text-xs px-2 py-1 rounded ${selectedTask.priority === 'high' ? 'bg-red-500/20 text-red-400' : selectedTask.priority === 'low' ? 'bg-[#374151] text-[#6b7280]' : 'bg-[#00ff88]/10 text-[#00ff88]'}`}>
                {selectedTask.priority === 'high' ? 'Hoog' : selectedTask.priority === 'low' ? 'Laag' : 'Normaal'}
              </span>
              <span className="text-xs px-2 py-1 rounded bg-[#1f2937] text-[#9ca3af] flex items-center gap-1">
                <UserIcon className="h-3 w-3" />{getUsername(selectedTask.assigned_to)}
              </span>
            </div>

            {/* Hours task: claim if unassigned and not bestuur */}
            {isHoursTask(selectedTask) && !selectedTask.assigned_to && !isBestuur && (
              <button onClick={() => handleClaimTask(selectedTask)} className="w-full mb-4 px-4 py-2 bg-[#1f2937] text-white rounded-lg text-sm font-medium hover:border-[#00ff88]/40 border border-[#374151] transition-colors">
                Neem taak op mij
              </button>
            )}

            {/* Hours task: enter hours (only assigned person) */}
            {canEnterHours(selectedTask) && (
              <button onClick={() => openHoursEntry(selectedTask, false)} className="w-full mb-4 px-4 py-2 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                Uren invullen
              </button>
            )}

            {/* Hours task: view hours (everyone except the one who can edit) */}
            {canViewHours(selectedTask) && !canEnterHours(selectedTask) && (
              <button onClick={() => openHoursEntry(selectedTask, true)} className="w-full mb-4 px-4 py-2 bg-[#1f2937] text-white rounded-lg text-sm font-medium border border-[#374151] hover:border-[#00ff88]/40 transition-colors">
                Uren bekijken
              </button>
            )}

            {/* Status buttons */}
            {(isBestuur || selectedTask.assigned_to === currentUserId) && (
              <div className="flex gap-2 mb-4">
                {['open', 'in_progress', 'done'].map(s => (
                  <button key={s} onClick={() => handleStatusChange(selectedTask, s)} className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all ${selectedTask.status === s ? s === 'done' ? 'bg-[#00ff88] text-[#0a0e1a]' : s === 'in_progress' ? 'bg-amber-400 text-[#0a0e1a]' : 'bg-[#374151] text-white' : 'bg-[#1f2937] text-[#6b7280] hover:text-white'}`}>
                    {s === 'open' ? 'Open' : s === 'in_progress' ? 'Bezig' : 'Gedaan'}
                  </button>
                ))}
              </div>
            )}

            {/* Request transfer */}
            {selectedTask.assigned_to === currentUserId && selectedTask.status !== 'done' && (
              <button onClick={() => setShowRequestModal(true)} className="w-full mb-4 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2">
                <ArrowRightLeft className="h-3.5 w-3.5" /> Kan niet / overdragen
              </button>
            )}

            {/* Updates */}
            <div className="border-t border-[#1f2937] pt-4">
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-[#00ff88]" /> Updates</h4>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {taskUpdates.map(u => (
                  <div key={u.id} className="bg-[#1f2937] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#00ff88] font-medium">{getUsername(u.user_id)}</span>
                      <span className="text-[10px] text-[#4b5563]">{format(new Date(u.created_at), 'dd/MM HH:mm')}</span>
                    </div>
                    {u.message && <p className="text-xs text-[#d1d5db]">{u.message}</p>}
                  </div>
                ))}
                {taskUpdates.length === 0 && <p className="text-xs text-[#374151] text-center py-4">Nog geen updates</p>}
              </div>

              {(isBestuur || selectedTask.assigned_to === currentUserId) && (
                <div className="flex gap-2">
                  <input value={updateMessage} onChange={e => setUpdateMessage(e.target.value)} placeholder="Voeg een update toe..." onKeyDown={e => e.key === 'Enter' && handleAddUpdate()} className="flex-1 bg-[#0a0e1a] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff88]/50" />
                  <button onClick={handleAddUpdate} disabled={!updateMessage.trim()} className="px-4 py-2 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-sm font-medium disabled:opacity-50 transition-all">Verstuur</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hours Entry/View Modal */}
      {showHoursModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{hoursViewOnly ? 'Uren overzicht' : 'Uren invullen'}</h3>
                <p className="text-sm text-[#6b7280]">
                  Week {format(new Date(`${getTaskWeekStart(selectedTask)}T00:00:00`), 'w')} — {format(new Date(`${getTaskWeekStart(selectedTask)}T00:00:00`), 'd MMM', { locale: nl })} t/m {format(addDays(new Date(`${getTaskWeekStart(selectedTask)}T00:00:00`), 6), 'd MMM yyyy', { locale: nl })}
                </p>
              </div>
              <button onClick={closeHoursModal} className="text-[#6b7280] hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {hoursLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : hoursViewOnly ? (
              /* View-only mode */
              <div className="space-y-2">
                {hourRows.length === 0 || (hourRows.length === 1 && !hourRows[0].personName) ? (
                  <p className="text-sm text-[#374151] text-center py-8">Nog geen uren ingevuld voor deze week.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-2 text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                      <span>Naam</span>
                      <span className="text-center">Uren</span>
                      <span className="text-center">Status</span>
                    </div>
                    {hourRows.filter(r => r.personName).map(row => {
                      const status = getRowStatus(row, getTaskWeekStart(selectedTask));
                      const required = getRequiredHoursForRow(row, getTaskWeekStart(selectedTask));
                      return (
                        <div key={row.rowId} className="bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-3">
                          <div className="grid grid-cols-[1fr_80px_80px] gap-2 items-center">
                            <span className="text-sm text-white font-medium">{row.personName}</span>
                            <span className={`text-sm text-center ${row.afgemeld ? 'text-[#374151]' : 'text-white'}`}>{row.afgemeld ? '-' : (parseFloat(row.hours) || 0).toFixed(1).replace('.', ',')}</span>
                            <span className={`text-xs text-center px-2 py-1 rounded ${row.afgemeld ? 'bg-red-500/10 text-red-400' : 'bg-[#00ff88]/10 text-[#00ff88]'}`}>
                              {row.afgemeld ? 'Afgemeld' : 'Actief'}
                            </span>
                          </div>
                          {!row.afgemeld && status && (
                            <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                              status === 'inactivity' ? 'bg-red-500/10 text-red-400' :
                              status === 'promotion' ? 'bg-amber-400/10 text-amber-300' :
                              'bg-[#00ff88]/10 text-[#00ff88]'
                            }`}>
                              {status === 'inactivity' && <><AlertTriangle className="h-3 w-3" /> Inactiviteit waarschuwing — onder de {Math.min(5, required).toFixed(1).replace('.', ',')} uur</>}
                              {status === 'ok' && <><Check className="h-3 w-3" /> In orde</>}
                              {status === 'promotion' && <><TrendingUp className="h-3 w-3" /> Promotie — boven de 7 uur</>}
                            </div>
                          )}
                          {row.afgemeld && (
                            <p className="text-[10px] text-[#6b7280] mt-1.5">Moet deze week nog {required.toFixed(1).replace('.', ',')} uur halen</p>
                          )}
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center bg-[#1f2937] rounded-lg px-3 py-3 mt-2">
                      <span className="text-sm font-medium text-[#9ca3af]">Totaal uren</span>
                      <span className="text-sm font-bold text-[#00ff88]">
                        {hourRows.filter(r => !r.afgemeld && r.personName).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0).toFixed(1).replace('.', ',')}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Edit mode */
              <div className="space-y-3">
                <p className="text-sm text-[#9ca3af] mb-2">
                  Vul per persoon de naam in, het aantal uren, en of diegene afgemeld is. Afgemelde personen worden automatisch herkend.
                </p>
                {hourRows.map((row, index) => {
                  const weekStartValue = getTaskWeekStart(selectedTask);
                  const status = getRowStatus(row, weekStartValue);
                  const required = getRequiredHoursForRow(row, weekStartValue);
                  return (
                    <div key={row.rowId} className="bg-[#0a0e1a] border border-[#1f2937] rounded-xl p-3 space-y-2">
                      <div className="grid grid-cols-[1fr_80px_auto_auto] gap-2 items-center">
                        <input
                          type="text"
                          value={row.personName}
                          onChange={e => updateHourRow(row.rowId, 'personName', e.target.value)}
                          placeholder={`Naam ${index + 1}`}
                          className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={row.hours}
                          onChange={e => updateHourRow(row.rowId, 'hours', e.target.value)}
                          disabled={row.afgemeld}
                          placeholder="0"
                          className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff88]/50 disabled:opacity-40 text-center"
                        />
                        <button
                          onClick={() => updateHourRow(row.rowId, 'afgemeld', !row.afgemeld)}
                          className={`h-9 px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                            row.afgemeld
                              ? 'border-red-500/30 bg-red-500/10 text-red-400'
                              : 'border-[#374151] bg-[#1f2937] text-[#9ca3af] hover:text-white'
                          }`}
                        >
                          {row.afgemeld ? 'Afgemeld' : 'Actief'}
                        </button>
                        <button
                          onClick={() => removeHourRow(row.rowId)}
                          className="h-9 w-9 rounded-lg border border-[#374151] bg-[#1f2937] text-[#6b7280] hover:text-red-400 transition-colors flex items-center justify-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {!row.afgemeld && status && (
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                          status === 'inactivity' ? 'bg-red-500/10 text-red-400' :
                          status === 'promotion' ? 'bg-amber-400/10 text-amber-300' :
                          'bg-[#00ff88]/10 text-[#00ff88]'
                        }`}>
                          {status === 'inactivity' && <><AlertTriangle className="h-3 w-3" /> Inactiviteit waarschuwing — onder de {Math.min(5, required).toFixed(1).replace('.', ',')} uur</>}
                          {status === 'ok' && <><Check className="h-3 w-3" /> In orde</>}
                          {status === 'promotion' && <><TrendingUp className="h-3 w-3" /> Promotie — boven de 7 uur</>}
                        </div>
                      )}
                      {row.afgemeld && row.personName && (
                        <p className="text-[10px] text-[#6b7280]">Afgemeld — moet deze week alsnog {required.toFixed(1).replace('.', ',')} uur halen</p>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={addHourRow}
                  className="w-full border border-dashed border-[#374151] rounded-xl py-3 text-sm font-medium text-[#00ff88] hover:border-[#00ff88]/40 hover:bg-[#00ff88]/5 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Persoon toevoegen
                </button>
              </div>
            )}

            {!hoursViewOnly && (
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={closeHoursModal} className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors">Sluiten</button>
                <button
                  onClick={handleHoursSubmit}
                  disabled={hoursSubmitting || hoursLoading}
                  className="px-5 py-2.5 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
                >
                  {hoursSubmitting ? 'Opslaan...' : 'Uren opslaan'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Transfer Modal */}
      {showRequestModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Overdrachtsverzoek</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-[#6b7280] hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[#9ca3af] text-sm mb-1 block">Type</label>
                <select value={requestType} onChange={e => setRequestType(e.target.value)} className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50">
                  <option value="cannot_do">Kan ik niet doen</option>
                  <option value="delayed">Niet op tijd</option>
                </select>
              </div>
              <div>
                <label className="text-[#9ca3af] text-sm mb-1 block">Toelichting</label>
                <textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)} placeholder="Waarom kun je deze taak niet doen..." rows={3} className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50 resize-none" />
              </div>
              <button onClick={handleCreateRequest} className="w-full bg-amber-500 hover:bg-amber-600 text-[#0a0e1a] font-semibold py-2.5 rounded-lg transition-all">Verzoek indienen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
