import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Copy, Code2, Trash2 } from "lucide-react";

interface DevMember {
  user_id: string;
  username: string;
  must_change_password: boolean;
  created_at: string;
  role?: string;
}

const rolePriority = ["super_admin", "admin", "head_developer", "developer"] as const;

const getRoleMeta = (role?: string) => {
  if (role === "super_admin" || role === "admin") {
    return { label: "Admin", className: "bg-destructive/10 text-destructive" };
  }
  if (role === "head_developer") {
    return { label: "Head Developer", className: "bg-blue-500/20 text-blue-400" };
  }
  return { label: "Developer", className: "bg-cyan-500/20 text-cyan-400" };
};

export const DeveloperAccountManager = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"developer" | "head_developer">("developer");
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [members, setMembers] = useState<DevMember[]>([]);
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["developer", "head_developer"]);

    const userIds = Array.from(new Set((roles || []).map((r: any) => r.user_id)));
    if (!userIds.length) { setMembers([]); return; }

    const { data: profiles } = await supabase
      .from("staff_profiles")
      .select("user_id, username, must_change_password, created_at")
      .in("user_id", userIds);

    const roleMap = new Map<string, string[]>();
    (roles || []).forEach((entry: any) => {
      const cur = roleMap.get(entry.user_id) || [];
      cur.push(entry.role);
      roleMap.set(entry.user_id, cur);
    });

    const list: DevMember[] = (profiles || []).map((p: any) => {
      const userRoles = roleMap.get(p.user_id) || [];
      const highest = rolePriority.find((r) => userRoles.includes(r)) || "developer";
      return { ...p, role: highest };
    });
    setMembers(list);
  };

  const handleCreate = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setTempPassword("");

    try {
      const { data, error } = await supabase.functions.invoke("create-developer-account", {
        body: { username: username.trim(), role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setTempPassword(data.tempPassword);
      setUsername("");
      setRole("developer");
      await load();
      toast({ title: "Account aangemaakt!", description: `${data.username} is aangemaakt.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Fout", description: err?.message || "Account aanmaken mislukt" });
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    toast({ title: "Gekopieerd!" });
  };

  const handleDelete = async (m: DevMember) => {
    if (!confirm(`Weet je zeker dat je '${m.username}' wilt verwijderen?`)) return;
    try {
      await supabase.from("user_roles").delete().eq("user_id", m.user_id).in("role", ["developer", "head_developer"]);
      await supabase.from("staff_profiles").delete().eq("user_id", m.user_id);
      await load();
      toast({ title: "Verwijderd" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Fout", description: err.message });
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-secondary/30 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5" /> Nieuw Developer Account
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Gebruikersnaam</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="bijv. dev_jan" />
          </div>
          <div>
            <Label>Rang</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setRole("developer")}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                  role === "developer" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                }`}
              >
                Developer
              </button>
              <button
                type="button"
                onClick={() => setRole("head_developer")}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                  role === "head_developer" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                }`}
              >
                Head Developer
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreate} disabled={loading || !username.trim()} variant="glow" className="w-full">
              {loading ? "Aanmaken..." : "Aanmaken"}
            </Button>
          </div>
        </div>

        {tempPassword && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400 font-medium mb-2">✅ Account aangemaakt! Tijdelijk wachtwoord:</p>
            <div className="flex items-center gap-2">
              <code className="bg-black/30 px-3 py-1.5 rounded text-blue-300 font-mono text-sm flex-1">{tempPassword}</code>
              <Button size="sm" variant="outline" onClick={copyPassword}><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Login op /developer met dit wachtwoord.</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Code2 className="h-5 w-5" /> Developers ({members.length})
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
            {members.map((m) => {
              const meta = getRoleMeta(m.role);
              return (
                <TableRow key={m.user_id}>
                  <TableCell className="font-medium">{m.username}</TableCell>
                  <TableCell><span className={`text-xs px-2 py-0.5 rounded ${meta.className}`}>{meta.label}</span></TableCell>
                  <TableCell>
                    {m.must_change_password
                      ? <span className="text-xs text-amber-400">Wacht op login</span>
                      : <span className="text-xs text-green-400">Actief</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("nl-NL")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nog geen developer accounts</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
