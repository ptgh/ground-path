import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/components/AuthPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const PractitionerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSocialWorker, isMentalHealthProfessional, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (!isSocialWorker() && !isMentalHealthProfessional() && !isAdmin())) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect /auth to /practitioner/auth for backwards compatibility */}
          <Route path="/auth" element={<Navigate to="/practitioner/auth" replace />} />
          <Route path="/practitioner/auth" element={<AuthPage />} />
          <Route path="/practitioner/dashboard" element={<PractitionerProtectedRoute><div className="min-h-screen bg-background p-8"><h1 className="text-3xl font-bold">Practitioner Dashboard</h1><p className="text-muted-foreground mt-2">Welcome to your professional workspace.</p></div></PractitionerProtectedRoute>} />
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
