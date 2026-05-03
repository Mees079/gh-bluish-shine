import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StaffChangePassword } from "@/components/staff/StaffChangePassword";
import { WeekPlanning } from "@/components/staff/WeekPlanning";
import { StaffAnnouncements } from "@/components/staff/StaffAnnouncements";
import { StaffAbsences } from "@/components/staff/StaffAbsences";
import { StaffHours } from "@/components/staff/StaffHours";
import { StaffPersonnel } from "@/components/staff/StaffPersonnel";
import { Shield, LogOut, Calendar, LayoutDashboard, Megaphone, UserX, Clock, Users, AlertTriangle } from "lucide-react";
import { isPast, parseISO } from "date-fns";

interface StaffProfile {
  user_id: string;
  username: string;
}

interface Absence {
  id: string;
  user_id: string;
  end_date: string;
  active: boolean;
}

const StaffDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("planning");
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/staff");
      return;
    }

    const userId = session.user.id;
    setUser(session.user);

    const { data: isStaff } = await supabase.rpc('is_staff_member', { _user_id: userId });
    if (!isStaff) {
      await supabase.auth.signOut();
      navigate("/staff");
      return;
    }

    // Get role
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    if (roles && roles.length > 0) {
      const roleOrder = ['super_admin', 'admin', 'bestuur', 'coordinatie'];
      const userRole = roleOrder.find(r => roles.some(ur => ur.role === r)) || 'coordinatie';
      setRole(userRole);
    }

    // Load staff profiles
    const { data: profiles } = await supabase.from('staff_profiles').select('user_id, username');
    let allProfiles = (profiles as StaffProfile[]) || [];

    // Load absences
    const { data: absData } = await supabase.from('staff_absences').select('id, user_id, end_date, active');
    setAbsences((absData as Absence[]) || []);

    // Count open tasks assigned to user
    const { count } = await supabase.from('staff_tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', userId).neq('status', 'done');
    setOpenTaskCount(count || 0);

    // Check staff profile
    const { data: profileData } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileData) {
      setProfile(profileData);
      setMustChangePassword(profileData.must_change_password);
      if (!allProfiles.some(p => p.user_id === userId)) {
        allProfiles = [...allProfiles, { user_id: userId, username: profileData.username }];
      }
    } else {
      setMustChangePassword(false);
      if (!allProfiles.some(p => p.user_id === userId)) {
        allProfiles = [...allProfiles, { user_id: userId, username: session.user.email?.split('@')[0] || 'Ik' }];
      }
    }

    setStaffProfiles(allProfiles);

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/staff");
  };

  const isBestuur = role === 'bestuur' || role === 'admin' || role === 'super_admin';
  const isAbsent = absences.some(a => a.user_id === user?.id && a.active && !isPast(parseISO(a.end_date)));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (mustChangePassword) {
    return <StaffChangePassword onComplete={() => setMustChangePassword(false)} />;
  }

  const getRoleBadge = () => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">Admin</span>;
      case 'bestuur':
        return <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">Bestuur</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded bg-[#00ff88]/20 text-[#00ff88] font-medium">Staff Coördinatie</span>;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Overzicht', icon: LayoutDashboard },
    { id: 'planning', label: 'Taken', icon: Calendar },
    { id: 'announcements', label: 'Berichten', icon: Megaphone },
    { id: 'absences', label: 'Afmeldingen', icon: UserX },
    { id: 'hours', label: 'Uren', icon: Clock },
    ...(isBestuur ? [{ id: 'personnel', label: 'Personeel', icon: Users }] : []),
  ];

  // Dashboard warnings
  const absentWithOpenTasks = absences
    .filter(a => a.active && !isPast(parseISO(a.end_date)))
    .filter(a => {
      // This is a simplified check - we'll show it for bestuur
      return true;
    });

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(0,255,136,0.04)_0%,_transparent_50%)]" />

      {/* Header */}
      <header className="relative border-b border-[#1f2937] bg-[#111827]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00ff88]/10 rounded-xl flex items-center justify-center border border-[#00ff88]/30">
              <Shield className="h-5 w-5 text-[#00ff88]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Staff Panel</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6b7280]">{profile?.username || user?.email?.split('@')[0]}</span>
                {getRoleBadge()}
                {isAbsent && <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">Afgemeld</span>}
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-[#6b7280] hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Uitloggen</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#00ff88] text-[#00ff88]'
                    : 'border-transparent text-[#6b7280] hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-[#111827]/60 border border-[#1f2937] rounded-2xl p-8 text-center">
              <LayoutDashboard className="h-12 w-12 text-[#374151] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Welkom, {profile?.username || user?.email?.split('@')[0]}!</h2>
              <p className="text-[#6b7280] text-sm">
                {isBestuur
                  ? 'Je hebt volledige toegang tot het Staff Panel.'
                  : 'Bekijk je taken, berichten en uren.'}
              </p>
            </div>

            {/* Notifications */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {openTaskCount > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-amber-500/10 transition-colors" onClick={() => setActiveTab('planning')}>
                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">{openTaskCount} open {openTaskCount === 1 ? 'taak' : 'taken'}</p>
                    <p className="text-xs text-[#6b7280]">Aan jou toegewezen</p>
                  </div>
                </div>
              )}
              {isAbsent && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                  <UserX className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Je bent afgemeld</p>
                    <p className="text-xs text-[#6b7280]">Bekijk je afmelding bij Afmeldingen</p>
                  </div>
                </div>
              )}
              {isAbsent && openTaskCount > 0 && isBestuur && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-400">⚠️ Afgemeld met open taken</p>
                    <p className="text-xs text-[#6b7280]">Er staan nog taken open voor afgemelde leden</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'planning' && user && (
          <WeekPlanning isBestuur={isBestuur} currentUserId={user.id} staffProfiles={staffProfiles} />
        )}

        {activeTab === 'announcements' && user && (
          <StaffAnnouncements isBestuur={isBestuur} currentUserId={user.id} staffProfiles={staffProfiles} />
        )}

        {activeTab === 'absences' && user && (
          <StaffAbsences isBestuur={isBestuur} currentUserId={user.id} staffProfiles={staffProfiles} />
        )}

        {activeTab === 'hours' && user && (
          <StaffHours isBestuur={isBestuur} currentUserId={user.id} staffProfiles={staffProfiles} />
        )}

        {activeTab === 'personnel' && isBestuur && (
          <StaffPersonnel staffProfiles={staffProfiles} />
        )}
      </main>
    </div>
  );
};

export default StaffDashboard;
