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
import { 
  User, 
  FileText, 
  BookOpen, 
  Calendar, 
  Activity, 
  Settings,
  Heart,
  Users,
  Brain,
  Shield,
  Award,
  Clock,
  BarChart3,
  PlusCircle,
  ArrowRight,
  Loader2,
  Globe,
  Newspaper,
  Copy,
  CheckCircle2,
  ShieldAlert
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
import { gsap } from 'gsap';

const Dashboard = () => {
  const { user, profile, roles, loading: authLoading } = useAuth();
  const unreadCount = useUnreadMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  // Note: Unverified practitioner redirect is now handled by VerifiedPractitionerRoute

  // Load user notes
  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  // Reset modal state when navigating to dashboard
  useEffect(() => {
    if (location.pathname === '/practitioner/dashboard') {
      setIsNoteModalOpen(false);
      setSelectedNote(null);
    }
  }, [location.pathname]);

  // Cleanup modal state on unmount
  useEffect(() => {
    return () => {
      setIsNoteModalOpen(false);
      setSelectedNote(null);
    };
  }, []);

  // GSAP button animations
  useEffect(() => {
    if (buttonsRef.current) {
      const buttons = buttonsRef.current.querySelectorAll('.dashboard-cta');
      
      buttons.forEach((button) => {
        const handleMouseEnter = () => {
          gsap.to(button, {
            scale: 1.05,
            y: -2,
            duration: 0.3,
            ease: "power2.out"
          });
        };
        
        const handleMouseLeave = () => {
          gsap.to(button, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          });
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
      // Update existing note
      setNotes(prev => prev.map(note => 
        note.id === savedNote.id ? savedNote : note
      ));
    } else {
      // Add new note
      setNotes(prev => [savedNote, ...prev]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const userRoles = roles.map(r => r.role);
  const isAdmin = userRoles.includes('admin');

  const getWelcomeMessage = () => {
    if (isAdmin) return 'Administrator Dashboard';
    if (isSocialWorker && isMentalHealthProfessional) return 'Welcome, Social Worker & Mental Health Professional';
    if (isSocialWorker) return 'Welcome, Social Worker';
    if (isMentalHealthProfessional) return 'Welcome, Mental Health Professional';
    return 'Welcome to your Professional Dashboard';
  };

  const getProfessionBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive';
      case 'social_worker': return 'bg-sage-100 text-sage-800';
      case 'mental_health_professional': return 'bg-sage-100 text-sage-700';
      case 'moderator': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatProfession = (profession: string) => {
    if (!profession) return 'Not specified';
    return profession
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const copyToClipboard = (value: string, label: string) => {
    if (!value || value === 'Not set' || value === 'Not provided' || value === 'Not specified' || value === 'No bio provided') return;
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const ProfileField = ({ label, value }: { label: string; value: string }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground flex-1">{value}</p>
        {value && value !== 'Not set' && value !== 'Not provided' && value !== 'Not specified' && value !== 'No bio provided' && (
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(value, label)}>
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
  const quickActions = [
    { 
      title: 'Create Note', 
      description: 'Document client interactions', 
      icon: PlusCircle, 
      action: () => handleNoteModal()
    },
    { 
      title: 'View Resources', 
      description: 'Access professional resources', 
      icon: BookOpen, 
      action: () => setActiveTab('resources')
    },
    { 
      title: 'Professional Forms', 
      description: 'Access specialized forms', 
      icon: FileText, 
      action: () => navigate('/practitioner/forms')
    },
    { 
      title: 'Schedule Session', 
      description: 'Book client appointments', 
      icon: Calendar, 
      action: () => console.log('Schedule')
    }
  ];


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto sm:mx-0">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-sm sm:text-lg">
                    {profile?.display_name?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{getWelcomeMessage()}</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {profile?.display_name || user.email}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                    {userRoles.length > 0 ? (
                      userRoles.map(role => (
                        <Badge key={role} variant="secondary" className={getProfessionBadgeColor(role)}>
                          {role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">
                        PRACTITIONER
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {(profile?.halaxy_integration as any)?.profile_url && (
                <div className="hidden lg:block">
                  <a 
                    href={(profile.halaxy_integration as any).profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <img 
                      src="https://cdn.halaxy.com/h/images/logo.png" 
                      alt="Book with Halaxy"
                      className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity"
                      loading="lazy"
                      decoding="async"
                    />
                  </a>
                </div>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full h-auto p-1 gap-1 ${isAdmin ? 'grid-cols-4 lg:grid-cols-9' : 'grid-cols-4 lg:grid-cols-7'}`}>
              <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="messages" className="relative text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                <MessageSquare className="h-3 w-3 mr-1 hidden sm:inline" />
                Messages
                {unreadCount > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="resources" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                <BookOpen className="h-3 w-3 mr-1 hidden sm:inline" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="forms" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                <FileText className="h-3 w-3 mr-1 hidden sm:inline" />
                Forms
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">History</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">Notes</TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger value="articles" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                    <Newspaper className="h-3 w-3 mr-1 hidden sm:inline" />
                    Articles
                  </TabsTrigger>
                  <TabsTrigger value="approvals" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                    <Shield className="h-3 w-3 mr-1 hidden sm:inline" />
                    Approvals
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="profile" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Access your most used professional tools
                  </CardDescription>
                </CardHeader>
                 <CardContent ref={buttonsRef}>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                     {quickActions.map((action, index) => (
                        <Button 
                          key={index}
                          variant="outline" 
                          className="dashboard-cta h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 text-center"
                          onClick={action.action}
                        >
                         <action.icon className="h-6 w-6 sm:h-8 sm:w-8 text-sage-600" />
                         <div className="text-center">
                           <div className="font-medium text-sm sm:text-base">{action.title}</div>
                           <div className="text-xs text-muted-foreground">{action.description}</div>
                         </div>
                       </Button>
                     ))}
                   </div>
                 </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingNotes ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : notes.length > 0 ? (
                      <div className="space-y-3">
                         {notes.slice(0, 3).map((note) => (
                           <div key={note.id} className="border-l-2 border-sage-600 pl-4">
                             <h4 className="font-medium">{note.title}</h4>
                             <p className="text-sm text-muted-foreground">
                               {new Date(note.created_at).toLocaleDateString()}
                             </p>
                           </div>
                         ))}
                        <Button 
                          variant="ghost" 
                          className="w-full mt-4" 
                          size="sm"
                          onClick={() => setActiveTab('notes')}
                        >
                          View All Notes <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No notes yet. Create your first note to get started.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Professional Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                         <span>Profession:</span>
                         <span className="font-medium">{formatProfession(profile?.profession)}</span>
                       </div>
                      <div className="flex justify-between text-sm">
                        <span>License Number:</span>
                        <span className="font-medium">{profile?.license_number || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Active Since:</span>
                        <span className="font-medium">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                       <ProfessionalProfileModal>
                         <Button variant="outline" className="dashboard-cta w-full border-sage-200 text-sage-700 hover:bg-sage-50" size="sm">
                           Update Professional Info
                         </Button>
                       </ProfessionalProfileModal>
                      <div className="flex items-center gap-2">
                          {(profile?.halaxy_integration as any)?.verified && (profile?.halaxy_integration as any)?.profile_url ? (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => window.open((profile.halaxy_integration as any).profile_url, '_blank')}
                                className="dashboard-cta flex-1 border-sage-200 text-sage-700 hover:bg-sage-50"
                                size="sm"
                              >
                                Halaxy Profile
                              </Button>
                              <a 
                                href={(profile.halaxy_integration as any).profile_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0"
                              >
                                <img 
                                  src="https://cdn.halaxy.com/h/images/logo.png" 
                                  alt="Halaxy booking system"
                                  className="h-8 w-auto"
                                  loading="lazy"
                                  decoding="async"
                                />
                              </a>
                            </>
                          ) : (
                            <ProfessionalProfileModal>
                              <span className="text-xs text-muted-foreground cursor-pointer hover:underline">Verify your Halaxy URL in Professional Profile settings</span>
                            </ProfessionalProfileModal>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <ClientMessagesPanel />
            </TabsContent>


            {/* Learning Tab */}
            <TabsContent value="resources" className="space-y-6">
              <ProfessionalResources />
            </TabsContent>

            {/* Forms Tab */}
            <TabsContent value="forms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Professional Forms
                  </CardTitle>
                  <CardDescription>
                    Clinical assessments, intake forms, and professional documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { label: 'Client Intake', desc: 'New client assessment', path: '/practitioner/forms/client-intake/fill' },
                      { label: 'PHQ-9', desc: 'Depression screening', path: '/practitioner/forms/phq-9/fill' },
                      { label: 'GAD-7', desc: 'Anxiety screening', path: '/practitioner/forms/gad-7/fill' },
                      { label: 'DASS-21', desc: 'Depression, anxiety & stress', path: '/practitioner/forms/dass-21/fill' },
                      { label: 'Mental State Exam', desc: 'MSE assessment', path: '/practitioner/forms/mental-status-exam/fill' },
                      { label: 'Suicide Risk', desc: 'Risk assessment', path: '/practitioner/forms/suicide-risk-assessment/fill' },
                      { label: 'Safety Plan', desc: 'Client safety planning', path: '/practitioner/forms/safety-planning/fill' },
                      { label: 'Treatment Plan', desc: 'Treatment planning', path: '/practitioner/forms/treatment-plan/fill' },
                      { label: 'Progress Notes', desc: 'Session documentation', path: '/practitioner/forms/progress-notes/fill' },
                      { label: 'GAF Scale', desc: 'Global assessment', path: '/practitioner/forms/gaf-scale/fill' },
                      { label: 'Crisis Intervention', desc: 'Emergency protocol', path: '/practitioner/forms/crisis-intervention/fill' },
                      { label: 'CPD Log', desc: 'Professional development', path: '/practitioner/forms/cpd-log/fill' },
                      { label: 'Incident Report', desc: 'Report documentation', path: '/practitioner/forms/incident-report/fill' },
                      { label: 'Case Review', desc: 'Case analysis', path: '/practitioner/forms/case-review/fill' },
                      { label: 'Supervision Record', desc: 'Supervision documentation', path: '/practitioner/forms/supervision-record/fill' },
                      { label: 'Reflective Practice', desc: 'Reflection journal', path: '/practitioner/forms/reflective-practice/fill' },
                      { label: 'K10', desc: 'Psychological distress', path: '/practitioner/forms/k10/fill' },
                    ].map((form) => (
                      <Button
                        key={form.path}
                        variant="outline"
                        className="dashboard-cta h-auto p-4 flex flex-col space-y-1 border-sage-200 hover:bg-sage-50 text-left items-start"
                        onClick={() => navigate(form.path)}
                      >
                        <span className="font-medium text-sm">{form.label}</span>
                        <span className="text-xs text-muted-foreground">{form.desc}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Form History Tab */}
            <TabsContent value="history" className="space-y-6">
              <FormHistory />
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Your Notes & Activities
                  </CardTitle>
                  <CardDescription>
                    Manage your professional notes and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingNotes ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <Button 
                         className="dashboard-cta w-full md:w-auto bg-sage-600 hover:bg-sage-700 text-white"
                         onClick={() => handleNoteModal()}
                       >
                         <PlusCircle className="h-4 w-4 mr-2" />
                         Create New Note
                       </Button>
                      {notes.length > 0 ? (
                        <div className="space-y-3">
                          {notes.map((note: Note) => (
                            <Card 
                              key={note.id} 
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => handleNoteModal(note)}
                            >
                              <CardContent className="p-4">
                                <h4 className="font-medium">{note.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {note.content || 'No content'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(note.created_at).toLocaleString()}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No notes yet. Create your first note to get started.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Articles Tab (Admin Only) */}
            {isAdmin && (
              <TabsContent value="articles" className="space-y-6">
                <ArticleManager />
              </TabsContent>
            )}

            {/* Approvals Tab (Admin Only) */}
            {isAdmin && (
              <TabsContent value="approvals" className="space-y-6">
                <PractitionerApprovals />
              </TabsContent>
            )}

            {/* Profile Tab */}
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your professional profile and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProfileField label="Display Name" value={profile?.display_name || 'Not set'} />
                    <ProfileField label="Email" value={user.email || ''} />
                    <ProfileField label="Profession" value={formatProfession(profile?.profession)} />
                    <ProfileField label="License Number" value={profile?.license_number || 'Not provided'} />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">LinkedIn</label>
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
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { navigator.clipboard.writeText(profile.linkedin_profile || ''); toast.success('LinkedIn URL copied'); }}>
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
                   <div className="space-y-2">
                      <ProfessionalProfileModal>
                        <Button className="dashboard-cta bg-sage-600 hover:bg-sage-700 text-white">Update Professional Profile</Button>
                      </ProfessionalProfileModal>
                       {(profile?.halaxy_integration as any)?.verified && (profile?.halaxy_integration as any)?.profile_url ? (
                         <Button
                           variant="outline"
                           onClick={() => window.open((profile.halaxy_integration as any).profile_url, '_blank')}
                           className="dashboard-cta w-full border-sage-200 text-sage-700 hover:bg-sage-50"
                         >
                           Halaxy Profile
                         </Button>
                       ) : (
                         <ProfessionalProfileModal>
                           <Button
                             variant="outline"
                             className="dashboard-cta w-full border-sage-200 text-sage-700 hover:bg-sage-50"
                           >
                             Verify Halaxy Profile
                           </Button>
                         </ProfessionalProfileModal>
                       )}
                   </div>
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <NotificationPreferencesCard userId={user.id} currentPrefs={profile?.notification_preferences} />
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