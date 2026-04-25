import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  FileText, 
  BookOpen, 
  Calendar, 
  Activity, 
  Settings,
  Shield,
  Clock,
  BarChart3,
  PlusCircle,
  ArrowRight,
  Loader2,
  Globe,
  Newspaper,
  Copy,
  CheckCircle2,
  ShieldAlert,
  StickyNote,
  ClipboardList,
  Video
} from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ProfessionalProfileModal from './ProfessionalProfileModal';
import FormHistory from './FormHistory';
import NoteModal from './NoteModal';
import ProfessionalResources from './dashboard/ProfessionalResources';
import ArticleManager from './dashboard/ArticleManager';
import PractitionerApprovals from './dashboard/PractitionerApprovals';
import { NotificationPreferencesCard } from './dashboard/NotificationPreferencesCard';
import { notesService, Note } from '@/services/notesService';
import { ClientMessagesPanel } from './messaging/ClientMessagesPanel';
import NativeBooking from './dashboard/NativeBooking';
import Microsoft365Card from './dashboard/Microsoft365Card';
import SessionRatesCard from './dashboard/SessionRatesCard';
import PractitionerSubscriptionCard from './dashboard/PractitionerSubscriptionCard';
import PractitionerPayoutsCard from './dashboard/PractitionerPayoutsCard';
import { gsap } from 'gsap';

interface BookingIntegration {
  profile_url?: string | null;
  verified?: boolean;
  session_mode?: 'halaxy' | 'native_beta';
}

type SessionMode = 'halaxy' | 'native_beta';

const getSessionMode = (profile: { booking_integration?: unknown } | null): SessionMode => {
  const integration = profile?.booking_integration as BookingIntegration | undefined;
  return integration?.session_mode || 'halaxy';
};

/* ─── Stat card for the overview ─── */
const StatCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) => (
  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-semibold leading-tight text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground truncate">{label}</p>
    </div>
  </div>
);

/* ─── Loading skeleton for cards ─── */
const CardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-56 mt-1" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-3/4" />
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, profile, roles, loading: authLoading, updateProfile } = useAuth();
  const unreadCount = useUnreadMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'overview';
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'overview';
  });
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  useEffect(() => {
    if (location.pathname === '/practitioner/dashboard') {
      setIsNoteModalOpen(false);
      setSelectedNote(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      setIsNoteModalOpen(false);
      setSelectedNote(null);
    };
  }, []);

  useEffect(() => {
    if (buttonsRef.current) {
      const buttons = buttonsRef.current.querySelectorAll('.dashboard-cta');
      buttons.forEach((button) => {
        const handleMouseEnter = () => {
          gsap.to(button, { scale: 1.05, y: -2, duration: 0.3, ease: "power2.out" });
        };
        const handleMouseLeave = () => {
          gsap.to(button, { scale: 1, y: 0, duration: 0.3, ease: "power2.out" });
        };
        button.addEventListener('mouseenter', handleMouseEnter);
        button.addEventListener('mouseleave', handleMouseLeave);
        return () => {
          button.removeEventListener('mouseenter', handleMouseEnter);
          button.removeEventListener('mouseleave', handleMouseLeave);
        };
      });
    }
  }, []);

  const loadNotes = async () => {
    try {
      setLoadingNotes(true);
      const userNotes = await notesService.getNotes();
      setNotes(userNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleNoteModal = (note?: Note) => {
    setSelectedNote(note || null);
    setIsNoteModalOpen(true);
  };

  const handleNoteSave = (savedNote: Note) => {
    if (selectedNote) {
      setNotes(prev => prev.map(note => note.id === savedNote.id ? savedNote : note));
    } else {
      setNotes(prev => [savedNote, ...prev]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const userRoles = roles.map(r => r.role);
  const isAdmin = userRoles.includes('admin');

  const getWelcomeMessage = () => {
    if (isAdmin) return 'Administrator Dashboard';
    if (userRoles.includes('social_worker') && userRoles.includes('mental_health_professional')) return 'Welcome, Social Worker & Mental Health Professional';
    if (userRoles.includes('social_worker')) return 'Welcome, Social Worker';
    if (userRoles.includes('mental_health_professional')) return 'Welcome, Mental Health Professional';
    return 'Welcome to your Professional Dashboard';
  };

  const getProfessionBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive';
      case 'social_worker': return 'bg-primary/10 text-primary';
      case 'mental_health_professional': return 'bg-primary/10 text-primary';
      case 'moderator': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatProfession = (profession: string | null | undefined) => {
    if (!profession) return 'Not specified';
    return profession.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatRoleLabel = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const copyToClipboard = (value: string, label: string) => {
    if (!value || value === 'Not set' || value === 'Not provided' || value === 'Not specified' || value === 'No bio provided') return;
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const ProfileField = ({ label, value }: { label: string; value: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <p className="text-sm text-foreground flex-1">{value}</p>
        {value && value !== 'Not set' && value !== 'Not provided' && value !== 'Not specified' && value !== 'No bio provided' && (
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100" onClick={() => copyToClipboard(value, label)}>
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );

  const quickActions = [
    { title: 'Create Note', description: 'Document client interactions', icon: PlusCircle, action: () => handleNoteModal() },
    { title: 'View Resources', description: 'Access professional resources', icon: BookOpen, action: () => setActiveTab('resources') },
    { title: 'Professional Forms', description: 'Access specialized forms', icon: FileText, action: () => navigate('/practitioner/forms') },
    { title: 'Schedule Session', description: 'Book client appointments', icon: Calendar, action: () => { if (isAdmin || getSessionMode(profile) === 'native_beta') { setActiveTab('booking'); } else { console.log('Schedule'); } } }
  ];

  /* ─── Form categories for better scanning ─── */
  const formCategories = [
    {
      title: 'Screening & Assessment',
      forms: [
        { label: 'PHQ-9', desc: 'Depression screening', path: '/practitioner/forms/phq-9/fill' },
        { label: 'GAD-7', desc: 'Anxiety screening', path: '/practitioner/forms/gad-7/fill' },
        { label: 'DASS-21', desc: 'Depression, anxiety & stress', path: '/practitioner/forms/dass-21/fill' },
        { label: 'K10', desc: 'Psychological distress', path: '/practitioner/forms/k10/fill' },
        { label: 'GAF Scale', desc: 'Global assessment', path: '/practitioner/forms/gaf-scale/fill' },
        { label: 'Mental State Exam', desc: 'MSE assessment', path: '/practitioner/forms/mental-status-exam/fill' },
      ]
    },
    {
      title: 'Risk & Safety',
      forms: [
        { label: 'Suicide Risk', desc: 'Risk assessment', path: '/practitioner/forms/suicide-risk-assessment/fill' },
        { label: 'Safety Plan', desc: 'Client safety planning', path: '/practitioner/forms/safety-planning/fill' },
        { label: 'Crisis Intervention', desc: 'Emergency protocol', path: '/practitioner/forms/crisis-intervention/fill' },
      ]
    },
    {
      title: 'Client Management',
      forms: [
        { label: 'Client Intake', desc: 'New client assessment', path: '/practitioner/forms/client-intake/fill' },
        { label: 'Treatment Plan', desc: 'Treatment planning', path: '/practitioner/forms/treatment-plan/fill' },
        { label: 'Progress Notes', desc: 'Session documentation', path: '/practitioner/forms/progress-notes/fill' },
      ]
    },
    {
      title: 'Professional Development',
      forms: [
        { label: 'CPD Log', desc: 'Professional development', path: '/practitioner/forms/cpd-log/fill' },
        { label: 'Incident Report', desc: 'Report documentation', path: '/practitioner/forms/incident-report/fill' },
        { label: 'Case Review', desc: 'Case analysis', path: '/practitioner/forms/case-review/fill' },
        { label: 'Supervision Record', desc: 'Supervision documentation', path: '/practitioner/forms/supervision-record/fill' },
        { label: 'Reflective Practice', desc: 'Reflection journal', path: '/practitioner/forms/reflective-practice/fill' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ─── Welcome Header ─── */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14 mx-auto sm:mx-0 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-sm sm:text-lg bg-primary/10 text-primary">
                    {profile?.display_name?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground leading-tight tracking-tight">{getWelcomeMessage()}</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {profile?.display_name || user.email}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                    {userRoles.length > 0 ? (
                      userRoles.map(role => (
                        <Badge key={role} variant="secondary" className={`${getProfessionBadgeColor(role)} text-[11px] font-medium`}>
                          {formatRoleLabel(role)}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground text-[11px]">
                        Practitioner
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full h-auto p-1 gap-0.5 ${isAdmin ? 'grid-cols-4 lg:grid-cols-10' : getSessionMode(profile) === 'native_beta' ? 'grid-cols-4 lg:grid-cols-8' : 'grid-cols-4 lg:grid-cols-7'}`}>
              <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
              {(isAdmin || getSessionMode(profile) === 'native_beta') && (
                <TabsTrigger value="booking" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Calendar className="h-3 w-3 mr-1 hidden sm:inline" />
                  Booking
                </TabsTrigger>
              )}
              <TabsTrigger value="messages" className="relative text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MessageSquare className="h-3 w-3 mr-1 hidden sm:inline" />
                Messages
                {unreadCount > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="resources" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BookOpen className="h-3 w-3 mr-1 hidden sm:inline" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="forms" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-3 w-3 mr-1 hidden sm:inline" />
                Forms
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">History</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Notes</TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger value="articles" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Newspaper className="h-3 w-3 mr-1 hidden sm:inline" />
                    Articles
                  </TabsTrigger>
                  <TabsTrigger value="approvals" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Shield className="h-3 w-3 mr-1 hidden sm:inline" />
                    Approvals
                  </TabsTrigger>
                  <TabsTrigger
                    value="mailing"
                    onClick={() => navigate('/practitioner/admin/mailing-list')}
                    className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <MessageSquare className="h-3 w-3 mr-1 hidden sm:inline" />
                    Mailing
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="profile" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Settings</TabsTrigger>
            </TabsList>

            {/* ═══ Booking Tab ═══ */}
            {(isAdmin || getSessionMode(profile) === 'native_beta') && (
              <TabsContent value="booking" className="space-y-6">
                <NativeBooking />
              </TabsContent>
            )}

            {/* ═══ Overview Tab ═══ */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Total Notes" value={notes.length} icon={StickyNote} />
                <StatCard label="Unread Messages" value={unreadCount} icon={MessageSquare} />
                <StatCard label="Profession" value={formatProfession(profile?.profession)} icon={User} />
                <StatCard label="Active Since" value={new Date(user.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })} icon={Calendar} />
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent ref={buttonsRef}>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickActions.map((action, index) => (
                      <Button 
                        key={index}
                        variant="outline" 
                        className="dashboard-cta h-auto p-4 flex flex-col items-center gap-2 text-center border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                        onClick={action.action}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <action.icon className="h-4 w-4" />
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-sm">{action.title}</div>
                          <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{action.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity + Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Notes */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4 text-primary" />
                        Recent Notes
                      </CardTitle>
                      {notes.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">{notes.length} total</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingNotes ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex gap-3">
                            <Skeleton className="h-full w-0.5 shrink-0" />
                            <div className="space-y-1.5 flex-1">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notes.length > 0 ? (
                      <div className="space-y-1">
                        {notes.slice(0, 4).map((note) => (
                          <button
                            key={note.id}
                            onClick={() => handleNoteModal(note)}
                            className="w-full text-left border-l-2 border-primary/40 hover:border-primary pl-3 py-2 rounded-r-md hover:bg-primary/5 transition-colors group"
                          >
                            <h4 className="font-medium text-sm group-hover:text-primary truncate">{note.title}</h4>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(note.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </button>
                        ))}
                        <Button 
                          variant="ghost" 
                          className="w-full mt-2 text-primary hover:text-primary hover:bg-primary/10" 
                          size="sm"
                          onClick={() => setActiveTab('notes')}
                        >
                          View All Notes <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <StickyNote className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">No notes yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Create your first note to get started.</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => handleNoteModal()}>
                          <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                          New Note
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Professional Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Professional Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {[
                        { label: 'Profession', value: formatProfession(profile?.profession) },
                        { label: 'License Number', value: profile?.license_number || 'Not provided' },
                        { label: 'Session Mode', value: getSessionMode(profile) === 'native_beta' ? 'Native Beta (Teams)' : 'Halaxy Booking + Telehealth' },
                        { label: 'Active Since', value: new Date(user.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium text-foreground flex items-center gap-1.5">
                            {item.value}
                            {item.label === 'Session Mode' && getSessionMode(profile) === 'native_beta' && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50">Beta</Badge>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <ProfessionalProfileModal>
                      <Button variant="outline" className="dashboard-cta w-full border-primary/30 text-primary hover:bg-primary/10" size="sm">
                        Update Professional Info
                      </Button>
                    </ProfessionalProfileModal>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══ Messages Tab ═══ */}
            <TabsContent value="messages" className="space-y-6">
              <ClientMessagesPanel />
            </TabsContent>

            {/* ═══ Learning Tab ═══ */}
            <TabsContent value="resources" className="space-y-6">
              <ProfessionalResources />
            </TabsContent>

            {/* ═══ Forms Tab ═══ */}
            <TabsContent value="forms" className="space-y-8">
              {formCategories.map((category) => (
                <div key={category.title}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-foreground">{category.title}</h3>
                    <Separator className="flex-1" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {category.forms.map((form) => (
                      <Button
                        key={form.path}
                        variant="outline"
                        className="dashboard-cta h-auto py-3 px-4 flex items-center gap-3 border-border hover:border-primary/40 hover:bg-primary/5 text-left justify-start transition-all"
                        onClick={() => navigate(form.path)}
                      >
                        <ClipboardList className="h-4 w-4 text-primary/80 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium text-sm block">{form.label}</span>
                          <span className="text-[11px] text-muted-foreground block truncate">{form.desc}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* ═══ History Tab ═══ */}
            <TabsContent value="history" className="space-y-6">
              <FormHistory />
            </TabsContent>

            {/* ═══ Notes Tab ═══ */}
            <TabsContent value="notes" className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-primary" />
                        Your Notes & Activities
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {notes.length > 0 ? `${notes.length} note${notes.length === 1 ? '' : 's'}` : 'Manage your professional notes and activities'}
                      </CardDescription>
                    </div>
                    <Button 
                      className="dashboard-cta w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                      size="sm"
                      onClick={() => handleNoteModal()}
                    >
                      <PlusCircle className="h-4 w-4 mr-1.5" />
                      New Note
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingNotes ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="p-4 rounded-lg border border-border">
                          <Skeleton className="h-4 w-2/3 mb-2" />
                          <Skeleton className="h-3 w-full mb-1" />
                          <Skeleton className="h-3 w-1/4 mt-2" />
                        </div>
                      ))}
                    </div>
                  ) : notes.length > 0 ? (
                    <div className="space-y-2">
                      {notes.map((note: Note) => (
                        <div 
                          key={note.id} 
                          className="p-4 rounded-lg border border-border hover:border-primary/40 hover:shadow-sm cursor-pointer transition-all group"
                          onClick={() => handleNoteModal(note)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm group-hover:text-primary truncate">{note.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {note.content || 'No content'}
                              </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                              {new Date(note.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <StickyNote className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No notes yet</p>
                      <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
                        Create your first note to start documenting client interactions and professional activities.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Articles Tab (Admin) ═══ */}
            {isAdmin && (
              <TabsContent value="articles" className="space-y-6">
                <ArticleManager />
              </TabsContent>
            )}

            {/* ═══ Approvals Tab (Admin) ═══ */}
            {isAdmin && (
              <TabsContent value="approvals" className="space-y-6">
                <PractitionerApprovals />
              </TabsContent>
            )}

            {/* ═══ Settings Tab ═══ */}
            <TabsContent value="profile" className="space-y-6">
              {/* Verification Status Banner */}
              {profile?.professional_verified || profile?.verification_method === 'linkedin' ? (
                <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Verified Practitioner
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Unverified Practitioner
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Complete verification to unlock your full professional profile.
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900 shrink-0" onClick={() => navigate('/practitioner/verify')}>
                      Verify Now
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4 text-primary" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your professional profile and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ProfileField label="Display Name" value={profile?.display_name || 'Not set'} />
                    <ProfileField label="Email" value={user.email || ''} />
                    <ProfileField label="Profession" value={formatProfession(profile?.profession)} />
                    <ProfileField label="License Number" value={profile?.license_number || 'Not provided'} />
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">LinkedIn</label>
                      <div className="flex items-center gap-2">
                        {(profile?.professional_verified || profile?.verification_method === 'linkedin') ? (
                          <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-950 text-xs">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:bg-amber-950 text-xs">
                            Unverified
                          </Badge>
                        )}
                        {profile?.linkedin_profile ? (
                          <>
                            <a href={profile.linkedin_profile} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                              {profile.linkedin_profile}
                            </a>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100" onClick={() => { navigator.clipboard.writeText(profile.linkedin_profile || ''); toast.success('LinkedIn URL copied'); }}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not provided</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ProfileField label="Bio" value={profile?.bio || 'No bio provided'} />
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <ProfessionalProfileModal>
                      <Button className="dashboard-cta bg-primary hover:bg-primary/90 text-primary-foreground">Update Professional Profile</Button>
                    </ProfessionalProfileModal>
                  </div>
                </CardContent>
              </Card>

              <NotificationPreferencesCard userId={user.id} currentPrefs={profile?.notification_preferences} />

              <PractitionerSubscriptionCard />

              <PractitionerPayoutsCard />

              <SessionRatesCard />

              {/* Session Mode — admin only */}
              {isAdmin && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Video className="h-4 w-4 text-primary" />
                      Session Mode
                    </CardTitle>
                    <CardDescription>
                      Choose how your sessions are delivered to clients.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(['halaxy', 'native_beta'] as const).map((mode) => {
                      const currentMode = getSessionMode(profile);
                      const isSelected = currentMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/30'
                          }`}
                          onClick={async () => {
                            if (isSelected) return;
                            try {
                              await updateProfile({
                                booking_integration: {
                                  ...((profile?.booking_integration as BookingIntegration) || {}),
                                  session_mode: mode,
                                },
                              });
                              toast.success(`Session mode updated to ${mode === 'halaxy' ? 'Halaxy' : 'Native Beta'}`);
                            } catch {
                              toast.error('Failed to update session mode');
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-primary' : 'border-muted-foreground/40'
                            }`}>
                              {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {mode === 'halaxy' ? 'Halaxy (Production)' : 'Groundpath Native'}
                                </span>
                                {mode === 'native_beta' && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50">Beta</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {mode === 'halaxy'
                                  ? 'Halaxy booking & Halaxy Telehealth. Live production pathway.'
                                  : 'Teams-based sessions. Internal testing only.'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Microsoft 365 Integration — admin only */}
              {isAdmin && <Microsoft365Card />}

              {/* UK/International toggle — admin only, display-only for now */}
              {isAdmin && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Globe className="h-4 w-4 text-primary" />
                      International Registrations
                    </CardTitle>
                    <CardDescription>
                      Enable UK and international practitioner registrations. Currently Australia-only.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">Enable UK/International</p>
                        <p className="text-xs text-muted-foreground mt-0.5">SWE, BASW, and other international bodies</p>
                      </div>
                      <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground">Coming Soon</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      
      <NoteModal
        open={isNoteModalOpen}
        onOpenChange={setIsNoteModalOpen}
        note={selectedNote}
        onSave={handleNoteSave}
      />
    </div>
  );
};

export default Dashboard;
