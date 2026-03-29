import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StaffChangePassword } from "@/components/staff/StaffChangePassword";
import { WeekPlanning } from "@/components/staff/WeekPlanning";
import { Shield, LogOut, Calendar, LayoutDashboard, Users } from "lucide-react";

const StaffDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("planning");
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

    // Check staff role
    const { data: isStaff } = await supabase.rpc('is_staff_member', { _user_id: userId });
    if (!isStaff) {
      await supabase.auth.signOut();
      navigate("/staff");
      return;
    }

    // Get role
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    if (roles && roles.length > 0) {
      // Pick highest role
      const roleOrder = ['super_admin', 'admin', 'bestuur', 'staff'];
      const userRole = roleOrder.find(r => roles.some(ur => ur.role === r)) || 'staff';
      setRole(userRole);
    }

    // Check staff profile
    const { data: profileData } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileData) {
      setProfile(profileData);
      setMustChangePassword(profileData.must_change_password);
    } else {
      // Admin user without staff profile - no password change needed
      setMustChangePassword(false);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/staff");
  };

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isBestuur = role === 'bestuur' || isAdmin;

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
        return <span className="text-xs px-2 py-0.5 rounded bg-[#00ff88]/20 text-[#00ff88] font-medium">Stafflid</span>;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, minRole: 'staff' },
    { id: 'planning', label: 'Planning', icon: Calendar, minRole: 'staff' },
  ];

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
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#6b7280] hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Uitloggen</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
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
                {isAdmin
                  ? 'Je hebt volledige toegang tot het Staff Panel. Ga naar Planning om taken te beheren.'
                  : isBestuur
                  ? 'Je hebt toegang tot de weekplanning. Bekijk de planning voor het overzicht.'
                  : 'Bekijk je toegewezen taken in de Planning tab.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'planning' && user && (
          <WeekPlanning isAdmin={isAdmin} currentUserId={user.id} />
        )}
      </main>
    </div>
  );
};

export default StaffDashboard;
