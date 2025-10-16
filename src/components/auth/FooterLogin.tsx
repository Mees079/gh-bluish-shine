import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock, LogIn } from "lucide-react";

export const FooterLogin = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check current session to toggle UI
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      toast({ title: "Ingelogd", description: "Je bent succesvol ingelogd" });

      // Open admin panel; it will verify admin-rechten zelf
      window.dispatchEvent(new Event("open-admin"));
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Login mislukt",
        description: err?.message || "Controleer je gegevens en probeer opnieuw",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdmin = () => {
    window.dispatchEvent(new Event("open-admin"));
  };

  return (
    <footer className="w-full border-t bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">Admin inloggen</h3>
            <p className="text-sm text-muted-foreground">
              Log in om het dashboard te openen en wachtwoorden te beheren.
            </p>
          </div>

          {!isLoggedIn ? (
            <form onSubmit={handleLogin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="footer-email">E-mail</Label>
                <Input
                  id="footer-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="bijv. HDRP@hdrp.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="footer-password">Wachtwoord</Label>
                <Input
                  id="footer-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="default" disabled={loading} className="w-full">
                {loading ? "Inloggen..." : (
                  <span className="inline-flex items-center gap-2"><LogIn className="h-4 w-4" /> Inloggen</span>
                )}
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-3 justify-start sm:justify-end">
              <Button variant="outline" onClick={handleOpenAdmin}>
                <Lock className="h-4 w-4 mr-2" /> Open Admin
              </Button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
