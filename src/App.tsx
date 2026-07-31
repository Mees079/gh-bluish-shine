import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

import Home from "./pages/Home";
import { AdminPanelGate } from "@/components/admin/AdminPanelGate";

const Shop = lazy(() => import("./pages/Shop"));
const Rules = lazy(() => import("./pages/Rules"));
const Support = lazy(() => import("./pages/Support"));
const StaffLogin = lazy(() => import("./pages/StaffLogin"));
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"));
const DeveloperLogin = lazy(() => import("./pages/DeveloperLogin"));
const DeveloperDashboard = lazy(() => import("./pages/DeveloperDashboard"));
const MeosLogin = lazy(() => import("./pages/MeosLogin"));
const MeosDashboard = lazy(() => import("./pages/MeosDashboard"));
const ContentCreatorLogin = lazy(() => import("./pages/ContentCreatorLogin"));
const ContentCreatorDashboard = lazy(() => import("./pages/ContentCreatorDashboard"));
const OnderwereldLogin = lazy(() => import("./pages/OnderwereldLogin"));
const OnderwereldDashboard = lazy(() => import("./pages/OnderwereldDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } },
});

const PageFallback = () => (
  <div className="min-h-dvh bg-background flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <AdminPanelGate />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/regels" element={<Rules />} />
            <Route path="/support" element={<Support />} />
            <Route path="/staff" element={<StaffLogin />} />
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/developer" element={<DeveloperLogin />} />
            <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
            <Route path="/meos" element={<MeosLogin />} />
            <Route path="/meos/dashboard" element={<MeosDashboard />} />
            <Route path="/contentcreator" element={<ContentCreatorLogin />} />
            <Route path="/contentcreator/dashboard" element={<ContentCreatorDashboard />} />
            <Route path="/onderwereld" element={<OnderwereldLogin />} />
            <Route path="/onderwereld/dashboard" element={<OnderwereldDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
