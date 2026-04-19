import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "@/components/AuthPage";
import AuthCallback from "@/components/AuthCallback";
import AuthenticatedRoute from "@/components/AuthenticatedRoute";

import LinkedInCallback from "@/components/LinkedInCallback";
import Dashboard from "@/components/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import VerifiedPractitionerRoute from "@/components/VerifiedPractitionerRoute";
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
import GoogleAnalytics from "./components/GoogleAnalytics";
import ClientDashboard from "./pages/ClientDashboard";
import Book from "./pages/Book";
import JoinSession from "./pages/JoinSession";
import BillingPage from "./pages/BillingPage";
import ScrollToTop from "./components/ScrollToTop";
// BookPractitioner merged into Book.tsx
import { useAuth, AuthProvider } from "./hooks/useAuth";

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
    // Don't intercept LinkedIn OAuth callback — LinkedInCallback handles it
    if (location.pathname === '/auth/callback') {
      return;
    }

    // Skip recovery links — let AuthPage handle PASSWORD_RECOVERY event
    if (location.hash.includes('type=recovery')) {
      return;
    }

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
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
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
  }, [location.hash, location.pathname, navigate]);

  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AuthCompletionRouter />
            <GoogleAnalytics />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/book" element={<Book />} />
              {/* BookPractitioner merged into /book — practitioner selection happens inline */}
              <Route path="/resources" element={<Resources />} />
              <Route path="/article/:slug" element={<Article />} />
              <Route path="/voice-session" element={<VoiceSessionPage />} />
              <Route path="/confirm" element={<ConfirmPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              <Route path="/verify-email" element={<Navigate to="/practitioner/auth" replace />} />
              <Route path="/professional-forms" element={<VerifiedPractitionerRoute><ProfessionalForms /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms" element={<VerifiedPractitionerRoute><ProfessionalForms /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/verify" element={<ProtectedRoute><PractitionerVerify /></ProtectedRoute>} />
              <Route path="/practitioner/forms/phq-9/fill" element={<VerifiedPractitionerRoute><PHQ9Form /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/gad-7/fill" element={<VerifiedPractitionerRoute><GAD7Form /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/dass-21/fill" element={<VerifiedPractitionerRoute><DASS21Form /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/mental-status-exam/fill" element={<VerifiedPractitionerRoute><MSEForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/suicide-risk-assessment/fill" element={<VerifiedPractitionerRoute><SuicideRiskForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/treatment-plan/fill" element={<VerifiedPractitionerRoute><TreatmentPlanForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/client-intake/fill" element={<VerifiedPractitionerRoute><ClientIntakeForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/gaf-scale/fill" element={<VerifiedPractitionerRoute><GAFForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/safety-planning/fill" element={<VerifiedPractitionerRoute><SafetyPlanForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/crisis-intervention/fill" element={<VerifiedPractitionerRoute><CrisisInterventionForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/cpd-log/fill" element={<VerifiedPractitionerRoute><CPDLogForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/incident-report/fill" element={<VerifiedPractitionerRoute><IncidentReportForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/progress-notes/fill" element={<VerifiedPractitionerRoute><ProgressNotesForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/case-review/fill" element={<VerifiedPractitionerRoute><CaseReviewForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/supervision-record/fill" element={<VerifiedPractitionerRoute><SupervisionRecordForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/reflective-practice/fill" element={<VerifiedPractitionerRoute><ReflectivePracticeForm /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/forms/k10/fill" element={<VerifiedPractitionerRoute><BDIForm /></VerifiedPractitionerRoute>} />
              <Route path="/auth" element={<Navigate to="/practitioner/auth" replace />} />
              <Route path="/practitioner/auth" element={<AuthPage />} />
              <Route path="/practitioner/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/callback" element={<LinkedInCallback />} />
              <Route path="/practitioner/dashboard" element={<VerifiedPractitionerRoute><Dashboard /></VerifiedPractitionerRoute>} />
              <Route path="/practitioner/messages" element={<VerifiedPractitionerRoute><Messages /></VerifiedPractitionerRoute>} />
              <Route path="/messages" element={<AuthenticatedRoute><Messages /></AuthenticatedRoute>} />
              <Route path="/dashboard" element={<AuthenticatedRoute><ClientDashboard /></AuthenticatedRoute>} />
              <Route path="/session/:bookingId" element={<AuthenticatedRoute><JoinSession /></AuthenticatedRoute>} />
              <Route path="/account/billing" element={<AuthenticatedRoute><BillingPage /></AuthenticatedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIAssistantRouter />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
