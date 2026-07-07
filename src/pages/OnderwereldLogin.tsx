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
      {/* Subtle diagonal grid background */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #ffffff 1px, transparent 1px), linear-gradient(-45deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.95)_75%)]" />
      {/* Soft top light */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06)_0%,_transparent_60%)]" />

      <div className="relative w-full max-w-md">
        <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-[0_0_80px_rgba(255,255,255,0.05)]">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-700">
              <Skull className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Onderwereld Portal</h1>
            <p className="text-zinc-500 text-xs mt-2 uppercase tracking-widest">HDRP · Gang Coordinatie</p>
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
                  className="w-full bg-black/60 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
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
                  className="w-full bg-black/60 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-lg transition-all disabled:opacity-50 uppercase tracking-wider text-sm"
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
