import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Skull, LogOut, LayoutDashboard, Users, Plus, ScrollText, Zap, AlertTriangle,
  Inbox, UserCircle, ShieldAlert, ChevronDown, ChevronRight, Upload, Trash2,
  Send, MessageSquare, Sparkles, Copy, X, Crown, Star, Menu,
} from "lucide-react";

// ============ Types ============
type Role = "onderwereld_proef" | "onderwereld_coordinator" | "onderwereld_hoofd";
type Gang = { id: string; name: string; logo_url: string | null; level: number; total_points: number; created_at: string };
type Scenario = { key: string; label: string; base_points: number; display_order: number };
type PointEntry = {
  id: string; gang_id: string; scenario_key: string; scenario_time: string; clip_url: string;
  base_points: number; effective_points: number; boost_multiplier: number;
  entered_by: string | null; entered_by_name: string | null; created_at: string;
};
type Boost = { id: string; multiplier: number; starts_at: string; ends_at: string; created_by_name: string | null; created_at: string };
type Warning = {
  id: string; gang_id: string; type: "inactivity" | "manual"; reason: string | null;
  week_start: string | null; resolved_at: string | null; issued_by_name: string | null; created_at: string;
};
type InboxMsg = { id: string; kind: "system" | "chat" | "urgent"; body: string; gang_id: string | null; author_id: string | null; author_name: string | null; created_at: string };
type OwProfile = { user_id: string; display_name: string; avatar_url: string | null };
type Account = { user_id: string; display_name: string; avatar_url: string | null; role: Role; email: string };

// ============ Level thresholds ============
const LEVEL_THRESHOLDS = [0, 200, 550, 1100, 1900, 3050]; // cum. total for reaching level (index+1)
function nextLevelInfo(level: number, total: number) {
  if (level >= 6) return { next: null, needed: 0, progress: 100, current: total, target: total };
  const cur = LEVEL_THRESHOLDS[level - 1];
  const next = LEVEL_THRESHOLDS[level];
  const progress = Math.min(100, Math.max(0, ((total - cur) / (next - cur)) * 100));
  return { next: level + 1, needed: next - total, progress, current: total, target: next };
}

// ============ Helpers ============
function nlDate(s: string) { return new Date(s).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" }); }
function nlDateOnly(s: string) { return new Date(s).toLocaleDateString("nl-NL"); }

async function signed(bucket: string, path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}

// ============ Main ============
type NavKey =
  | "overview" | "gangs" | "gang-detail" | "gang-new" | "points-new" | "points-recent"
  | "boosts" | "warnings" | "inbox" | "settings" | "accounts";

const OnderwereldDashboard = () => {
  const navigate = useNavigate();
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [me, setMe] = useState<OwProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nav, setNav] = useState<NavKey>("overview");
  const [selectedGang, setSelectedGang] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [gangsOpen, setGangsOpen] = useState(true);
  const [pointsOpen, setPointsOpen] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/onderwereld"); return; }
      setUid(session.user.id);

      // find role (highest first)
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const rs = (roles || []).map((r: any) => r.role);
      const r: Role | null =
        rs.includes("onderwereld_hoofd") || rs.includes("admin") || rs.includes("super_admin") ? "onderwereld_hoofd"
        : rs.includes("onderwereld_coordinator") ? "onderwereld_coordinator"
        : rs.includes("onderwereld_proef") ? "onderwereld_proef"
        : null;
      if (!r) { await supabase.auth.signOut(); navigate("/onderwereld"); return; }
      setRole(r);

      let { data: prof } = await supabase.from("ow_profiles").select("*").eq("user_id", session.user.id).maybeSingle();
      if (!prof) {
        const dn = session.user.email?.split("@")[0] || "Onbekend";
        await supabase.from("ow_profiles").insert({ user_id: session.user.id, display_name: dn });
        prof = { user_id: session.user.id, display_name: dn, avatar_url: null } as any;
      }
      setMe(prof as OwProfile);
      setAvatarUrl(await signed("onderwereld-avatars", prof.avatar_url));
      setLoading(false);
    })();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/onderwereld"); };

  if (loading || !uid || !role || !me) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Laden...</div>;
  }

  const roleLabel = role === "onderwereld_hoofd" ? "Hoofd Coordinator" : role === "onderwereld_coordinator" ? "Coordinator" : "Proef Coordinator";
  const isHoofd = role === "onderwereld_hoofd";
  const isCoord = role === "onderwereld_coordinator" || isHoofd;

  const openGangDetail = (id: string) => { setSelectedGang(id); setNav("gang-detail"); };

  const NavItem = ({ k, icon: I, label, indent = false, color = "blue" }: any) => {
    const colorMap: any = {
      blue: { on: "text-blue-300", bar: "border-blue-400", glow: "from-blue-500/20" },
      violet: { on: "text-violet-300", bar: "border-violet-400", glow: "from-violet-500/20" },
      emerald: { on: "text-emerald-300", bar: "border-emerald-400", glow: "from-emerald-500/20" },
      amber: { on: "text-amber-300", bar: "border-amber-400", glow: "from-amber-500/20" },
      pink: { on: "text-pink-300", bar: "border-pink-400", glow: "from-pink-500/20" },
      red: { on: "text-red-300", bar: "border-red-400", glow: "from-red-500/20" },
    };
    const c = colorMap[color] || colorMap.blue;
    return (
      <button
        onClick={() => setNav(k)}
        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
          nav === k ? `bg-gradient-to-r ${c.glow} to-transparent border-l-2 ${c.bar} text-white` : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
        } ${indent ? "pl-8 text-xs" : ""}`}
      >
        <I className={`h-4 w-4 ${nav === k ? c.on : "text-slate-400"}`} />
        <span>{label}</span>
      </button>
    );
  };

  const closeNav = () => setSidebarOpen(false);
  const NavItemClose = (props: any) => (
    <div onClick={closeNav}><NavItem {...props} /></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a14] via-[#0a0e1a] to-[#050a14] text-white relative overflow-x-hidden">
      {/* Colored ambient blobs */}
      <div className="fixed -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#00ff88]/15 blur-[120px] pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-[#00ff88]/10 blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-[#00ff88]/8 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 -left-20 w-[400px] h-[400px] rounded-full bg-[#00ff88]/8 blur-[120px] pointer-events-none" />
      {/* Grid overlay */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #ffffff 1px, transparent 1px), linear-gradient(-45deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Floating open button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`fixed top-4 right-4 z-40 p-2.5 rounded-lg bg-gradient-to-br from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00bb66] shadow-lg shadow-[#00ff88]/30 text-white transition-all ${sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {sidebarOpen && (
        <div onClick={closeNav} className="fixed inset-0 bg-[#050a14]/60 z-40 backdrop-blur-sm" />
      )}

      {/* Sidebar (right, collapsible) */}
      <aside className={`fixed top-0 right-0 h-full w-72 bg-[#0a0e1a]/95 backdrop-blur-xl border-l border-slate-600 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-[#00ff88]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00ff88] to-[#00dd77] flex items-center justify-center shadow-lg shadow-[#00ff88]/30">
              <Skull className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold tracking-tight">Onderwereld</div>
              <div className="text-xs bg-gradient-to-r from-[#00ff88] to-[#00ff88] bg-clip-text text-transparent uppercase tracking-wider font-semibold">HDRP</div>
            </div>
          </div>
          <button onClick={closeNav} className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>


        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavItemClose k="overview" icon={LayoutDashboard} label="Overzicht" color="blue" />

          <button onClick={() => setGangsOpen(!gangsOpen)} className="w-full flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider text-violet-300/80 hover:text-violet-200 mt-2">
            <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Gangs</span>
            {gangsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          {gangsOpen && <>
            <NavItemClose k="gangs" icon={Users} label="Alle gangs" indent color="violet" />
            {isHoofd && <NavItemClose k="gang-new" icon={Plus} label="Nieuwe gang" indent color="violet" />}
          </>}

          <button onClick={() => setPointsOpen(!pointsOpen)} className="w-full flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider text-emerald-300/80 hover:text-emerald-200 mt-2">
            <span className="flex items-center gap-2"><ScrollText className="h-3.5 w-3.5" /> Punten</span>
            {pointsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          {pointsOpen && <>
            <NavItemClose k="points-new" icon={Plus} label="Punten invoeren" indent color="emerald" />
            <NavItemClose k="points-recent" icon={ScrollText} label="Recent toegevoegd" indent color="emerald" />
          </>}

          <div className="pt-2" />
          <NavItemClose k="boosts" icon={Zap} label="Boosts" color="amber" />
          <NavItemClose k="warnings" icon={AlertTriangle} label="Waarschuwingen" color="red" />
          <NavItemClose k="inbox" icon={Inbox} label="Inbox & chat" color="pink" />

          <div className="pt-3 mt-3 border-t border-slate-700" />
          <NavItemClose k="settings" icon={UserCircle} label="Mijn account" color="blue" />
          {isHoofd && <NavItemClose k="accounts" icon={ShieldAlert} label="Accounts beheren" color="red" />}
        </nav>

        <div className="p-4 border-t border-slate-700 flex items-center gap-3 bg-gradient-to-r from-[#050a14] to-[#0a0e1a]">
          {avatarUrl
            ? <img src={avatarUrl} className="w-9 h-9 rounded-full object-cover border-2 border-[#00ff88]/60" alt="" />
            : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00dd77] flex items-center justify-center text-white font-bold">{me.display_name[0]?.toUpperCase()}</div>}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{me.display_name}</div>
            <div className="text-xs text-slate-300 truncate">{roleLabel}</div>
          </div>
          <button onClick={handleLogout} className="p-2 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400" title="Uitloggen">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="min-h-screen relative z-10 flex flex-col">
        <div className="max-w-7xl w-full mx-auto p-6 lg:p-10 pr-16 lg:pr-20 flex-1">
          {nav === "overview" && <OverviewPanel me={me} role={role} onNav={setNav} onGang={openGangDetail} />}
          {nav === "gangs" && <GangsPanel isHoofd={isHoofd} onOpen={openGangDetail} />}
          {nav === "gang-new" && isHoofd && <GangNewPanel me={me} uid={uid} onDone={(id) => openGangDetail(id)} />}
          {nav === "gang-detail" && selectedGang && <GangDetailPanel gangId={selectedGang} isHoofd={isHoofd} isCoord={isCoord} />}
          {nav === "points-new" && <PointsNewPanel me={me} uid={uid} />}
          {nav === "points-recent" && <PointsRecentPanel isCoord={isCoord} />}
          {nav === "boosts" && <BoostsPanel me={me} uid={uid} isCoord={isCoord} />}
          {nav === "warnings" && <WarningsPanel me={me} uid={uid} isCoord={isCoord} isHoofd={isHoofd} />}
          {nav === "inbox" && <InboxPanel me={me} uid={uid} isHoofd={isHoofd} />}
          {nav === "settings" && <SettingsPanel me={me} setMe={setMe} setAvatarUrl={setAvatarUrl} />}
          {nav === "accounts" && isHoofd && <AccountsPanel meUid={uid} />}
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-700 bg-[#050a14]/70 backdrop-blur mt-8">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Skull className="h-4 w-4 text-slate-300" />
              <span className="uppercase tracking-widest">HDRP · Onderwereld Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Ingelogd als <span className="text-slate-200">{me.display_name}</span></span>
              <span className="hidden md:inline text-slate-600">|</span>
              <span>v1.0</span>
            </div>
            <div className="text-slate-500">© {new Date().getFullYear()} HDRP Hoofddorp Roleplay — Alle rechten voorbehouden</div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default OnderwereldDashboard;

// =============================================================
// PANELS
// =============================================================

function Card({ children, className = "" }: any) {
  return <div className={`bg-[#111827]/80 backdrop-blur border border-slate-600/60 rounded-xl ${className}`}>{children}</div>;
}
function SectionTitle({ children, sub }: any) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">{children}</h2>
      {sub && <p className="text-sm text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
function Label({ children }: any) { return <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">{children}</label>; }
const inputCls = "w-full bg-[#050a14]/60 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/40 placeholder-slate-500";
const btnPrimary = "bg-gradient-to-r from-[#00ff88] to-[#00dd77] hover:from-[#00dd77] hover:to-[#00bb66] text-[#0a0e1a] font-bold px-5 py-2.5 rounded-lg text-sm uppercase tracking-wider transition-all disabled:opacity-40";
const btnGhost = "border border-slate-600 hover:border-slate-400 text-slate-200 hover:text-white px-4 py-2 rounded-lg text-sm transition-all";
const btnDanger = "border border-red-900/60 hover:bg-red-900/30 text-red-400 px-3 py-1.5 rounded-lg text-xs transition-all inline-flex items-center gap-1.5";

function LevelBadge({ level }: { level: number }) {
  const stars = "★".repeat(level);
  const colors = ["text-slate-400", "text-zinc-800", "text-slate-200", "text-white", "text-white", "text-orange-400", "text-red-500"];
  return <span className={`text-sm font-bold ${colors[level] || "text-white"}`}>LVL {level} <span className="text-xs">{stars}</span></span>;
}

function ProgressBar({ current, target, level }: { current: number; target: number; level: number }) {
  const info = nextLevelInfo(level, current);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">{current} pt</span>
        <span className="text-slate-400">{info.next ? `${info.needed} nodig voor LVL ${info.next}` : "MAX LEVEL"}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
        <div className="h-full bg-gradient-to-r from-[#00ff88] via-[#00dd77] to-[#00ff88] transition-all shadow-[0_0_10px_rgba(0,255,136,0.6)]" style={{ width: `${info.progress}%` }} />
      </div>
    </div>
  );
}

// -------- Overview --------
function OverviewPanel({ me, role, onNav, onGang }: any) {
  const [stats, setStats] = useState({ gangs: 0, weekPoints: 0, activeWarns: 0, urgent: 0, activeBoost: null as Boost | null });
  const [recentInbox, setRecentInbox] = useState<InboxMsg[]>([]);
  const [topGangs, setTopGangs] = useState<Gang[]>([]);

  useEffect(() => {
    (async () => {
      const [g, pe, w, ub, ib, tg] = await Promise.all([
        supabase.from("ow_gangs").select("id", { count: "exact", head: true }),
        supabase.from("ow_point_entries").select("effective_points").gte("scenario_time", weekStartISO()),
        supabase.from("ow_warnings").select("id", { count: "exact", head: true }).is("resolved_at", null),
        supabase.from("ow_boosts").select("*").lte("starts_at", new Date().toISOString()).gte("ends_at", new Date().toISOString()).order("multiplier", { ascending: false }).limit(1),
        supabase.from("ow_inbox_messages").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("ow_gangs").select("*").order("total_points", { ascending: false }).limit(5),
      ]);
      const urgent = (ib.data || []).filter((m: any) => m.kind === "urgent").length;
      setStats({
        gangs: g.count || 0,
        weekPoints: (pe.data || []).reduce((s: number, r: any) => s + (r.effective_points || 0), 0),
        activeWarns: w.count || 0,
        urgent,
        activeBoost: (ub.data || [])[0] as Boost | undefined || null,
      });
      setRecentInbox((ib.data as any) || []);
      setTopGangs((tg.data as any) || []);
    })();
  }, []);

  const roleLabel = role === "onderwereld_hoofd" ? "Hoofd Onderwereld Coordinator" : role === "onderwereld_coordinator" ? "Onderwereld Coordinator" : "Proef Onderwereld Coordinator";

  return (
    <div className="-m-6 lg:-m-10 -mr-16 lg:-mr-20">
      {/* Compact hero */}
      <section className="px-6 lg:px-10 pr-16 lg:pr-20 pt-10 pb-8 relative border-b border-slate-700/60 bg-gradient-to-br from-[#00ff88]/10 via-transparent to-transparent">
        <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] via-[#00ff88] to-[#00ff88] text-xs uppercase tracking-[0.4em] mb-4 font-bold">{roleLabel}</p>
        <h1 className="text-[clamp(2.5rem,7vw,6rem)] font-black text-white tracking-tighter leading-[0.9]">
          Welkom <span className="bg-gradient-to-r from-[#00ff88] via-[#00ff88] to-[#00dd77] bg-clip-text text-transparent">{me.display_name}.</span>
        </h1>
        <p className="text-slate-300 mt-4 text-base md:text-lg max-w-3xl">
          Overzicht van gang-activiteit binnen HDRP. Beheer punten, boosts en waarschuwingen vanuit één centrale plek.
        </p>
      </section>

      <div className="px-6 lg:px-10 pr-16 lg:pr-20 py-8 space-y-8">

      {stats.activeBoost && (
        <Card className="p-4 border-amber-500/50 bg-gradient-to-r from-amber-950/60 via-orange-950/40 to-red-950/40 shadow-lg shadow-amber-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-900/50">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white font-bold">Actieve boost: x{stats.activeBoost.multiplier}</div>
              <div className="text-xs text-amber-200/80">Loopt tot {nlDate(stats.activeBoost.ends_at)}</div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Gangs", value: stats.gangs, icon: Users, grad: "from-blue-500 to-cyan-500", ring: "shadow-[#00ff88]/20 border-blue-500/30" },
          { label: "Punten deze week", value: stats.weekPoints, icon: ScrollText, grad: "from-emerald-500 to-teal-500", ring: "shadow-emerald-900/40 border-emerald-500/30" },
          { label: "Actieve warns", value: stats.activeWarns, icon: AlertTriangle, grad: "from-orange-500 to-amber-500", ring: "shadow-orange-900/40 border-orange-500/30" },
          { label: "Spoedmeldingen", value: stats.urgent, icon: ShieldAlert, grad: "from-red-500 to-pink-500", ring: "shadow-red-900/40 border-red-500/30" },
        ].map((s, i) => (
          <Card key={i} className={`p-5 shadow-lg ${s.ring}`}>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.grad} flex items-center justify-center mb-3 shadow-md`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-3">Snelle acties</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { k: "points-new", icon: Plus, label: "Punten invoeren", grad: "from-emerald-500 to-teal-600", hover: "hover:border-emerald-400" },
            { k: "gangs", icon: Users, label: "Alle gangs", grad: "from-violet-500 to-purple-600", hover: "hover:border-violet-400" },
            { k: "warnings", icon: AlertTriangle, label: "Waarschuwingen", grad: "from-orange-500 to-red-500", hover: "hover:border-orange-400" },
            { k: "inbox", icon: Inbox, label: "Inbox & chat", grad: "from-pink-500 to-rose-500", hover: "hover:border-pink-400" },
          ].map((a) => (
            <button key={a.k} onClick={() => onNav(a.k)} className="group">
              <Card className={`p-4 ${a.hover} transition flex items-center gap-3`}>
                <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${a.grad} flex items-center justify-center shadow-md group-hover:scale-110 transition`}>
                  <a.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-white font-medium">{a.label}</span>
              </Card>
            </button>
          ))}
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Crown className="h-4 w-4 text-amber-400" /> Top gangs</h3>
          {topGangs.length === 0 && <p className="text-slate-400 text-sm">Nog geen gangs.</p>}
          <div className="space-y-3">
            {topGangs.map((g) => (
              <button key={g.id} onClick={() => onGang(g.id)} className="w-full text-left hover:bg-slate-700/60 p-2 rounded-lg transition">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white font-medium">{g.name}</span>
                  <LevelBadge level={g.level} />
                </div>
                <ProgressBar current={g.total_points} target={0} level={g.level} />
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Inbox className="h-4 w-4 text-pink-400" /> Recente meldingen</h3>
          {recentInbox.length === 0 && <p className="text-slate-400 text-sm">Nog geen berichten.</p>}
          <div className="space-y-3">
            {recentInbox.map((m) => (
              <div key={m.id} className={`p-3 rounded-lg text-sm border ${
                m.kind === "urgent" ? "bg-red-950/40 border-red-500/40 text-red-100"
                : m.kind === "system" ? "bg-slate-700/60 border-slate-600 text-slate-200"
                : "bg-slate-700/60 border-slate-600 text-white"
              }`}>
                <div className="text-xs text-slate-400 mb-1">{m.author_name || "Systeem"} · {nlDate(m.created_at)}</div>
                {m.body}
              </div>
            ))}
          </div>
          <button onClick={() => onNav("inbox")} className={`${btnGhost} w-full mt-4`}>Volledige inbox</button>
        </Card>
      </div>
      </div>
    </div>
  );
}

function weekStartISO() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // mon=0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// -------- Gangs list --------
function GangsPanel({ isHoofd, onOpen }: any) {
  const [gangs, setGangs] = useState<(Gang & { logoSigned: string | null })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("ow_gangs").select("*").order("total_points", { ascending: false });
    const withLogos = await Promise.all((data || []).map(async (g: any) => ({ ...g, logoSigned: await signed("onderwereld-logos", g.logo_url) })));
    setGangs(withLogos);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <SectionTitle sub="Klik op een gang voor details, puntengeschiedenis en waarschuwingen.">Alle gangs</SectionTitle>
      {loading ? <p className="text-slate-400">Laden...</p> : gangs.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300">Nog geen gangs aangemaakt.</p>
          {isHoofd && <p className="text-slate-400 text-sm mt-1">Ga naar "Nieuwe gang" om er één toe te voegen.</p>}
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {gangs.map((g) => (
            <button key={g.id} onClick={() => onOpen(g.id)} className="text-left">
              <Card className="p-5 hover:border-slate-400 transition group">
                <div className="flex items-center gap-4 mb-4">
                  {g.logoSigned
                    ? <img src={g.logoSigned} className="w-14 h-14 rounded-lg object-cover border border-slate-600" alt="" />
                    : <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-2xl font-bold text-slate-200">{g.name[0]?.toUpperCase()}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold text-white truncate group-hover:text-white">{g.name}</div>
                    <LevelBadge level={g.level} />
                  </div>
                </div>
                <ProgressBar current={g.total_points} target={0} level={g.level} />
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// -------- New gang --------
function GangNewPanel({ me, uid, onDone }: any) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState(1);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      let logoPath: string | null = null;
      if (logoFile) {
        const path = `${crypto.randomUUID()}-${logoFile.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
        const { error: upErr } = await supabase.storage.from("onderwereld-logos").upload(path, logoFile, { upsert: false });
        if (upErr) throw upErr;
        logoPath = path;
      }
      const total = LEVEL_THRESHOLDS[level - 1] || 0;
      const { data, error } = await supabase.from("ow_gangs").insert({
        name: name.trim(), logo_url: logoPath, level, total_points: total, created_by: uid,
      }).select().single();
      if (error) throw error;
      await supabase.from("ow_inbox_messages").insert({
        kind: "system", body: `📌 Nieuwe gang toegevoegd: ${name.trim()} (start op LVL ${level})`,
        gang_id: data.id, author_id: uid, author_name: me.display_name,
      });
      onDone(data.id);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-xl">
      <SectionTitle sub="Alleen Hoofd Coordinatoren kunnen gangs aanmaken.">Nieuwe gang</SectionTitle>
      <Card className="p-6">
        {err && <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded text-red-200 text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Gangnaam</Label><input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Bijv. De Vossen" /></div>
          <div>
            <Label>Startlevel</Label>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} type="button" onClick={() => setLevel(n)}
                  className={`py-2 rounded-lg border text-sm font-bold ${level === n ? "bg-zinc-300 text-black border-zinc-100" : "bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400"}`}>
                  LVL {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">Punten worden gezet op de startdrempel van dit level ({LEVEL_THRESHOLDS[level - 1]} pt).</p>
          </div>
          <div>
            <Label>Logo (optioneel)</Label>
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-black file:font-bold hover:file:bg-zinc-300 file:cursor-pointer" />
          </div>
          <button disabled={busy || !name} className={btnPrimary}>{busy ? "Aanmaken..." : "Gang aanmaken"}</button>
        </form>
      </Card>
    </div>
  );
}

// -------- Gang detail --------
function GangDetailPanel({ gangId, isHoofd, isCoord }: any) {
  const [gang, setGang] = useState<(Gang & { logoSigned: string | null }) | null>(null);
  const [entries, setEntries] = useState<PointEntry[]>([]);
  const [warns, setWarns] = useState<Warning[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, Scenario>>({});
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const load = async () => {
    const [g, e, w, s] = await Promise.all([
      supabase.from("ow_gangs").select("*").eq("id", gangId).maybeSingle(),
      supabase.from("ow_point_entries").select("*").eq("gang_id", gangId).order("scenario_time", { ascending: false }).limit(100),
      supabase.from("ow_warnings").select("*").eq("gang_id", gangId).order("created_at", { ascending: false }),
      supabase.from("ow_scenarios").select("*"),
    ]);
    if (g.data) {
      const withLogo = { ...(g.data as any), logoSigned: await signed("onderwereld-logos", (g.data as any).logo_url) };
      setGang(withLogo); setName(g.data.name);
    }
    setEntries((e.data as any) || []);
    setWarns((w.data as any) || []);
    const map: Record<string, Scenario> = {}; (s.data || []).forEach((x: any) => map[x.key] = x); setScenarios(map);
  };
  useEffect(() => { load(); }, [gangId]);

  const saveEdit = async () => {
    if (!gang) return;
    let logoPath = gang.logo_url;
    if (logoFile) {
      const path = `${crypto.randomUUID()}-${logoFile.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
      const { error } = await supabase.storage.from("onderwereld-logos").upload(path, logoFile);
      if (error) { alert(error.message); return; }
      logoPath = path;
    }
    await supabase.from("ow_gangs").update({ name: name.trim(), logo_url: logoPath }).eq("id", gangId);
    setEditing(false); setLogoFile(null); load();
  };

  const deleteGang = async () => {
    if (!confirm(`Gang "${gang?.name}" verwijderen? Alle punten & waarschuwingen worden ook verwijderd.`)) return;
    await supabase.from("ow_gangs").delete().eq("id", gangId);
    window.history.back();
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Deze punteninvoer verwijderen?")) return;
    await supabase.from("ow_point_entries").delete().eq("id", id);
    load();
  };

  if (!gang) return <p className="text-slate-400">Laden...</p>;

  return (
    <div>
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-5">
          {gang.logoSigned
            ? <img src={gang.logoSigned} className="w-24 h-24 rounded-xl object-cover border border-slate-600" alt="" />
            : <div className="w-24 h-24 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-4xl font-bold text-slate-200">{gang.name[0]?.toUpperCase()}</div>}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-sm text-slate-300" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className={btnPrimary}>Opslaan</button>
                  <button onClick={() => { setEditing(false); setName(gang.name); }} className={btnGhost}>Annuleren</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{gang.name}</h1>
                  <LevelBadge level={gang.level} />
                </div>
                <p className="text-slate-400 text-sm mt-1">Aangemaakt {nlDateOnly(gang.created_at)}</p>
                <div className="mt-4"><ProgressBar current={gang.total_points} target={0} level={gang.level} /></div>
              </>
            )}
          </div>
          {isHoofd && !editing && (
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className={btnGhost}>Bewerken</button>
              <button onClick={deleteGang} className={btnDanger}><Trash2 className="h-3.5 w-3.5" /> Verwijderen</button>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-5 col-span-2">
          <h3 className="text-white font-semibold mb-4">Punten geschiedenis</h3>
          {entries.length === 0 ? <p className="text-slate-400 text-sm">Nog geen punten ingevoerd.</p> : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 bg-slate-700/40 rounded-lg border border-slate-600/60 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium">{scenarios[e.scenario_key]?.label || e.scenario_key}</div>
                    <div className="text-xs text-slate-400">
                      {nlDate(e.scenario_time)} · door {e.entered_by_name || "?"}
                      <a href={e.clip_url} target="_blank" rel="noreferrer" className="ml-2 text-white hover:underline">Clip →</a>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">+{e.effective_points} pt</div>
                    {e.boost_multiplier > 1 && <div className="text-xs text-white">x{e.boost_multiplier} boost</div>}
                  </div>
                  {isCoord && <button onClick={() => deleteEntry(e.id)} className={btnDanger}><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="text-white font-semibold mb-4">Waarschuwingen</h3>
          {warns.length === 0 ? <p className="text-slate-400 text-sm">Geen waarschuwingen.</p> : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {warns.map((w) => (
                <div key={w.id} className={`p-3 rounded-lg border text-xs ${
                  w.resolved_at ? "bg-slate-700/40 border-slate-600 text-slate-400 line-through"
                  : w.type === "inactivity" ? "bg-orange-950/30 border-orange-800/50 text-orange-200"
                  : "bg-red-950/30 border-red-800/50 text-red-200"
                }`}>
                  <div className="font-semibold uppercase text-[10px] tracking-wider mb-1">{w.type === "inactivity" ? "Inactiviteit" : "Handmatig"}</div>
                  <div>{w.reason}</div>
                  <div className="text-[10px] mt-1 opacity-70">{nlDate(w.created_at)} · {w.issued_by_name || "?"}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// -------- Points new --------
function PointsNewPanel({ me, uid }: any) {
  const [gangs, setGangs] = useState<Gang[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [gangId, setGangId] = useState("");
  const [scenario, setScenario] = useState("");
  const [when, setWhen] = useState(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16);
  });
  const [clip, setClip] = useState("");
  const [activeBoost, setActiveBoost] = useState<Boost | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; err?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [g, s] = await Promise.all([
        supabase.from("ow_gangs").select("*").order("name"),
        supabase.from("ow_scenarios").select("*").order("display_order"),
      ]);
      setGangs((g.data as any) || []); setScenarios((s.data as any) || []);
    })();
  }, []);

  useEffect(() => {
    if (!when) { setActiveBoost(null); return; }
    (async () => {
      const iso = new Date(when).toISOString();
      const { data } = await supabase.from("ow_boosts").select("*").lte("starts_at", iso).gt("ends_at", iso).order("multiplier", { ascending: false }).limit(1);
      setActiveBoost((data as any)?.[0] || null);
    })();
  }, [when]);

  const selectedScenario = scenarios.find(s => s.key === scenario);
  const base = selectedScenario?.base_points || 0;
  const mult = activeBoost?.multiplier || 1;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setBusy(true);
    try {
      const { error } = await supabase.from("ow_point_entries").insert({
        gang_id: gangId, scenario_key: scenario, scenario_time: new Date(when).toISOString(),
        clip_url: clip.trim(), base_points: base, effective_points: base, boost_multiplier: 1,
        entered_by: uid, entered_by_name: me.display_name,
      });
      if (error) throw error;
      setMsg({ ok: "Punten toegevoegd!" });
      setScenario(""); setClip("");
    } catch (e: any) { setMsg({ err: e.message }); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl">
      <SectionTitle sub="Selecteer de gang, het scenario en voeg de clip toe. Punten en boost worden automatisch berekend.">Punten invoeren</SectionTitle>
      <Card className="p-6">
        {msg?.err && <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded text-red-200 text-sm">{msg.err}</div>}
        {msg?.ok && <div className="mb-4 p-3 bg-green-950/40 border border-green-500/40 rounded text-green-200 text-sm">{msg.ok}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Gang</Label>
            <select required value={gangId} onChange={(e) => setGangId(e.target.value)} className={inputCls}>
              <option value="">— Kies gang —</option>
              {gangs.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Tijdstip scenario</Label>
            <input required type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls} />
          </div>
          <div>
            <Label>Type scenario</Label>
            <div className="grid grid-cols-1 gap-2">
              {scenarios.map((s) => (
                <button key={s.key} type="button" onClick={() => setScenario(s.key)}
                  className={`flex justify-between items-center p-3 rounded-lg border text-left text-sm ${
                    scenario === s.key ? "bg-slate-700/60 border-zinc-300 text-white" : "bg-slate-700/40 border-slate-600 text-slate-200 hover:border-slate-400"
                  }`}>
                  <span>{s.label}</span>
                  <span className="font-bold text-white">{s.base_points} pt</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Clip (link)</Label>
            <input required type="url" value={clip} onChange={(e) => setClip(e.target.value)} className={inputCls} placeholder="https://..." />
          </div>

          {selectedScenario && (
            <Card className={`p-4 border ${activeBoost ? "border-zinc-100/60 bg-slate-700/60" : "border-slate-600"}`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Punten die worden toegekend</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{base * mult} pt</div>
                  {activeBoost && <div className="text-xs text-white">{base} × {mult} boost actief</div>}
                </div>
              </div>
            </Card>
          )}

          <button disabled={busy || !gangId || !scenario || !clip} className={btnPrimary}>{busy ? "Bezig..." : "Punten toevoegen"}</button>
        </form>
      </Card>
    </div>
  );
}

// -------- Recent points --------
function PointsRecentPanel({ isCoord }: any) {
  const [rows, setRows] = useState<(PointEntry & { gang?: string })[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, Scenario>>({});
  const load = async () => {
    const [{ data }, { data: gs }, { data: sc }] = await Promise.all([
      supabase.from("ow_point_entries").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("ow_gangs").select("id,name"),
      supabase.from("ow_scenarios").select("*"),
    ]);
    const gmap: Record<string, string> = {}; (gs || []).forEach((g: any) => gmap[g.id] = g.name);
    const smap: Record<string, Scenario> = {}; (sc || []).forEach((s: any) => smap[s.key] = s); setScenarios(smap);
    setRows(((data as any) || []).map((r: any) => ({ ...r, gang: gmap[r.gang_id] })));
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("Verwijderen?")) return;
    await supabase.from("ow_point_entries").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <SectionTitle sub="De 100 meest recente invoeren over alle gangs heen.">Recent toegevoegde punten</SectionTitle>
      <Card className="overflow-hidden">
        {rows.length === 0 ? <p className="p-6 text-slate-400 text-sm">Nog niks ingevoerd.</p> : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-400 border-b border-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Gang</th>
                <th className="text-left px-4 py-3">Scenario</th>
                <th className="text-left px-4 py-3">Tijdstip</th>
                <th className="text-left px-4 py-3">Clip</th>
                <th className="text-left px-4 py-3">Door</th>
                <th className="text-right px-4 py-3">Punten</th>
                {isCoord && <th></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-700 hover:bg-slate-700/40">
                  <td className="px-4 py-3 text-white">{r.gang}</td>
                  <td className="px-4 py-3 text-slate-200">{scenarios[r.scenario_key]?.label || r.scenario_key}</td>
                  <td className="px-4 py-3 text-slate-300">{nlDate(r.scenario_time)}</td>
                  <td className="px-4 py-3"><a href={r.clip_url} target="_blank" rel="noreferrer" className="text-white hover:underline">Bekijk →</a></td>
                  <td className="px-4 py-3 text-slate-300">{r.entered_by_name || "?"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-white font-bold">+{r.effective_points}</span>
                    {r.boost_multiplier > 1 && <span className="text-xs text-white ml-1">×{r.boost_multiplier}</span>}
                  </td>
                  {isCoord && (
                    <td className="px-2"><button onClick={() => del(r.id)} className="text-red-500 hover:text-red-400 p-2"><Trash2 className="h-3.5 w-3.5" /></button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// -------- Boosts --------
function BoostsPanel({ me, uid, isCoord }: any) {
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [mult, setMult] = useState(2);
  const [startNow, setStartNow] = useState(true);
  const [startAt, setStartAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [hours, setHours] = useState(2);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    const { data } = await supabase.from("ow_boosts").select("*").order("starts_at", { ascending: false });
    setBoosts((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const now = new Date();
  const active = boosts.filter(b => new Date(b.starts_at) <= now && new Date(b.ends_at) > now);
  const upcoming = boosts.filter(b => new Date(b.starts_at) > now);
  const past = boosts.filter(b => new Date(b.ends_at) <= now);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const start = startNow ? new Date() : new Date(startAt);
      const end = new Date(start.getTime() + hours * 3600_000);
      const { error } = await supabase.from("ow_boosts").insert({
        multiplier: mult, starts_at: start.toISOString(), ends_at: end.toISOString(),
        created_by: uid, created_by_name: me.display_name,
      });
      if (error) throw error;
      await supabase.from("ow_inbox_messages").insert({
        kind: "system",
        body: `⚡ Nieuwe puntenboost aangemaakt: x${mult} van ${nlDate(start.toISOString())} tot ${nlDate(end.toISOString())}`,
        author_id: uid, author_name: me.display_name,
      });
      load();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Boost verwijderen?")) return;
    await supabase.from("ow_boosts").delete().eq("id", id); load();
  };

  return (
    <div>
      <SectionTitle sub="Puntenboost x2 t/m x5. Alle punten die tijdens de boost-periode worden ingevoerd (op basis van scenario-tijdstip) worden automatisch vermenigvuldigd.">Puntenboosts</SectionTitle>

      {active.length > 0 && (
        <Card className="p-5 mb-6 border-zinc-100/50 bg-gradient-to-r from-zinc-900/60 to-zinc-900/40">
          <div className="flex items-center gap-3 mb-3"><Sparkles className="h-5 w-5 text-white" /><span className="text-white font-semibold">Actief nu</span></div>
          {active.map(b => (
            <div key={b.id} className="flex items-center justify-between py-2 border-t border-slate-600 first:border-t-0">
              <div>
                <div className="text-white text-xl font-bold">x{b.multiplier}</div>
                <div className="text-xs text-white">Loopt tot {nlDate(b.ends_at)} · door {b.created_by_name}</div>
              </div>
              {isCoord && <button onClick={() => del(b.id)} className={btnDanger}><Trash2 className="h-3 w-3" /></button>}
            </div>
          ))}
        </Card>
      )}

      <Card className="p-6 mb-6">
        <h3 className="text-white font-semibold mb-4">Nieuwe boost</h3>
        {err && <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded text-red-200 text-sm">{err}</div>}
        <form onSubmit={create} className="space-y-4">
          <div>
            <Label>Multiplier</Label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setMult(n)}
                  className={`py-3 rounded-lg border font-bold text-lg ${mult === n ? "bg-zinc-300 text-black border-zinc-100" : "bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400"}`}>x{n}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Starten</Label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setStartNow(true)} className={`${startNow ? btnPrimary : btnGhost} !py-2`}>Nu</button>
              <button type="button" onClick={() => setStartNow(false)} className={`${!startNow ? btnPrimary : btnGhost} !py-2`}>Kies tijd</button>
            </div>
            {!startNow && <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />}
          </div>
          <div>
            <Label>Duur (uren)</Label>
            <input type="number" min={1} max={168} value={hours} onChange={(e) => setHours(Number(e.target.value))} className={inputCls} />
          </div>
          <button disabled={busy} className={btnPrimary}>{busy ? "Aanmaken..." : "Boost aanmaken"}</button>
        </form>
      </Card>

      {upcoming.length > 0 && (
        <Card className="p-5 mb-6">
          <h3 className="text-white font-semibold mb-3">Gepland</h3>
          {upcoming.map(b => (
            <div key={b.id} className="flex items-center justify-between py-2 border-t border-slate-600 first:border-t-0 text-sm">
              <div><span className="text-white font-bold">x{b.multiplier}</span> <span className="text-slate-400">· {nlDate(b.starts_at)} → {nlDate(b.ends_at)}</span></div>
              {isCoord && <button onClick={() => del(b.id)} className={btnDanger}><Trash2 className="h-3 w-3" /></button>}
            </div>
          ))}
        </Card>
      )}

      {past.length > 0 && (
        <Card className="p-5">
          <h3 className="text-white font-semibold mb-3">Historie</h3>
          <div className="space-y-1 text-sm max-h-64 overflow-y-auto">
            {past.map(b => (
              <div key={b.id} className="flex justify-between py-1.5 border-t border-slate-700 first:border-t-0 text-slate-400">
                <span>x{b.multiplier} · {nlDate(b.starts_at)}</span>
                <span className="text-slate-400">{b.created_by_name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// -------- Warnings --------
function WarningsPanel({ me, uid, isCoord, isHoofd }: any) {
  const [warns, setWarns] = useState<(Warning & { gangName?: string })[]>([]);
  const [gangs, setGangs] = useState<Gang[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [gangId, setGangId] = useState("");
  const [reason, setReason] = useState("");

  const load = async () => {
    const [{ data: ws }, { data: gs }] = await Promise.all([
      supabase.from("ow_warnings").select("*").order("created_at", { ascending: false }),
      supabase.from("ow_gangs").select("id,name").order("name"),
    ]);
    const gm: Record<string, string> = {}; (gs || []).forEach((g: any) => gm[g.id] = g.name);
    setWarns(((ws as any) || []).map((w: any) => ({ ...w, gangName: gm[w.gang_id] })));
    setGangs((gs as any) || []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: g } = await supabase.from("ow_gangs").select("name").eq("id", gangId).maybeSingle();
    await supabase.from("ow_warnings").insert({
      gang_id: gangId, type: "manual", reason: reason.trim(),
      issued_by: uid, issued_by_name: me.display_name,
    });
    await supabase.from("ow_inbox_messages").insert({
      kind: "system",
      body: `⚠️ ${g?.name} heeft een waarschuwing gekregen van ${me.display_name}: ${reason.trim()}`,
      gang_id: gangId, author_id: uid, author_name: me.display_name,
    });
    setShowForm(false); setReason(""); setGangId(""); load();
  };

  const resolve = async (id: string) => { await supabase.from("ow_warnings").update({ resolved_at: new Date().toISOString() }).eq("id", id); load(); };
  const del = async (id: string) => { if (!confirm("Verwijderen?")) return; await supabase.from("ow_warnings").delete().eq("id", id); load(); };

  const active = warns.filter(w => !w.resolved_at);
  const resolved = warns.filter(w => w.resolved_at);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <SectionTitle sub="Automatische inactiviteit + handmatige waarschuwingen van coordinatoren.">Waarschuwingen</SectionTitle>
        {isCoord && <button onClick={() => setShowForm(!showForm)} className={btnPrimary}>{showForm ? "Sluiten" : "+ Nieuwe waarschuwing"}</button>}
      </div>

      {showForm && isCoord && (
        <Card className="p-5 mb-6">
          <form onSubmit={create} className="space-y-4">
            <div>
              <Label>Gang</Label>
              <select required value={gangId} onChange={e => setGangId(e.target.value)} className={inputCls}>
                <option value="">— Kies gang —</option>
                {gangs.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Reden</Label>
              <textarea required value={reason} onChange={e => setReason(e.target.value)} className={inputCls} rows={3} placeholder="Waarom krijgt deze gang een waarschuwing?" />
            </div>
            <button className={btnPrimary}>Waarschuwing geven</button>
          </form>
        </Card>
      )}

      <h3 className="text-white font-semibold mb-3">Actief ({active.length})</h3>
      {active.length === 0 ? <Card className="p-6 text-center text-slate-400 text-sm mb-6">Geen actieve waarschuwingen.</Card> : (
        <div className="space-y-2 mb-8">
          {active.map(w => (
            <Card key={w.id} className={`p-4 border-l-4 ${w.type === "inactivity" ? "border-l-orange-500" : "border-l-red-500"}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs uppercase font-bold tracking-wider ${w.type === "inactivity" ? "text-orange-400" : "text-red-400"}`}>
                      {w.type === "inactivity" ? "Inactiviteit" : "Handmatig"}
                    </span>
                    <span className="text-white font-semibold">{w.gangName}</span>
                  </div>
                  <p className="text-slate-200 text-sm">{w.reason}</p>
                  <p className="text-xs text-slate-400 mt-1">{nlDate(w.created_at)} · door {w.issued_by_name}</p>
                </div>
                <div className="flex gap-2">
                  {isCoord && <button onClick={() => resolve(w.id)} className={btnGhost}>Oplossen</button>}
                  {isHoofd && <button onClick={() => del(w.id)} className={btnDanger}><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h3 className="text-white font-semibold mb-3">Opgelost ({resolved.length})</h3>
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {resolved.map(w => (
          <div key={w.id} className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 text-sm text-slate-400 flex justify-between">
            <span><span className="text-slate-300">{w.gangName}</span> · {w.reason}</span>
            <span className="text-xs">{nlDateOnly(w.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------- Inbox --------
function InboxPanel({ me, uid, isHoofd }: any) {
  const [msgs, setMsgs] = useState<InboxMsg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase.from("ow_inbox_messages").select("*").order("created_at", { ascending: true }).limit(500);
    setMsgs((data as any) || []);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("ow-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "ow_inbox_messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!text.trim()) return;
    await supabase.from("ow_inbox_messages").insert({ kind: "chat", body: text.trim(), author_id: uid, author_name: me.display_name });
    setText("");
  };
  const del = async (id: string) => { await supabase.from("ow_inbox_messages").delete().eq("id", id); };

  return (
    <div>
      <SectionTitle sub="Systeem-meldingen en teamchat op één plek.">Inbox & team chat</SectionTitle>
      <Card className="flex flex-col h-[calc(100vh-16rem)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.map(m => (
            <div key={m.id} className={`group flex ${m.kind === "chat" && m.author_id === uid ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-2xl rounded-xl px-4 py-2.5 text-sm border relative ${
                m.kind === "urgent" ? "bg-red-950/40 border-red-500/60 text-red-100"
                : m.kind === "system" ? "bg-[#111827]/70 border-slate-600 text-slate-200"
                : m.author_id === uid ? "bg-gradient-to-r from-zinc-800 to-zinc-800 border-slate-600/50 text-white"
                : "bg-slate-800 border-slate-600 text-white"
              }`}>
                {m.kind === "chat" && <div className="text-xs text-white font-semibold mb-0.5">{m.author_name}</div>}
                <div className="whitespace-pre-wrap">{m.body}</div>
                <div className="text-[10px] opacity-60 mt-1">{nlDate(m.created_at)}</div>
                {isHoofd && (
                  <button onClick={() => del(m.id)} className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 bg-red-900 hover:bg-red-800 rounded text-white transition">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="border-t border-slate-600 p-3 flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
            placeholder="Typ een bericht voor het team..." className={inputCls} />
          <button onClick={send} className={btnPrimary}><Send className="h-4 w-4" /></button>
        </div>
      </Card>
    </div>
  );
}

// -------- Settings (own profile) --------
function SettingsPanel({ me, setMe, setAvatarUrl }: any) {
  const [name, setName] = useState(me.display_name);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pass, setPass] = useState("");
  const [passMsg, setPassMsg] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      let avatarPath = me.avatar_url;
      if (file) {
        const path = `${me.user_id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
        const { error } = await supabase.storage.from("onderwereld-avatars").upload(path, file);
        if (error) throw error;
        avatarPath = path;
      }
      const { error } = await supabase.from("ow_profiles").update({ display_name: name.trim(), avatar_url: avatarPath }).eq("user_id", me.user_id);
      if (error) throw error;
      const updated = { ...me, display_name: name.trim(), avatar_url: avatarPath };
      setMe(updated);
      setAvatarUrl(await signed("onderwereld-avatars", avatarPath));
      setMsg("Opgeslagen!"); setFile(null);
    } catch (e: any) { setMsg("Fout: " + e.message); } finally { setBusy(false); }
  };

  const changePass = async () => {
    if (pass.length < 6) { setPassMsg("Wachtwoord moet minimaal 6 tekens zijn."); return; }
    const { error } = await supabase.auth.updateUser({ password: pass });
    setPassMsg(error ? error.message : "Wachtwoord gewijzigd!");
    setPass("");
  };

  return (
    <div className="max-w-xl">
      <SectionTitle sub="Pas je naam, profielfoto en wachtwoord aan.">Mijn account</SectionTitle>
      <Card className="p-6 mb-6">
        {msg && <div className="mb-4 p-3 bg-slate-800 border border-slate-600 rounded text-slate-200 text-sm">{msg}</div>}
        <div className="space-y-4">
          <div><Label>Weergavenaam</Label><input value={name} onChange={e => setName(e.target.value)} className={inputCls} /></div>
          <div>
            <Label>Profielfoto</Label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-black file:font-bold hover:file:bg-zinc-300 file:cursor-pointer" />
          </div>
          <button onClick={save} disabled={busy} className={btnPrimary}>{busy ? "Opslaan..." : "Opslaan"}</button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-white font-semibold mb-4">Wachtwoord wijzigen</h3>
        {passMsg && <div className="mb-4 p-3 bg-slate-800 border border-slate-600 rounded text-slate-200 text-sm">{passMsg}</div>}
        <div className="flex gap-2">
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Nieuw wachtwoord" className={inputCls} />
          <button onClick={changePass} className={btnPrimary}>Wijzigen</button>
        </div>
      </Card>
    </div>
  );
}

// -------- Accounts (hoofd) --------
function AccountsPanel({ meUid }: any) {
  const [accs, setAccs] = useState<{ user_id: string; display_name: string; role: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [login, setLogin] = useState("");
  const [dn, setDn] = useState("");
  const [role, setRole] = useState<Role>("onderwereld_proef");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<any>(null);

  const load = async () => {
    const { data: profs } = await supabase.from("ow_profiles").select("user_id, display_name");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("role", ["onderwereld_proef", "onderwereld_coordinator", "onderwereld_hoofd"] as any);
    const map: Record<string, string> = {}; (roles || []).forEach((r: any) => {
      // Keep highest
      const rank = r.role === "onderwereld_hoofd" ? 3 : r.role === "onderwereld_coordinator" ? 2 : 1;
      const cur = map[r.user_id];
      const curRank = cur === "onderwereld_hoofd" ? 3 : cur === "onderwereld_coordinator" ? 2 : cur === "onderwereld_proef" ? 1 : 0;
      if (rank > curRank) map[r.user_id] = r.role;
    });
    setAccs((profs || []).filter((p: any) => map[p.user_id]).map((p: any) => ({ ...p, role: map[p.user_id] })));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ow-create-account", { body: { login_username: login, display_name: dn, role } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setMsg({ ok: true, temp_password: (data as any).temp_password, email: (data as any).email });
      setLogin(""); setDn(""); setShowForm(false); load();
    } catch (e: any) { setMsg({ err: e.message }); } finally { setBusy(false); }
  };

  const del = async (user_id: string) => {
    if (!confirm("Account verwijderen?")) return;
    const { error } = await supabase.functions.invoke("ow-delete-account", { body: { user_id } });
    if (error) alert(error.message); load();
  };

  const roleLabel = (r: string) => r === "onderwereld_hoofd" ? "Hoofd" : r === "onderwereld_coordinator" ? "Coordinator" : "Proef";

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <SectionTitle sub="Alleen Hoofd Coordinatoren kunnen accounts beheren.">Accounts</SectionTitle>
        <button onClick={() => setShowForm(!showForm)} className={btnPrimary}>{showForm ? "Sluiten" : "+ Nieuw account"}</button>
      </div>

      {msg?.err && <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded text-red-200 text-sm">{msg.err}</div>}
      {msg?.ok && (
        <Card className="p-4 mb-4 border-green-500/40 bg-green-950/30">
          <div className="text-green-200 text-sm mb-2">Account aangemaakt! Deel deze gegevens met de gebruiker:</div>
          <div className="text-xs text-green-100 font-mono flex items-center gap-2">
            {msg.email} / <span className="bg-[#050a14]/60 px-2 py-1 rounded">{msg.temp_password}</span>
            <button onClick={() => navigator.clipboard.writeText(msg.temp_password)} className={btnGhost + " !py-1 !text-xs"}><Copy className="h-3 w-3" /></button>
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={create} className="space-y-4">
            <div><Label>Gebruikersnaam (login)</Label><input required value={login} onChange={e => setLogin(e.target.value)} className={inputCls} placeholder="bijv. mees" /></div>
            <div><Label>Weergavenaam</Label><input required value={dn} onChange={e => setDn(e.target.value)} className={inputCls} placeholder="Mees" /></div>
            <div>
              <Label>Rol</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["onderwereld_proef", "onderwereld_coordinator", "onderwereld_hoofd"] as Role[]).map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`py-2.5 rounded-lg border text-sm ${role === r ? "bg-zinc-300 text-black border-zinc-100 font-bold" : "bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400"}`}>
                    {roleLabel(r)}
                  </button>
                ))}
              </div>
            </div>
            <button disabled={busy} className={btnPrimary}>{busy ? "Aanmaken..." : "Account aanmaken"}</button>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-slate-400 border-b border-slate-600">
            <tr><th className="text-left px-4 py-3">Naam</th><th className="text-left px-4 py-3">Rol</th><th></th></tr>
          </thead>
          <tbody>
            {accs.map(a => (
              <tr key={a.user_id} className="border-b border-slate-700 hover:bg-slate-700/40">
                <td className="px-4 py-3 text-white">{a.display_name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    a.role === "onderwereld_hoofd" ? "bg-slate-700 text-white border border-slate-500"
                    : a.role === "onderwereld_coordinator" ? "bg-slate-700 text-zinc-200 border border-slate-500"
                    : "bg-slate-700 text-slate-200 border border-slate-500"
                  }`}>{roleLabel(a.role)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {a.user_id !== meUid && <button onClick={() => del(a.user_id)} className={btnDanger}><Trash2 className="h-3.5 w-3.5" /> Verwijderen</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
