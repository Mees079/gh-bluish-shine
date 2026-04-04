import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Copy, Users, Trash2 } from "lucide-react";

interface StaffMember {
  user_id: string;
  username: string;
  must_change_password: boolean;
  created_at: string;
  role?: string;
}

const rolePriority = ["super_admin", "admin", "bestuur", "coordinatie"] as const;

const getRoleMeta = (role?: string) => {
  if (role === "super_admin" || role === "admin") {
    return {
      label: "Admin",
      className: "bg-destructive/10 text-destructive",
    };
  }

  if (role === "bestuur") {
    return {
      label: "Bestuur",
      className: "bg-amber-500/20 text-amber-400",
    };
  }

  return {
    label: "Staff Coördinatie",
    className: "bg-primary/20 text-primary",
  };
};

const getCreateAccountErrorMessage = async (error: any) => {
  if (error?.context && typeof error.context.json === "function") {
    try {
      const response = await error.context.json();
      if (response?.error) {
        return response.error;
      }
    } catch {
      // Fall back to the generic message below.
    }
  }

  return error?.message || "Account aanmaken mislukt";
};

export const StaffAccountManager = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"coordinatie" | "bestuur">("coordinatie");
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadStaffMembers();
  }, []);

  const loadStaffMembers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from("staff_profiles")
      .select("user_id, username, must_change_password, created_at")
      .order("created_at", { ascending: false });

    if (profilesError || !profiles) {
      setStaffMembers([]);
      return;
    }

    const userIds = profiles.map((profile) => profile.user_id);
    const { data: roles } = userIds.length
      ? await supabase.from("user_roles").select("user_id, role").in("user_id", userIds)
      : { data: [] as Array<{ user_id: string; role: string }> };

    const roleMap = new Map<string, string[]>();
    (roles || []).forEach((entry) => {
      const current = roleMap.get(entry.user_id) || [];
      current.push(entry.role);
      roleMap.set(entry.user_id, current);
    });

    const members: StaffMember[] = profiles.map((profile) => {
      const rolesForUser = roleMap.get(profile.user_id) || [];
      const highestRole = rolePriority.find((candidate) => rolesForUser.includes(candidate)) || "coordinatie";

      return {
        ...profile,
        role: highestRole,
      };
    });

    setStaffMembers(members);
  };

  const handleCreate = async () => {
    if (!username.trim()) return;

    setLoading(true);
    setTempPassword("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const requestedRole = role;
      const { data, error } = await supabase.functions.invoke("create-staff-account", {
        body: { username: username.trim(), role: requestedRole },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.role && data.role !== requestedRole) {
        throw new Error(`Rol mismatch: gevraagd ${requestedRole}, ontvangen ${data.role}`);
      }

      setTempPassword(data.tempPassword);
      setUsername("");
      setRole("coordinatie");
      await loadStaffMembers();

      toast({
        title: "Account aangemaakt!",
        description: `${data.username} is aangemaakt als ${requestedRole === "bestuur" ? "Bestuur" : "Staff Coördinatie"}.`,
      });
    } catch (err: any) {
      const message = await getCreateAccountErrorMessage(err);
      toast({
        variant: "destructive",
        title: "Fout",
        description: message,
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
      await supabase.from("user_roles").delete().eq("user_id", member.user_id);
      await supabase.from("staff_profiles").delete().eq("user_id", member.user_id);
      await loadStaffMembers();
      toast({ title: "Verwijderd", description: `${member.username} is verwijderd als stafflid.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Fout", description: err.message });
    }
  };

  return (
    <div className="space-y-8">
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
              onChange={(e) => setUsername(e.target.value)}
              placeholder="bijv. jan123"
            />
          </div>

          <div>
            <Label>Rang</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setRole("coordinatie")}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                  role === "coordinatie"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Staff Coördinatie
              </button>
              <button
                type="button"
                onClick={() => setRole("bestuur")}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                  role === "bestuur"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Bestuur
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Je maakt nu een <span className="text-foreground font-medium">{role === "bestuur" ? "Bestuur" : "Staff Coördinatie"}</span> account aan.
            </p>
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
            {staffMembers.map((member) => {
              const roleMeta = getRoleMeta(member.role);

              return (
                <TableRow key={member.user_id}>
                  <TableCell className="font-medium">{member.username}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded ${roleMeta.className}`}>
                      {roleMeta.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    {member.must_change_password ? (
                      <span className="text-xs text-amber-400">Wacht op eerste login</span>
                    ) : (
                      <span className="text-xs text-green-400">Actief</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(member.created_at).toLocaleDateString("nl-NL")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(member)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
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
