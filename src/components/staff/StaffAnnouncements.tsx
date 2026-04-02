import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Megaphone, Plus, X, Trash2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string | null;
  message: string;
  created_by: string | null;
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

export const StaffAnnouncements = ({ isBestuur, currentUserId, staffProfiles }: Props) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from('staff_announcements')
      .select('*')
      .order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!message.trim()) return;
    await supabase.from('staff_announcements').insert({
      title: title.trim() || null,
      message: message.trim(),
      created_by: currentUserId,
    });
    setTitle("");
    setMessage("");
    setShowAdd(false);
    loadAnnouncements();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('staff_announcements').delete().eq('id', id);
    loadAnnouncements();
  };

  const getUsername = (userId: string | null) => {
    if (!userId) return "Systeem";
    return staffProfiles.find(p => p.user_id === userId)?.username || "Onbekend";
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-[#00ff88]" />
          Mededelingen
        </h2>
        {isBestuur && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-3 py-2 bg-[#00ff88]/10 text-[#00ff88] rounded-lg text-sm font-medium hover:bg-[#00ff88]/20 transition-colors">
            <Plus className="h-4 w-4" /> Nieuw bericht
          </button>
        )}
      </div>

      {showAdd && (
        <div className="bg-[#111827]/80 border border-[#00ff88]/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Nieuw bericht</h3>
            <button onClick={() => setShowAdd(false)} className="text-[#6b7280] hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titel (optioneel)"
            className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
          />
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Bericht..."
            rows={4}
            className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88]/50 resize-none"
          />
          <button onClick={handleAdd} disabled={!message.trim()} className="px-4 py-2 bg-[#00ff88] text-[#0a0e1a] rounded-lg text-sm font-semibold disabled:opacity-50 transition-all">
            Plaatsen
          </button>
        </div>
      )}

      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className="bg-[#111827]/60 border border-[#1f2937] rounded-xl p-5 hover:border-[#00ff88]/20 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {a.title && <h3 className="text-base font-semibold text-white mb-1">{a.title}</h3>}
                <p className="text-sm text-[#d1d5db] whitespace-pre-wrap">{a.message}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs text-[#00ff88] font-medium">{getUsername(a.created_by)}</span>
                  <span className="text-xs text-[#4b5563]">{format(new Date(a.created_at), "d MMM yyyy 'om' HH:mm", { locale: nl })}</span>
                </div>
              </div>
              {isBestuur && (
                <button onClick={() => handleDelete(a.id)} className="text-[#4b5563] hover:text-red-400 ml-3 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="text-center py-12 text-[#374151]">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nog geen mededelingen</p>
          </div>
        )}
      </div>
    </div>
  );
};
