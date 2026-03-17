import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  Newspaper
} from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ProfessionalProfileModal from './ProfessionalProfileModal';
import FormHistory from './FormHistory';
import NoteModal from './NoteModal';
import ProfessionalResources from './dashboard/ProfessionalResources';
import ArticleManager from './dashboard/ArticleManager';
import { notesService, Note } from '@/services/notesService';
import { ClientMessagesPanel } from './messaging/ClientMessagesPanel';
import { gsap } from 'gsap';

const Dashboard = () => {
  const { user, profile, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  // Redirect unverified practitioners to verification page
  useEffect(() => {
    if (!authLoading && user && profile) {
      const userType = user.user_metadata?.user_type;
      if (userType === 'practitioner' && (!profile.verification_status || profile.verification_status === 'unverified')) {
        navigate('/practitioner/verify', { replace: true });
      }
    }
  }, [user, authLoading, profile, navigate]);

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
  const isSocialWorker = userRoles.includes('social_worker');
  const isMentalHealthProfessional = userRoles.includes('mental_health_professional');
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

  const professionalTools = {
    social_worker: [
      { name: 'AASW Registration', description: 'Manage registration status', icon: Shield },
      { name: 'CPD Tracking', description: 'Track professional development', icon: Award },
      { name: 'NDIS Resources', description: 'Access NDIS tools', icon: Users }
    ],
    mental_health_professional: [
      { name: 'Mental Health Tools', description: 'Assessment and therapy tools', icon: Brain },
      { name: 'Crisis Resources', description: 'Emergency intervention guides', icon: Heart },
      { name: 'Treatment Planning', description: 'Plan client treatment', icon: BarChart3 }
    ]
  };

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
              <div className="hidden lg:block">
                <a 
                  href="https://www.halaxy.com/profile/groundpath/location/1353667"
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
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full h-auto p-1 gap-1 ${isAdmin ? 'grid-cols-4 lg:grid-cols-7' : 'grid-cols-3 lg:grid-cols-6'}`}>
              <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="tools" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">Professional</TabsTrigger>
              <TabsTrigger value="resources" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">Resources</TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">History</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">Notes</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="articles" className="text-xs sm:text-sm py-2 px-2 sm:px-3 data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                  <Newspaper className="h-3 w-3 mr-1 hidden sm:inline" />
                  Articles
                </TabsTrigger>
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
                         <Button
                           variant="outline"
                            onClick={() => window.open('https://www.halaxy.com/profile/groundpath/location/1353667', '_blank')}
                           className="dashboard-cta flex-1 border-sage-200 text-sage-700 hover:bg-sage-50"
                           size="sm"
                         >
                           Halaxy Profile
                         </Button>
                        <a 
                          href="https://www.halaxy.com/profile/groundpath/location/1353667"
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Professional Tools Tab */}
            <TabsContent value="tools" className="space-y-6">
              {isSocialWorker && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Social Work Tools
                    </CardTitle>
                    <CardDescription>
                      Specialized tools for social work practice
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {professionalTools.social_worker.map((tool, index) => (
                         <Button key={index} variant="outline" className="dashboard-cta h-auto p-4 flex flex-col space-y-2 border-sage-200 hover:bg-sage-50">
                           <tool.icon className="h-8 w-8 text-sage-600" />
                           <div className="text-center">
                             <div className="font-medium">{tool.name}</div>
                             <div className="text-xs text-muted-foreground">{tool.description}</div>
                           </div>
                         </Button>
                       ))}
                     </div>
                  </CardContent>
                </Card>
              )}

              {isMentalHealthProfessional && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Mental Health Tools
                    </CardTitle>
                    <CardDescription>
                      Specialized tools for mental health practice
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {professionalTools.mental_health_professional.map((tool, index) => (
                         <Button key={index} variant="outline" className="dashboard-cta h-auto p-4 flex flex-col space-y-2 border-sage-200 hover:bg-sage-50">
                           <tool.icon className="h-8 w-8 text-sage-600" />
                           <div className="text-center">
                             <div className="font-medium">{tool.name}</div>
                             <div className="text-xs text-muted-foreground">{tool.description}</div>
                           </div>
                         </Button>
                       ))}
                     </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>General Professional Resources</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Button variant="outline" className="dashboard-cta border-sage-200 text-sage-700 hover:bg-sage-50" onClick={() => setActiveTab('resources')}>
                       <BookOpen className="h-4 w-4 mr-2" />
                       Professional Resources
                     </Button>
                     <Button variant="outline" className="dashboard-cta border-sage-200 text-sage-700 hover:bg-sage-50" onClick={() => navigate('/practitioner/forms')}>
                       <FileText className="h-4 w-4 mr-2" />
                       Professional Forms
                     </Button>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-6">
              <ProfessionalResources />
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

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Display Name</label>
                      <p className="text-sm text-muted-foreground">
                        {profile?.display_name || 'Not set'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Profession</label>
                       <p className="text-sm text-muted-foreground">
                         {formatProfession(profile?.profession)}
                       </p>
                     </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">License Number</label>
                      <p className="text-sm text-muted-foreground">
                        {profile?.license_number || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <p className="text-sm text-muted-foreground">
                      {profile?.bio || 'No bio provided'}
                    </p>
                  </div>
                   <div className="space-y-2">
                      <ProfessionalProfileModal>
                        <Button className="dashboard-cta bg-sage-600 hover:bg-sage-700 text-white">Update Professional Profile</Button>
                      </ProfessionalProfileModal>
                       <Button
                         variant="outline"
                         onClick={() => window.open('https://www.halaxy.com/profile/groundpath/location/1353667', '_blank')}
                         className="dashboard-cta w-full border-sage-200 text-sage-700 hover:bg-sage-50"
                       >
                         Halaxy Profile
                       </Button>
                   </div>
                </CardContent>
              </Card>
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