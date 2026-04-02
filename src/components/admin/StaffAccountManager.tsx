import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Copy, Users, Shield, Trash2 } from "lucide-react";

interface StaffMember {
  user_id: string;
  username: string;
  must_change_password: boolean;
  created_at: string;
  role?: string;
}

export const StaffAccountManager = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("coordinatie");
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadStaffMembers();
  }, []);

  const loadStaffMembers = async () => {
    const { data: profiles } = await supabase.from('staff_profiles').select('*');
    if (!profiles) return;

    // Get roles for each staff member
    const members: StaffMember[] = [];
    for (const p of profiles) {
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', p.user_id);
      const staffRole = roles?.find(r => ['coordinatie', 'bestuur'].includes(r.role))?.role || 'coordinatie';
      members.push({ ...p, role: staffRole });
    }
    setStaffMembers(members);
  };

  const handleCreate = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setTempPassword("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const { data, error } = await supabase.functions.invoke('create-staff-account', {
        body: { username: username.trim(), role },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setTempPassword(data.tempPassword);
      setUsername("");
      loadStaffMembers();

      toast({
        title: "Account aangemaakt!",
        description: `Staff account '${data.username}' is aangemaakt.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: err.message || "Account aanmaken mislukt",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    toast({ title: "Gekopieerd!", description: "Tijdelijk wachtwoord gekopieerd naar klembord" });
  };

  const handleDelete = async (member: StaffMember) => {
    if (!confirm(`Weet je zeker dat je '${member.username}' wilt verwijderen?`)) return;

    try {
      await supabase.from('user_roles').delete().eq('user_id', member.user_id);
      await supabase.from('staff_profiles').delete().eq('user_id', member.user_id);
      loadStaffMembers();
      toast({ title: "Verwijderd", description: `${member.username} is verwijderd als stafflid.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Fout", description: err.message });
    }
  };

  return (
    <div className="space-y-8">
      {/* Create new staff */}
      <div className="bg-secondary/30 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5" />
          Nieuw Staff Account
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Gebruikersnaam</Label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="bijv. jan123"
            />
          </div>
          <div>
            <Label>Rang</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coordinatie">Staff Coördinatie</SelectItem>
                <SelectItem value="bestuur">Bestuur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreate} disabled={loading || !username.trim()} variant="glow" className="w-full">
              {loading ? "Aanmaken..." : "Aanmaken"}
            </Button>
          </div>
        </div>

        {tempPassword && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400 font-medium mb-2">✅ Account aangemaakt! Tijdelijk wachtwoord:</p>
            <div className="flex items-center gap-2">
              <code className="bg-black/30 px-3 py-1.5 rounded text-green-300 font-mono text-sm flex-1">
                {tempPassword}
              </code>
              <Button size="sm" variant="outline" onClick={copyPassword}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              De gebruiker moet dit wachtwoord wijzigen bij de eerste login op /staff
            </p>
          </div>
        )}
      </div>

      {/* Staff list */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          Staff Leden ({staffMembers.length})
        </h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gebruikersnaam</TableHead>
              <TableHead>Rang</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aangemaakt</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffMembers.map(m => (
              <TableRow key={m.user_id}>
                <TableCell className="font-medium">{m.username}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    m.role === 'bestuur' ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/20 text-primary'
                  }`}>
                    {m.role === 'bestuur' ? 'Bestuur' : 'Staff Coördinatie'}
                  </span>
                </TableCell>
                <TableCell>
                  {m.must_change_password ? (
                    <span className="text-xs text-amber-400">Wacht op eerste login</span>
                  ) : (
                    <span className="text-xs text-green-400">Actief</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString('nl-NL')}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(m)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {staffMembers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nog geen staff accounts aangemaakt
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
