import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "@/components/AuthPage";
import AuthCallback from "@/components/AuthCallback";
import AuthenticatedRoute from "@/components/AuthenticatedRoute";
import LinkedInCallback from "@/components/LinkedInCallback";
import ProtectedRoute from "@/components/ProtectedRoute";
import VerifiedPractitionerRoute from "@/components/VerifiedPractitionerRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AIAssistant } from "./components/AIAssistant";
import { ClientAIAssistant } from "./components/ClientAIAssistant";
import GoogleAnalytics from "./components/GoogleAnalytics";
import ScrollToTop from "./components/ScrollToTop";
import { useAuth, AuthProvider } from "./hooks/useAuth";

// Lazy-load heavy / less-critical routes to keep the initial bundle small
const Dashboard = lazy(() => import("@/components/Dashboard"));
const Resources = lazy(() => import("./pages/Resources"));
const ProfessionalForms = lazy(() => import("./pages/ProfessionalForms"));
const PHQ9Form = lazy(() => import("./components/forms/PHQ9Form"));
const GAD7Form = lazy(() => import("./components/forms/GAD7Form"));
const DASS21Form = lazy(() => import("./components/forms/DASS21Form").then(m => ({ default: m.DASS21Form })));
const MSEForm = lazy(() => import("./components/forms/MSEForm").then(m => ({ default: m.MSEForm })));
const SuicideRiskForm = lazy(() => import("./components/forms/SuicideRiskForm").then(m => ({ default: m.SuicideRiskForm })));
const TreatmentPlanForm = lazy(() => import("./components/forms/TreatmentPlanForm").then(m => ({ default: m.TreatmentPlanForm })));
const ClientIntakeForm = lazy(() => import("./components/forms/ClientIntakeForm").then(m => ({ default: m.ClientIntakeForm })));
const GAFForm = lazy(() => import("./components/forms/GAFForm").then(m => ({ default: m.GAFForm })));
const SafetyPlanForm = lazy(() => import("./components/forms/SafetyPlanForm").then(m => ({ default: m.SafetyPlanForm })));
const CrisisInterventionForm = lazy(() => import("./components/forms/CrisisInterventionForm").then(m => ({ default: m.CrisisInterventionForm })));
const CPDLogForm = lazy(() => import("./components/forms/CPDLogForm").then(m => ({ default: m.CPDLogForm })));
const IncidentReportForm = lazy(() => import("./components/forms/IncidentReportForm").then(m => ({ default: m.IncidentReportForm })));
const ProgressNotesForm = lazy(() => import("./components/forms/ProgressNotesForm").then(m => ({ default: m.ProgressNotesForm })));
const CaseReviewForm = lazy(() => import("./components/forms/CaseReviewForm").then(m => ({ default: m.CaseReviewForm })));
const SupervisionRecordForm = lazy(() => import("./components/forms/SupervisionRecordForm").then(m => ({ default: m.SupervisionRecordForm })));
const ReflectivePracticeForm = lazy(() => import("./components/forms/ReflectivePracticeForm").then(m => ({ default: m.ReflectivePracticeForm })));
const BDIForm = lazy(() => import("./components/forms/BDIForm").then(m => ({ default: m.BDIForm })));
const UnsubscribePage = lazy(() => import("./pages/Unsubscribe"));
const ConfirmPage = lazy(() => import("./pages/Confirm"));
const Article = lazy(() => import("./pages/Article"));
const VoiceSessionPage = lazy(() => import("./pages/VoiceSession"));
const Messages = lazy(() => import("./pages/Messages"));
const PractitionerVerify = lazy(() => import("./pages/PractitionerVerify"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const Book = lazy(() => import("./pages/Book"));
const JoinSession = lazy(() => import("./pages/JoinSession"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const AdminMailingList = lazy(() => import("./pages/AdminMailingList"));
const AdminM365Hub = lazy(() => import("./pages/AdminM365Hub"));
const AdminIntake = lazy(() => import("./pages/AdminIntake"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const PractitionerProfile = lazy(() => import("./pages/PractitionerProfile"));
const SecureResources = lazy(() => import("./pages/SecureResources"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const AIAssistantRouter = () => {
  const location = useLocation();
  const { user } = useAuth();

  // App-shell ("dashboard-style") practitioner routes — assistant is the
  // signed-in practitioner assistant. All other routes (including the public
  // /practitioner/:id profile page) get the public client assistant.
  const PRACTITIONER_APP_PREFIXES = [
    '/practitioner/dashboard',
    '/practitioner/messages',
    '/practitioner/forms',
    '/practitioner/admin',
    '/practitioner/verify',
    '/practitioner/auth',
  ];
  const isPractitionerApp = PRACTITIONER_APP_PREFIXES.some(p => location.pathname.startsWith(p));

  if (isPractitionerApp && user) {
    return <AIAssistant />;
  }

  if (!isPractitionerApp) {
    return <ClientAIAssistant />;
  }

  return null;
};

const AuthCompletionRouter = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/auth/callback') {
      return;
    }

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
            <ScrollToTop />
            <AuthCompletionRouter />
            <GoogleAnalytics />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/book" element={<Book />} />
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
                <Route path="/auth" element={<AuthPage defaultUserType="user" />} />
                <Route path="/practitioner/auth" element={<AuthPage />} />
                <Route path="/practitioner/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/callback" element={<LinkedInCallback />} />
                <Route path="/practitioner/dashboard" element={<VerifiedPractitionerRoute><Dashboard /></VerifiedPractitionerRoute>} />
                <Route path="/practitioner/messages" element={<VerifiedPractitionerRoute><Messages /></VerifiedPractitionerRoute>} />
                <Route path="/practitioner/admin" element={<VerifiedPractitionerRoute><AdminLayout /></VerifiedPractitionerRoute>}>
                  <Route index element={<Navigate to="intake" replace />} />
                  <Route path="intake" element={<AdminIntake />} />
                  <Route path="m365" element={<AdminM365Hub />} />
                </Route>
                <Route path="/messages" element={<AuthenticatedRoute><Messages /></AuthenticatedRoute>} />
                <Route path="/dashboard" element={<AuthenticatedRoute><ClientDashboard /></AuthenticatedRoute>} />
                <Route path="/session/:bookingId" element={<AuthenticatedRoute><JoinSession /></AuthenticatedRoute>} />
                <Route path="/account/billing" element={<AuthenticatedRoute><BillingPage /></AuthenticatedRoute>} />
                <Route path="/secure-resources" element={<AuthenticatedRoute><SecureResources /></AuthenticatedRoute>} />
                {/* Public practitioner profile — must come after all specific /practitioner/* routes */}
                <Route path="/practitioner/:userId" element={<PractitionerProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <AIAssistantRouter />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
