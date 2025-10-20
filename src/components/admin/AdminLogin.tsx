import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, User } from "lucide-react";

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Login met email format (username@hdrp.local)
      const email = `${username}@hdrp.local`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check admin status using backend function (supports admin & super_admin)
        const { data: isAdmin, error: roleCheckError } = await supabase.rpc('is_admin', { _user_id: data.user.id });

        if (roleCheckError || !isAdmin) {
          await supabase.auth.signOut();
          throw new Error("Geen admin toegang");
        }

        toast({
          title: "Ingelogd!",
          description: `Welkom, ${username}`,
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message || "Login mislukt",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Admin Login</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Druk op <kbd className="px-2 py-1 bg-secondary rounded">CTRL</kbd> +{" "}
          <kbd className="px-2 py-1 bg-secondary rounded">SHIFT</kbd> +{" "}
          <kbd className="px-2 py-1 bg-secondary rounded">P</kbd> om dit venster te openen
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto">
        <div className="space-y-2">
          <Label htmlFor="username">Gebruikersnaam</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              placeholder="Gebruikersnaam"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Wachtwoord</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="glow"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Inloggen..." : "Login"}
        </Button>
      </form>

      

    </div>
  );
};
