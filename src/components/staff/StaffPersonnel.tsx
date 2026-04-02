import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isPast } from "date-fns";
import { nl } from "date-fns/locale";
import { Users, Search, Clock, UserX, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface StaffProfile {
  user_id: string;
  username: string;
}

interface HourEntry {
  id: string;
  user_id: string;
  week_start: string;
  hours: number;
  notes: string | null;
  submitted_at: string;
}

interface Absence {
  id: string;
  user_id: string;
  reason: string | null;
  end_date: string;
  active: boolean;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  assigned_to: string | null;
  scheduled_date: string;
}

interface Props {
  staffProfiles: StaffProfile[];
}

export const StaffPersonnel = ({ staffProfiles }: Props) => {
  const [search, setSearch] = useState("");
  const [hours, setHours] = useState<HourEntry[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadHours(), loadAbsences(), loadTasks()]).then(() => setLoading(false));
  }, []);

  const loadHours = async () => {
    const { data } = await supabase.from('staff_hours').select('*').order('week_start', { ascending: false });
    setHours((data as HourEntry[]) || []);
  };

  const loadAbsences = async () => {
    const { data } = await supabase.from('staff_absences').select('*').order('created_at', { ascending: false });
    setAbsences((data as Absence[]) || []);
  };

  const loadTasks = async () => {
    const { data } = await supabase.from('staff_tasks').select('*').order('scheduled_date', { ascending: false });
    setTasks((data as Task[]) || []);
  };

  const filtered = staffProfiles.filter(p =>
    !search || p.username.toLowerCase().includes(search.toLowerCase())
  );

  const getUserHours = (userId: string) => hours.filter(h => h.user_id === userId);
  const getUserAbsences = (userId: string) => absences.filter(a => a.user_id === userId);
  const getUserTasks = (userId: string) => tasks.filter(t => t.assigned_to === userId);
  const isAbsent = (userId: string) => absences.some(a => a.user_id === userId && a.active && !isPast(parseISO(a.end_date)));

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-[#00ff88]" />
          Personeelsbeheer
        </h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4b5563]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek op naam..."
          className="w-full bg-[#1f2937] border border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
        />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#111827]/60 border border-[#1f2937] rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{staffProfiles.length}</p>
          <p className="text-xs text-[#6b7280]">Totaal leden</p>
        </div>
        <div className="bg-[#111827]/60 border border-[#1f2937] rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">{staffProfiles.filter(p => isAbsent(p.user_id)).length}</p>
          <p className="text-xs text-[#6b7280]">Afgemeld</p>
        </div>
        <div className="bg-[#111827]/60 border border-[#1f2937] rounded-xl p-4">
          <p className="text-2xl font-bold text-[#00ff88]">{hours.reduce((s, h) => s + h.hours, 0)}</p>
          <p className="text-xs text-[#6b7280]">Totaal uren</p>
        </div>
        <div className="bg-[#111827]/60 border border-[#1f2937] rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">{tasks.filter(t => t.status !== 'done').length}</p>
          <p className="text-xs text-[#6b7280]">Open taken</p>
        </div>
      </div>

      {/* Staff members list */}
      <div className="space-y-2">
        {filtered.map(profile => {
          const userHours = getUserHours(profile.user_id);
          const userAbsences = getUserAbsences(profile.user_id);
          const userTasks = getUserTasks(profile.user_id);
          const totalHours = userHours.reduce((s, h) => s + h.hours, 0);
          const openTasks = userTasks.filter(t => t.status !== 'done').length;
          const absent = isAbsent(profile.user_id);
          const expanded = expandedUser === profile.user_id;

          return (
            <div key={profile.user_id} className={`bg-[#111827]/60 border rounded-xl overflow-hidden transition-colors ${absent ? 'border-amber-500/30' : 'border-[#1f2937]'}`}>
              <button
                onClick={() => setExpandedUser(expanded ? null : profile.user_id)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#1f2937]/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${absent ? 'bg-amber-500/20 text-amber-400' : 'bg-[#00ff88]/10 text-[#00ff88]'}`}>
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      {profile.username}
                      {absent && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">Afgemeld</span>}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
                      <span>{totalHours}u totaal</span>
                      <span>{openTasks} open taken</span>
                    </div>
                  </div>
                </div>
                {expanded ? <ChevronUp className="h-4 w-4 text-[#6b7280]" /> : <ChevronDown className="h-4 w-4 text-[#6b7280]" />}
              </button>

              {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-[#1f2937]">
                  {/* Warnings */}
                  {absent && openTasks > 0 && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-400">
                        Deze persoon is afgemeld maar heeft nog {openTasks} openstaande {openTasks === 1 ? 'taak' : 'taken'}!
                      </p>
                    </div>
                  )}

                  {/* Hours table */}
                  <div className="mt-3">
                    <h4 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Urenhistorie
                    </h4>
                    {userHours.length > 0 ? (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#1f2937]">
                            <th className="text-left py-2 px-2 text-[#6b7280]">Week</th>
                            <th className="text-right py-2 px-2 text-[#6b7280]">Uren</th>
                            <th className="text-left py-2 px-2 text-[#6b7280]">Toelichting</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userHours.slice(0, 10).map(h => (
                            <tr key={h.id} className="border-b border-[#1f2937]/30">
                              <td className="py-2 px-2 text-[#9ca3af]">Week {format(new Date(h.week_start + 'T00:00:00'), 'w')} — {format(new Date(h.week_start + 'T00:00:00'), 'd MMM', { locale: nl })}</td>
                              <td className="py-2 px-2 text-right text-[#00ff88] font-semibold">{h.hours}u</td>
                              <td className="py-2 px-2 text-[#6b7280] truncate max-w-[200px]">{h.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-xs text-[#374151] py-2">Geen uren ingediend</p>
                    )}
                  </div>

                  {/* Recent tasks */}
                  <div>
                    <h4 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Recente taken
                    </h4>
                    <div className="space-y-1">
                      {userTasks.slice(0, 5).map(t => (
                        <div key={t.id} className="flex items-center justify-between py-1.5 px-2 bg-[#1f2937]/30 rounded">
                          <span className="text-xs text-[#d1d5db]">{t.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            t.status === 'done' ? 'bg-[#00ff88]/10 text-[#00ff88]' : t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-[#374151] text-[#6b7280]'
                          }`}>{t.status === 'done' ? 'Gedaan' : t.status === 'in_progress' ? 'Bezig' : 'Open'}</span>
                        </div>
                      ))}
                      {userTasks.length === 0 && <p className="text-xs text-[#374151] py-2">Geen taken</p>}
                    </div>
                  </div>

                  {/* Absences */}
                  {userAbsences.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-1">
                        <UserX className="h-3 w-3" /> Afmeldingen
                      </h4>
                      <div className="space-y-1">
                        {userAbsences.slice(0, 5).map(a => (
                          <div key={a.id} className="flex items-center justify-between py-1.5 px-2 bg-[#1f2937]/30 rounded">
                            <span className="text-xs text-[#9ca3af]">{a.reason || "Geen reden"}</span>
                            <span className="text-[10px] text-[#6b7280]">tot {format(parseISO(a.end_date), 'd MMM yyyy', { locale: nl })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#374151]">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Geen leden gevonden</p>
          </div>
        )}
      </div>
    </div>
  );
};
