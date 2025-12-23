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
import PHQ9Form from "./components/forms/PHQ9Form";
import GAD7Form from "./components/forms/GAD7Form";
import { DASS21Form } from "./components/forms/DASS21Form";
import { MSEForm } from "./components/forms/MSEForm";
import { SuicideRiskForm } from "./components/forms/SuicideRiskForm";
import { TreatmentPlanForm } from "./components/forms/TreatmentPlanForm";
import { ClientIntakeForm } from "./components/forms/ClientIntakeForm";
import { GAFForm } from "./components/forms/GAFForm";
import { SafetyPlanForm } from "./components/forms/SafetyPlanForm";
import { CrisisInterventionForm } from "./components/forms/CrisisInterventionForm";
import { CPDLogForm } from "./components/forms/CPDLogForm";
import { IncidentReportForm } from "./components/forms/IncidentReportForm";
import { ProgressNotesForm } from "./components/forms/ProgressNotesForm";
import { CaseReviewForm } from "./components/forms/CaseReviewForm";
import { SupervisionRecordForm } from "./components/forms/SupervisionRecordForm";
import { ReflectivePracticeForm } from "./components/forms/ReflectivePracticeForm";
import { BDIForm } from "./components/forms/BDIForm";
import UnsubscribePage from "./pages/Unsubscribe";
import ConfirmPage from "./pages/Confirm";
import Article from "./pages/Article";

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
            <Route path="/article/:slug" element={<Article />} />
            <Route path="/confirm" element={<ConfirmPage />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/professional-forms" element={<ProfessionalForms />} />
            <Route path="/practitioner/forms" element={<ProfessionalForms />} />
        <Route path="/practitioner/forms/phq-9/fill" element={<PHQ9Form />} />
        <Route path="/practitioner/forms/gad-7/fill" element={<GAD7Form />} />
        <Route path="/practitioner/forms/dass-21/fill" element={<DASS21Form />} />
        <Route path="/practitioner/forms/mental-status-exam/fill" element={<MSEForm />} />
        <Route path="/practitioner/forms/suicide-risk-assessment/fill" element={<SuicideRiskForm />} />
        <Route path="/practitioner/forms/treatment-plan/fill" element={<TreatmentPlanForm />} />
        <Route path="/practitioner/forms/client-intake/fill" element={<ClientIntakeForm />} />
        <Route path="/practitioner/forms/gaf-scale/fill" element={<GAFForm />} />
        <Route path="/practitioner/forms/safety-planning/fill" element={<SafetyPlanForm />} />
        <Route path="/practitioner/forms/crisis-intervention/fill" element={<CrisisInterventionForm />} />
        <Route path="/practitioner/forms/cpd-log/fill" element={<CPDLogForm />} />
        <Route path="/practitioner/forms/incident-report/fill" element={<IncidentReportForm />} />
        <Route path="/practitioner/forms/progress-notes/fill" element={<ProgressNotesForm />} />
        <Route path="/practitioner/forms/case-review/fill" element={<CaseReviewForm />} />
        <Route path="/practitioner/forms/supervision-record/fill" element={<SupervisionRecordForm />} />
        <Route path="/practitioner/forms/reflective-practice/fill" element={<ReflectivePracticeForm />} />
        <Route path="/practitioner/forms/beck-depression/fill" element={<BDIForm />} />
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
