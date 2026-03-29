import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, User, Shield } from "lucide-react";

const StaffLogin = () => {
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
      const email = `${username}@hdrp.staff`;
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      if (data.user) {
        const { data: isStaff } = await supabase.rpc('is_staff_member', { _user_id: data.user.id });
        if (!isStaff) {
          await supabase.auth.signOut();
          throw new Error("Geen staff toegang");
        }

        // Also try admin login format
        navigate("/staff/dashboard");
      }
    } catch (err: any) {
      // Try admin format (@hdrp.local)
      try {
        const email = `${username}@hdrp.local`;
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;

        if (data.user) {
          const { data: isStaff } = await supabase.rpc('is_staff_member', { _user_id: data.user.id });
          if (!isStaff) {
            await supabase.auth.signOut();
            throw new Error("Geen staff toegang");
          }
          navigate("/staff/dashboard");
          return;
        }
      } catch {
        // Fall through to original error
      }
      setError(err.message || "Login mislukt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,255,136,0.08)_0%,_transparent_60%)]" />
      
      <div className="relative w-full max-w-md">
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-[#00ff88]/20 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,255,136,0.1)]">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-[#00ff88]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#00ff88]/30">
              <Shield className="h-8 w-8 text-[#00ff88]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Staff Panel</h1>
            <p className="text-[#6b7280] text-sm mt-2">Log in met je staff account</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[#9ca3af] text-sm font-medium mb-2 block">Gebruikersnaam</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4b5563]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Gebruikersnaam"
                  required
                  className="w-full bg-[#1f2937] border border-[#374151] rounded-lg pl-10 pr-4 py-3 text-white placeholder-[#4b5563] focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[#9ca3af] text-sm font-medium mb-2 block">Wachtwoord</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4b5563]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#1f2937] border border-[#374151] rounded-lg pl-10 pr-4 py-3 text-white placeholder-[#4b5563] focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/30 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff88] hover:bg-[#00dd77] text-[#0a0e1a] font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]"
            >
              {loading ? "Inloggen..." : "Inloggen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
