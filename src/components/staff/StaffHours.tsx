import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, parseISO, max as dateMax, min as dateMin, endOfWeek, differenceInCalendarDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Clock, ChevronLeft, ChevronRight, Calendar, AlertTriangle, TrendingUp, Check } from "lucide-react";

const MINUTES_PER_DAY = 45;
const DEFAULT_REQUIRED = (7 * MINUTES_PER_DAY) / 60;

interface AbsenceRecord {
  id: string;
  user_id: string;
  reason: string | null;
  start_date: string;
  end_date: string;
  active: boolean;
}

interface StaffProfile {
  user_id: string;
  username: string;
}

interface HourEntry {
  id: string;
  user_id: string;
  person_name: string | null;
  week_start: string;
  hours: number;
  notes: string | null;
  submitted_at: string;
  submitted_by: string | null;
}

interface Props {
  isBestuur: boolean;
  currentUserId: string;
  staffProfiles: StaffProfile[];
}

export const StaffHours = ({ isBestuur, currentUserId, staffProfiles }: Props) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [hours, setHours] = useState<HourEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHours();
  }, [weekStart]);

  const loadHours = async () => {
    setLoading(true);
    const ws = format(weekStart, 'yyyy-MM-dd');
    const { data } = await supabase
      .from('staff_hours')
      .select('*')
      .eq('week_start', ws)
      .order('created_at');
    setHours((data as HourEntry[]) || []);
    setLoading(false);
  };

  const getUsername = (userId: string | null) => {
    if (!userId) return "Onbekend";
    return staffProfiles.find(p => p.user_id === userId)?.username || "Onbekend";
  };

  const activeEntries = hours.filter(h => h.notes !== 'AFGEMELD');
  const afgemeldEntries = hours.filter(h => h.notes === 'AFGEMELD');
  const totalHours = activeEntries.reduce((sum, h) => sum + h.hours, 0);

  return (
    <div className="space-y-6">
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : hours.length === 0 ? (
        <div className="bg-[#111827]/60 border border-[#1f2937] rounded-2xl p-8 text-center">
          <Clock className="h-10 w-10 text-[#374151] mx-auto mb-3" />
          <p className="text-[#6b7280] text-sm">Nog geen uren ingevuld voor deze week.</p>
          <p className="text-[#4b5563] text-xs mt-1">Uren worden ingevuld via een "Week uren" taak bij Taken.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111827]/60 border border-[#1f2937] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#00ff88]">{activeEntries.length}</p>
              <p className="text-xs text-[#6b7280]">Actief</p>
            </div>
            <div className="bg-[#111827]/60 border border-[#1f2937] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{afgemeldEntries.length}</p>
              <p className="text-xs text-[#6b7280]">Afgemeld</p>
            </div>
            <div className="bg-[#111827]/60 border border-[#1f2937] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{totalHours}</p>
              <p className="text-xs text-[#6b7280]">Totaal uren</p>
            </div>
          </div>

          <div className="bg-[#111827]/60 border border-[#1f2937] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-3 text-xs font-medium text-[#6b7280] uppercase tracking-wider border-b border-[#1f2937]">
              <span>Naam</span>
              <span className="text-center">Uren</span>
              <span className="text-center">Status</span>
            </div>
            {hours.map(entry => (
              <div key={entry.id} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center px-4 py-3 border-b border-[#1f2937]/50 last:border-0">
                <span className="text-sm text-white font-medium">{entry.person_name || getUsername(entry.user_id)}</span>
                <span className={`text-sm text-center ${entry.notes === 'AFGEMELD' ? 'text-[#374151]' : 'text-white'}`}>
                  {entry.notes === 'AFGEMELD' ? '-' : entry.hours}
                </span>
                <span className={`text-xs text-center px-2 py-1 rounded ${entry.notes === 'AFGEMELD' ? 'bg-red-500/10 text-red-400' : 'bg-[#00ff88]/10 text-[#00ff88]'}`}>
                  {entry.notes === 'AFGEMELD' ? 'Afgemeld' : 'Actief'}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 bg-[#1f2937]/30">
              <span className="text-sm font-medium text-[#9ca3af]">Totaal uren</span>
              <span className="text-sm font-bold text-[#00ff88]">{totalHours}</span>
            </div>
          </div>

          {hours[0]?.submitted_by && (
            <p className="text-xs text-[#4b5563] text-center">
              Ingevuld door {getUsername(hours[0].submitted_by)}
            </p>
          )}
        </>
      )}
    </div>
  );
};