import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HacktownProvider } from "@/contexts/HacktownContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PrivateRoute } from "@/components/PrivateRoute";
import Dashboard from "@/pages/Dashboard";
import Days from "@/pages/Days";
import Venues from "@/pages/Venues";
import Slots from "@/pages/Slots";
import CapacityManagement from "@/pages/CapacityManagement";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <HacktownProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/days" element={<Days />} />
                      <Route path="/venues" element={<Venues />} />
                      <Route path="/slots" element={<Slots />} />
                      <Route path="/capacity" element={<CapacityManagement />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </PrivateRoute>
              }
            />
          </Routes>
        </HacktownProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
