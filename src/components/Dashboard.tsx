import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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
  Loader2
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ProfessionalProfileModal from './ProfessionalProfileModal';

const Dashboard = () => {
  const { user, profile, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Dashboard: Redirecting unauthenticated user to auth page');
      navigate('/practitioner/auth');
    }
  }, [user, authLoading, navigate]);

  // Load user notes
  useEffect(() => {
    if (user) {
      // Simulate loading notes - in real app, fetch from Supabase
      setTimeout(() => {
        setNotes([
          { id: 1, title: 'Client Session Notes', created_at: '2024-01-10', content: 'Progress noted in therapy...' },
          { id: 2, title: 'Professional Development Plan', created_at: '2024-01-08', content: 'Goals for 2024...' }
        ]);
        setLoadingNotes(false);
      }, 1000);
    }
  }, [user]);

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
      case 'admin': return 'bg-red-100 text-red-800';
      case 'social_worker': return 'bg-blue-100 text-blue-800';
      case 'mental_health_professional': return 'bg-green-100 text-green-800';
      case 'moderator': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const quickActions = [
    { 
      title: 'Create Note', 
      description: 'Document client interactions', 
      icon: PlusCircle, 
      action: () => console.log('Create note')
    },
    { 
      title: 'View Resources', 
      description: 'Access professional resources', 
      icon: BookOpen, 
      action: () => navigate('/resources')
    },
    { 
      title: 'Professional Forms', 
      description: 'Access specialized forms', 
      icon: FileText, 
      action: () => console.log('Forms')
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {profile?.display_name?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{getWelcomeMessage()}</h1>
                  <p className="text-muted-foreground">
                    {profile?.display_name || user.email}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {userRoles.map(role => (
                      <Badge key={role} variant="secondary" className={getProfessionBadgeColor(role)}>
                        {role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <a 
                  href="https://www.halaxy.com/profile/mr-paul-habermann/social-worker/1722983"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <img 
                    src="https://cdn.halaxy.com/h/images/logo.png" 
                    alt="Book with Halaxy"
                    className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </a>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="tools" className="text-xs sm:text-sm">Professional</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs sm:text-sm">Notes</TabsTrigger>
              <TabsTrigger value="profile" className="text-xs sm:text-sm">Settings</TabsTrigger>
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
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                      <Button 
                        key={index}
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        onClick={action.action}
                      >
                        <action.icon className="h-8 w-8 text-primary" />
                        <div className="text-center">
                          <div className="font-medium">{action.title}</div>
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
                        {notes.slice(0, 3).map((note: any) => (
                          <div key={note.id} className="border-l-2 border-primary pl-4">
                            <h4 className="font-medium">{note.title}</h4>
                            <p className="text-sm text-muted-foreground">{note.created_at}</p>
                          </div>
                        ))}
                        <Button variant="ghost" className="w-full mt-4" size="sm">
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
                        <span className="font-medium">{profile?.profession || 'Not specified'}</span>
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
                        <Button variant="outline" className="w-full" size="sm">
                          Update Professional Info
                        </Button>
                      </ProfessionalProfileModal>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => window.open('https://www.halaxy.com/profile/mr-paul-habermann/social-worker/1722983', '_blank')}
                          className="flex-1"
                          size="sm"
                        >
                          Halaxy Profile
                        </Button>
                        <a 
                          href="https://www.halaxy.com/profile/mr-paul-habermann/social-worker/1722983"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                        >
                          <img 
                            src="https://cdn.halaxy.com/h/images/logo.png" 
                            alt="Halaxy"
                            className="h-8 w-auto"
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
                        <Button key={index} variant="outline" className="h-auto p-4 flex flex-col space-y-2">
                          <tool.icon className="h-8 w-8 text-blue-600" />
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
                        <Button key={index} variant="outline" className="h-auto p-4 flex flex-col space-y-2">
                          <tool.icon className="h-8 w-8 text-green-600" />
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
                    <Button variant="outline" onClick={() => navigate('/resources')}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Resource Library
                    </Button>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Professional Forms
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                      <Button className="w-full md:w-auto">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create New Note
                      </Button>
                      {notes.length > 0 ? (
                        <div className="space-y-3">
                          {notes.map((note: any) => (
                            <Card key={note.id}>
                              <CardContent className="p-4">
                                <h4 className="font-medium">{note.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">{note.created_at}</p>
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
                        {profile?.profession || 'Not specified'}
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
                       <Button>Update Professional Profile</Button>
                     </ProfessionalProfileModal>
                     <Button
                       variant="outline"
                       onClick={() => window.open('https://www.halaxy.com/profile/mr-paul-habermann/social-worker/1722983', '_blank')}
                       className="w-full"
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
    </div>
  );
};

export default Dashboard;