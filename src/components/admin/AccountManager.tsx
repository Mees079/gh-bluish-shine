import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Key, UserPlus } from "lucide-react";
import { accountSchema } from "@/lib/validation";

interface AccountManagerProps {
  user: User;
}

export const AccountManager = ({ user }: AccountManagerProps) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const { toast } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Wachtwoord gewijzigd",
        description: "Je wachtwoord is succesvol bijgewerkt",
      });
      setOldPassword("");
      setNewPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    try {
      accountSchema.parse({
        username: newUsername,
        password: newUserPassword,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Validatiefout",
        description: error.errors?.[0]?.message || "Controleer de invoer",
      });
      return;
    }

    try {
      const email = `${newUsername}@hdrp.local`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password: newUserPassword,
      });

      if (error) throw error;

      if (data.user) {
        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'admin'
          });

        if (roleError) throw roleError;

        toast({
          title: "Account aangemaakt",
          description: `Admin account voor ${newUsername} is aangemaakt`,
        });
        setNewUsername("");
        setNewUserPassword("");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-4">Wachtwoord Wijzigen</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="new-password">Nieuw Wachtwoord</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit">
            <Key className="h-4 w-4 mr-2" />
            Wachtwoord Wijzigen
          </Button>
        </form>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">Nieuw Admin Account</h3>
        <form onSubmit={handleCreateUser} className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="new-username">Gebruikersnaam</Label>
            <Input
              id="new-username"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="bijv: Admin2"
              required
            />
          </div>
          <div>
            <Label htmlFor="new-user-password">Wachtwoord</Label>
            <Input
              id="new-user-password"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit">
            <UserPlus className="h-4 w-4 mr-2" />
            Account Aanmaken
          </Button>
        </form>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-2">Account Info</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Gebruikersnaam:</strong> {user.email?.split('@')[0]}</p>
          <p><strong>Account ID:</strong> {user.id}</p>
        </div>
      </div>
    </div>
  );
};
