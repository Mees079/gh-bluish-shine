import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AdminLogin } from "./AdminLogin";
import { AdminDashboard } from "./AdminDashboard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export const AdminPanel = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // CTRL + SHIFT + P trigger + custom event
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setOpen(true);
      }
    };

    const handleOpenAdmin = () => setOpen(true);

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('open-admin', handleOpenAdmin as unknown as EventListener);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('open-admin', handleOpenAdmin as unknown as EventListener);
    };
  }, []);

  useEffect(() => {
    // Check auth status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if user is admin
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        setIsAdmin(!!data);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    toast({
      title: "Uitgelogd",
      description: "Je bent succesvol uitgelogd",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0">
        {!user || !isAdmin ? (
          <AdminLogin onSuccess={() => setLoading(false)} />
        ) : (
          <AdminDashboard user={user} onLogout={handleLogout} />
        )}
      </DialogContent>
    </Dialog>
  );
};
