import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "@/components/AuthPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Redirect /auth to /practitioner/auth for backwards compatibility */}
          <Route path="/auth" element={<Navigate to="/practitioner/auth" replace />} />
          <Route path="/practitioner/auth" element={<AuthPage />} />
          <Route path="/practitioner/dashboard" element={<div className="min-h-screen bg-background p-8"><h1 className="text-3xl font-bold">Practitioner Dashboard</h1><p className="text-muted-foreground mt-2">Welcome to your professional workspace.</p></div>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
