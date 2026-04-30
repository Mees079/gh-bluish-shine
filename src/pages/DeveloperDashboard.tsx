import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StaffChangePassword } from "@/components/staff/StaffChangePassword";
import { DevTasksManager } from "@/components/developer/DevTasksManager";
import { Code2, LogOut, LayoutDashboard, ListTodo, AlertCircle } from "lucide-react";

interface Profile { user_id: string; username: string }

const DeveloperDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "tasks">("overview");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [myCount, setMyCount] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => { check(); }, []);

  const check = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/developer"); return; }

    const userId = session.user.id;
    setUser(session.user);

    const { data: isDev } = await supabase.rpc("is_developer_member", { _user_id: userId });
    if (!isDev) {
      await supabase.auth.signOut();
      navigate("/developer");
      return;
    }

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const order = ["super_admin", "admin", "head_developer", "developer"];
    const r = order.find(rr => roles?.some(ur => ur.role === rr)) || "developer";
    setRole(r);

    const { data: pdata } = await supabase
      .from("staff_profiles")
      .select("user_id, username");
    setProfiles((pdata as Profile[]) || []);

    const { data: profData } = await supabase
      .from("staff_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (profData) {
      setProfile(profData);
      setMustChangePassword(profData.must_change_password);
    }

    // Counts
    const { count: oc } = await supabase.from("dev_tasks").select("id", { count: "exact", head: true }).eq("status", "open");
    setOpenCount(oc || 0);
    const { count: mc } = await supabase.from("dev_tasks").select("id", { count: "exact", head: true }).eq("claimed_by", userId).neq("status", "paid");
    setMyCount(mc || 0);
    const { count: sc } = await supabase.from("dev_tasks").select("id", { count: "exact", head: true }).eq("status", "submitted");
    setSubmittedCount(sc || 0);

    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/developer");
  };

  const isHead = role === "head_developer" || role === "admin" || role === "super_admin";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (mustChangePassword) {
    return <StaffChangePassword onComplete={() => setMustChangePassword(false)} />;
  }

  const roleBadge = isHead
    ? <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">Head Developer</span>
    : <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-medium">Developer</span>;

  const tabs = [
    { id: "overview", label: "Overzicht", icon: LayoutDashboard },
    { id: "tasks", label: "Taken", icon: ListTodo },
  ] as const;

  return (
    <div className="min-h-screen bg-[#050a14] relative">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.06) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.08)_0%,_transparent_50%)] pointer-events-none" />

      <header className="relative border-b border-slate-800/80 bg-[#0b1424]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Code2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Developer Portal</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{profile?.username || user?.email?.split("@")[0]}</span>
                {roleBadge}
              </div>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Uitloggen</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id ? "border-blue-500 text-blue-300" : "border-transparent text-slate-500 hover:text-white"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="bg-[#0b1424]/70 border border-slate-800 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white">Welkom terug, {profile?.username || "Developer"}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {isHead ? "Je hebt volledige toegang tot het developer panel." : "Bekijk openstaande taken en claim wat je wilt oppakken."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Open taken" value={openCount} accent="blue" onClick={() => setTab("tasks")} />
              <StatCard label="Mijn lopende taken" value={myCount} accent="amber" onClick={() => setTab("tasks")} />
              {isHead && <StatCard label="Wacht op betaling" value={submittedCount} accent="purple" onClick={() => setTab("tasks")} />}
            </div>
          </div>
        )}

        {tab === "tasks" && user && (
          <DevTasksManager isHead={isHead} currentUserId={user.id} profiles={profiles} />
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value, accent, onClick }: { label: string; value: number; accent: "blue" | "amber" | "purple"; onClick?: () => void }) => {
  const c =
    accent === "blue" ? "border-blue-500/30 bg-blue-500/5 text-blue-300" :
    accent === "amber" ? "border-amber-500/30 bg-amber-500/5 text-amber-300" :
    "border-purple-500/30 bg-purple-500/5 text-purple-300";
  return (
    <button onClick={onClick} className={`text-left rounded-xl border ${c} p-5 hover:brightness-125 transition-all`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </button>
  );
};

export default DeveloperDashboard;
