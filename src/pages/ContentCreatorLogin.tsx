import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, User, Video } from "lucide-react";

const ContentCreatorLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const email = `${username.toLowerCase().replace(/[^a-z0-9_]/g, "")}@cc.hdrp.local`;
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      if (!data.user) throw new Error("Login mislukt");
      const { data: isCc } = await supabase.rpc("is_content_creator", { _user_id: data.user.id });
      if (!isCc) {
        await supabase.auth.signOut();
        throw new Error("Geen content creator toegang");
      }
      navigate("/contentcreator/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login mislukt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0512] flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(168,85,247,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.08) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.15)_0%,_transparent_60%)]" />

      <div className="relative w-full max-w-md">
        <div className="bg-[#150822]/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 shadow-[0_0_60px_rgba(168,85,247,0.15)]">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 border border-purple-500/30">
              <Video className="h-8 w-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Content Creator Portal</h1>
            <p className="text-slate-400 text-sm mt-2">Voor HDRP content creators</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">{error}</div>
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
                  placeholder="tiktok_naam"
                  required
                  className="w-full bg-[#1a0f2e] border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40"
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
                  className="w-full bg-[#1a0f2e] border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(168,85,247,0.35)]"
            >
              {loading ? "Inloggen..." : "Inloggen"}
            </button>
          </form>
          <p className="text-center text-xs text-slate-600 mt-6">HDRP Content Creator Program</p>
        </div>
      </div>
    </div>
  );
};

export default ContentCreatorLogin;
