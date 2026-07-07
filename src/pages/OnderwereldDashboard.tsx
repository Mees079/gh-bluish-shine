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
    return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-100">Laden...</div>;
  }

  const roleLabel = role === "onderwereld_hoofd" ? "Hoofd Coordinator" : role === "onderwereld_coordinator" ? "Coordinator" : "Proef Coordinator";
  const isHoofd = role === "onderwereld_hoofd";
  const isCoord = role === "onderwereld_coordinator" || isHoofd;

  const openGangDetail = (id: string) => { setSelectedGang(id); setNav("gang-detail"); };

  const NavItem = ({ k, icon: I, label, indent = false }: any) => (
    <button
      onClick={() => setNav(k)}
      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
        nav === k ? "bg-gradient-to-r from-white/10 to-transparent border-l-2 border-zinc-100 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
      } ${indent ? "pl-8 text-xs" : ""}`}
    >
      <I className={`h-4 w-4 ${nav === k ? "text-zinc-100" : "text-zinc-500"}`} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'><g fill='none' stroke='%23d4af37' stroke-width='0.8'><path d='M20 90 L45 78 L65 84 L72 70 L79 84 L100 78 L160 90 L100 102 L79 96 L72 110 L65 96 L45 102 Z'/><circle cx='90' cy='30' r='10'/><text x='84' y='35' font-family='serif' fill='%23d4af37' font-size='12'>$</text><rect x='30' y='135' width='45' height='27' rx='3'/><line x1='30' y1='148' x2='75' y2='148'/><path d='M120 130 L165 130 L165 162 L120 162 Z M126 138 L159 138 M126 145 L159 145 M126 152 L159 152'/><path d='M30 30 L38 26 L46 30 L38 34 Z' stroke-width='1.2'/></g></svg>")`,
      }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(212,175,55,0.06)_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(139,0,0,0.08)_0%,_transparent_50%)] pointer-events-none" />

      {/* Sidebar */}
      <aside className="relative w-72 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800 flex flex-col z-10">
        <div className="p-5 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-300 to-red-900 flex items-center justify-center">
              <Skull className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="text-white font-bold tracking-tight">Onderwereld</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">HDRP</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavItem k="overview" icon={LayoutDashboard} label="Overzicht" />

          <button onClick={() => setGangsOpen(!gangsOpen)} className="w-full flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300">
            <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Gangs</span>
            {gangsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          {gangsOpen && <>
            <NavItem k="gangs" icon={Users} label="Alle gangs" indent />
            {isHoofd && <NavItem k="gang-new" icon={Plus} label="Nieuwe gang" indent />}
          </>}

          <button onClick={() => setPointsOpen(!pointsOpen)} className="w-full flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300 mt-2">
            <span className="flex items-center gap-2"><ScrollText className="h-3.5 w-3.5" /> Punten</span>
            {pointsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          {pointsOpen && <>
            <NavItem k="points-new" icon={Plus} label="Punten invoeren" indent />
            <NavItem k="points-recent" icon={ScrollText} label="Recent toegevoegd" indent />
          </>}

          <div className="pt-2" />
          <NavItem k="boosts" icon={Zap} label="Boosts" />
          <NavItem k="warnings" icon={AlertTriangle} label="Waarschuwingen" />
          <NavItem k="inbox" icon={Inbox} label="Inbox & chat" />

          <div className="pt-3 mt-3 border-t border-zinc-900" />
          <NavItem k="settings" icon={UserCircle} label="Mijn account" />
          {isHoofd && <NavItem k="accounts" icon={ShieldAlert} label="Accounts beheren" />}
        </nav>

        <div className="p-4 border-t border-zinc-900 flex items-center gap-3">
          {avatarUrl
            ? <img src={avatarUrl} className="w-9 h-9 rounded-full object-cover border border-zinc-700" alt="" />
            : <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-100 font-bold">{me.display_name[0]?.toUpperCase()}</div>}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{me.display_name}</div>
            <div className="text-xs text-zinc-400 truncate">{roleLabel}</div>
          </div>
          <button onClick={handleLogout} className="p-2 rounded hover:bg-red-900/30 text-zinc-500 hover:text-red-400" title="Uitloggen">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 relative z-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
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
      </main>
    </div>
  );
};

export default OnderwereldDashboard;

// =============================================================
// PANELS
// =============================================================

function Card({ children, className = "" }: any) {
  return <div className={`bg-zinc-950/80 backdrop-blur border border-zinc-800/60 rounded-xl ${className}`}>{children}</div>;
}
function SectionTitle({ children, sub }: any) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">{children}</h2>
      {sub && <p className="text-sm text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}
function Label({ children }: any) { return <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">{children}</label>; }
const inputCls = "w-full bg-black/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700 placeholder-zinc-700";
const btnPrimary = "bg-gradient-to-r from-zinc-800 to-zinc-200 hover:from-zinc-300 hover:to-white text-black font-bold px-5 py-2.5 rounded-lg text-sm uppercase tracking-wider transition-all disabled:opacity-40";
const btnGhost = "border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-all";
const btnDanger = "border border-red-900/60 hover:bg-red-900/30 text-red-400 px-3 py-1.5 rounded-lg text-xs transition-all inline-flex items-center gap-1.5";

function LevelBadge({ level }: { level: number }) {
  const stars = "★".repeat(level);
  const colors = ["text-zinc-500", "text-zinc-800", "text-zinc-300", "text-zinc-100", "text-zinc-100", "text-orange-400", "text-red-500"];
  return <span className={`text-sm font-bold ${colors[level] || "text-zinc-100"}`}>LVL {level} <span className="text-xs">{stars}</span></span>;
}

function ProgressBar({ current, target, level }: { current: number; target: number; level: number }) {
  const info = nextLevelInfo(level, current);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{current} pt</span>
        <span className="text-zinc-500">{info.next ? `${info.needed} nodig voor LVL ${info.next}` : "MAX LEVEL"}</span>
      </div>
      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
        <div className="h-full bg-gradient-to-r from-zinc-300 via-white to-red-500 transition-all" style={{ width: `${info.progress}%` }} />
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
    <div>
      <div className="mb-8">
        <p className="text-zinc-100 text-sm uppercase tracking-widest mb-1">{roleLabel}</p>
        <h1 className="text-4xl font-bold text-white">Welkom {me.display_name}</h1>
        <p className="text-zinc-400 mt-2">Overzicht van gang-activiteit binnen HDRP. Hieronder zie je wat er speelt.</p>
      </div>

      {stats.activeBoost && (
        <Card className="p-4 mb-6 border-zinc-700 bg-gradient-to-r from-zinc-900/60 to-zinc-900/40">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-white" />
            <div className="flex-1">
              <div className="text-white font-bold">Actieve boost: x{stats.activeBoost.multiplier}</div>
              <div className="text-xs text-zinc-100/80">Loopt tot {nlDate(stats.activeBoost.ends_at)}</div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Gangs", value: stats.gangs, icon: Users, tint: "text-zinc-100" },
          { label: "Punten deze week", value: stats.weekPoints, icon: ScrollText, tint: "text-zinc-100" },
          { label: "Actieve warns", value: stats.activeWarns, icon: AlertTriangle, tint: "text-orange-400" },
          { label: "Spoedmeldingen", value: stats.urgent, icon: ShieldAlert, tint: "text-red-500" },
        ].map((s, i) => (
          <Card key={i} className="p-5">
            <s.icon className={`h-5 w-5 ${s.tint} mb-3`} />
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Crown className="h-4 w-4 text-zinc-100" /> Top gangs</h3>
          {topGangs.length === 0 && <p className="text-zinc-500 text-sm">Nog geen gangs.</p>}
          <div className="space-y-3">
            {topGangs.map((g) => (
              <button key={g.id} onClick={() => onGang(g.id)} className="w-full text-left hover:bg-zinc-900/60 p-2 rounded-lg transition">
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
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Inbox className="h-4 w-4 text-zinc-100" /> Recente meldingen</h3>
          {recentInbox.length === 0 && <p className="text-zinc-500 text-sm">Nog geen berichten.</p>}
          <div className="space-y-3">
            {recentInbox.map((m) => (
              <div key={m.id} className={`p-3 rounded-lg text-sm border ${
                m.kind === "urgent" ? "bg-red-950/40 border-red-500/40 text-red-100"
                : m.kind === "system" ? "bg-zinc-900/60 border-zinc-800 text-zinc-300"
                : "bg-zinc-900/60 border-zinc-800 text-white"
              }`}>
                <div className="text-xs text-zinc-500 mb-1">{m.author_name || "Systeem"} · {nlDate(m.created_at)}</div>
                {m.body}
              </div>
            ))}
          </div>
          <button onClick={() => onNav("inbox")} className={`${btnGhost} w-full mt-4`}>Volledige inbox</button>
        </Card>
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
      {loading ? <p className="text-zinc-500">Laden...</p> : gangs.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Nog geen gangs aangemaakt.</p>
          {isHoofd && <p className="text-zinc-600 text-sm mt-1">Ga naar "Nieuwe gang" om er één toe te voegen.</p>}
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {gangs.map((g) => (
            <button key={g.id} onClick={() => onOpen(g.id)} className="text-left">
              <Card className="p-5 hover:border-zinc-600 transition group">
                <div className="flex items-center gap-4 mb-4">
                  {g.logoSigned
                    ? <img src={g.logoSigned} className="w-14 h-14 rounded-lg object-cover border border-zinc-800" alt="" />
                    : <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-300">{g.name[0]?.toUpperCase()}</div>}
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
                  className={`py-2 rounded-lg border text-sm font-bold ${level === n ? "bg-zinc-300 text-black border-zinc-100" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"}`}>
                  LVL {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">Punten worden gezet op de startdrempel van dit level ({LEVEL_THRESHOLDS[level - 1]} pt).</p>
          </div>
          <div>
            <Label>Logo (optioneel)</Label>
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-black file:font-bold hover:file:bg-zinc-300 file:cursor-pointer" />
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

  if (!gang) return <p className="text-zinc-500">Laden...</p>;

  return (
    <div>
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-5">
          {gang.logoSigned
            ? <img src={gang.logoSigned} className="w-24 h-24 rounded-xl object-cover border border-zinc-800" alt="" />
            : <div className="w-24 h-24 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl font-bold text-zinc-300">{gang.name[0]?.toUpperCase()}</div>}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-sm text-zinc-400" />
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
                <p className="text-zinc-500 text-sm mt-1">Aangemaakt {nlDateOnly(gang.created_at)}</p>
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
          {entries.length === 0 ? <p className="text-zinc-500 text-sm">Nog geen punten ingevoerd.</p> : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/60 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium">{scenarios[e.scenario_key]?.label || e.scenario_key}</div>
                    <div className="text-xs text-zinc-500">
                      {nlDate(e.scenario_time)} · door {e.entered_by_name || "?"}
                      <a href={e.clip_url} target="_blank" rel="noreferrer" className="ml-2 text-zinc-100 hover:underline">Clip →</a>
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
          {warns.length === 0 ? <p className="text-zinc-500 text-sm">Geen waarschuwingen.</p> : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {warns.map((w) => (
                <div key={w.id} className={`p-3 rounded-lg border text-xs ${
                  w.resolved_at ? "bg-zinc-900/40 border-zinc-800 text-zinc-500 line-through"
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
                    scenario === s.key ? "bg-zinc-900/60 border-zinc-300 text-white" : "bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                  }`}>
                  <span>{s.label}</span>
                  <span className="font-bold text-zinc-100">{s.base_points} pt</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Clip (link)</Label>
            <input required type="url" value={clip} onChange={(e) => setClip(e.target.value)} className={inputCls} placeholder="https://..." />
          </div>

          {selectedScenario && (
            <Card className={`p-4 border ${activeBoost ? "border-zinc-100/60 bg-zinc-900/60" : "border-zinc-800"}`}>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Punten die worden toegekend</span>
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
        {rows.length === 0 ? <p className="p-6 text-zinc-500 text-sm">Nog niks ingevoerd.</p> : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-zinc-500 border-b border-zinc-800">
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
                <tr key={r.id} className="border-b border-zinc-900 hover:bg-zinc-900/40">
                  <td className="px-4 py-3 text-white">{r.gang}</td>
                  <td className="px-4 py-3 text-zinc-300">{scenarios[r.scenario_key]?.label || r.scenario_key}</td>
                  <td className="px-4 py-3 text-zinc-400">{nlDate(r.scenario_time)}</td>
                  <td className="px-4 py-3"><a href={r.clip_url} target="_blank" rel="noreferrer" className="text-zinc-100 hover:underline">Bekijk →</a></td>
                  <td className="px-4 py-3 text-zinc-400">{r.entered_by_name || "?"}</td>
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
            <div key={b.id} className="flex items-center justify-between py-2 border-t border-zinc-800 first:border-t-0">
              <div>
                <div className="text-white text-xl font-bold">x{b.multiplier}</div>
                <div className="text-xs text-zinc-100">Loopt tot {nlDate(b.ends_at)} · door {b.created_by_name}</div>
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
                  className={`py-3 rounded-lg border font-bold text-lg ${mult === n ? "bg-zinc-300 text-black border-zinc-100" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"}`}>x{n}</button>
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
            <div key={b.id} className="flex items-center justify-between py-2 border-t border-zinc-800 first:border-t-0 text-sm">
              <div><span className="text-white font-bold">x{b.multiplier}</span> <span className="text-zinc-500">· {nlDate(b.starts_at)} → {nlDate(b.ends_at)}</span></div>
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
              <div key={b.id} className="flex justify-between py-1.5 border-t border-zinc-900 first:border-t-0 text-zinc-500">
                <span>x{b.multiplier} · {nlDate(b.starts_at)}</span>
                <span className="text-zinc-600">{b.created_by_name}</span>
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
      {active.length === 0 ? <Card className="p-6 text-center text-zinc-500 text-sm mb-6">Geen actieve waarschuwingen.</Card> : (
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
                  <p className="text-zinc-300 text-sm">{w.reason}</p>
                  <p className="text-xs text-zinc-500 mt-1">{nlDate(w.created_at)} · door {w.issued_by_name}</p>
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
          <div key={w.id} className="p-3 rounded-lg border border-zinc-900 bg-zinc-950/50 text-sm text-zinc-500 flex justify-between">
            <span><span className="text-zinc-400">{w.gangName}</span> · {w.reason}</span>
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
                : m.kind === "system" ? "bg-zinc-900/70 border-zinc-800 text-zinc-300"
                : m.author_id === uid ? "bg-gradient-to-r from-zinc-800 to-zinc-800 border-zinc-800/50 text-white"
                : "bg-zinc-900 border-zinc-800 text-zinc-100"
              }`}>
                {m.kind === "chat" && <div className="text-xs text-zinc-100 font-semibold mb-0.5">{m.author_name}</div>}
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
        <div className="border-t border-zinc-800 p-3 flex gap-2">
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
        {msg && <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 text-sm">{msg}</div>}
        <div className="space-y-4">
          <div><Label>Weergavenaam</Label><input value={name} onChange={e => setName(e.target.value)} className={inputCls} /></div>
          <div>
            <Label>Profielfoto</Label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-black file:font-bold hover:file:bg-zinc-300 file:cursor-pointer" />
          </div>
          <button onClick={save} disabled={busy} className={btnPrimary}>{busy ? "Opslaan..." : "Opslaan"}</button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-white font-semibold mb-4">Wachtwoord wijzigen</h3>
        {passMsg && <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 text-sm">{passMsg}</div>}
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
            {msg.email} / <span className="bg-black/60 px-2 py-1 rounded">{msg.temp_password}</span>
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
                    className={`py-2.5 rounded-lg border text-sm ${role === r ? "bg-zinc-300 text-black border-zinc-100 font-bold" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"}`}>
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
          <thead className="text-xs uppercase text-zinc-500 border-b border-zinc-800">
            <tr><th className="text-left px-4 py-3">Naam</th><th className="text-left px-4 py-3">Rol</th><th></th></tr>
          </thead>
          <tbody>
            {accs.map(a => (
              <tr key={a.user_id} className="border-b border-zinc-900 hover:bg-zinc-900/40">
                <td className="px-4 py-3 text-white">{a.display_name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    a.role === "onderwereld_hoofd" ? "bg-zinc-800 text-white border border-zinc-700"
                    : a.role === "onderwereld_coordinator" ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                    : "bg-zinc-800 text-zinc-300 border border-zinc-700"
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
