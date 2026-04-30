import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, User, Code2 } from "lucide-react";

const DeveloperLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const tryLogin = async (email: string) => {
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) throw err;
    if (!data.user) throw new Error("Login mislukt");

    const { data: isDev } = await supabase.rpc("is_developer_member", { _user_id: data.user.id });
    if (!isDev) {
      await supabase.auth.signOut();
      throw new Error("Geen developer toegang");
    }
    navigate("/developer/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await tryLogin(`${username}@hdrp.dev`);
    } catch (err: any) {
      try {
        await tryLogin(`${username}@hdrp.staff`);
      } catch {
        try {
          await tryLogin(`${username}@hdrp.local`);
        } catch {
          setError(err?.message || "Login mislukt");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.07) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12)_0%,_transparent_60%)]" />

      <div className="relative w-full max-w-md">
        <div className="bg-[#0b1424]/90 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 shadow-[0_0_60px_rgba(59,130,246,0.15)]">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30">
              <Code2 className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Developer Portal</h1>
            <p className="text-slate-400 text-sm mt-2">Toegang voor het development team</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Gebruikersnaam</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="developer"
                  required
                  className="w-full bg-[#0f1a2e] border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Wachtwoord</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0f1a2e] border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-[0_0_30px_rgba(59,130,246,0.35)] hover:shadow-[0_0_45px_rgba(59,130,246,0.55)]"
            >
              {loading ? "Inloggen..." : "Inloggen"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-6">HDRP Development Environment</p>
        </div>
      </div>
    </div>
  );
};

export default DeveloperLogin;
