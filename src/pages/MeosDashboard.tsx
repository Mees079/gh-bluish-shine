import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, Search, FileText, Gavel, MapPin, Users, BookOpen, LogOut, KeyRound,
  AlertTriangle, Plus, X, Upload, Trash2, Loader2, Bell, Volume2, VolumeX, Check,
} from "lucide-react";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;

type Role = "meos_politie" | "meos_dsi" | "meos_commandant" | "meos_hulpdiensten" | "meos_bestuur";
type Tab = "personen" | "bevelen" | "locaties" | "briefings" | "account" | "beheer";

async function sha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function MeosDashboard() {
  const nav = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tab, setTab] = useState<Tab>("personen");
  const [mustChange, setMustChange] = useState(false);

  const isHigh = roles.some(r => ["meos_dsi", "meos_commandant", "meos_hulpdiensten", "meos_bestuur"].includes(r));
  const isDsi = roles.some(r => ["meos_dsi", "meos_commandant", "meos_hulpdiensten", "meos_bestuur"].includes(r));
  const visibleRank: string = roles.includes("meos_commandant") ? "Commandant"
    : roles.includes("meos_hulpdiensten") ? "Hulpdiensten Coordinatie"
    : roles.includes("meos_bestuur") ? "Bestuur"
    : "Politie"; // DSI hidden

  useEffect(() => {
    document.title = "MEOS - Politie";
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { nav("/meos"); return; }
      setUser(data.session.user);
      const [{ data: prof }, { data: rs }] = await Promise.all([
        supabase.from("meos_profiles").select("*").eq("user_id", data.session.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", data.session.user.id),
      ]);
      if (!prof) { await supabase.auth.signOut(); nav("/meos"); return; }
      setProfile(prof);
      setRoles((rs || []).map((r: any) => r.role).filter((r: string) => r.startsWith("meos_")) as Role[]);
      setMustChange(prof.must_change_password);
    });
  }, [nav]);

  const logout = async () => { await supabase.auth.signOut(); nav("/meos"); };

  if (!user || !profile) {
    return <div className="min-h-screen bg-[#0a1628] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
  }

  if (mustChange) return <ChangePassword onDone={() => setMustChange(false)} />;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <IncidentMonitor isMember={true} />
      {/* Top bar */}
      <header className="bg-gradient-to-r from-[#003d7a] to-[#0055a5] text-white shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#003d7a]" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">MEOS</h1>
              <p className="text-[10px] text-blue-100 uppercase tracking-widest">Politie HDRP</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <div className="font-semibold">{profile.roblox_username}</div>
              <div className="text-[10px] text-blue-100 uppercase tracking-wider">{visibleRank}</div>
            </div>
            <button onClick={logout} className="p-2 hover:bg-white/10 rounded transition" title="Uitloggen">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Tabs */}
        <nav className="max-w-7xl mx-auto flex gap-1 px-6 overflow-x-auto">
          {[
            { id: "personen", label: "Personen", icon: Search },
            { id: "bevelen", label: "Aanhoudingsbevelen", icon: Gavel },
            { id: "locaties", label: "Locaties", icon: MapPin },
            { id: "briefings", label: "Briefings", icon: BookOpen },
            { id: "account", label: "Mijn Account", icon: KeyRound },
            ...(isHigh ? [{ id: "beheer", label: "Beheer", icon: Users }] : []),
          ].map(t => {
            const Icon = t.icon as any;
            return (
              <button key={t.id} onClick={() => setTab(t.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.id ? "border-white text-white" : "border-transparent text-blue-100 hover:text-white hover:border-white/50"}`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {tab === "personen" && <PersonenTab isHigh={isHigh} username={profile.roblox_username} />}
        {tab === "bevelen" && <BevelenTab isHigh={isHigh} />}
        {tab === "locaties" && <LocatiesTab isHigh={isHigh} />}
        {tab === "briefings" && <BriefingsTab canEdit={isDsi} />}
        {tab === "account" && <AccountTab />}
        {tab === "beheer" && isHigh && <BeheerTab />}
      </main>
    </div>
  );
}

/* ============== INCIDENT MONITOR (audio alarm) ============== */
function IncidentMonitor({ isMember }: { isMember: boolean }) {
  const [active, setActive] = useState<any[]>([]);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<{ ctx?: AudioContext; interval?: any }>({});

  useEffect(() => {
    if (!isMember) return;
    const load = async () => {
      const { data } = await supabase.from("meos_incidents").select("*").eq("status", "active").order("started_at", { ascending: false });
      setActive(data || []);
    };
    load();
    const ch = supabase.channel("meos-incidents").on("postgres_changes", { event: "*", schema: "public", table: "meos_incidents" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isMember]);

  useEffect(() => {
    if (active.length > 0 && !muted) {
      if (!audioRef.current.ctx) audioRef.current.ctx = new AudioContext();
      const beep = () => {
        const ctx = audioRef.current.ctx!;
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "square"; osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      };
      beep();
      audioRef.current.interval = setInterval(beep, 1500);
    }
    return () => { if (audioRef.current.interval) clearInterval(audioRef.current.interval); };
  }, [active.length, muted]);

  const resolve = async (id: string, locId: string) => {
    await supabase.from("meos_incidents").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", id);
    if (locId) await supabase.from("meos_locations").update({ status: "intact" }).eq("id", locId);
  };

  if (active.length === 0) return null;
  return (
    <div className="bg-red-600 text-white animate-pulse-slow border-b-4 border-red-800">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 animate-bounce" />
          <div>
            <div className="font-bold uppercase tracking-wide text-sm">⚠ NOODOPROEP — {active.length} actieve incident{active.length > 1 ? "en" : ""}</div>
            <div className="text-xs text-red-100">{active.map(a => a.location_name).join(" • ")}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMuted(!muted)} className="p-2 bg-red-700 hover:bg-red-800 rounded" title={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {active.map(a => (
            <button key={a.id} onClick={() => resolve(a.id, a.location_id)} className="px-3 py-1.5 bg-white text-red-700 text-xs font-bold rounded hover:bg-red-50">
              {a.location_name} → Veilig
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============== PERSONEN TAB ============== */
function PersonenTab({ isHigh, username }: { isHigh: boolean; username: string }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [person, setPerson] = useState<any>(null);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<any[]>([]);
  const [arrests, setArrests] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState<"note" | "arrest" | "warrant" | null>(null);

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!search.trim()) return;
    setLoading(true); setError(""); setPerson(null);
    try {
      const r = await fetch(`${FN_URL}/meos-roblox-avatar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: search.trim() }),
      });
      const j = await r.json();
      if (!r.ok) { setError(j.error || "Niet gevonden"); setLoading(false); return; }

      const { data: existing } = await supabase.from("meos_persons").select("*").ilike("roblox_username", j.name).maybeSingle();
      let p: any;
      if (existing) {
        await supabase.from("meos_persons").update({ avatar_url: j.avatar_url, roblox_user_id: j.id, updated_at: new Date().toISOString() }).eq("id", existing.id);
        p = { ...existing, avatar_url: j.avatar_url, roblox_user_id: j.id, displayName: j.displayName };
      } else {
        const { data: created } = await supabase.from("meos_persons").insert({ roblox_username: j.name, roblox_user_id: j.id, avatar_url: j.avatar_url }).select().single();
        p = { ...created, displayName: j.displayName };
      }
      setPerson(p);
      await loadRecords(p.id);
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  const loadRecords = async (pid: string) => {
    const [{ data: n }, { data: a }] = await Promise.all([
      supabase.from("meos_notes").select("*").eq("person_id", pid).order("created_at", { ascending: false }),
      supabase.from("meos_arrests").select("*").eq("person_id", pid).order("created_at", { ascending: false }),
    ]);
    setNotes(n || []); setArrests(a || []);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={lookup} className="bg-white rounded-lg shadow border p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Zoek Roblox gebruikersnaam..."
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#0055a5]" />
        </div>
        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#003d7a] text-white rounded font-semibold hover:bg-[#002a55] disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Opzoeken"}
        </button>
      </form>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-800">{error}</div>}

      {person && (
        <>
          <div className="bg-white rounded-lg shadow border p-6 flex items-center gap-6">
            {person.avatar_url && <img src={person.avatar_url} alt="" className="w-32 h-32 rounded-lg border-4 border-[#003d7a] bg-gray-100" />}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{person.roblox_username}</h2>
              {person.displayName && person.displayName !== person.roblox_username && <p className="text-sm text-gray-500">@{person.displayName}</p>}
              <div className="mt-3 flex gap-4 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-semibold">{notes.length} aantekeningen</span>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded font-semibold">{arrests.length} aanhoudingen</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setShowAdd("note")} className="px-4 py-2 bg-[#0055a5] text-white text-sm rounded font-semibold hover:bg-[#003d7a] flex items-center gap-2">
                <Plus className="w-4 h-4" /> Aantekening
              </button>
              <button onClick={() => setShowAdd("arrest")} className="px-4 py-2 bg-red-600 text-white text-sm rounded font-semibold hover:bg-red-700 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Aanhouding
              </button>
              <button onClick={() => setShowAdd("warrant")} className="px-4 py-2 bg-amber-600 text-white text-sm rounded font-semibold hover:bg-amber-700 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Aanhoudingsbevel
              </button>
            </div>
          </div>

          <RecordList title="Aantekeningen" records={notes} type="note" isHigh={isHigh} username={username} onChanged={() => loadRecords(person.id)} />
          <RecordList title="Aanhoudingen" records={arrests} type="arrest" isHigh={isHigh} username={username} onChanged={() => loadRecords(person.id)} />
        </>
      )}

      {showAdd && person && (
        <AddRecordModal type={showAdd} person={person} username={username}
          onClose={() => setShowAdd(null)}
          onSaved={() => { setShowAdd(null); loadRecords(person.id); }} />
      )}
    </div>
  );
}

/* ============== RECORD LIST ============== */
function RecordList({ title, records, type, isHigh, username, onChanged }: any) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  if (records.length === 0) return (
    <div className="bg-white rounded-lg shadow border p-6">
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">Geen {title.toLowerCase()} geregistreerd.</p>
    </div>
  );
  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        {type === "note" ? <FileText className="w-4 h-4" /> : <Gavel className="w-4 h-4" />} {title}
      </h3>
      <div className="space-y-3">
        {records.map((r: any) => (
          <div key={r.id} className="border border-gray-200 rounded p-4 flex gap-4">
            {isHigh && r.photo_path && <PhotoView path={r.photo_path} />}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-500">
                  Door <span className="font-semibold text-gray-700">{r.author_username || "—"}</span> • {new Date(r.created_at).toLocaleString("nl-NL")}
                </div>
                {r.ai_verified && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">✓ AI gecontroleerd</span>}
              </div>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">{r.content || r.reason}</div>
              {r.charges && <div className="text-xs text-gray-600 mt-1">Aanklacht: {r.charges}</div>}
              {!isHigh && <div className="text-[10px] text-gray-400 mt-2 italic">Foto alleen zichtbaar voor hogere rangen</div>}
            </div>
            <button onClick={() => setDeletingId(r.id)} className="self-start text-red-600 hover:bg-red-50 p-1 rounded" title="Verwijderen">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      {deletingId && <DeleteWithProofModal type={type} recordId={deletingId} username={username} onClose={() => setDeletingId(null)} onDeleted={() => { setDeletingId(null); onChanged(); }} />}
    </div>
  );
}

function PhotoView({ path }: { path: string }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    supabase.storage.from("meos-photos").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl || ""));
  }, [path]);
  if (!url) return <div className="w-24 h-24 bg-gray-100 animate-pulse rounded" />;
  return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="" className="w-24 h-24 object-cover rounded border border-gray-300 hover:border-[#0055a5]" /></a>;
}

/* ============== ADD RECORD MODAL ============== */
function AddRecordModal({ type, person, username, onClose, onSaved }: any) {
  const [content, setContent] = useState("");
  const [charges, setCharges] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aiResult, setAiResult] = useState<{ found: boolean; reason: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setAiResult(null);
    if (!file) { setError("Foto vereist"); return; }
    if (!content.trim()) { setError("Uitleg vereist"); return; }
    setBusy(true);
    try {
      // Hash check
      const hash = await sha256(file);
      const tableName = type === "note" ? "meos_notes" : type === "arrest" ? "meos_arrests" : "meos_warrants";
      const { data: dup } = await supabase.from(tableName).select("id").eq("photo_hash", hash).maybeSingle();
      if (dup) { setError("Deze foto is al eerder gebruikt. Upload een nieuwe screenshot."); setBusy(false); return; }

      // AI verify
      const b64 = await fileToBase64(file);
      const { data: { session } } = await supabase.auth.getSession();
      const ai = await fetch(`${FN_URL}/meos-verify-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ image_base64: b64, expected_username: person.roblox_username }),
      });
      const aiJ = await ai.json();
      setAiResult(aiJ);
      if (!aiJ.found) { setError(`AI kon de username niet vinden: ${aiJ.reason}. Upload een TAB-screenshot waar "${person.roblox_username}" duidelijk op staat.`); setBusy(false); return; }

      // Upload
      const path = `${person.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("meos-photos").upload(path, file);
      if (upErr) { setError(upErr.message); setBusy(false); return; }

      const { data: { user } } = await supabase.auth.getUser();
      const base: any = {
        person_id: person.id,
        author_id: user!.id,
        author_username: username,
        photo_path: path,
        photo_hash: hash,
        ai_verified: true,
      };
      if (type === "note") { base.content = content; }
      else if (type === "arrest") { base.reason = content; base.charges = charges || null; }
      else { base.reason = content; base.status = "open"; }

      const { error: insErr } = await supabase.from(tableName).insert(base);
      if (insErr) { setError(insErr.message); setBusy(false); return; }
      onSaved();
    } catch (err: any) { setError(err.message); }
    setBusy(false);
  };

  const title = type === "note" ? "Aantekening" : type === "arrest" ? "Aanhouding" : "Aanhoudingsbevel";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="bg-[#003d7a] text-white px-5 py-3 flex items-center justify-between sticky top-0">
          <h3 className="font-bold">Nieuwe {title} — {person.roblox_username}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 text-xs text-blue-900">
            <strong>Foto vereist:</strong> upload een screenshot waarop je in-game op TAB hebt geklikt zodat de username <code className="bg-white px-1">{person.roblox_username}</code> duidelijk zichtbaar is. AI controleert dit automatisch.
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-700">{type === "note" ? "Aantekening" : "Reden"}</label>
            <textarea required rows={3} value={content} onChange={e => setContent(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0055a5]" />
          </div>
          {type === "arrest" && (
            <div>
              <label className="text-xs font-bold uppercase text-gray-700">Aanklacht (optioneel)</label>
              <input type="text" value={charges} onChange={e => setCharges(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0055a5]" />
            </div>
          )}
          <div>
            <label className="text-xs font-bold uppercase text-gray-700">TAB Screenshot</label>
            <input type="file" accept="image/*" required onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full mt-1 text-sm" />
            {file && <div className="mt-2 text-xs text-gray-600">{file.name} ({(file.size / 1024).toFixed(0)} KB)</div>}
          </div>
          {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-800">{error}</div>}
          {aiResult?.found && <div className="bg-green-50 border-l-4 border-green-500 p-3 text-sm text-green-800">✓ AI verificatie geslaagd</div>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Annuleren</button>
            <button type="submit" disabled={busy} className="px-4 py-2 text-sm bg-[#003d7a] text-white rounded font-semibold hover:bg-[#002a55] disabled:opacity-50 flex items-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============== DELETE WITH PROOF ============== */
function DeleteWithProofModal({ type, recordId, username, onClose, onDeleted }: any) {
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !file) { setError("Foto en uitleg vereist"); return; }
    setBusy(true);
    try {
      const path = `deletions/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      await supabase.storage.from("meos-photos").upload(path, file);
      const { data: { user } } = await supabase.auth.getUser();
      const tableName = type === "note" ? "meos_notes" : type === "arrest" ? "meos_arrests" : "meos_warrants";
      await supabase.from("meos_action_logs").insert({
        action: "delete", target_type: type, target_id: recordId, reason, photo_path: path,
        user_id: user!.id, username,
      });
      await supabase.from(tableName).delete().eq("id", recordId);
      onDeleted();
    } catch (err: any) { setError(err.message); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="bg-red-700 text-white px-5 py-3 flex items-center justify-between">
          <h3 className="font-bold">Verwijderen — bewijs vereist</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-gray-700">Uitleg</label>
            <textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-700">Bewijs Foto</label>
            <input type="file" accept="image/*" required onChange={e => setFile(e.target.files?.[0] || null)} className="w-full mt-1 text-sm" />
          </div>
          {error && <div className="bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded">Annuleren</button>
            <button type="submit" disabled={busy} className="px-4 py-2 text-sm bg-red-700 text-white rounded font-semibold hover:bg-red-800 disabled:opacity-50">
              {busy ? "Bezig..." : "Verwijderen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============== BEVELEN TAB ============== */
function BevelenTab({ isHigh }: { isHigh: boolean }) {
  const [warrants, setWarrants] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("meos_warrants").select("*, meos_persons(roblox_username, avatar_url)").eq("status", "open").order("created_at", { ascending: false });
      setWarrants(data || []);
    };
    load();
    const ch = supabase.channel("warrants").on("postgres_changes", { event: "*", schema: "public", table: "meos_warrants" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const close = async (id: string) => { await supabase.from("meos_warrants").update({ status: "closed" }).eq("id", id); };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
        <h2 className="font-bold text-amber-900 flex items-center gap-2"><Gavel className="w-5 h-5" /> Open Aanhoudingsbevelen</h2>
        <p className="text-sm text-amber-800 mt-1">{warrants.length} actief</p>
      </div>
      {warrants.map(w => (
        <div key={w.id} className="bg-white rounded-lg shadow border p-4 flex gap-4">
          {w.meos_persons?.avatar_url && <img src={w.meos_persons.avatar_url} alt="" className="w-20 h-20 rounded border" />}
          <div className="flex-1">
            <div className="font-bold text-lg">{w.meos_persons?.roblox_username}</div>
            <div className="text-xs text-gray-500">Door {w.author_username} • {new Date(w.created_at).toLocaleString("nl-NL")}</div>
            <div className="text-sm mt-2">{w.reason}</div>
          </div>
          {isHigh && <button onClick={() => close(w.id)} className="self-start px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700">Sluiten</button>}
        </div>
      ))}
      {warrants.length === 0 && <div className="bg-white rounded-lg shadow border p-8 text-center text-gray-500">Geen openstaande bevelen.</div>}
    </div>
  );
}

/* ============== LOCATIES TAB ============== */
function LocatiesTab({ isHigh }: { isHigh: boolean }) {
  const [locs, setLocs] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const load = async () => {
    const { data } = await supabase.from("meos_locations").select("*").eq("active", true).order("name");
    setLocs(data || []);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("locs").on("postgres_changes", { event: "*", schema: "public", table: "meos_locations" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const add = async () => {
    if (!newName.trim()) return;
    await supabase.from("meos_locations").insert({ name: newName.trim() });
    setNewName("");
  };
  const remove = async (id: string) => { await supabase.from("meos_locations").update({ active: false }).eq("id", id); };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow border p-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2"><MapPin className="w-5 h-5" /> Bewaakte Locaties</h2>
        <p className="text-xs text-gray-500 mt-1">Status komt automatisch binnen vanuit Roblox bij overval-meldingen.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {locs.map(l => (
          <div key={l.id} className={`rounded-lg shadow border-2 p-5 ${l.status === "intact" ? "bg-white border-green-500" : "bg-red-50 border-red-500 animate-pulse"}`}>
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-lg">{l.name}</h3>
              {isHigh && <button onClick={() => remove(l.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
            </div>
            <div className={`mt-2 inline-block px-3 py-1 rounded text-xs font-bold uppercase ${l.status === "intact" ? "bg-green-100 text-green-800" : "bg-red-600 text-white"}`}>
              {l.status === "intact" ? "✓ Intact" : "⚠ " + l.status.replace("_", " ")}
            </div>
            {l.last_signal_at && <div className="text-[10px] text-gray-500 mt-2">Laatste signaal: {new Date(l.last_signal_at).toLocaleString("nl-NL")}</div>}
          </div>
        ))}
      </div>
      {isHigh && (
        <div className="bg-white rounded-lg shadow border p-4 flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nieuwe locatie..." className="flex-1 px-3 py-2 border rounded text-sm" />
          <button onClick={add} className="px-4 py-2 bg-[#003d7a] text-white text-sm rounded font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Toevoegen</button>
        </div>
      )}
    </div>
  );
}

/* ============== BRIEFINGS TAB ============== */
function BriefingsTab({ canEdit }: { canEdit: boolean }) {
  const [locs, setLocs] = useState<any[]>([]);
  const [briefings, setBriefings] = useState<Record<string, any>>({});
  const [editingLoc, setEditingLoc] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState(""); const [editContent, setEditContent] = useState("");

  const load = async () => {
    const { data: l } = await supabase.from("meos_locations").select("*").eq("active", true).order("name");
    setLocs(l || []);
    const { data: b } = await supabase.from("meos_scenario_briefings").select("*");
    const map: Record<string, any> = {};
    (b || []).forEach((br: any) => { map[br.location_id] = br; });
    setBriefings(map);
  };
  useEffect(() => { load(); }, []);

  const startEdit = (locId: string) => {
    const ex = briefings[locId];
    setEditTitle(ex?.title || "");
    setEditContent(ex?.content || "");
    setEditingLoc(locId);
  };
  const save = async () => {
    if (!editingLoc) return;
    const { data: { user } } = await supabase.auth.getUser();
    const ex = briefings[editingLoc];
    if (ex) {
      await supabase.from("meos_scenario_briefings").update({ title: editTitle, content: editContent, updated_at: new Date().toISOString() }).eq("id", ex.id);
    } else {
      await supabase.from("meos_scenario_briefings").insert({ location_id: editingLoc, title: editTitle, content: editContent, author_id: user?.id });
    }
    setEditingLoc(null); load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow border p-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Scenario Briefings</h2>
        <p className="text-xs text-gray-500 mt-1">Uitleg per locatie bij overvallen, geschreven door DSI.</p>
      </div>
      {locs.map(l => {
        const b = briefings[l.id];
        return (
          <div key={l.id} className="bg-white rounded-lg shadow border p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{l.name}</h3>
              {canEdit && <button onClick={() => startEdit(l.id)} className="text-xs px-3 py-1 bg-[#003d7a] text-white rounded font-semibold">{b ? "Bewerken" : "+ Briefing"}</button>}
            </div>
            {b ? (
              <>
                <div className="font-semibold text-sm mt-2">{b.title}</div>
                <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{b.content}</div>
              </>
            ) : <div className="text-sm text-gray-400 italic mt-2">Nog geen briefing.</div>}
          </div>
        );
      })}

      {editingLoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="bg-[#003d7a] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold">Briefing</h3>
              <button onClick={() => setEditingLoc(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Titel" className="w-full px-3 py-2 border rounded" />
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={10} placeholder="Uitleg / scenario..." className="w-full px-3 py-2 border rounded text-sm" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingLoc(null)} className="px-4 py-2 text-sm border rounded">Annuleren</button>
                <button onClick={save} className="px-4 py-2 text-sm bg-[#003d7a] text-white rounded font-semibold">Opslaan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============== ACCOUNT TAB ============== */
function AccountTab() {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const change = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(""); setErr("");
    if (pw.length < 6) { setErr("Minimaal 6 tekens"); return; }
    if (pw !== pw2) { setErr("Wachtwoorden komen niet overeen"); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setErr(error.message); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("meos_profiles").update({ must_change_password: false }).eq("user_id", user.id);
    setMsg("Wachtwoord gewijzigd."); setPw(""); setPw2("");
  };
  return (
    <div className="max-w-md bg-white rounded-lg shadow border p-6">
      <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><KeyRound className="w-5 h-5" /> Wachtwoord wijzigen</h2>
      <form onSubmit={change} className="space-y-3">
        <input type="password" placeholder="Nieuw wachtwoord" value={pw} onChange={e => setPw(e.target.value)} className="w-full px-3 py-2 border rounded" />
        <input type="password" placeholder="Bevestig" value={pw2} onChange={e => setPw2(e.target.value)} className="w-full px-3 py-2 border rounded" />
        {err && <div className="text-sm text-red-700">{err}</div>}
        {msg && <div className="text-sm text-green-700">{msg}</div>}
        <button type="submit" className="w-full bg-[#003d7a] text-white py-2 rounded font-semibold">Wijzigen</button>
      </form>
    </div>
  );
}

/* ============== BEHEER TAB ============== */
function BeheerTab() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [robloxName, setRobloxName] = useState("");
  const [extraRoles, setExtraRoles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok?: string; err?: string }>({});
  const [allRoles, setAllRoles] = useState<Record<string, string[]>>({});

  const load = async () => {
    const { data: ps } = await supabase.from("meos_profiles").select("*").order("roblox_username");
    setProfiles(ps || []);
    const { data: rs } = await supabase.from("user_roles").select("user_id, role");
    const m: Record<string, string[]> = {};
    (rs || []).forEach((r: any) => { if (!m[r.user_id]) m[r.user_id] = []; m[r.user_id].push(r.role); });
    setAllRoles(m);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setResult({});
    const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch(`${FN_URL}/meos-create-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
      body: JSON.stringify({ roblox_username: robloxName, extra_roles: extraRoles }),
    });
    const j = await r.json();
    if (!r.ok) setResult({ err: j.error });
    else { setResult({ ok: `Account aangemaakt. Tijdelijk wachtwoord: ${j.temp_password}` }); setRobloxName(""); setExtraRoles([]); load(); }
    setBusy(false);
  };

  const toggleRole = async (uid: string, role: string) => {
    const has = allRoles[uid]?.includes(role);
    if (has) await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role as any);
    else await supabase.from("user_roles").insert({ user_id: uid, role: role as any });
    load();
  };

  const ROLES = [
    { v: "meos_dsi", l: "DSI (verborgen)" },
    { v: "meos_commandant", l: "Commandant" },
    { v: "meos_hulpdiensten", l: "Hulpdiensten Coordinatie" },
    { v: "meos_bestuur", l: "Bestuur" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border p-5">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Plus className="w-5 h-5" /> Nieuw Account</h2>
        <form onSubmit={create} className="space-y-3">
          <input value={robloxName} onChange={e => setRobloxName(e.target.value)} placeholder="Roblox gebruikersnaam" required className="w-full px-3 py-2 border rounded" />
          <div className="flex flex-wrap gap-2">
            {ROLES.map(r => (
              <label key={r.v} className="flex items-center gap-2 text-sm px-3 py-1.5 border rounded cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={extraRoles.includes(r.v)} onChange={e => setExtraRoles(s => e.target.checked ? [...s, r.v] : s.filter(x => x !== r.v))} />
                {r.l}
              </label>
            ))}
          </div>
          <button type="submit" disabled={busy} className="px-4 py-2 bg-[#003d7a] text-white rounded font-semibold disabled:opacity-50">{busy ? "Bezig..." : "Aanmaken"}</button>
          {result.ok && <div className="text-sm text-green-800 bg-green-50 p-3 rounded">{result.ok}</div>}
          {result.err && <div className="text-sm text-red-800 bg-red-50 p-3 rounded">{result.err}</div>}
        </form>
      </div>

      <div className="bg-white rounded-lg shadow border p-5">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Users className="w-5 h-5" /> Accounts ({profiles.length})</h2>
        <div className="space-y-2">
          {profiles.map(p => (
            <div key={p.id} className="border rounded p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{p.roblox_username}</div>
                <div className="text-[10px] text-gray-500 font-mono">{(allRoles[p.user_id] || []).join(", ")}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {ROLES.map(r => (
                  <button key={r.v} onClick={() => toggleRole(p.user_id, r.v)} className={`text-[10px] px-2 py-1 rounded font-semibold ${allRoles[p.user_id]?.includes(r.v) ? "bg-[#003d7a] text-white" : "bg-gray-200 text-gray-700"}`}>
                    {r.l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============== CHANGE PASSWORD GATE ============== */
function ChangePassword({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { setErr("Minimaal 6 tekens"); return; }
    if (pw !== pw2) { setErr("Komen niet overeen"); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setErr(error.message); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("meos_profiles").update({ must_change_password: false }).eq("user_id", user.id);
    onDone();
  };
  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-[#003d7a]" />
          <div><h1 className="font-bold text-lg">Wachtwoord wijzigen</h1><p className="text-xs text-gray-500">Verplicht bij eerste login</p></div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input type="password" placeholder="Nieuw wachtwoord" value={pw} onChange={e => setPw(e.target.value)} className="w-full px-3 py-2 border rounded" />
          <input type="password" placeholder="Bevestig" value={pw2} onChange={e => setPw2(e.target.value)} className="w-full px-3 py-2 border rounded" />
          {err && <div className="text-sm text-red-700">{err}</div>}
          <button className="w-full bg-[#003d7a] text-white py-2 rounded font-semibold">Wijzigen & Doorgaan</button>
        </form>
      </div>
    </div>
  );
}
