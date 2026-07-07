import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Video, LogOut, Plus, Trophy, RefreshCw, Trash2, Radio, Clock, Gift, Ticket } from "lucide-react";
import { toast } from "sonner";

type Creator = {
  id: string;
  user_id: string | null;
  twitch_username: string;
  display_name: string | null;
  is_active: boolean;
  total_seconds: number;
  is_currently_live: boolean;
  last_checked_at: string | null;
};
type Reward = { id: string; hours_required: number; title: string; description: string | null; sort_order: number; is_active: boolean };
type Claim = { id: string; creator_id: string; reward_id: string; claimed_at: string };

const fmtHours = (s: number) => `${Math.floor(s / 3600)}u ${Math.floor((s % 3600) / 60)}m`;

const ContentCreatorDashboard = () => {
  const nav = useNavigate();
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [isHead, setIsHead] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempPw, setTempPw] = useState<string | null>(null);

  const load = async () => {
    const [{ data: cs }, { data: rs }, { data: cls }] = await Promise.all([
      supabase.from("cc_creators").select("*").order("total_seconds", { ascending: false }),
      supabase.from("cc_rewards").select("*").order("hours_required"),
      supabase.from("cc_reward_claims").select("*"),
    ]);
    setCreators((cs as Creator[]) || []);
    setRewards((rs as Reward[]) || []);
    setClaims((cls as Claim[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return nav("/contentcreator");
      const { data: isCc } = await supabase.rpc("is_content_creator", { _user_id: user.id });
      if (!isCc) { await supabase.auth.signOut(); return nav("/contentcreator"); }
      const { data: h } = await supabase.rpc("is_head_content_creator", { _user_id: user.id });
      setIsHead(!!h);
      setMe({ id: user.id });
      await load();
    })();
  }, []);

  const myCreator = creators.find(c => c.user_id === me?.id);

  const logout = async () => { await supabase.auth.signOut(); nav("/contentcreator"); };

  const checkLive = async () => {
    toast.loading("Live status checken...", { id: "cl" });
    const { error } = await supabase.functions.invoke("cc-check-live", { body: {} });
    if (error) toast.error("Check mislukt", { id: "cl" });
    else { toast.success("Bijgewerkt", { id: "cl" }); await load(); }
  };

  // Create account form
  const [newUser, setNewUser] = useState("");
  const [newHead, setNewHead] = useState(false);
  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setTempPw(null);
    const { data, error } = await supabase.functions.invoke("cc-create-account", {
      body: { twitch_username: newUser, display_name: newUser, is_head: newHead },
    });
    if (error || (data as any)?.error) return toast.error((data as any)?.error || "Aanmaken mislukt");
    setTempPw((data as any).temp_password);
    setNewUser("");
    setNewHead(false);
    await load();
    toast.success("Account aangemaakt");
  };

  const removeCreator = async (id: string) => {
    if (!confirm("Verwijderen?")) return;
    await supabase.from("cc_creators").delete().eq("id", id);
    await load();
  };

  // Reward management
  const [rh, setRh] = useState(5);
  const [rt, setRt] = useState("");
  const [rd, setRd] = useState("");
  const addReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("cc_rewards").insert({ hours_required: rh, title: rt, description: rd, sort_order: rh });
    if (error) return toast.error(error.message);
    setRh(5); setRt(""); setRd("");
    await load();
    toast.success("Beloning toegevoegd");
  };
  const removeReward = async (id: string) => {
    if (!confirm("Beloning verwijderen?")) return;
    await supabase.from("cc_rewards").delete().eq("id", id);
    await load();
  };

  const claimReward = async (reward: Reward) => {
    if (!myCreator) return toast.error("Geen creator profiel gekoppeld");
    const { error } = await supabase.from("cc_reward_claims").insert({ creator_id: myCreator.id, reward_id: reward.id });
    if (error) return toast.error(error.message);
    toast.success("Beloning geclaimd! Maak een ticket in Discord.");
    await load();
  };

  const isClaimed = (rewardId: string, creatorId?: string) =>
    claims.some(c => c.reward_id === rewardId && c.creator_id === (creatorId || myCreator?.id));

  if (loading) return <div className="min-h-screen bg-[#0a0512] flex items-center justify-center text-purple-300">Laden...</div>;

  return (
    <div className="min-h-screen bg-[#0a0512] text-white">
      <header className="border-b border-purple-500/20 bg-[#150822]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl border border-purple-500/30 flex items-center justify-center">
              <Video className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h1 className="font-bold">Content Creator Panel</h1>
              <p className="text-xs text-slate-400">{isHead ? "Head Content Creator" : "Content Creator"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={checkLive} className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 px-3 py-2 rounded-lg text-sm">
              <RefreshCw className="h-4 w-4" /> Check live status
            </button>
            <button onClick={logout} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm">
              <LogOut className="h-4 w-4" /> Uitloggen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Mijn stats */}
        {myCreator && (
          <section className="bg-[#150822] border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Radio className="h-5 w-5 text-purple-400" /> Mijn stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1a0f2e] rounded-xl p-4">
                <div className="text-xs text-slate-400">Twitch</div>
                <div className="font-mono text-purple-300">{myCreator.twitch_username}</div>
              </div>
              <div className="bg-[#1a0f2e] rounded-xl p-4">
                <div className="text-xs text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Totaal live</div>
                <div className="text-xl font-bold">{fmtHours(myCreator.total_seconds)}</div>
              </div>
              <div className="bg-[#1a0f2e] rounded-xl p-4">
                <div className="text-xs text-slate-400">Status</div>
                <div className={`text-lg font-semibold ${myCreator.is_currently_live ? "text-red-400" : "text-slate-500"}`}>
                  {myCreator.is_currently_live ? "🔴 LIVE" : "Offline"}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Voortgangslijn / beloningen */}
        <section className="bg-[#150822] border border-purple-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-400" /> Beloningen</h2>
          {rewards.length === 0 ? (
            <p className="text-slate-400 text-sm">Nog geen beloningen ingesteld.</p>
          ) : (
            <div className="space-y-3">
              {rewards.map(r => {
                const myHours = (myCreator?.total_seconds || 0) / 3600;
                const pct = Math.min(100, (myHours / r.hours_required) * 100);
                const reached = myHours >= r.hours_required;
                const claimed = isClaimed(r.id);
                return (
                  <div key={r.id} className="bg-[#1a0f2e] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          <Gift className="h-4 w-4 text-purple-400" />
                          {r.title} <span className="text-xs text-slate-400">({r.hours_required}u)</span>
                        </div>
                        {r.description && <p className="text-sm text-slate-400 mt-1">{r.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        {myCreator && (
                          claimed ? (
                            <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1.5 rounded-lg border border-green-500/30">Geclaimd</span>
                          ) : reached ? (
                            <button onClick={() => claimReward(r)} className="text-xs bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <Ticket className="h-3 w-3" /> Claim
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">Nog {(r.hours_required - myHours).toFixed(1)}u</span>
                          )
                        )}
                        {isHead && (
                          <button onClick={() => removeReward(r.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                    </div>
                    {myCreator && (
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    {claimed && (
                      <p className="text-xs text-yellow-300 mt-2">→ Maak een ticket aan in de Discord om je beloning te claimen.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isHead && (
            <form onSubmit={addReward} className="mt-6 border-t border-purple-500/20 pt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input type="number" min={1} value={rh} onChange={e => setRh(+e.target.value)} placeholder="Uren" required className="bg-[#1a0f2e] border border-slate-700 rounded-lg px-3 py-2 text-sm" />
              <input value={rt} onChange={e => setRt(e.target.value)} placeholder="Titel (bv. €10 Robux)" required className="bg-[#1a0f2e] border border-slate-700 rounded-lg px-3 py-2 text-sm" />
              <input value={rd} onChange={e => setRd(e.target.value)} placeholder="Beschrijving" className="bg-[#1a0f2e] border border-slate-700 rounded-lg px-3 py-2 text-sm" />
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 rounded-lg text-sm flex items-center justify-center gap-1"><Plus className="h-4 w-4" /> Toevoegen</button>
            </form>
          )}
        </section>

        {/* Alle creators */}
        <section className="bg-[#150822] border border-purple-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Alle content creators</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-xs uppercase">
                <tr className="border-b border-purple-500/20">
                  <th className="text-left py-2">Twitch</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Totaal live</th>
                  <th className="text-left py-2">Laatst gecheckt</th>
                  {isHead && <th></th>}
                </tr>
              </thead>
              <tbody>
                {creators.map(c => (
                  <tr key={c.id} className="border-b border-slate-800/50">
                    <td className="py-3">
                      <a href={`https://twitch.tv/${c.twitch_username}`} target="_blank" className="text-purple-300 hover:underline font-mono">{c.twitch_username}</a>
                    </td>
                    <td className={c.is_currently_live ? "text-red-400 font-semibold" : "text-slate-500"}>
                      {c.is_currently_live ? "🔴 LIVE" : "Offline"}
                    </td>
                    <td className="font-mono">{fmtHours(c.total_seconds)}</td>
                    <td className="text-slate-500 text-xs">{c.last_checked_at ? new Date(c.last_checked_at).toLocaleString("nl-NL") : "-"}</td>
                    {isHead && (
                      <td className="text-right">
                        <button onClick={() => removeCreator(c.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Account aanmaken (head only) */}
        {isHead && (
          <section className="bg-[#150822] border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-purple-400" /> Nieuw account</h2>
            <form onSubmit={createAccount} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={newUser} onChange={e => setNewUser(e.target.value)} placeholder="Twitch gebruikersnaam" required className="bg-[#1a0f2e] border border-slate-700 rounded-lg px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newHead} onChange={e => setNewHead(e.target.checked)} />
                Head Content Creator
              </label>
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 rounded-lg text-sm">Account aanmaken</button>
            </form>
            {tempPw && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
                Tijdelijk wachtwoord: <code className="font-mono font-bold">{tempPw}</code>
                <p className="text-xs text-slate-400 mt-1">Geef dit door aan de creator (login op /contentcreator).</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default ContentCreatorDashboard;
