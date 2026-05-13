import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, KeyRound, User, ArrowRight } from "lucide-react";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;

export default function MeosLogin() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"login" | "activate">("login");
  const [robloxName, setRobloxName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    document.title = "MEOS - Politie Login";
    // Init super account once
    fetch(`${FN_URL}/meos-init-super`, { method: "POST" }).catch(() => {});
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav("/meos/dashboard");
    });
  }, [nav]);

  const emailFor = (u: string) => `${u.toLowerCase().replace(/[^a-z0-9]/g, "")}@meos.hdrp.local`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailFor(robloxName), password });
    setLoading(false);
    if (error) { setError("Ongeldige inloggegevens"); return; }
    nav("/meos/dashboard");
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    try {
      const r = await fetch(`${FN_URL}/meos-redeem-code`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roblox_username: robloxName, code: code.trim().toUpperCase() }),
      });
      const j = await r.json();
      if (!r.ok) { setError(j.error || "Activatie mislukt"); setLoading(false); return; }
      // Auto login with temp password
      const { error: lErr } = await supabase.auth.signInWithPassword({ email: j.email, password: j.temp_password });
      setLoading(false);
      if (lErr) { setError(lErr.message); return; }
      setInfo("Account geactiveerd. Wijzig nu je wachtwoord.");
      nav("/meos/dashboard");
    } catch (err: any) {
      setError(err.message); setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a1628] flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-blue-900/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#003d7a] to-[#0055a5] p-6 text-white relative">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-[#003d7a]" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">MEOS</h1>
                <p className="text-xs text-blue-100 uppercase tracking-widest">Mobiel Effecten Onderzoek Systeem</p>
              </div>
            </div>
            <div className="absolute top-2 right-2 text-[10px] text-blue-200 font-mono">POLITIE • HDRP</div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button onClick={() => { setTab("login"); setError(""); }} className={`flex-1 py-3 text-sm font-semibold transition ${tab === "login" ? "text-[#003d7a] border-b-2 border-[#003d7a] bg-blue-50/50" : "text-gray-500 hover:text-gray-700"}`}>
              Inloggen
            </button>
            <button onClick={() => { setTab("activate"); setError(""); }} className={`flex-1 py-3 text-sm font-semibold transition ${tab === "activate" ? "text-[#003d7a] border-b-2 border-[#003d7a] bg-blue-50/50" : "text-gray-500 hover:text-gray-700"}`}>
              Account activeren
            </button>
          </div>

          <div className="p-6">
            {tab === "activate" && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-[#0055a5] text-xs text-blue-900">
                Type <code className="bg-white px-1 rounded font-mono">/meosinlog</code> in-game om een activatie-code te krijgen.
              </div>
            )}

            {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-800">{error}</div>}
            {info && <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-sm text-green-800">{info}</div>}

            <form onSubmit={tab === "login" ? handleLogin : handleActivate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Roblox Gebruikersnaam</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" required value={robloxName} onChange={e => setRobloxName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0055a5] focus:ring-1 focus:ring-[#0055a5]" />
                </div>
              </div>

              {tab === "login" ? (
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Wachtwoord</label>
                  <div className="relative mt-1">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0055a5] focus:ring-1 focus:ring-[#0055a5]" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Activatie Code</label>
                  <input type="text" required value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={8}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded text-center font-mono text-lg tracking-[0.3em] focus:outline-none focus:border-[#0055a5] focus:ring-1 focus:ring-[#0055a5]" />
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#003d7a] hover:bg-[#002a55] text-white font-semibold py-3 rounded transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? "Bezig..." : tab === "login" ? "Inloggen" : "Activeren"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Beveiligd Systeem • Alleen voor bevoegden</p>
          </div>
        </div>
      </div>
    </div>
  );
}
