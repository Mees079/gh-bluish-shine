import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, User, Skull } from "lucide-react";

const OnderwereldLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Init default HDRP account (idempotent)
    supabase.functions.invoke("ow-init-hdrp").catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const email = `${username.toLowerCase().replace(/[^a-z0-9_]/g, "")}@onderwereld.hdrp.local`;
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      if (!data.user) throw new Error("Login mislukt");
      const { data: isOw } = await supabase.rpc("is_onderwereld", { _user_id: data.user.id });
      if (!isOw) {
        await supabase.auth.signOut();
        throw new Error("Geen onderwereld toegang");
      }
      navigate("/onderwereld/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login mislukt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%23d4af37' stroke-width='1'><path d='M10 60 L30 50 L45 55 L50 45 L55 55 L70 50 L110 60 L70 70 L55 65 L50 75 L45 65 L30 70 Z'/><circle cx='60' cy='20' r='8'/><text x='55' y='24' font-family='serif' fill='%23d4af37' font-size='10'>%24</text><rect x='20' y='90' width='30' height='18' rx='2'/><line x1='20' y1='99' x2='50' y2='99'/><path d='M80 90 L110 90 L110 108 L80 108 Z M85 95 L105 95 M85 100 L105 100'/></g></svg>")`,
      }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.9)_80%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08)_0%,_transparent_60%)]" />

      <div className="relative w-full max-w-md">
        <div className="bg-zinc-950/90 backdrop-blur-xl border border-yellow-600/20 rounded-2xl p-8 shadow-[0_0_80px_rgba(212,175,55,0.1)]">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-600/20 to-red-900/20 rounded-2xl flex items-center justify-center mb-4 border border-yellow-600/40">
              <Skull className="h-8 w-8 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Onderwereld Portal</h1>
            <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest text-xs">HDRP · Klassieke gang tracker</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-zinc-300 text-sm font-medium mb-2 block">Gebruikersnaam</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="hdrp"
                  required
                  className="w-full bg-black/60 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-yellow-600/60 focus:ring-1 focus:ring-yellow-600/40"
                />
              </div>
            </div>
            <div>
              <label className="text-zinc-300 text-sm font-medium mb-2 block">Wachtwoord</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full bg-black/60 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-yellow-600/60 focus:ring-1 focus:ring-yellow-600/40"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-700 via-yellow-600 to-amber-600 hover:from-yellow-600 hover:to-amber-500 text-black font-bold py-3 rounded-lg transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(212,175,55,0.3)] uppercase tracking-wider text-sm"
            >
              {loading ? "Inloggen..." : "Toegang"}
            </button>
          </form>
          <p className="text-center text-xs text-zinc-700 mt-6 uppercase tracking-widest">Onderwereld Coordinatie</p>
        </div>
      </div>
    </div>
  );
};

export default OnderwereldLogin;
