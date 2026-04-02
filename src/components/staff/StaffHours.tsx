import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Clock, Plus, X, Send } from "lucide-react";

interface HourEntry {
  id: string;
  user_id: string;
  week_start: string;
  hours: number;
  notes: string | null;
  submitted_at: string;
}

interface StaffProfile {
  user_id: string;
  username: string;
}

interface Props {
  isBestuur: boolean;
  currentUserId: string;
  staffProfiles: StaffProfile[];
}

export const StaffHours = ({ isBestuur, currentUserId, staffProfiles }: Props) => {
  const [hours, setHours] = useState<HourEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newHours, setNewHours] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [loading, setLoading] = useState(true);

  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    let query = supabase.from('staff_hours').select('*').order('week_start', { ascending: false });
    if (!isBestuur) {
      query = query.eq('user_id', currentUserId);
    }
    const { data } = await query;
    setHours((data as HourEntry[]) || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    const h = parseFloat(newHours);
    if (isNaN(h) || h < 0) return;
    
    // Check if already submitted for this week
    const existing = hours.find(e => e.user_id === currentUserId && e.week_start === currentWeekStart);
    if (existing) {
      await supabase.from('staff_hours').update({ hours: h, notes: newNotes.trim() || null }).eq('id', existing.id);
    } else {
      await supabase.from('staff_hours').insert({
        user_id: currentUserId,
        week_start: currentWeekStart,
        hours: h,
        notes: newNotes.trim() || null,
      });
    }
    setNewHours("");
    setNewNotes("");
    setShowAdd(false);
    loadHours();
  };

  const getUsername = (userId: string) => {
    return staffProfiles.find(p => p.user_id === userId)?.username || "Onbekend";
  };

  const myCurrentWeek = hours.find(e => e.user_id === currentUserId && e.week_start === currentWeekStart);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#00ff88]" />
          Urenregistratie
        </h2>
        {!myCurrentWeek && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-3 py-2 bg-[#00ff88]/10 text-[#00ff88] rounded-lg text-sm font-medium hover:bg-[#00ff88]/20 transition-colors">
            <Plus className="h-4 w-4" /> Uren invullen
          </button>
        )}
      </div>

      {/* Current week status */}
      <div className={`rounded-xl border p-4 ${myCurrentWeek ? 'bg-[#00ff88]/5 border-[#00ff88]/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
        <p className="text-sm text-[#9ca3af]">
          Week {format(weekStart, 'w')} — {format(weekStart, 'd MMM', { locale: nl })} t/m {format(addDays(weekStart, 6), 'd MMM', { locale: nl })}
        </p>
        {myCurrentWeek ? (
          <div className="flex items-center justify-between mt-2">
            <p className="text-lg font-bold text-[#00ff88]">{myCurrentWeek.hours} uur ingediend</p>
            <button onClick={() => { setNewHours(String(myCurrentWeek.hours)); setNewNotes(myCurrentWeek.notes || ""); setShowAdd(true); }} className="text-xs text-[#6b7280] hover:text-white transition-colors">
              Aanpassen
            </button>
          </div>
        ) : (
          <p className="text-sm text-amber-400 mt-1">⚠️ Je hebt deze week nog geen uren ingediend</p>
        )}
      </div>

      {showAdd && (
        <div className="bg-[#111827]/80 border border-[#00ff88]/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Uren invullen — Week {format(weekStart, 'w')}</h3>
            <button onClick={() => setShowAdd(false)} className="text-[#6b7280] hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div>
            <label className="text-[#9ca3af] text-sm mb-1 block">Aantal uren *</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={newHours}
              onChange={e => setNewHours(e.target.value)}
              placeholder="bijv. 8"
              className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
            />
          </div>
          <div>
            <label className="text-[#9ca3af] text-sm mb-1 block">Toelichting (optioneel)</label>
            <textarea
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="Wat heb je gedaan..."
              rows={3}
              className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50 resize-none"
            />
          </div>
          <button onClick={handleSubmit} disabled={!newHours} className="flex items-center gap-2 px-4 py-2 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-sm font-semibold disabled:opacity-50 transition-all">
            <Send className="h-4 w-4" /> Indienen
          </button>
        </div>
      )}

      {/* History / Overview */}
      {isBestuur ? (
        <BestuurHoursOverview hours={hours} staffProfiles={staffProfiles} />
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[#6b7280]">Mijn geschiedenis</h3>
          {hours.filter(h => h.user_id === currentUserId).map(h => (
            <div key={h.id} className="bg-[#111827]/40 border border-[#1f2937] rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Week {format(new Date(h.week_start + 'T00:00:00'), 'w')} — {format(new Date(h.week_start + 'T00:00:00'), 'd MMM yyyy', { locale: nl })}</p>
                {h.notes && <p className="text-xs text-[#6b7280] mt-0.5">{h.notes}</p>}
              </div>
              <span className="text-sm font-semibold text-[#00ff88]">{h.hours}u</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Bestuur-only overview panel
const BestuurHoursOverview = ({ hours, staffProfiles }: { hours: HourEntry[]; staffProfiles: StaffProfile[] }) => {
  const [search, setSearch] = useState("");

  const getUsername = (userId: string) => staffProfiles.find(p => p.user_id === userId)?.username || "Onbekend";

  // Group by user
  const userMap = new Map<string, HourEntry[]>();
  hours.forEach(h => {
    const entries = userMap.get(h.user_id) || [];
    entries.push(h);
    userMap.set(h.user_id, entries);
  });

  const filtered = Array.from(userMap.entries()).filter(([userId]) => {
    if (!search) return true;
    return getUsername(userId).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Overzicht alle leden</h3>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek persoon..."
          className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50 w-48"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f2937]">
              <th className="text-left py-3 px-4 text-[#6b7280] font-medium">Naam</th>
              <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Totaal uren</th>
              <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Gem. per week</th>
              <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Weken ingediend</th>
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

      {/* Detailed entries */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[#6b7280]">Recente inzendingen</h3>
        {hours.slice(0, 20).map(h => (
          <div key={h.id} className="bg-[#111827]/40 border border-[#1f2937] rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="text-sm text-[#00ff88] font-medium">{getUsername(h.user_id)}</span>
              <span className="text-xs text-[#4b5563] ml-2">
                Week {format(new Date(h.week_start + 'T00:00:00'), 'w')} — {format(new Date(h.submitted_at), "d MMM 'om' HH:mm", { locale: nl })}
              </span>
              {h.notes && <p className="text-xs text-[#6b7280] mt-0.5">{h.notes}</p>}
            </div>
            <span className="text-sm font-bold text-white">{h.hours}u</span>
          </div>
        ))}
      </div>
    </div>
  );
};
