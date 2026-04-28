import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, parseISO, startOfWeek, endOfWeek, addDays, isWithinInterval, max, min, differenceInCalendarDays } from "date-fns";
import { nl } from "date-fns/locale";
import { UserX, Plus, X, AlertTriangle, Check, Clock } from "lucide-react";

interface Absence {
  id: string;
  user_id: string;
  reason: string | null;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
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

const MINUTES_PER_DAY = 45;

// Calculate required hours for the current week given absence period
const calculateRequiredHours = (absStart: Date, absEnd: Date): number => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Find overlap of absence with current week
  const absenceStartInWeek = max([absStart, weekStart]);
  const absenceEndInWeek = min([absEnd, weekEnd]);

  let absentDays = 0;
  if (absenceStartInWeek <= absenceEndInWeek) {
    absentDays = differenceInCalendarDays(absenceEndInWeek, absenceStartInWeek) + 1;
  }

  const workingDaysInWeek = 7;
  const presentDays = Math.max(0, workingDaysInWeek - absentDays);
  const requiredMinutes = presentDays * MINUTES_PER_DAY;
  return requiredMinutes / 60;
};

export const StaffAbsences = ({ isBestuur, currentUserId, staffProfiles }: Props) => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAbsences();
  }, []);

  const loadAbsences = async () => {
    const { data } = await supabase
      .from('staff_absences')
      .select('*')
      .order('created_at', { ascending: false });
    setAbsences((data as Absence[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!endDate || !startDate) return;

    // Resolve user_id: if a known staff profile is picked, use their id; otherwise own id (and store name in reason)
    let userId = currentUserId;
    let finalReason = reason.trim();

    if (selectedName === '__custom__' && customName.trim()) {
      // Free-text name: store as part of reason and use submitter's user_id
      finalReason = `[${customName.trim()}] ${finalReason}`.trim();
    } else if (selectedName) {
      userId = selectedName;
    }

    await supabase.from('staff_absences').insert({
      user_id: userId,
      reason: finalReason || null,
      start_date: startDate,
      end_date: endDate,
    });
    setReason("");
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate("");
    setSelectedName("");
    setCustomName("");
    setShowAdd(false);
    loadAbsences();
  };

  const handleDeactivate = async (id: string) => {
    await supabase.from('staff_absences').update({ active: false }).eq('id', id);
    loadAbsences();
  };

  const getDisplayName = (a: Absence) => {
    // Check if reason starts with [Name] for custom names
    const customMatch = a.reason?.match(/^\[([^\]]+)\]/);
    if (customMatch) return customMatch[1];
    return staffProfiles.find(p => p.user_id === a.user_id)?.username || "Onbekend";
  };

  const getCleanReason = (a: Absence) => {
    return a.reason?.replace(/^\[([^\]]+)\]\s*/, '') || '';
  };

  const safeParse = (d?: string | null): Date | null => {
    if (!d) return null;
    const parsed = parseISO(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };
  const fmt = (d?: string | null, pattern = 'd MMM yyyy') => {
    const p = safeParse(d);
    return p ? format(p, pattern, { locale: nl }) : '—';
  };

  const activeAbsences = absences.filter(a => {
    const end = safeParse(a.end_date);
    return a.active && (!end || !isPast(end));
  });
  const pastAbsences = absences.filter(a => {
    const end = safeParse(a.end_date);
    return !a.active || (end && isPast(end));
  });

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <UserX className="h-5 w-5 text-[#00ff88]" />
          Afmeldingen
        </h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-3 py-2 bg-[#00ff88]/10 text-[#00ff88] rounded-lg text-sm font-medium hover:bg-[#00ff88]/20 transition-colors">
          <Plus className="h-4 w-4" /> Iemand afmelden
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#111827]/80 border border-[#00ff88]/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Afmelding aanmaken</h3>
            <button onClick={() => setShowAdd(false)} className="text-[#6b7280] hover:text-white"><X className="h-4 w-4" /></button>
          </div>

          <div>
            <label className="text-[#9ca3af] text-sm mb-1 block">Persoon</label>
            <select
              value={selectedName}
              onChange={e => setSelectedName(e.target.value)}
              className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
            >
              <option value="">Mezelf</option>
              {staffProfiles.map(sp => (
                <option key={sp.user_id} value={sp.user_id}>{sp.username}</option>
              ))}
              <option value="__custom__">+ Andere naam (handmatig)</option>
            </select>
          </div>

          {selectedName === '__custom__' && (
            <div>
              <label className="text-[#9ca3af] text-sm mb-1 block">Naam</label>
              <input
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Vul naam in"
                className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#9ca3af] text-sm mb-1 block">Vanaf *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
              />
            </div>
            <div>
              <label className="text-[#9ca3af] text-sm mb-1 block">Tot *</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[#9ca3af] text-sm mb-1 block">Reden (optioneel)</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reden van afmelding"
              className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
            />
          </div>

          <button onClick={handleAdd} disabled={!endDate || !startDate || (selectedName === '__custom__' && !customName.trim())} className="px-4 py-2 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-sm font-semibold disabled:opacity-50 transition-all">
            Bevestigen
          </button>
        </div>
      )}

      {/* Active absences */}
      {activeAbsences.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Actief afgemeld ({activeAbsences.length})
          </h3>
          <div className="space-y-2">
            {activeAbsences.map(a => {
              const absStart = a.start_date ? parseISO(a.start_date) : parseISO(a.end_date);
              const absEnd = parseISO(a.end_date);
              const requiredHours = calculateRequiredHours(absStart, absEnd);
              const cleanReason = getCleanReason(a);
              return (
                <div key={a.id} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{getDisplayName(a)}</p>
                      {cleanReason && <p className="text-xs text-[#9ca3af] mt-0.5">{cleanReason}</p>}
                      <p className="text-xs text-amber-400 mt-1">
                        {format(absStart, 'd MMM', { locale: nl })} t/m {format(absEnd, 'd MMM yyyy', { locale: nl })}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#00ff88]/10 text-[#00ff88] text-xs font-medium">
                        <Clock className="h-3 w-3" />
                        Moet deze week nog {requiredHours.toFixed(2).replace('.', ',')} uur halen
                      </div>
                    </div>
                    {(isBestuur || a.user_id === currentUserId) && (
                      <button onClick={() => handleDeactivate(a.id)} className="px-3 py-1.5 text-xs bg-[#1f2937] text-[#9ca3af] hover:text-white rounded-lg transition-colors flex items-center gap-1 flex-shrink-0">
                        <Check className="h-3 w-3" /> Terug
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past absences */}
      {pastAbsences.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[#6b7280] mb-3">Geschiedenis</h3>
          <div className="space-y-2">
            {pastAbsences.slice(0, 10).map(a => (
              <div key={a.id} className="bg-[#111827]/40 border border-[#1f2937] rounded-xl p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#9ca3af]">{getDisplayName(a)}</p>
                    {getCleanReason(a) && <p className="text-xs text-[#6b7280] mt-0.5">{getCleanReason(a)}</p>}
                  </div>
                  <span className="text-xs text-[#4b5563]">
                    {format(parseISO(a.start_date), 'd MMM', { locale: nl })} – {format(parseISO(a.end_date), 'd MMM yyyy', { locale: nl })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {absences.length === 0 && (
        <div className="text-center py-12 text-[#374151]">
          <UserX className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Niemand is afgemeld</p>
        </div>
      )}
    </div>
  );
};
