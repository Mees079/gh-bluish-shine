import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminPanel } from "@/components/admin/AdminPanel";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Rules from "./pages/Rules";
import Support from "./pages/Support";
import StaffLogin from "./pages/StaffLogin";
import StaffDashboard from "./pages/StaffDashboard";
import DeveloperLogin from "./pages/DeveloperLogin";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import MeosLogin from "./pages/MeosLogin";
import MeosDashboard from "./pages/MeosDashboard";
import ContentCreatorLogin from "./pages/ContentCreatorLogin";
import ContentCreatorDashboard from "./pages/ContentCreatorDashboard";
import OnderwereldLogin from "./pages/OnderwereldLogin";
import OnderwereldDashboard from "./pages/OnderwereldDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      
      <AdminPanel />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
