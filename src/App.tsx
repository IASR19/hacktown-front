import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HacktownProvider } from "@/contexts/HacktownContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PrivateRoute } from "@/components/PrivateRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "@/pages/Dashboard";
import Days from "@/pages/Days";
import Venues from "@/pages/Venues";
import VenueInfrastructure from "@/pages/VenueInfrastructure";
import VenueAudiovisual from "@/pages/VenueAudiovisual";
import Slots from "@/pages/Slots";
import CapacityManagement from "@/pages/CapacityManagement";
import CapacityAnalysis from "@/pages/CapacityAnalysis";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <HacktownProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/days"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Days />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/venues"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Venues />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/venue-infrastructure"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <VenueInfrastructure />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/venue-audiovisual"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <VenueAudiovisual />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/slots"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Slots />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/capacity"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <CapacityManagement />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/capacity-analysis"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <CapacityAnalysis />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HacktownProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
