import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "@/components/AuthPage";
import AuthCallback from "@/components/AuthCallback";
import LinkedInCallback from "@/components/LinkedInCallback";
import Dashboard from "@/components/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import VoiceSessionPage from "./pages/VoiceSession";
import Messages from "./pages/Messages";
import VerifyEmail from "./pages/VerifyEmail";
import PractitionerVerify from "./pages/PractitionerVerify";
import { AIAssistant } from "./components/AIAssistant";
import { ClientAIAssistant } from "./components/ClientAIAssistant";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

const AIAssistantRouter = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isPractitionerRoute = location.pathname.startsWith('/practitioner');

  if (isPractitionerRoute && user) {
    return <AIAssistant />;
  }

  if (!isPractitionerRoute) {
    return <ClientAIAssistant />;
  }

  return null;
};

const AuthCompletionRouter = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hasAuthHash =
      location.hash.includes('access_token') ||
      location.hash.includes('refresh_token') ||
      location.hash.includes('type=signup');

    if (!hasAuthHash) {
      return;
    }

    let mounted = true;

    const moveToCompletion = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted || !session?.user?.email_confirmed_at) {
        return;
      }

      const userType = session.user.user_metadata?.user_type === 'practitioner' ? 'practitioner' : 'user';
      sessionStorage.setItem('pending_signup_email', session.user.email || '');
      sessionStorage.setItem('pending_signup_user_type', userType);

      navigate(`/practitioner/auth?signup=complete&type=${userType}`, { replace: true });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') &&
        session?.user?.email_confirmed_at
      ) {
        sessionStorage.setItem('pending_signup_email', session.user.email || '');
        sessionStorage.setItem(
          'pending_signup_user_type',
          session.user.user_metadata?.user_type === 'practitioner' ? 'practitioner' : 'user'
        );
        navigate(
          `/practitioner/auth?signup=complete&type=${
            session.user.user_metadata?.user_type === 'practitioner' ? 'practitioner' : 'user'
          }`,
          { replace: true }
        );
      }
    });

    void moveToCompletion();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [location.hash, navigate]);

  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthCompletionRouter />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/article/:slug" element={<Article />} />
            <Route path="/voice-session" element={<VoiceSessionPage />} />
            <Route path="/confirm" element={<ConfirmPage />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/professional-forms" element={<ProfessionalForms />} />
            <Route path="/practitioner/forms" element={<ProfessionalForms />} />
            <Route path="/practitioner/verify" element={<PractitionerVerify />} />
            <Route path="/practitioner/forms/phq-9/fill" element={<ProtectedRoute><PHQ9Form /></ProtectedRoute>} />
            <Route path="/practitioner/forms/gad-7/fill" element={<ProtectedRoute><GAD7Form /></ProtectedRoute>} />
            <Route path="/practitioner/forms/dass-21/fill" element={<ProtectedRoute><DASS21Form /></ProtectedRoute>} />
            <Route path="/practitioner/forms/mental-status-exam/fill" element={<ProtectedRoute><MSEForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/suicide-risk-assessment/fill" element={<ProtectedRoute><SuicideRiskForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/treatment-plan/fill" element={<ProtectedRoute><TreatmentPlanForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/client-intake/fill" element={<ProtectedRoute><ClientIntakeForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/gaf-scale/fill" element={<ProtectedRoute><GAFForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/safety-planning/fill" element={<ProtectedRoute><SafetyPlanForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/crisis-intervention/fill" element={<ProtectedRoute><CrisisInterventionForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/cpd-log/fill" element={<ProtectedRoute><CPDLogForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/incident-report/fill" element={<ProtectedRoute><IncidentReportForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/progress-notes/fill" element={<ProtectedRoute><ProgressNotesForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/case-review/fill" element={<ProtectedRoute><CaseReviewForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/supervision-record/fill" element={<ProtectedRoute><SupervisionRecordForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/reflective-practice/fill" element={<ProtectedRoute><ReflectivePracticeForm /></ProtectedRoute>} />
            <Route path="/practitioner/forms/k10/fill" element={<ProtectedRoute><BDIForm /></ProtectedRoute>} />
            <Route path="/auth" element={<Navigate to="/practitioner/auth" replace />} />
            <Route path="/practitioner/auth" element={<AuthPage />} />
            <Route path="/practitioner/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/callback" element={<LinkedInCallback />} />
            <Route path="/practitioner/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/practitioner/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIAssistantRouter />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
