import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const InitializeDefaultAdmin = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeAdmin = async () => {
      if (initialized) return;

      try {
        // Call edge function to create default admin
        await supabase.functions.invoke('create-default-admin');
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize default admin:', error);
      }
    };

    initializeAdmin();
  }, []);

  return null;
};
