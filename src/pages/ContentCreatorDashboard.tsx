import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Video, LogOut, Plus, Trophy, RefreshCw, Trash2, Radio, Clock, Gift, Ticket,
  Users, Flame, TrendingUp, Crown, ExternalLink, Copy, Sparkles, Calendar, Award,
  Coins, CheckCircle2, KeyRound, Zap, Timer, ShoppingBag, Rocket,
} from "lucide-react";
import { toast } from "sonner";

type Creator = {
  id: string;
  user_id: string | null;
  twitch_username: string;
  login_username: string | null;
  roblox_username: string | null;
  display_name: string | null;
  is_active: boolean;
  total_seconds: number;
  points: number;
  is_currently_live: boolean;
  is_in_game: boolean;
  last_ingame_ping_at: string | null;
  last_checked_at: string | null;
  created_at: string;
};
type Reward = { id: string; points_required: number; hours_required: number; title: string; description: string | null; sort_order: number; is_active: boolean; boost_multiplier: number | null; boost_duration_minutes: number | null };
type Claim = { id: string; creator_id: string; reward_id: string; claimed_at: string; status: string; code: string | null; points_spent: number; redeemed_at: string | null };
type Session = { id: string; creator_id: string; started_at: string; ended_at: string | null; duration_seconds: number | null; stream_title: string | null };
type Boost = { id: string; creator_id: string | null; label: string; multiplier: number; interval_seconds: number | null; starts_at: string; ends_at: string; source: string; points_spent: number };

const fmtHours = (s: number) => `${Math.floor(s / 3600)}u ${Math.floor((s % 3600) / 60)}m`;
const fmtHoursDecimal = (s: number) => (s / 3600).toFixed(1);
const timeAgo = (d: string | null) => {
  if (!d) return "-";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}u`;
  return `${Math.floor(diff / 86400)}d`;
};

const ContentCreatorDashboard = () => {
  const nav = useNavigate();
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);
  const [isHead, setIsHead] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempPw, setTempPw] = useState<{ pw: string; login: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const load = async () => {
    const [{ data: cs }, { data: rs }, { data: cls }, { data: ss }, { data: bs }] = await Promise.all([
      supabase.from("cc_creators").select("*").order("points", { ascending: false }),
      supabase.from("cc_rewards").select("*").order("points_required"),
      supabase.from("cc_reward_claims").select("*").order("claimed_at", { ascending: false }),
      supabase.from("cc_live_sessions").select("*").order("started_at", { ascending: false }).limit(50),
      supabase.from("cc_boosts").select("*").order("ends_at", { ascending: false }),
    ]);
    setCreators((cs as Creator[]) || []);
    setRewards((rs as Reward[]) || []);
    setClaims((cls as Claim[]) || []);
    setSessions((ss as Session[]) || []);
    setBoosts((bs as Boost[]) || []);
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
      setMe({ id: user.id, email: user.email || "" });
      await load();
    })();
  }, []);

  const myCreator = creators.find(c => c.user_id === me?.id);
  const mySessions = useMemo(() => sessions.filter(s => s.creator_id === myCreator?.id), [sessions, myCreator]);

  const totals = useMemo(() => {
    const totalHours = creators.reduce((a, c) => a + c.total_seconds, 0) / 3600;
    const liveNow = creators.filter(c => c.is_currently_live).length;
    const totalSessions = sessions.length;
    return { totalHours, liveNow, totalSessions, creators: creators.length };
  }, [creators, sessions]);

  const logout = async () => { await supabase.auth.signOut(); nav("/contentcreator"); };

  const checkLive = async () => {
    setChecking(true);
    toast.loading("Live status checken...", { id: "cl" });
    const { error } = await supabase.functions.invoke("cc-check-live", { body: {} });
    if (error) toast.error("Check mislukt", { id: "cl" });
    else { toast.success("Bijgewerkt", { id: "cl" }); await load(); }
    setChecking(false);
  };

  // Create account form
  const [newLogin, setNewLogin] = useState("");
  const [newTikTok, setNewTikTok] = useState("");
  const [newRoblox, setNewRoblox] = useState("");
  const [newHead, setNewHead] = useState(false);
  const [creating, setCreating] = useState(false);
  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setTempPw(null);
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("cc-create-account", {
      body: {
        login_username: newLogin.trim(),
        tiktok_username: newTikTok.trim().replace(/^@/, ""),
        roblox_username: newRoblox.trim(),
        display_name: newTikTok.trim(),
        is_head: newHead,
      },
    });
    setCreating(false);
    if (error || (data as any)?.error) return toast.error((data as any)?.error || "Aanmaken mislukt");
    setTempPw({ pw: (data as any).temp_password, login: (data as any).login_username });
    setNewLogin(""); setNewTikTok(""); setNewRoblox(""); setNewHead(false);
    await load();
    toast.success("Account aangemaakt");
  };

  const removeCreator = async (id: string) => {
    if (!confirm("Verwijderen?")) return;
    await supabase.from("cc_creators").delete().eq("id", id);
    await load();
  };

  // Reward management (points based)
  const [rp, setRp] = useState(4);
  const [rt, setRt] = useState("");
  const [rd, setRd] = useState("");
  const [rIsBoost, setRIsBoost] = useState(false);
  const [rBoostMult, setRBoostMult] = useState(2);
  const [rBoostDur, setRBoostDur] = useState(60);
  const addReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { points_required: rp, hours_required: 0, title: rt, description: rd, sort_order: rp };
    if (rIsBoost) {
      payload.boost_multiplier = rBoostMult;
      payload.boost_duration_minutes = rBoostDur;
    }
    const { error } = await supabase.from("cc_rewards").insert(payload);
    if (error) return toast.error(error.message);
    setRp(4); setRt(""); setRd(""); setRIsBoost(false); setRBoostMult(2); setRBoostDur(60);
    await load();
    toast.success("Shop-item toegevoegd");
  };
  const removeReward = async (id: string) => {
    if (!confirm("Item verwijderen?")) return;
    await supabase.from("cc_rewards").delete().eq("id", id);
    await load();
  };

  const [lastCode, setLastCode] = useState<{ code: string; title: string } | null>(null);
  const claimReward = async (reward: Reward) => {
    if (!myCreator) return toast.error("Geen creator profiel gekoppeld");
    if ((myCreator.points || 0) < reward.points_required) return toast.error("Niet genoeg punten");
    const boost = reward.boost_multiplier && reward.boost_duration_minutes;
    if (!confirm(`"${reward.title}" kopen voor ${reward.points_required} punten?${boost ? `\n\nJe krijgt een x${reward.boost_multiplier} boost voor ${reward.boost_duration_minutes} min.` : ""}`)) return;
    const { data, error } = await supabase.functions.invoke("cc-claim-reward", { body: { reward_id: reward.id } });
    if (error || (data as any)?.error) return toast.error((data as any)?.error || "Aankoop mislukt");
    if (boost) toast.success(`Boost x${reward.boost_multiplier} actief!`);
    else {
      setLastCode({ code: (data as any).code, title: reward.title });
      toast.success("Aankoop gelukt! Kopieer je code.");
    }
    await load();
  };

  // Boost management (head CC only)
  const [bLabel, setBLabel] = useState("");
  const [bMult, setBMult] = useState(2);
  const [bInterval, setBInterval] = useState<number | "">(15);
  const [bMinutes, setBMinutes] = useState(60);
  const [bScope, setBScope] = useState<"global" | string>("global");
  const addBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    const ends = new Date(Date.now() + bMinutes * 60 * 1000).toISOString();
    const payload: any = {
      label: bLabel || `x${bMult} boost`,
      multiplier: bMult,
      interval_seconds: bInterval === "" ? null : Number(bInterval) * 60,
      ends_at: ends,
      source: "admin",
      created_by: me?.id,
    };
    if (bScope !== "global") payload.creator_id = bScope;
    const { error } = await supabase.from("cc_boosts").insert(payload);
    if (error) return toast.error(error.message);
    setBLabel(""); setBMult(2); setBInterval(15); setBMinutes(60); setBScope("global");
    await load();
    toast.success("Boost gestart");
  };
  const stopBoost = async (id: string) => {
    if (!confirm("Boost nu stoppen?")) return;
    await supabase.from("cc_boosts").update({ ends_at: new Date().toISOString() }).eq("id", id);
    await load();
  };

  // Head CC: redeem a code that a creator brought via Discord ticket
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemInfo, setRedeemInfo] = useState<any>(null);
  const [redeeming, setRedeeming] = useState(false);
  const doRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeeming(true);
    setRedeemInfo(null);
    const { data, error } = await supabase.functions.invoke("cc-redeem-code", { body: { code: redeemCode.trim().toUpperCase() } });
    setRedeeming(false);
    if (error || (data as any)?.error) return toast.error((data as any)?.error || "Ongeldig");
    setRedeemInfo((data as any).claim);
    setRedeemCode("");
    toast.success("Code ingewisseld");
    await load();
  };

  const nextReward = useMemo(() => {
    if (!myCreator) return null;
    return rewards.filter(r => r.points_required > (myCreator.points || 0)).sort((a, b) => a.points_required - b.points_required)[0] || null;
  }, [rewards, myCreator]);

  const activeBoosts = useMemo(() => {
    const now = Date.now();
    return boosts.filter(b => new Date(b.starts_at).getTime() <= now && new Date(b.ends_at).getTime() > now);
  }, [boosts]);

  const myEffective = useMemo(() => {
    if (!myCreator) return { mult: 1, interval: 15 };
    const bs = activeBoosts.filter(b => b.creator_id === null || b.creator_id === myCreator.id);
    const mult = bs.reduce((m, b) => m * Number(b.multiplier || 1), 1);
    const intervals = bs.map(b => b.interval_seconds).filter((n): n is number => typeof n === "number" && n > 0);
    const interval = intervals.length ? Math.min(900, ...intervals) : 900;
    return { mult: mult > 0 ? mult : 1, interval: Math.round(interval / 60) };
  }, [activeBoosts, myCreator]);

  const boostShopItems = rewards.filter(r => r.boost_multiplier && r.boost_duration_minutes);
  const productShopItems = rewards.filter(r => !r.boost_multiplier);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0512] flex items-center justify-center text-purple-300">
      <div className="animate-pulse flex items-center gap-3"><Video className="h-5 w-5" /> Laden...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0512] text-white relative overflow-hidden">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{
        backgroundImage: "radial-gradient(circle at 20% 0%, rgba(168,85,247,0.18), transparent 50%), radial-gradient(circle at 80% 30%, rgba(236,72,153,0.12), transparent 55%)",
      }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: "linear-gradient(rgba(168,85,247,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.6) 1px,transparent 1px)",
        backgroundSize: "56px 56px",
      }} />

      <header className="relative border-b border-purple-500/20 bg-[#0f0620]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500/30 to-fuchsia-500/20 rounded-xl border border-purple-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.35)]">
              <Video className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <h1 className="font-bold tracking-tight flex items-center gap-2">
                HDRP Content Creators
                {isHead && <span className="text-[10px] uppercase tracking-widest bg-yellow-500/15 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded-full flex items-center gap-1"><Crown className="h-3 w-3" /> Head</span>}
              </h1>
              <p className="text-xs text-slate-400">Ingelogd als {me?.email?.split("@")[0]}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={checkLive} disabled={checking} className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 px-3 py-2 rounded-lg text-sm disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} /> Refresh live
            </button>
            <button onClick={logout} className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg text-sm">
              <LogOut className="h-4 w-4" /> Uitloggen
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Overzicht stats */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={<Users className="h-4 w-4" />} label="Creators" value={totals.creators.toString()} tint="purple" />
          <StatCard icon={<Radio className="h-4 w-4" />} label="Nu live" value={totals.liveNow.toString()} tint="red" pulse={totals.liveNow > 0} />
          <StatCard icon={<Clock className="h-4 w-4" />} label="Totaal uren" value={totals.totalHours.toFixed(1)} tint="fuchsia" />
          <StatCard icon={<Calendar className="h-4 w-4" />} label="Sessies" value={totals.totalSessions.toString()} tint="cyan" />
          <StatCard icon={<Zap className="h-4 w-4" />} label="Actieve boosts" value={activeBoosts.length.toString()} tint="yellow" pulse={activeBoosts.length > 0} />
        </section>

        {/* Actieve boosts banner */}
        {activeBoosts.length > 0 && (
          <section className="relative overflow-hidden bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-fuchsia-500/10 border border-yellow-500/30 rounded-2xl p-5">
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(250,204,21,0.2), transparent 40%)" }} />
            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center animate-pulse"><Zap className="h-5 w-5 text-yellow-300" /></div>
                <div>
                  <h3 className="font-bold text-yellow-100 flex items-center gap-2">Boost actief! <Rocket className="h-4 w-4" /></h3>
                  {myCreator && (
                    <p className="text-sm text-yellow-200/80">Jij verdient nu <b>x{myEffective.mult}</b> punten per <b>{myEffective.interval} min</b>.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {activeBoosts.map(b => {
                  const scoped = b.creator_id ? creators.find(c => c.id === b.creator_id)?.twitch_username : null;
                  const min = Math.max(0, Math.floor((new Date(b.ends_at).getTime() - Date.now()) / 60000));
                  return (
                    <div key={b.id} className="text-xs bg-black/30 border border-yellow-500/30 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                      <span className="font-bold text-yellow-200">x{b.multiplier}</span>
                      {b.interval_seconds && <span className="text-slate-300">/{Math.round(b.interval_seconds/60)}m</span>}
                      <span className="text-slate-400">{scoped ? `@${scoped}` : "iedereen"}</span>
                      <Timer className="h-3 w-3 text-yellow-300" /> <span className="text-slate-300">{min}m</span>
                      {isHead && <button onClick={() => stopBoost(b.id)} className="text-red-400/80 hover:text-red-300 ml-1"><Trash2 className="h-3 w-3" /></button>}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}


        {/* Mijn stats */}
        {myCreator && (
          <section className="relative bg-gradient-to-br from-[#180a2d] to-[#0f0620] border border-purple-500/25 rounded-2xl p-6 overflow-hidden">
            <div className="absolute -top-16 -right-16 w-60 h-60 bg-fuchsia-500/10 rounded-full blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-fuchsia-400" /> Mijn dashboard</h2>
                <p className="text-sm text-slate-400 mt-1">Live status & voortgang van jouw account</p>
              </div>
              <a href={`https://tiktok.com/@${myCreator.twitch_username}/live`} target="_blank" className="text-xs bg-purple-600/20 border border-purple-500/40 px-3 py-2 rounded-lg flex items-center gap-2 self-start md:self-auto hover:bg-purple-600/30">
                Open mijn TikTok LIVE <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-5 gap-4">
              <MiniStat label="TikTok" value={`@${myCreator.twitch_username}`} accent />
              <MiniStat label="Status" value={myCreator.is_currently_live ? "🔴 LIVE" : "Offline"} accent={myCreator.is_currently_live} />
              <MiniStat label="Punten" value={`⭐ ${myCreator.points || 0}`} accent />
              <MiniStat label="Totaal live" value={fmtHours(myCreator.total_seconds)} />
              <MiniStat label="Laatst gecheckt" value={timeAgo(myCreator.last_checked_at) + " geleden"} />
            </div>

            {nextReward && (
              <div className="relative mt-6 bg-[#0f0620]/60 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="flex items-center gap-2 text-slate-300"><Award className="h-4 w-4 text-yellow-400" /> Volgende beloning: <span className="text-white font-semibold">{nextReward.title}</span></span>
                  <span className="text-xs text-slate-400">{myCreator.points || 0} / {nextReward.points_required} punten</span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-400 transition-all" style={{ width: `${Math.min(100, ((myCreator.points || 0) / nextReward.points_required) * 100)}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-2">Je verdient <b>x{myEffective.mult} punt per {myEffective.interval} min</b> dat je TikTok LIVE bent én in-game zit.</p>
              </div>
            )}

            {lastCode && (
              <div className="relative mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold mb-1"><CheckCircle2 className="h-4 w-4" /> Aankoop gelukt: {lastCode.title}</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="font-mono font-bold text-2xl text-emerald-200 bg-black/30 px-3 py-1.5 rounded-lg tracking-widest">{lastCode.code}</code>
                  <button onClick={() => { navigator.clipboard.writeText(lastCode.code); toast.success("Gekopieerd"); }} className="flex items-center gap-1 text-xs bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg"><Copy className="h-3 w-3" /> Kopieer code</button>
                </div>
                <p className="text-xs text-slate-400 mt-2">Maak een ticket aan in Discord en stuur deze code — een Head Content Creator geeft je het product.</p>
              </div>
            )}
          </section>
        )}

        {/* Grid: rewards + leaderboard */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Beloningen (shop) */}
          <div className="lg:col-span-2 bg-[#150822]/80 border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-400" /> Puntenshop</h2>
            <p className="text-xs text-slate-400 mb-4">Koop een beloning met je verdiende punten. Je krijgt een unieke code die je in Discord inlevert.</p>
            {rewards.length === 0 ? (
              <p className="text-slate-400 text-sm">Nog geen beloningen ingesteld.</p>
            ) : (
              <div className="space-y-3">
                {rewards.map(r => {
                  const myPts = myCreator?.points || 0;
                  const pct = Math.min(100, (myPts / r.points_required) * 100);
                  const reached = myPts >= r.points_required;
                  return (
                    <div key={r.id} className="bg-gradient-to-br from-[#1a0f2e] to-[#150822] border border-purple-500/10 rounded-xl p-4 hover:border-purple-500/30 transition">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="min-w-0">
                          <div className="font-semibold flex items-center gap-2 flex-wrap">
                            <Gift className="h-4 w-4 text-purple-400 shrink-0" />
                            <span>{r.title}</span>
                            <span className="text-xs bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full flex items-center gap-1"><Coins className="h-3 w-3" /> {r.points_required} pt</span>
                          </div>
                          {r.description && <p className="text-sm text-slate-400 mt-1">{r.description}</p>}
                        </div>
                        <div className="flex gap-2 items-center shrink-0">
                          {myCreator && (
                            reached ? (
                              <button onClick={() => claimReward(r)} className="text-xs bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:brightness-110 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                                <Ticket className="h-3 w-3" /> Koop ({r.points_required})
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">Nog {r.points_required - myPts} pt</span>
                            )
                          )}
                          {isHead && (
                            <button onClick={() => removeReward(r.id)} className="text-red-400/70 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                          )}
                        </div>
                      </div>
                      {myCreator && (
                        <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {isHead && (
              <form onSubmit={addReward} className="mt-6 border-t border-purple-500/20 pt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="number" min={1} value={rp} onChange={e => setRp(+e.target.value)} placeholder="Punten" required className="bg-[#1a0f2e] border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                <input value={rt} onChange={e => setRt(e.target.value)} placeholder="Titel (bv. €10 Robux)" required className="bg-[#1a0f2e] border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                <input value={rd} onChange={e => setRd(e.target.value)} placeholder="Beschrijving" className="bg-[#1a0f2e] border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                <button type="submit" className="bg-purple-600 hover:bg-purple-500 rounded-lg text-sm flex items-center justify-center gap-1"><Plus className="h-4 w-4" /> Toevoegen</button>
              </form>
            )}
          </div>


          {/* Leaderboard */}
          <div className="bg-[#150822]/80 border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-fuchsia-400" /> Leaderboard</h2>
            <div className="space-y-2">
              {creators.slice(0, 8).map((c, i) => (
                <div key={c.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${c.user_id === me?.id ? "bg-purple-500/10 border border-purple-500/30" : "bg-[#1a0f2e]/60"}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" :
                    i === 1 ? "bg-slate-400/15 text-slate-300 border border-slate-400/30" :
                    i === 2 ? "bg-orange-500/15 text-orange-300 border border-orange-500/30" :
                    "bg-slate-800 text-slate-400"
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm truncate">
                      <span className="font-medium truncate">@{c.twitch_username}</span>
                      {c.is_currently_live && <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded animate-pulse">LIVE</span>}
                    </div>
                    <div className="text-xs text-slate-500 font-mono flex gap-2"><span className="text-yellow-400">⭐ {c.points || 0}</span><span>·</span><span>{fmtHours(c.total_seconds)}</span></div>
                  </div>
                  {i === 0 && <Crown className="h-4 w-4 text-yellow-400 shrink-0" />}
                </div>
              ))}
              {creators.length === 0 && <p className="text-slate-500 text-sm">Nog geen creators.</p>}
            </div>
          </div>
        </section>

        {/* Alle creators */}
        <section className="bg-[#150822]/80 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-purple-400" /> Alle content creators</h2>
            <span className="text-xs text-slate-500">{creators.length} totaal</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-xs uppercase tracking-wider">
                <tr className="border-b border-purple-500/20">
                  <th className="text-left py-2 font-medium">TikTok</th>
                  <th className="text-left py-2 font-medium">Login</th>
                  <th className="text-left py-2 font-medium">Roblox</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">In-game</th>
                  <th className="text-left py-2 font-medium">Uren</th>
                  <th className="text-left py-2 font-medium">Punten</th>
                  <th className="text-left py-2 font-medium">Aankopen</th>
                  <th className="text-left py-2 font-medium">Laatst</th>
                  {isHead && <th></th>}
                </tr>
              </thead>
              <tbody>
                {creators.map(c => {
                  const claimedCount = claims.filter(cl => cl.creator_id === c.id).length;
                  return (
                    <tr key={c.id} className="border-b border-slate-800/50 hover:bg-purple-500/5">
                      <td className="py-3">
                        <a href={`https://tiktok.com/@${c.twitch_username}/live`} target="_blank" className="text-purple-300 hover:underline font-mono flex items-center gap-1">
                          @{c.twitch_username} <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      </td>
                      <td className="text-slate-400 font-mono text-xs">{c.login_username || "-"}</td>
                      <td className="text-slate-400 font-mono text-xs">{c.roblox_username || "-"}</td>
                      <td className={c.is_currently_live ? "text-red-400 font-semibold" : "text-slate-500"}>
                        {c.is_currently_live ? <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE</span> : "Offline"}
                      </td>
                      <td className={c.is_in_game ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                        {c.is_in_game ? <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> in-game</span> : "-"}
                      </td>
                      <td className="font-mono">{fmtHours(c.total_seconds)}</td>
                      <td className="font-mono text-yellow-300">⭐ {c.points || 0}</td>
                      <td className="text-slate-400"><span className="text-xs bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5">{claimedCount}</span></td>
                      <td className="text-slate-500 text-xs">{c.last_checked_at ? timeAgo(c.last_checked_at) + " geleden" : "-"}</td>
                      {isHead && (
                        <td className="text-right">
                          <button onClick={() => removeCreator(c.id)} className="text-red-400/70 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sessies & claims */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#150822]/80 border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Flame className="h-5 w-5 text-orange-400" /> {myCreator ? "Mijn recente sessies" : "Recente sessies"}</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(myCreator ? mySessions : sessions).slice(0, 15).map(s => {
                const creator = creators.find(c => c.id === s.creator_id);
                return (
                  <div key={s.id} className="flex items-center justify-between bg-[#1a0f2e]/60 rounded-lg px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="font-mono text-purple-300 truncate">@{creator?.twitch_username || "?"}</div>
                      <div className="text-xs text-slate-500">{new Date(s.started_at).toLocaleString("nl-NL")}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs">{s.duration_seconds ? fmtHours(s.duration_seconds) : (s.ended_at ? "-" : <span className="text-red-400 animate-pulse">bezig</span>)}</div>
                    </div>
                  </div>
                );
              })}
              {(myCreator ? mySessions : sessions).length === 0 && <p className="text-slate-500 text-sm">Nog geen sessies opgeslagen.</p>}
            </div>
          </div>

          <div className="bg-[#150822]/80 border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Ticket className="h-5 w-5 text-yellow-400" /> Recente aankopen</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {claims.slice(0, 20).map(cl => {
                const creator = creators.find(c => c.id === cl.creator_id);
                const reward = rewards.find(r => r.id === cl.reward_id);
                const mine = creator?.user_id === me?.id;
                const showCode = isHead || mine;
                return (
                  <div key={cl.id} className="bg-[#1a0f2e]/60 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate">
                          <span className="font-mono text-purple-300">@{creator?.twitch_username || "?"}</span>
                          <span className="text-slate-500"> kocht </span>
                          <span className="text-white font-medium">{reward?.title || "?"}</span>
                          <span className="text-yellow-400 text-xs"> · {cl.points_spent}pt</span>
                        </div>
                        <div className="text-xs text-slate-500">{new Date(cl.claimed_at).toLocaleString("nl-NL")}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase border ${cl.redeemed_at ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"}`}>
                        {cl.redeemed_at ? "ingewisseld" : "open"}
                      </span>
                    </div>
                    {showCode && cl.code && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="font-mono text-xs text-emerald-200 bg-black/40 px-2 py-0.5 rounded tracking-wider">{cl.code}</code>
                        <button onClick={() => { navigator.clipboard.writeText(cl.code!); toast.success("Gekopieerd"); }} className="text-slate-500 hover:text-white"><Copy className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                );
              })}
              {claims.length === 0 && <p className="text-slate-500 text-sm">Nog geen aankopen.</p>}
            </div>
          </div>
        </section>

        {/* Head CC: code inwisselen */}
        {isHead && (
          <section className="bg-gradient-to-br from-[#180a2d] to-[#150822] border border-emerald-500/25 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2"><KeyRound className="h-5 w-5 text-emerald-400" /> Code inwisselen (Head CC)</h2>
            <p className="text-xs text-slate-400 mb-4">Vul de code in die een creator via Discord ticket doorgaf. Na inwisselen zie je welk product je moet uitreiken.</p>
            <form onSubmit={doRedeem} className="flex gap-2">
              <input value={redeemCode} onChange={e => setRedeemCode(e.target.value.toUpperCase())} placeholder="CC-XXXX-XXXX" required className="flex-1 bg-[#1a0f2e] border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono tracking-widest" />
              <button type="submit" disabled={redeeming} className="bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm px-4 flex items-center gap-1 disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" /> Inwisselen
              </button>
            </form>
            {redeemInfo && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm space-y-1">
                <div className="font-semibold text-emerald-300 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Geef dit uit:</div>
                <div>Product: <b className="text-white">{redeemInfo.cc_rewards?.title}</b></div>
                {redeemInfo.cc_rewards?.description && <div className="text-slate-400 text-xs">{redeemInfo.cc_rewards.description}</div>}
                <div>Creator: <span className="font-mono text-purple-300">@{redeemInfo.cc_creators?.twitch_username}</span></div>
                <div>Roblox: <span className="font-mono text-purple-300">{redeemInfo.cc_creators?.roblox_username || "-"}</span></div>
                <div className="text-xs text-slate-400">Kosten: {redeemInfo.points_spent} pt</div>
              </div>
            )}
          </section>
        )}

        {/* Account aanmaken (head only) */}
        {isHead && (
          <section className="bg-gradient-to-br from-[#180a2d] to-[#150822] border border-purple-500/25 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2"><Plus className="h-5 w-5 text-purple-400" /> Nieuw creator account</h2>
            <p className="text-xs text-slate-400 mb-4">De <b>login gebruikersnaam</b> wordt gebruikt om in te loggen. De <b>TikTok gebruikersnaam</b> wordt gemonitord voor livestatus. De <b>Roblox gebruikersnaam</b> wordt gebruikt om te controleren of de creator daadwerkelijk in-game zit — anders telt de live-tijd niet.</p>
            <form onSubmit={createAccount} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Login gebruikersnaam</label>
                <input value={newLogin} onChange={e => setNewLogin(e.target.value)} placeholder="bv. jan_creator" required className="w-full bg-[#1a0f2e] border border-slate-700 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">TikTok gebruikersnaam</label>
                <input value={newTikTok} onChange={e => setNewTikTok(e.target.value)} placeholder="@tiktok_naam" required className="w-full bg-[#1a0f2e] border border-slate-700 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Roblox gebruikersnaam</label>
                <input value={newRoblox} onChange={e => setNewRoblox(e.target.value)} placeholder="RobloxUser123" required className="w-full bg-[#1a0f2e] border border-slate-700 rounded-lg px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm mt-6">
                <input type="checkbox" checked={newHead} onChange={e => setNewHead(e.target.checked)} className="accent-purple-500" />
                Head CC
              </label>
              <button type="submit" disabled={creating} className="bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:brightness-110 rounded-lg text-sm mt-6 disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                {creating ? "Aanmaken..." : "Account aanmaken"}
              </button>
            </form>
            {tempPw && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div>Login: <code className="font-mono font-bold text-green-300">{tempPw.login}</code></div>
                    <div>Tijdelijk wachtwoord: <code className="font-mono font-bold text-green-300">{tempPw.pw}</code></div>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`Login: ${tempPw.login}\nWachtwoord: ${tempPw.pw}`); toast.success("Gekopieerd"); }}
                    className="flex items-center gap-1 text-xs bg-green-500/20 border border-green-500/40 hover:bg-green-500/30 px-3 py-1.5 rounded-lg"
                  ><Copy className="h-3 w-3" /> Kopieer</button>
                </div>
                <p className="text-xs text-slate-400 mt-2">Geef dit door aan de creator — inloggen kan op /contentcreator.</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, tint, pulse }: { icon: React.ReactNode; label: string; value: string; tint: "purple" | "red" | "fuchsia" | "cyan" | "yellow"; pulse?: boolean }) => {
  const tints: Record<string, string> = {
    purple: "from-purple-500/15 to-transparent border-purple-500/30 text-purple-300",
    red: "from-red-500/15 to-transparent border-red-500/30 text-red-300",
    fuchsia: "from-fuchsia-500/15 to-transparent border-fuchsia-500/30 text-fuchsia-300",
    cyan: "from-cyan-500/15 to-transparent border-cyan-500/30 text-cyan-300",
    yellow: "from-yellow-500/15 to-transparent border-yellow-500/30 text-yellow-300",
  };
  return (
    <div className={`relative bg-gradient-to-br ${tints[tint]} border rounded-2xl p-4 backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
        <span className={pulse ? "animate-pulse" : ""}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
    </div>
  );
};

const MiniStat = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="bg-[#0f0620]/70 border border-purple-500/15 rounded-xl p-4">
    <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
    <div className={`mt-1 font-semibold ${accent ? "text-fuchsia-300" : "text-white"}`}>{value}</div>
  </div>
);

export default ContentCreatorDashboard;
