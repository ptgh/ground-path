import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "@/components/AuthPage";
import AuthCallback from "@/components/AuthCallback";
import Dashboard from "@/components/Dashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Resources from "./pages/Resources";
import ProfessionalForms from "./pages/ProfessionalForms";

const queryClient = new QueryClient();

const App = () => {
  // Clear any auth state on app load to prevent unwanted redirects
  useEffect(() => {
    const currentPath = window.location.pathname;
    console.log('App loading - current path:', currentPath);
    
    // If we're on root and there's some cached redirect, clear it
    if (currentPath === '/' && window.location.href.includes('practitioner')) {
      console.log('Clearing unwanted redirect, forcing home page load');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/practitioner/forms" element={<ProfessionalForms />} />
            {/* Redirect /auth to /practitioner/auth for backwards compatibility */}
            <Route path="/auth" element={<Navigate to="/practitioner/auth" replace />} />
            <Route path="/practitioner/auth" element={<AuthPage />} />
            <Route path="/practitioner/auth/callback" element={<AuthCallback />} />
            <Route path="/practitioner/dashboard" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
