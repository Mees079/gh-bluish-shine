import { useEffect, useState, Suspense, lazy } from "react";

const AdminPanel = lazy(() =>
  import("@/components/admin/AdminPanel").then((m) => ({ default: m.AdminPanel }))
);

/**
 * Laadt de zware admin-bundle pas nadat iemand het paneel opent
 * (CTRL+SHIFT+P of het "open-admin" event).
 */
export const AdminPanelGate = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setEnabled(true);
      }
    };
    const onOpen = () => setEnabled(true);

    window.addEventListener("keydown", onKey);
    window.addEventListener("open-admin", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-admin", onOpen as EventListener);
    };
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <AdminPanel defaultOpen />
    </Suspense>
  );
};
