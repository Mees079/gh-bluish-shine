import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { UserX, Plus, X, AlertTriangle, Check } from "lucide-react";

interface Absence {
  id: string;
  user_id: string;
  reason: string | null;
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

export const StaffAbsences = ({ isBestuur, currentUserId, staffProfiles }: Props) => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [reason, setReason] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
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
    if (!endDate) return;
    const userId = isBestuur && selectedUser ? selectedUser : currentUserId;
    await supabase.from('staff_absences').insert({
      user_id: userId,
      reason: reason.trim() || null,
      end_date: endDate,
    });
    setReason("");
    setEndDate("");
    setSelectedUser("");
    setShowAdd(false);
    loadAbsences();
  };

  const handleDeactivate = async (id: string) => {
    await supabase.from('staff_absences').update({ active: false }).eq('id', id);
    loadAbsences();
  };

  const getUsername = (userId: string) => {
    return staffProfiles.find(p => p.user_id === userId)?.username || "Onbekend";
  };

  const activeAbsences = absences.filter(a => a.active && !isPast(parseISO(a.end_date)));
  const pastAbsences = absences.filter(a => !a.active || isPast(parseISO(a.end_date)));

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
          <Plus className="h-4 w-4" /> {isBestuur ? "Iemand afmelden" : "Afmelden"}
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#111827]/80 border border-[#00ff88]/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Afmelding aanmaken</h3>
            <button onClick={() => setShowAdd(false)} className="text-[#6b7280] hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          {isBestuur && (
            <div>
              <label className="text-[#9ca3af] text-sm mb-1 block">Persoon</label>
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
              >
                <option value="">Mezelf</option>
                {staffProfiles.map(sp => (
                  <option key={sp.user_id} value={sp.user_id}>{sp.username}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-[#9ca3af] text-sm mb-1 block">Reden (optioneel)</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reden van afmelding"
              className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
            />
          </div>
          <div>
            <label className="text-[#9ca3af] text-sm mb-1 block">Afgemeld tot *</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
            />
          </div>
          <button onClick={handleAdd} disabled={!endDate} className="px-4 py-2 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-sm font-semibold disabled:opacity-50 transition-all">
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
            {activeAbsences.map(a => (
              <div key={a.id} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{getUsername(a.user_id)}</p>
                  {a.reason && <p className="text-xs text-[#9ca3af] mt-0.5">{a.reason}</p>}
                  <p className="text-xs text-amber-400 mt-1">
                    Afgemeld tot {format(parseISO(a.end_date), 'd MMMM yyyy', { locale: nl })}
                  </p>
                </div>
                {(isBestuur || a.user_id === currentUserId) && (
                  <button onClick={() => handleDeactivate(a.id)} className="px-3 py-1.5 text-xs bg-[#1f2937] text-[#9ca3af] hover:text-white rounded-lg transition-colors flex items-center gap-1">
                    <Check className="h-3 w-3" /> Terug
                  </button>
                )}
              </div>
            ))}
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
                    <p className="text-sm text-[#9ca3af]">{getUsername(a.user_id)}</p>
                    {a.reason && <p className="text-xs text-[#6b7280] mt-0.5">{a.reason}</p>}
                  </div>
                  <span className="text-xs text-[#4b5563]">tot {format(parseISO(a.end_date), 'd MMM yyyy', { locale: nl })}</span>
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
