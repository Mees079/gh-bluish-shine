import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ShieldCheck } from "lucide-react";

interface StaffChangePasswordProps {
  onComplete: () => void;
}

export const StaffChangePassword = ({ onComplete }: StaffChangePasswordProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens bevatten");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      // Mark password as changed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('staff_profiles')
          .update({ must_change_password: false })
          .eq('user_id', user.id);
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || "Wachtwoord wijzigen mislukt");
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
            <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/30">
              <ShieldCheck className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Wachtwoord Wijzigen</h1>
            <p className="text-[#6b7280] text-sm mt-2">Je moet je tijdelijke wachtwoord wijzigen voordat je verder kunt</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleChange} className="space-y-5">
            <div>
              <label className="text-[#9ca3af] text-sm font-medium mb-2 block">Nieuw wachtwoord</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4b5563]" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimaal 8 tekens"
                  required
                  className="w-full bg-[#1f2937] border border-[#374151] rounded-lg pl-10 pr-4 py-3 text-white placeholder-[#4b5563] focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[#9ca3af] text-sm font-medium mb-2 block">Bevestig wachtwoord</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4b5563]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Herhaal wachtwoord"
                  required
                  className="w-full bg-[#1f2937] border border-[#374151] rounded-lg pl-10 pr-4 py-3 text-white placeholder-[#4b5563] focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/30 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff88] hover:bg-[#00dd77] text-[#0a0e1a] font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,136,0.3)]"
            >
              {loading ? "Wijzigen..." : "Wachtwoord Wijzigen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
