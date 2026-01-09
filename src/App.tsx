import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HacktownProvider } from "@/contexts/HacktownContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Days from "@/pages/Days";
import Venues from "@/pages/Venues";
import Slots from "@/pages/Slots";
import CapacityManagement from "@/pages/CapacityManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <HacktownProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/days" element={<Days />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/slots" element={<Slots />} />
              <Route path="/capacity" element={<CapacityManagement />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </HacktownProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
