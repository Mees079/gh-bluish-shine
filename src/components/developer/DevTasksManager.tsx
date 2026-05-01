import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isPast, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Plus,
  Calendar,
  Paperclip,
  Link as LinkIcon,
  MessageSquare,
  Send,
  CheckCircle2,
  Euro,
  Coins,
  Download,
  Upload,
  Hand,
  X,
  ExternalLink,
  AlertCircle,
  Clock,
  User as UserIcon,
} from "lucide-react";

interface DevTask {
  id: string;
  title: string;
  description: string | null;
  additions: string | null;
  deadline: string | null;
  attachment_path: string | null;
  attachment_link: string | null;
  payment_amount: number | null;
  payment_currency: string;
  status: string; // open | claimed | submitted | paid
  claimed_by: string | null;
  claimed_at: string | null;
  submission_path: string | null;
  submission_link: string | null;
  submission_payment_link: string | null;
  submission_notes: string | null;
  submitted_at: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  message: string;
  is_head_dev: boolean;
  created_at: string;
}

interface UnclaimReq {
  id: string;
  task_id: string;
  requested_by: string;
  reason: string | null;
  status: string;
  created_at: string;
}

interface Profile { user_id: string; username: string }

interface Props {
  isHead: boolean;
  currentUserId: string;
  profiles: Profile[];
}

const STATUS_META: Record<string, { label: string; color: string; ring: string }> = {
  open: { label: "Open", color: "text-blue-300", ring: "border-blue-500/40 bg-blue-500/5" },
  claimed: { label: "In Behandeling", color: "text-amber-300", ring: "border-amber-500/40 bg-amber-500/5" },
  submitted: { label: "Ingeleverd", color: "text-purple-300", ring: "border-purple-500/40 bg-purple-500/5" },
  paid: { label: "Betaald", color: "text-emerald-300", ring: "border-emerald-500/40 bg-emerald-500/5" },
};

export const DevTasksManager = ({ isHead, currentUserId, profiles }: Props) => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<DevTask[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [unclaimReqs, setUnclaimReqs] = useState<UnclaimReq[]>([]);
  const [view, setView] = useState<"board" | "timeline">("board");
  const [showCreate, setShowCreate] = useState(false);
  const [openTask, setOpenTask] = useState<DevTask | null>(null);

  const profileMap = new Map(profiles.map(p => [p.user_id, p.username]));

  useEffect(() => {
    load();
    const channel = supabase
      .channel("dev-tasks-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "dev_tasks" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "dev_task_comments" }, loadComments)
      .on("postgres_changes", { event: "*", schema: "public", table: "dev_task_unclaim_requests" }, loadUnclaim)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const load = async () => {
    const { data } = await supabase.from("dev_tasks").select("*").order("created_at", { ascending: false });
    setTasks((data as DevTask[]) || []);
    loadComments();
    loadUnclaim();
  };
  const loadComments = async () => {
    const { data } = await supabase.from("dev_task_comments").select("*").order("created_at", { ascending: true });
    setComments((data as Comment[]) || []);
  };
  const loadUnclaim = async () => {
    const { data } = await supabase.from("dev_task_unclaim_requests").select("*").eq("status", "open");
    setUnclaimReqs((data as UnclaimReq[]) || []);
  };

  const claim = async (t: DevTask) => {
    const { error } = await supabase
      .from("dev_tasks")
      .update({ status: "claimed", claimed_by: currentUserId, claimed_at: new Date().toISOString() })
      .eq("id", t.id);
    if (error) toast({ variant: "destructive", title: "Fout", description: error.message });
    else toast({ title: "Geclaimd", description: t.title });
  };

  const markPaid = async (t: DevTask) => {
    const { error } = await supabase
      .from("dev_tasks")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", t.id);
    if (error) toast({ variant: "destructive", title: "Fout", description: error.message });
    else toast({ title: "Op betaald gezet" });
  };

  const deleteTask = async (t: DevTask) => {
    if (!confirm(`'${t.title}' verwijderen?`)) return;
    const { error } = await supabase.from("dev_tasks").delete().eq("id", t.id);
    if (error) toast({ variant: "destructive", title: "Fout", description: error.message });
    else { toast({ title: "Verwijderd" }); setOpenTask(null); }
  };

  const approveUnclaim = async (req: UnclaimReq) => {
    await supabase.from("dev_tasks")
      .update({ status: "open", claimed_by: null, claimed_at: null })
      .eq("id", req.task_id);
    await supabase.from("dev_task_unclaim_requests")
      .update({ status: "approved", resolved_by: currentUserId, resolved_at: new Date().toISOString() })
      .eq("id", req.id);
    toast({ title: "Vrijgegeven" });
  };

  const denyUnclaim = async (req: UnclaimReq) => {
    await supabase.from("dev_task_unclaim_requests")
      .update({ status: "denied", resolved_by: currentUserId, resolved_at: new Date().toISOString() })
      .eq("id", req.id);
    toast({ title: "Verzoek afgewezen" });
  };

  const buckets = {
    open: tasks.filter(t => t.status === "open"),
    claimed: tasks.filter(t => t.status === "claimed"),
    submitted: tasks.filter(t => t.status === "submitted"),
    paid: tasks.filter(t => t.status === "paid"),
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-[#0b1424] border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setView("board")}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              view === "board" ? "bg-blue-500/15 text-blue-300" : "text-slate-400 hover:text-white"
            }`}
          >Board</button>
          <button
            onClick={() => setView("timeline")}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              view === "timeline" ? "bg-blue-500/15 text-blue-300" : "text-slate-400 hover:text-white"
            }`}
          >Tijdlijn</button>
        </div>

        {isHead && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-[0_0_25px_rgba(59,130,246,0.3)]"
          >
            <Plus className="h-4 w-4" /> Nieuwe Taak
          </button>
        )}
      </div>

      {/* Unclaim requests for head dev */}
      {isHead && unclaimReqs.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4" /> Vrijgave verzoeken ({unclaimReqs.length})
          </h3>
          <div className="space-y-2">
            {unclaimReqs.map(r => {
              const task = tasks.find(t => t.id === r.task_id);
              return (
                <div key={r.id} className="flex items-center justify-between bg-[#0b1424] border border-slate-800 rounded-lg p-3 text-sm">
                  <div>
                    <div className="text-white font-medium">{task?.title || "?"}</div>
                    <div className="text-xs text-slate-400">
                      {profileMap.get(r.requested_by) || "?"}{r.reason ? ` — ${r.reason}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveUnclaim(r)} className="px-3 py-1 text-xs bg-emerald-500/15 text-emerald-300 rounded hover:bg-emerald-500/25">Vrijgeven</button>
                    <button onClick={() => denyUnclaim(r)} className="px-3 py-1 text-xs bg-red-500/15 text-red-300 rounded hover:bg-red-500/25">Afwijzen</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(["open", "claimed", "submitted", "paid"] as const).map(col => {
            const meta = STATUS_META[col];
            return (
              <div key={col} className="bg-[#0b1424]/60 border border-slate-800 rounded-xl p-3 min-h-[200px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className={`text-sm font-semibold ${meta.color}`}>{meta.label}</h3>
                  <span className="text-xs text-slate-500">{buckets[col].length}</span>
                </div>
                <div className="space-y-2">
                  {buckets[col].map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      profileMap={profileMap}
                      onOpen={() => setOpenTask(t)}
                    />
                  ))}
                  {buckets[col].length === 0 && (
                    <div className="text-xs text-slate-600 text-center py-6">Leeg</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Timeline tasks={tasks} profileMap={profileMap} onOpen={(t) => setOpenTask(t)} />
      )}

      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          currentUserId={currentUserId}
          onCreated={load}
        />
      )}

      {openTask && (
        <TaskDetail
          task={openTask}
          isHead={isHead}
          currentUserId={currentUserId}
          comments={comments.filter(c => c.task_id === openTask.id)}
          profileMap={profileMap}
          onClose={() => setOpenTask(null)}
          onAction={() => {
            load();
            // refresh openTask reference
            setTimeout(async () => {
              const { data } = await supabase.from("dev_tasks").select("*").eq("id", openTask.id).maybeSingle();
              if (data) setOpenTask(data as DevTask);
            }, 200);
          }}
          onClaim={() => claim(openTask)}
          onMarkPaid={() => markPaid(openTask)}
          onDelete={() => deleteTask(openTask)}
        />
      )}
    </div>
  );
};

// ---------------- Task Card ----------------
const TaskCard = ({
  task, profileMap, onOpen,
}: { task: DevTask; profileMap: Map<string, string>; onOpen: () => void }) => {
  const deadline = task.deadline ? parseISO(task.deadline) : null;
  const overdue = deadline && isPast(deadline) && task.status !== "paid";
  const days = deadline ? differenceInDays(deadline, new Date()) : null;

  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-[#0f1a2e] border border-slate-800 hover:border-blue-500/40 rounded-lg p-3 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-sm font-medium text-white group-hover:text-blue-300 line-clamp-2">{task.title}</h4>
      </div>
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {task.payment_amount != null && (
          <span className="flex items-center gap-1 text-emerald-300/90 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            {task.payment_currency === "ROBUX"
              ? <Coins className="h-3 w-3" />
              : <Euro className="h-3 w-3" />}
            {task.payment_amount}
          </span>
        )}
        {deadline && (
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
            overdue ? "bg-red-500/15 text-red-300" : "bg-slate-800 text-slate-400"
          }`}>
            <Calendar className="h-3 w-3" />
            {format(deadline, "d MMM", { locale: nl })}
            {!overdue && days !== null && days <= 3 && days >= 0 && ` (${days}d)`}
          </span>
        )}
        {task.claimed_by && (
          <span className="flex items-center gap-1 text-blue-300/90 bg-blue-500/10 px-1.5 py-0.5 rounded">
            <UserIcon className="h-3 w-3" />
            {profileMap.get(task.claimed_by) || "?"}
          </span>
        )}
      </div>
    </button>
  );
};

// ---------------- Timeline ----------------
const Timeline = ({
  tasks, profileMap, onOpen,
}: { tasks: DevTask[]; profileMap: Map<string, string>; onOpen: (t: DevTask) => void }) => {
  const sorted = [...tasks]
    .filter(t => t.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1));
  const noDeadline = tasks.filter(t => !t.deadline);

  return (
    <div className="space-y-6">
      <div className="bg-[#0b1424]/60 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" /> Op deadline
        </h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Geen taken met deadline</p>
        ) : (
          <div className="relative pl-6 border-l border-slate-800 space-y-3">
            {sorted.map(t => {
              const d = parseISO(t.deadline!);
              const overdue = isPast(d) && t.status !== "paid";
              const meta = STATUS_META[t.status];
              return (
                <button
                  key={t.id}
                  onClick={() => onOpen(t)}
                  className={`relative w-full text-left bg-[#0f1a2e] border ${meta.ring} rounded-lg p-3 hover:border-blue-500/50 transition-colors`}
                >
                  <span className={`absolute -left-[31px] top-4 h-3 w-3 rounded-full ${overdue ? "bg-red-500" : "bg-blue-500"} ring-4 ring-[#050a14]`} />
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">{t.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {format(d, "EEEE d MMMM yyyy", { locale: nl })}
                        {t.claimed_by && ` · ${profileMap.get(t.claimed_by)}`}
                      </p>
                    </div>
                    <span className={`text-xs ${meta.color}`}>{meta.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {noDeadline.length > 0 && (
        <div className="bg-[#0b1424]/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Zonder deadline</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {noDeadline.map(t => (
              <TaskCard key={t.id} task={t} profileMap={profileMap} onOpen={() => onOpen(t)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------- Create Modal ----------------
const CreateTaskModal = ({
  onClose, currentUserId, onCreated,
}: { onClose: () => void; currentUserId: string; onCreated: () => void }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [additions, setAdditions] = useState("");
  const [deadline, setDeadline] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"EUR" | "ROBUX">("EUR");

  const submit = async () => {
    if (!title.trim()) { toast({ variant: "destructive", title: "Naam is verplicht" }); return; }
    setSaving(true);
    try {
      let attachment_path: string | null = null;
      if (file) {
        const path = `tasks/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("dev-files").upload(path, file);
        if (upErr) throw upErr;
        attachment_path = path;
      }
      const { data: inserted, error } = await supabase.from("dev_tasks").insert({
        title: title.trim(),
        description: description.trim() || null,
        additions: additions.trim() || null,
        deadline: deadline || null,
        attachment_link: link.trim() || null,
        attachment_path,
        payment_amount: amount ? Number(amount) : null,
        payment_currency: currency,
        created_by: currentUserId,
      }).select().single();
      if (error) throw error;

      // Fire Discord notification (non-blocking)
      try {
        const taskUrl = `${window.location.origin}/developer/dashboard`;
        await supabase.functions.invoke("notify-new-dev-task", {
          body: {
            task_id: inserted.id,
            title: inserted.title,
            description: inserted.description,
            deadline: inserted.deadline,
            payment_amount: inserted.payment_amount,
            payment_currency: inserted.payment_currency,
            task_url: taskUrl,
          },
        });
      } catch (notifyErr) {
        console.warn("Discord notify failed:", notifyErr);
      }

      toast({ title: "Taak aangemaakt" });
      onCreated();
      onClose();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Fout", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Nieuwe Taak" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Naam">
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="dev-input" placeholder="Korte titel van de taak" />
        </Field>
        <Field label="Beschrijving">
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={3} className="dev-input" placeholder="Wat moet er gedaan worden?" />
        </Field>
        <Field label="Toevoegingen / Notities">
          <textarea value={additions} onChange={e => setAdditions(e.target.value)}
            rows={2} className="dev-input" placeholder="Extra info, wensen, referenties..." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Eind datum">
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="dev-input" />
          </Field>
          <Field label="Betaling">
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="dev-input flex-1"
              />
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as any)}
                className="dev-input w-28"
                style={{ colorScheme: "dark" }}
              >
                <option value="EUR" style={{ background: "#0f1a2e", color: "white" }}>€ EUR</option>
                <option value="ROBUX" style={{ background: "#0f1a2e", color: "white" }}>R$ Robux</option>
              </select>
            </div>
            {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-2.5 py-1">
                {currency === "ROBUX" ? <Coins className="h-3.5 w-3.5" /> : <Euro className="h-3.5 w-3.5" />}
                {currency === "ROBUX" ? `R$ ${Number(amount)}` : `€ ${Number(amount).toFixed(2).replace(".", ",")}`}
              </div>
            )}
          </Field>
        </div>
        <Field label="Bijlage (link)">
          <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="dev-input" />
        </Field>
        <Field label="Bijlage (bestand)">
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="dev-input file:mr-3 file:rounded file:border-0 file:bg-blue-500/15 file:text-blue-300 file:px-3 file:py-1" />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Annuleren</button>
          <button onClick={submit} disabled={saving}
            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg disabled:opacity-50">
            {saving ? "Opslaan..." : "Aanmaken"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ---------------- Task Detail ----------------
const TaskDetail = ({
  task, isHead, currentUserId, comments, profileMap,
  onClose, onAction, onClaim, onMarkPaid, onDelete,
}: {
  task: DevTask; isHead: boolean; currentUserId: string; comments: Comment[];
  profileMap: Map<string, string>; onClose: () => void; onAction: () => void;
  onClaim: () => void; onMarkPaid: () => void; onDelete: () => void;
}) => {
  const { toast } = useToast();
  const [msg, setMsg] = useState("");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [unclaimOpen, setUnclaimOpen] = useState(false);
  const meta = STATUS_META[task.status];
  const isClaimer = task.claimed_by === currentUserId;

  const sendComment = async () => {
    if (!msg.trim()) return;
    const { error } = await supabase.from("dev_task_comments").insert({
      task_id: task.id, user_id: currentUserId, message: msg.trim(), is_head_dev: isHead,
    });
    if (error) toast({ variant: "destructive", title: "Fout", description: error.message });
    else { setMsg(""); onAction(); }
  };

  const downloadAttachment = async (path: string) => {
    const { data, error } = await supabase.storage.from("dev-files").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      toast({ variant: "destructive", title: "Fout", description: error?.message || "Geen toegang" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <Modal title={task.title} onClose={onClose} wide>
      <div className="grid md:grid-cols-3 gap-5">
        {/* Left: details */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded ${meta.color} ${meta.ring} border`}>{meta.label}</span>
            {task.payment_amount != null && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                {task.payment_currency === "ROBUX" ? <Coins className="h-3 w-3" /> : <Euro className="h-3 w-3" />}
                {task.payment_amount} {task.payment_currency === "ROBUX" ? "Robux" : "EUR"}
              </span>
            )}
            {task.deadline && (
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {format(parseISO(task.deadline), "d MMM yyyy", { locale: nl })}
              </span>
            )}
            {task.claimed_by && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                Door {profileMap.get(task.claimed_by) || "?"}
              </span>
            )}
          </div>

          {task.description && (
            <Section label="Beschrijving"><p className="text-sm text-slate-300 whitespace-pre-wrap">{task.description}</p></Section>
          )}
          {task.additions && (
            <Section label="Toevoegingen"><p className="text-sm text-slate-300 whitespace-pre-wrap">{task.additions}</p></Section>
          )}

          {(() => {
            const canSeeAttachments = isHead || isClaimer;
            const hasAttachments = task.attachment_path || task.attachment_link;
            if (!hasAttachments) return null;
            if (!canSeeAttachments) {
              return (
                <Section label="Bijlagen">
                  <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/40 border border-slate-700/60 border-dashed rounded-lg px-3 py-2">
                    <Paperclip className="h-4 w-4" />
                    Bijlagen worden zichtbaar zodra je deze taak claimt.
                  </div>
                </Section>
              );
            }
            return (
              <Section label="Bijlagen">
                <div className="flex flex-col gap-2">
                  {task.attachment_path && (
                    <button onClick={() => downloadAttachment(task.attachment_path!)}
                      className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                      <Paperclip className="h-4 w-4" /> Download bestand <Download className="h-3 w-3 ml-auto" />
                    </button>
                  )}
                  {task.attachment_link && (
                    <a href={task.attachment_link} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                      <LinkIcon className="h-4 w-4" /> {task.attachment_link} <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                </div>
              </Section>
            );
          })()}

          {/* Submission section */}
          {(task.status === "submitted" || task.status === "paid") && (
            <Section label="Ingeleverd">
              {task.submission_notes && <p className="text-sm text-slate-300 whitespace-pre-wrap mb-2">{task.submission_notes}</p>}
              <div className="flex flex-col gap-2">
                {task.submission_path && (
                  <button onClick={() => downloadAttachment(task.submission_path!)}
                    className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                    <Download className="h-4 w-4" /> Download ingeleverd bestand
                  </button>
                )}
                {task.submission_link && (
                  <a href={task.submission_link} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                    <LinkIcon className="h-4 w-4" /> {task.submission_link}
                  </a>
                )}
                {task.submission_payment_link && (
                  <a href={task.submission_payment_link} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                    <Euro className="h-4 w-4" /> Betaallink openen <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                )}
              </div>
            </Section>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {task.status === "open" && !isHead && (
              <button onClick={onClaim}
                className="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg">
                <Hand className="h-4 w-4" /> Claim deze taak
              </button>
            )}
            {task.status === "claimed" && isClaimer && (
              <>
                <button onClick={() => setSubmitOpen(true)}
                  className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-4 py-2 rounded-lg">
                  <Upload className="h-4 w-4" /> Inleveren
                </button>
                <button onClick={() => setUnclaimOpen(true)}
                  className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg">
                  <X className="h-4 w-4" /> Vrijgave aanvragen
                </button>
              </>
            )}
            {task.status === "submitted" && isHead && (
              <button onClick={onMarkPaid}
                className="flex items-center gap-2 text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4" /> Op betaald zetten
              </button>
            )}
            {isHead && (
              <button onClick={onDelete}
                className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200 px-3 py-2 rounded-lg ml-auto">
                Verwijderen
              </button>
            )}
          </div>
        </div>

        {/* Right: chat */}
        <div className="md:col-span-1 bg-[#0b1424] border border-slate-800 rounded-xl p-4 flex flex-col h-[480px]">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-blue-400" /> Vragen & Antwoorden
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {comments.length === 0 && <p className="text-xs text-slate-600 text-center py-4">Nog geen berichten</p>}
            {comments.map(c => (
              <div key={c.id} className={`text-sm rounded-lg p-2.5 ${
                c.is_head_dev ? "bg-blue-500/10 border border-blue-500/20" : "bg-slate-800/50 border border-slate-700/50"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${c.is_head_dev ? "text-blue-300" : "text-slate-300"}`}>
                    {profileMap.get(c.user_id) || "?"}{c.is_head_dev && " · Head Dev"}
                  </span>
                  <span className="text-[10px] text-slate-500">{format(parseISO(c.created_at), "d MMM HH:mm", { locale: nl })}</span>
                </div>
                <p className="text-slate-200 whitespace-pre-wrap">{c.message}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={msg} onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendComment()}
              placeholder="Stel een vraag..."
              className="dev-input flex-1 text-sm" />
            <button onClick={sendComment} className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 px-3 rounded-lg">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {submitOpen && (
        <SubmitModal task={task} onClose={() => setSubmitOpen(false)} onDone={onAction} />
      )}
      {unclaimOpen && (
        <UnclaimModal task={task} currentUserId={currentUserId} onClose={() => setUnclaimOpen(false)} onDone={() => { onAction(); setUnclaimOpen(false); }} />
      )}
    </Modal>
  );
};

// ---------------- Submit Modal ----------------
const SubmitModal = ({ task, onClose, onDone }: { task: DevTask; onClose: () => void; onDone: () => void }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [payLink, setPayLink] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const submit = async () => {
    setSaving(true);
    try {
      let path: string | null = null;
      if (file) {
        const p = `submissions/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("dev-files").upload(p, file);
        if (upErr) throw upErr;
        path = p;
      }
      const { error } = await supabase.from("dev_tasks").update({
        status: "submitted",
        submission_notes: notes.trim() || null,
        submission_link: link.trim() || null,
        submission_payment_link: payLink.trim() || null,
        submission_path: path,
        submitted_at: new Date().toISOString(),
      }).eq("id", task.id);
      if (error) throw error;
      toast({ title: "Ingeleverd!" });
      onDone();
      onClose();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Fout", description: e.message });
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Taak inleveren" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Notities"><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="dev-input" placeholder="Wat heb je gedaan?" /></Field>
        <Field label="Bestand"><input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="dev-input file:mr-3 file:rounded file:border-0 file:bg-purple-500/15 file:text-purple-300 file:px-3 file:py-1" /></Field>
        <Field label="Link naar resultaat (optioneel)"><input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="dev-input" /></Field>
        <Field label="Betaallink (Tikkie / Robux link)"><input value={payLink} onChange={e => setPayLink(e.target.value)} placeholder="https://tikkie.me/... of Robux gamepass link" className="dev-input" /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Annuleren</button>
          <button onClick={submit} disabled={saving}
            className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg disabled:opacity-50">
            {saving ? "Versturen..." : "Inleveren"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ---------------- Unclaim Modal ----------------
const UnclaimModal = ({ task, currentUserId, onClose, onDone }: { task: DevTask; currentUserId: string; onClose: () => void; onDone: () => void }) => {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("dev_task_unclaim_requests").insert({
      task_id: task.id, requested_by: currentUserId, reason: reason.trim() || null,
    });
    setSaving(false);
    if (error) toast({ variant: "destructive", title: "Fout", description: error.message });
    else { toast({ title: "Verzoek verstuurd" }); onDone(); }
  };

  return (
    <Modal title="Vrijgave aanvragen" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-400">Een Head Developer ontvangt je verzoek om deze taak vrij te geven.</p>
        <Field label="Reden (optioneel)"><textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} className="dev-input" placeholder="Waarom kun je deze taak niet doen?" /></Field>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Annuleren</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50">
            {saving ? "Versturen..." : "Verstuur verzoek"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ---------------- Generic UI ----------------
const Modal = ({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
    <div onClick={e => e.stopPropagation()}
      className={`bg-[#0b1424] border border-slate-800 rounded-2xl shadow-[0_0_60px_rgba(59,130,246,0.15)] w-full ${wide ? "max-w-4xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-[#0b1424] z-10">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">{label}</label>
    {children}
  </div>
);

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</h4>
    {children}
  </div>
);
