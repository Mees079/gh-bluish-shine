import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Clock, Search, UserX, FileText } from "lucide-react";

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

interface Props {
  isBestuur: boolean;
  currentUserId: string;
  staffProfiles: StaffProfile[];
}

export const StaffHours = ({ isBestuur, currentUserId, staffProfiles }: Props) => {
  const [entries, setEntries] = useState<HourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekStart = format(weekStart, 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase.from('staff_hours').select('*').order('week_start', { ascending: false });
    setEntries((data as HourEntry[]) || []);
    setLoading(false);
  };

  const getUsername = (userId: string) => staffProfiles.find(p => p.user_id === userId)?.username || "Onbekend";

  const currentWeekEntries = entries
    .filter((entry) => entry.week_start === currentWeekStart)
    .sort((a, b) => getUsername(a.user_id).localeCompare(getUsername(b.user_id)));

  const filteredCurrentWeekEntries = currentWeekEntries.filter((entry) => {
    if (!search) return true;
    return getUsername(entry.user_id).toLowerCase().includes(search.toLowerCase());
  });

  const myEntries = entries
    .filter((entry) => entry.user_id === currentUserId)
    .sort((a, b) => b.week_start.localeCompare(a.week_start));

  const currentWeekTotal = currentWeekEntries
    .filter((entry) => entry.notes !== "AFGEMELD")
    .reduce((sum, entry) => sum + entry.hours, 0);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#00ff88]" />
          Urenoverzicht — Week {format(weekStart, 'w')}
        </h2>
        <p className="text-sm text-[#6b7280]">
          {format(weekStart, 'd MMM', { locale: nl })} t/m {format(addDays(weekStart, 6), 'd MMM', { locale: nl })}
        </p>
      </div>

      <div className="bg-[#111827]/60 border border-[#1f2937] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-[#00ff88]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Nieuwe urenflow</h3>
            <p className="text-sm text-[#9ca3af] leading-relaxed">
              Bestuur plant een taak met de titel <span className="text-white font-medium">Staff uren</span> in bij Taken.
              De toegewezen staff coördinator opent die taak en voert daar per medewerker de uren in.
            </p>
          </div>
        </div>
      </div>

      {isBestuur ? (
        <>
          <div className="bg-[#111827]/60 border border-[#1f2937] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2937] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Deze week ingevoerd</h3>
                <p className="text-xs text-[#6b7280] mt-1">{currentWeekEntries.length} regels · {currentWeekTotal} uur totaal</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4b5563]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Zoek persoon..."
                  className="bg-[#1f2937] border border-[#374151] rounded-lg pl-9 pr-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50 w-full sm:w-48"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f2937]">
                    <th className="text-left py-3 px-4 text-[#6b7280] font-medium">Naam</th>
                    <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Uren</th>
                    <th className="text-left py-3 px-4 text-[#6b7280] font-medium">Status</th>
                    <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Ingediend</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCurrentWeekEntries.map((entry) => (
                    <tr key={entry.id} className={`border-b border-[#1f2937]/50 ${entry.notes === 'AFGEMELD' ? 'bg-red-500/5' : 'hover:bg-[#1f2937]/30'}`}>
                      <td className="py-3 px-4 text-white font-medium">{getUsername(entry.user_id)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-[#00ff88]">{entry.hours}u</td>
                      <td className="py-3 px-4">
                        {entry.notes === 'AFGEMELD' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <UserX className="h-3.5 w-3.5" /> Afgemeld
                          </span>
                        ) : (
                          <span className="text-xs text-[#9ca3af]">Ingediend</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-[#9ca3af]">
                        {format(new Date(entry.submitted_at), 'dd/MM HH:mm')}
                      </td>
                    </tr>
                  ))}
                  {filteredCurrentWeekEntries.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-[#374151]">Nog geen uren gevonden voor deze week</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <BestuurOverview hours={entries} staffProfiles={staffProfiles} search={search} />
        </>
      ) : (
        <div className="bg-[#111827]/60 border border-[#1f2937] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#1f2937]">
            <h3 className="text-sm font-semibold text-white">Mijn urenhistorie</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2937]">
                  <th className="text-left py-3 px-4 text-[#6b7280] font-medium">Week</th>
                  <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Uren</th>
                  <th className="text-left py-3 px-4 text-[#6b7280] font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Ingediend</th>
                </tr>
              </thead>
              <tbody>
                {myEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#1f2937]/50 hover:bg-[#1f2937]/30">
                    <td className="py-3 px-4 text-white">Week {format(new Date(`${entry.week_start}T00:00:00`), 'w')} — {format(new Date(`${entry.week_start}T00:00:00`), 'd MMM yyyy', { locale: nl })}</td>
                    <td className="py-3 px-4 text-right text-[#00ff88] font-semibold">{entry.hours}u</td>
                    <td className="py-3 px-4 text-[#9ca3af]">{entry.notes === 'AFGEMELD' ? 'Afgemeld' : 'Ingediend'}</td>
                    <td className="py-3 px-4 text-right text-[#9ca3af]">{format(new Date(entry.submitted_at), 'dd/MM HH:mm')}</td>
                  </tr>
                ))}
                {myEntries.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-[#374151]">Nog geen uren voor jouw account gevonden</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const BestuurOverview = ({ hours, staffProfiles, search }: { hours: HourEntry[]; staffProfiles: StaffProfile[]; search: string }) => {
  const getUsername = (userId: string) => staffProfiles.find(p => p.user_id === userId)?.username || "Onbekend";

  // Group by user
  const userMap = new Map<string, HourEntry[]>();
  hours.forEach(h => {
    if (h.notes === "AFGEMELD") return; // skip afgemeld entries for totals
    const entries = userMap.get(h.user_id) || [];
    entries.push(h);
    userMap.set(h.user_id, entries);
  });

  const filtered = Array.from(userMap.entries()).filter(([userId]) => {
    if (!search) return true;
    return getUsername(userId).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="bg-[#111827]/60 border border-[#1f2937] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f2937]">
              <th className="text-left py-3 px-4 text-[#6b7280] font-medium">Naam</th>
              <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Totaal uren</th>
              <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Gem. per week</th>
              <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Weken geregistreerd</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(([userId, entries]) => {
              const total = entries.reduce((s, e) => s + e.hours, 0);
              const avg = entries.length > 0 ? (total / entries.length).toFixed(1) : "0";
              return (
                <tr key={userId} className="border-b border-[#1f2937]/50 hover:bg-[#1f2937]/30">
                  <td className="py-3 px-4 text-white font-medium">{getUsername(userId)}</td>
                  <td className="py-3 px-4 text-right text-[#00ff88] font-semibold">{total}u</td>
                  <td className="py-3 px-4 text-right text-[#9ca3af]">{avg}u</td>
                  <td className="py-3 px-4 text-right text-[#9ca3af]">{entries.length}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-[#374151]">Geen resultaten</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
