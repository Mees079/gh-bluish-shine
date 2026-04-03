import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Clock, Send, Search, UserX, Check } from "lucide-react";

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

interface RowData {
  user_id: string;
  username: string;
  hours: string;
  afgemeld: boolean;
}

export const StaffHours = ({ isBestuur, currentUserId, staffProfiles }: Props) => {
  const [existingHours, setExistingHours] = useState<HourEntry[]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [search, setSearch] = useState("");

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekStart = format(weekStart, 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase.from('staff_hours').select('*').order('week_start', { ascending: false });
    const hours = (data as HourEntry[]) || [];
    setExistingHours(hours);

    // Check if this week already has entries
    const thisWeek = hours.filter(h => h.week_start === currentWeekStart);

    // Build rows for all staff
    const newRows: RowData[] = staffProfiles.map(p => {
      const existing = thisWeek.find(h => h.user_id === p.user_id);
      return {
        user_id: p.user_id,
        username: p.username,
        hours: existing ? String(existing.hours) : "",
        afgemeld: existing?.notes === "AFGEMELD",
      };
    });
    setRows(newRows);
    setSubmitted(thisWeek.length > 0);
    setLoading(false);
  };

  const updateRow = (userId: string, field: 'hours' | 'afgemeld', value: any) => {
    setRows(prev => prev.map(r => {
      if (r.user_id !== userId) return r;
      if (field === 'afgemeld') return { ...r, afgemeld: value, hours: value ? "0" : r.hours };
      return { ...r, [field]: value };
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      for (const row of rows) {
        const h = parseFloat(row.hours) || 0;
        const existing = existingHours.find(e => e.user_id === row.user_id && e.week_start === currentWeekStart);

        if (existing) {
          await supabase.from('staff_hours').update({
            hours: h,
            notes: row.afgemeld ? "AFGEMELD" : null,
          }).eq('id', existing.id);
        } else {
          await supabase.from('staff_hours').insert({
            user_id: row.user_id,
            week_start: currentWeekStart,
            hours: h,
            notes: row.afgemeld ? "AFGEMELD" : null,
          });
        }
      }
      setSubmitted(true);
      loadData();
    } catch (err) {
      console.error('Error submitting hours:', err);
    }
    setSubmitting(false);
  };

  const getUsername = (userId: string) => staffProfiles.find(p => p.user_id === userId)?.username || "Onbekend";

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#00ff88]" />
          Urenregistratie — Week {format(weekStart, 'w')}
        </h2>
        <p className="text-sm text-[#6b7280]">
          {format(weekStart, 'd MMM', { locale: nl })} t/m {format(addDays(weekStart, 6), 'd MMM', { locale: nl })}
        </p>
      </div>

      {/* Fill-in table (coordinatie or bestuur) */}
      <div className="bg-[#111827]/60 border border-[#1f2937] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#1f2937] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {submitted ? "✅ Uren ingediend deze week" : "Vul de uren in voor alle leden"}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2937]">
                <th className="text-left py-3 px-4 text-[#6b7280] font-medium">Naam</th>
                <th className="text-center py-3 px-4 text-[#6b7280] font-medium w-32">Uren</th>
                <th className="text-center py-3 px-4 text-[#6b7280] font-medium w-32">Afgemeld</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.user_id} className={`border-b border-[#1f2937]/50 ${row.afgemeld ? 'bg-red-500/5' : 'hover:bg-[#1f2937]/30'}`}>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${row.afgemeld ? 'text-red-400 line-through' : 'text-white'}`}>
                      {row.username}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={row.hours}
                      onChange={e => updateRow(row.user_id, 'hours', e.target.value)}
                      disabled={row.afgemeld}
                      placeholder="0"
                      className="w-20 bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-1.5 text-white text-sm text-center focus:outline-none focus:border-[#00ff88]/50 disabled:opacity-30"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => updateRow(row.user_id, 'afgemeld', !row.afgemeld)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        row.afgemeld
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-[#1f2937] text-[#4b5563] border border-[#374151] hover:border-[#6b7280]'
                      }`}
                    >
                      {row.afgemeld ? <UserX className="h-4 w-4" /> : <Check className="h-4 w-4 opacity-0" />}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-[#374151]">Geen staffleden gevonden</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#1f2937] flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-sm font-semibold disabled:opacity-50 transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Indienen..." : submitted ? "Bijwerken" : "Indienen"}
          </button>
        </div>
      </div>

      {/* Bestuur: history overview */}
      {isBestuur && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Overzicht alle weken</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4b5563]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Zoek persoon..."
                className="bg-[#1f2937] border border-[#374151] rounded-lg pl-9 pr-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50 w-48"
              />
            </div>
          </div>

          <BestuurOverview hours={existingHours} staffProfiles={staffProfiles} search={search} />
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
