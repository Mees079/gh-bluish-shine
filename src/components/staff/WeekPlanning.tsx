import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, User as UserIcon, CheckCircle2, Circle, AlertCircle, FileText, X, ArrowRightLeft, Hand, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface HourEntry {
  id: string;
  user_id: string;
  week_start: string;
  hours: number;
  notes: string | null;
  submitted_at: string;
}

interface HourRow {
  rowId: string;
  userId: string;
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
  userId: "",
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
  const { toast } = useToast();

  // Add task form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newPriority, setNewPriority] = useState("normal");

  // Task update form
  const [updateMessage, setUpdateMessage] = useState("");

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    loadTasks();
    loadTaskRequests();
  }, [weekStart]);

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

  const isHoursTask = (task: Task | null) => Boolean(task && task.title.trim().toLowerCase().startsWith('staff uren'));

  const canManageHoursTask = (task: Task | null) => Boolean(
    task && isHoursTask(task) && (isBestuur || task.assigned_to === currentUserId)
  );

  const canClaimHoursTask = (task: Task | null) => Boolean(
    task && isHoursTask(task) && !task.assigned_to && !isBestuur
  );

  const getTaskWeekStart = (task: Task) => format(
    startOfWeek(new Date(`${task.scheduled_date}T00:00:00`), { weekStartsOn: 1 }),
    'yyyy-MM-dd'
  );

  const closeHoursModal = () => {
    setShowHoursModal(false);
    setHourRows([createEmptyHourRow()]);
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
    // Update the request
    await supabase.from('staff_task_requests').update({ taken_by: currentUserId, status: 'taken' }).eq('id', request.id);
    // Reassign the task
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

  const handleClaimHoursTask = async (task: Task) => {
    const { error } = await supabase
      .from('staff_tasks')
      .update({ assigned_to: currentUserId })
      .eq('id', task.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: error.message,
      });
      return;
    }

    const updatedTask = { ...task, assigned_to: currentUserId };
    setTasks(prev => prev.map(item => item.id === task.id ? updatedTask : item));
    setSelectedTask(updatedTask);
    toast({
      title: 'Taak toegewezen',
      description: 'De taak staat nu op jouw naam.',
    });
  };

  const openHoursEntry = async (task: Task) => {
    setShowHoursModal(true);
    setHoursLoading(true);

    const weekStartValue = getTaskWeekStart(task);
    const { data, error } = await supabase
      .from('staff_hours')
      .select('*')
      .eq('week_start', weekStartValue)
      .order('created_at');

    if (error) {
      setHoursLoading(false);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: error.message,
      });
      return;
    }

    const existingRows = ((data as HourEntry[]) || []).map((entry) => ({
      rowId: entry.id,
      userId: entry.user_id,
      hours: String(entry.hours),
      afgemeld: entry.notes === 'AFGEMELD',
    }));

    setHourRows(existingRows.length > 0 ? existingRows : [createEmptyHourRow()]);
    setHoursLoading(false);
  };

  const addHourRow = () => {
    setHourRows(prev => [...prev, createEmptyHourRow()]);
  };

  const updateHourRow = (rowId: string, field: 'userId' | 'hours' | 'afgemeld', value: string | boolean) => {
    setHourRows(prev => prev.map((row) => {
      if (row.rowId !== rowId) return row;

      if (field === 'afgemeld') {
        return {
          ...row,
          afgemeld: Boolean(value),
          hours: value ? '0' : row.hours,
        };
      }

      return {
        ...row,
        [field]: value,
      };
    }));
  };

  const removeHourRow = (rowId: string) => {
    setHourRows(prev => prev.length === 1 ? [createEmptyHourRow()] : prev.filter(row => row.rowId !== rowId));
  };

  const handleHoursSubmit = async () => {
    if (!selectedTask) return;

    const filledRows = hourRows.filter(row => row.userId);
    if (filledRows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Geen medewerkers gekozen',
        description: 'Voeg minimaal één medewerker toe voordat je opslaat.',
      });
      return;
    }

    const seenUsers = new Set<string>();
    for (const row of filledRows) {
      if (seenUsers.has(row.userId)) {
        toast({
          variant: 'destructive',
          title: 'Dubbele naam gevonden',
          description: `${getUsername(row.userId)} staat meer dan één keer in de lijst.`,
        });
        return;
      }
      seenUsers.add(row.userId);
    }

    setHoursSubmitting(true);

    try {
      const weekStartValue = getTaskWeekStart(selectedTask);
      const { data: existingData, error: existingError } = await supabase
        .from('staff_hours')
        .select('*')
        .eq('week_start', weekStartValue);

      if (existingError) throw existingError;

      const existingRows = (existingData as HourEntry[]) || [];

      for (const row of filledRows) {
        const parsedHours = row.afgemeld ? 0 : parseFloat(row.hours);

        if (!row.afgemeld && Number.isNaN(parsedHours)) {
          throw new Error(`Vul geldige uren in voor ${getUsername(row.userId)}.`);
        }

        const payload = {
          hours: parsedHours,
          notes: row.afgemeld ? 'AFGEMELD' : null,
          submitted_at: new Date().toISOString(),
        };

        const existingEntry = existingRows.find(entry => entry.user_id === row.userId);

        if (existingEntry) {
          const { error } = await supabase
            .from('staff_hours')
            .update(payload)
            .eq('id', existingEntry.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('staff_hours')
            .insert({
              user_id: row.userId,
              week_start: weekStartValue,
              ...payload,
            });

          if (error) throw error;
        }
      }

      toast({
        title: 'Uren opgeslagen',
        description: 'De urenlijst is bijgewerkt voor deze week.',
      });

      if (selectedTask.status === 'open') {
        await handleStatusChange(selectedTask, 'in_progress');
      }

      closeHoursModal();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Opslaan mislukt',
        description: error?.message || 'De uren konden niet worden opgeslagen.',
      });
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

  // Open task requests for current tasks
  const relevantRequests = taskRequests.filter(r => tasks.some(t => t.id === r.task_id));

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
                    <button
                      onClick={() => handleTakeOverTask(r)}
                      className="px-3 py-1.5 bg-[#00ff88]/10 text-[#00ff88] rounded-lg text-xs font-medium hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1"
                    >
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
              <button onClick={() => { setShowAddTask(false); setAddDate(null); }} className="text-[#6b7280] hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-[#00ff88] mb-4">{format(addDate, 'EEEE d MMMM yyyy', { locale: nl })}</p>
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

            {canClaimHoursTask(selectedTask) && (
              <button
                onClick={() => handleClaimHoursTask(selectedTask)}
                className="w-full mb-4 px-4 py-2 bg-[#1f2937] text-white rounded-lg text-sm font-medium hover:border-[#00ff88]/40 border border-[#374151] transition-colors"
              >
                Neem taak op mij
              </button>
            )}

            {canManageHoursTask(selectedTask) && (
              <button
                onClick={() => openHoursEntry(selectedTask)}
                className="w-full mb-4 px-4 py-2 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.2)]"
              >
                {isBestuur && selectedTask.assigned_to !== currentUserId ? 'Uren bekijken' : 'Uren invoeren'}
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

            {/* Request transfer button (for coordinatie) */}
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

      {showHoursModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 w-full max-w-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Staff uren</h3>
                <p className="text-sm text-[#6b7280]">
                  Week {format(new Date(`${getTaskWeekStart(selectedTask)}T00:00:00`), 'w')} — {format(new Date(`${getTaskWeekStart(selectedTask)}T00:00:00`), 'd MMM', { locale: nl })} t/m {format(addDays(new Date(`${getTaskWeekStart(selectedTask)}T00:00:00`), 6), 'd MMM yyyy', { locale: nl })}
                </p>
              </div>
              <button onClick={closeHoursModal} className="text-[#6b7280] hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <p className="text-sm text-[#9ca3af] mb-4">
              Voeg per regel een medewerker toe met het aantal uren, of zet iemand op afgemeld.
            </p>

            {hoursLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {hourRows.map((row, index) => (
                  <div key={row.rowId} className="grid grid-cols-1 md:grid-cols-[1.5fr_0.7fr_auto_auto] gap-3 items-end bg-[#0a0e1a] border border-[#1f2937] rounded-xl p-4">
                    <div>
                      <label className="text-xs text-[#6b7280] mb-1 block">Naam {index + 1}</label>
                      <select
                        value={row.userId}
                        onChange={e => updateHourRow(row.rowId, 'userId', e.target.value)}
                        className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
                      >
                        <option value="">Kies stafflid</option>
                        {staffProfiles.map((profile) => {
                          const alreadySelected = hourRows.some(other => other.rowId !== row.rowId && other.userId === profile.user_id);
                          return (
                            <option key={profile.user_id} value={profile.user_id} disabled={alreadySelected}>
                              {profile.username}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-[#6b7280] mb-1 block">Uren</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={row.hours}
                        onChange={e => updateHourRow(row.rowId, 'hours', e.target.value)}
                        disabled={row.afgemeld}
                        placeholder="0"
                        className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50 disabled:opacity-40"
                      />
                    </div>

                    <button
                      onClick={() => updateHourRow(row.rowId, 'afgemeld', !row.afgemeld)}
                      className={`h-11 px-4 rounded-lg border text-sm font-medium transition-colors ${
                        row.afgemeld
                          ? 'border-red-500/30 bg-red-500/10 text-red-400'
                          : 'border-[#374151] bg-[#1f2937] text-[#9ca3af] hover:text-white'
                      }`}
                    >
                      {row.afgemeld ? 'Afgemeld' : 'Actief'}
                    </button>

                    <button
                      onClick={() => removeHourRow(row.rowId)}
                      className="h-11 w-11 rounded-lg border border-[#374151] bg-[#1f2937] text-[#6b7280] hover:text-red-400 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addHourRow}
                  className="w-full border border-dashed border-[#374151] rounded-xl py-3 text-sm font-medium text-[#00ff88] hover:border-[#00ff88]/40 hover:bg-[#00ff88]/5 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Persoon toevoegen
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeHoursModal} className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors">
                Sluiten
              </button>
              <button
                onClick={handleHoursSubmit}
                disabled={hoursSubmitting || hoursLoading}
                className="px-5 py-2.5 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
              >
                {hoursSubmitting ? 'Opslaan...' : 'Uren opslaan'}
              </button>
            </div>
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
