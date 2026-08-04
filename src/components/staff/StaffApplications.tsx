import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, Trash2, Search, Inbox, User } from "lucide-react";

interface Application {
  id: string;
  team: string;
  name: string;
  discord_name: string;
  discord_id: string | null;
  roblox_name: string;
  age: string | null;
  answers: Record<string, string>;
  status: string;
  reviewed_by_name: string | null;
  created_at: string;
}

interface Props {
  currentUserName: string;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: "In behandeling", className: "bg-[#337aff]/15 text-[#337aff]" },
  accepted: { label: "Geaccepteerd", className: "bg-green-500/15 text-green-400" },
  rejected: { label: "Afgewezen", className: "bg-red-500/15 text-red-400" },
};

const TEAM_LABELS: Record<string, string> = {
  staff: "Staff team",
  development: "Development team",
  contentcreator: "Content creator team",
};

export const StaffApplications = ({ currentUserName }: Props) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("pending");
  const [selected, setSelected] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    setApplications(((data as any[]) || []) as Application[]);
    setLoading(false);
  };

  const notify = async (app: Application, event: "accepted" | "rejected" | "deleted") => {
    await supabase.functions.invoke("notify-application", {
      body: {
        event,
        application_id: app.id,
        team: app.team,
        name: app.name,
        discord_name: app.discord_name,
        discord_id: app.discord_id,
        roblox_name: app.roblox_name,
        age: app.age,
        reviewer: currentUserName,
      },
    });
  };

  const review = async (app: Application, status: "accepted" | "rejected") => {
    setBusy(true);
    const { error } = await supabase
      .from("applications")
      .update({
        status,
        reviewed_by_name: currentUserName,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", app.id);
    setBusy(false);

    if (error) {
      toast({ variant: "destructive", title: "Fout", description: "Bijwerken mislukt." });
      return;
    }

    await notify(app, status);
    toast({
      title: status === "accepted" ? "Geaccepteerd" : "Afgewezen",
      description: `${app.name} is ${status === "accepted" ? "geaccepteerd" : "afgewezen"}.`,
    });
    setSelected(null);
    load();
  };

  const remove = async (app: Application) => {
    if (!confirm(`Sollicitatie van ${app.name} verwijderen?`)) return;
    setBusy(true);
    const { error } = await supabase.from("applications").delete().eq("id", app.id);
    setBusy(false);

    if (error) {
      toast({ variant: "destructive", title: "Fout", description: "Verwijderen mislukt." });
      return;
    }

    await notify(app, "deleted");
    toast({ title: "Verwijderd", description: `Sollicitatie van ${app.name} is verwijderd.` });
    setSelected(null);
    load();
  };

  const visible = applications
    .filter((app) => (filter === "all" ? true : app.status === filter))
    .filter((app) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [app.name, app.discord_name, app.roblox_name].some((v) => v?.toLowerCase().includes(q));
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ba7ba]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, Discord of Roblox..."
            className="w-full h-10 rounded-lg bg-[#0e1524] border border-[#25303f] pl-9 pr-3 text-sm text-white placeholder:text-[#5d6b80] outline-none focus:border-[#337aff]"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {(["pending", "accepted", "rejected", "all"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === key ? "bg-[#337aff] text-white" : "text-[#9ba7ba] hover:text-white hover:bg-[#25303f]"
              }`}
            >
              {key === "pending" ? "Open" : key === "accepted" ? "Geaccepteerd" : key === "rejected" ? "Afgewezen" : "Alles"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#337aff] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-[#25303f] bg-[#0e1524]/60 p-12 text-center">
          <Inbox className="h-10 w-10 text-[#3a465c] mx-auto mb-3" />
          <p className="text-[#9ba7ba] text-sm">Geen sollicitaties gevonden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((app) => {
            const status = STATUS_META[app.status] || STATUS_META.pending;
            return (
              <div
                key={app.id}
                className="rounded-2xl border border-[#25303f] bg-[#0e1524]/70 p-5 flex flex-col gap-3 hover:border-[#337aff]/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-[#337aff]/10 border border-[#337aff]/30 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-[#337aff]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{app.name}</p>
                      <p className="text-xs text-[#9ba7ba] truncate">{TEAM_LABELS[app.team] || app.team}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                <div className="text-xs text-[#9ba7ba] space-y-0.5">
                  <p>Discord: <span className="text-white/80">{app.discord_name}</span></p>
                  <p>Roblox: <span className="text-white/80">{app.roblox_name}</span></p>
                  <p>Leeftijd: <span className="text-white/80">{app.age || "-"}</span></p>
                  <p>{new Date(app.created_at).toLocaleString("nl-NL")}</p>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-2">
                  <button
                    onClick={() => setSelected(app)}
                    className="flex-1 h-9 rounded-lg bg-[#25303f] text-white text-sm font-medium hover:bg-[#2f3c4f] transition-colors"
                  >
                    Bekijken
                  </button>
                  {app.status === "pending" && (
                    <>
                      <button
                        onClick={() => review(app, "accepted")}
                        disabled={busy}
                        title="Accepteren"
                        className="h-9 w-9 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 flex items-center justify-center transition-colors"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => review(app, "rejected")}
                        disabled={busy}
                        title="Afwijzen"
                        className="h-9 w-9 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 flex items-center justify-center transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => remove(app)}
                    disabled={busy}
                    title="Verwijderen"
                    className="h-9 w-9 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sollicitatie van {selected?.name}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><span className="text-muted-foreground">Team:</span> {TEAM_LABELS[selected.team] || selected.team}</p>
                <p><span className="text-muted-foreground">Leeftijd:</span> {selected.age || "-"}</p>
                <p><span className="text-muted-foreground">Discord:</span> {selected.discord_name}</p>
                <p><span className="text-muted-foreground">Discord ID:</span> {selected.discord_id || "-"}</p>
                <p><span className="text-muted-foreground">Roblox:</span> {selected.roblox_name}</p>
                <p><span className="text-muted-foreground">Ingestuurd:</span> {new Date(selected.created_at).toLocaleString("nl-NL")}</p>
              </div>

              <div className="space-y-3">
                {Object.entries(selected.answers || {}).map(([question, answer]) => (
                  <div key={question} className="rounded-xl border border-border bg-secondary/30 p-4">
                    <p className="text-sm font-semibold text-foreground">{question}</p>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{answer}</p>
                  </div>
                ))}
              </div>

              {selected.reviewed_by_name && (
                <p className="text-xs text-muted-foreground">Behandeld door {selected.reviewed_by_name}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {selected.status === "pending" && (
                  <>
                    <button
                      onClick={() => review(selected, "accepted")}
                      disabled={busy}
                      className="h-10 px-5 rounded-lg bg-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/30 transition-colors"
                    >
                      Accepteren
                    </button>
                    <button
                      onClick={() => review(selected, "rejected")}
                      disabled={busy}
                      className="h-10 px-5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/30 transition-colors"
                    >
                      Afwijzen
                    </button>
                  </>
                )}
                <button
                  onClick={() => remove(selected)}
                  disabled={busy}
                  className="h-10 px-5 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors"
                >
                  Verwijderen
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
