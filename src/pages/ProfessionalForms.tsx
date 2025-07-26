import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Eye, 
  User,
  Users,
  Brain,
  Heart,
  Shield,
  Calendar,
  ClipboardCheck,
  AlertTriangle,
  ArrowLeft,
  FileDown,
  Printer,
  Star
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface FormCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  forms: ProfessionalForm[];
}

interface ProfessionalForm {
  id: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  downloadUrl?: string;
  formType: 'pdf' | 'interactive' | 'template';
  lastUpdated: string;
}

const ProfessionalForms = () => {
  const { user, profile, roles } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const userRoles = roles.map(r => r.role);
  const isSocialWorker = userRoles.includes('social_worker');
  const isMentalHealthProfessional = userRoles.includes('mental_health_professional');

  const formCategories: FormCategory[] = [
    {
      id: 'client-management',
      title: 'Client Management',
      description: 'Forms for client intake, assessment, and ongoing management',
      icon: User,
      color: 'text-blue-600',
      forms: [
        {
          id: 'client-intake',
          title: 'Client Intake Form',
          description: 'Comprehensive client information and background assessment',
          category: 'client-management',
          required: true,
          formType: 'interactive',
          lastUpdated: '2024-01-15'
        },
        {
          id: 'risk-assessment',
          title: 'Risk Assessment Form',
          description: 'Evaluate client safety and risk factors',
          category: 'client-management',
          required: true,
          formType: 'interactive',
          lastUpdated: '2024-01-10'
        },
        {
          id: 'case-review',
          title: 'Case Review Template',
          description: 'Structured template for case review meetings',
          category: 'client-management',
          required: false,
          formType: 'template',
          lastUpdated: '2024-01-05'
        }
      ]
    },
    {
      id: 'mental-health',
      title: 'Mental Health Assessment',
      description: 'Specialized forms for mental health evaluation and treatment',
      icon: Brain,
      color: 'text-green-600',
      forms: [
        {
          id: 'mental-status-exam',
          title: 'Mental Status Examination',
          description: 'Comprehensive mental health assessment tool',
          category: 'mental-health',
          required: true,
          formType: 'interactive',
          lastUpdated: '2024-01-12'
        },
        {
          id: 'treatment-plan',
          title: 'Treatment Planning Form',
          description: 'Develop and document treatment goals and interventions',
          category: 'mental-health',
          required: true,
          formType: 'interactive',
          lastUpdated: '2024-01-08'
        },
        {
          id: 'therapy-notes',
          title: 'Therapy Session Notes',
          description: 'Template for documenting therapy sessions',
          category: 'mental-health',
          required: false,
          formType: 'template',
          lastUpdated: '2024-01-20'
        }
      ]
    },
    {
      id: 'crisis-intervention',
      title: 'Crisis & Safety',
      description: 'Forms for crisis intervention and safety planning',
      icon: AlertTriangle,
      color: 'text-red-600',
      forms: [
        {
          id: 'safety-plan',
          title: 'Safety Planning Form',
          description: 'Create comprehensive safety plans for at-risk clients',
          category: 'crisis-intervention',
          required: true,
          formType: 'interactive',
          lastUpdated: '2024-01-18'
        },
        {
          id: 'incident-report',
          title: 'Incident Report Form',
          description: 'Document critical incidents and responses',
          category: 'crisis-intervention',
          required: true,
          formType: 'interactive',
          lastUpdated: '2024-01-14'
        },
        {
          id: 'crisis-contact',
          title: 'Crisis Contact Sheet',
          description: 'Emergency contact information and resources',
          category: 'crisis-intervention',
          required: false,
          formType: 'pdf',
          lastUpdated: '2024-01-01'
        }
      ]
    },
    {
      id: 'professional-development',
      title: 'Professional Development',
      description: 'Forms for supervision, training, and professional growth',
      icon: Shield,
      color: 'text-purple-600',
      forms: [
        {
          id: 'supervision-record',
          title: 'Supervision Record',
          description: 'Document supervision sessions and professional development',
          category: 'professional-development',
          required: true,
          formType: 'template',
          lastUpdated: '2024-01-16'
        },
        {
          id: 'cpd-tracker',
          title: 'CPD Activity Tracker',
          description: 'Track continuing professional development activities',
          category: 'professional-development',
          required: false,
          formType: 'interactive',
          lastUpdated: '2024-01-22'
        },
        {
          id: 'reflection-template',
          title: 'Professional Reflection Template',
          description: 'Structured reflection on practice and learning',
          category: 'professional-development',
          required: false,
          formType: 'template',
          lastUpdated: '2024-01-11'
        }
      ]
    }
  ];

  // Filter forms based on user roles
  const getAvailableForms = () => {
    let availableForms = formCategories.flatMap(category => category.forms);
    
    // Filter based on user roles if needed
    if (!isMentalHealthProfessional) {
      availableForms = availableForms.filter(form => 
        form.category !== 'mental-health' || form.id === 'treatment-plan'
      );
    }
    
    return availableForms;
  };

  const getFilteredForms = () => {
    const allForms = getAvailableForms();
    if (selectedCategory === 'all') return allForms;
    return allForms.filter(form => form.category === selectedCategory);
  };

  const handleFormAction = (form: ProfessionalForm, action: 'view' | 'download' | 'fill') => {
    // In a real app, this would handle the actual form action
    console.log(`${action} form:`, form.title);
    // Placeholder - would open form in modal or new page
  };

  const getFormTypeIcon = (formType: string) => {
    switch (formType) {
      case 'pdf': return FileDown;
      case 'interactive': return ClipboardCheck;
      case 'template': return FileText;
      default: return FileText;
    }
  };

  const getFormTypeBadge = (formType: string) => {
    switch (formType) {
      case 'pdf': return { label: 'PDF', variant: 'secondary' as const };
      case 'interactive': return { label: 'Interactive', variant: 'default' as const };
      case 'template': return { label: 'Template', variant: 'outline' as const };
      default: return { label: 'Document', variant: 'secondary' as const };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/practitioner/dashboard')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Professional Forms</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Access specialized forms and templates for professional practice
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Forms
              </Button>
              {formCategories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="gap-2"
                >
                  <category.icon className="h-4 w-4" />
                  {category.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Forms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredForms().map(form => {
              const FormTypeIcon = getFormTypeIcon(form.formType);
              const typeBadge = getFormTypeBadge(form.formType);
              
              return (
                <Card key={form.id} className="group hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FormTypeIcon className="h-5 w-5 text-primary" />
                        {form.required && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                    </div>
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    <CardDescription>{form.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground">
                        Last updated: {new Date(form.lastUpdated).toLocaleDateString()}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleFormAction(form, 'view')}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleFormAction(form, 'download')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleFormAction(form, 'fill')}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Categories Overview */}
          {selectedCategory === 'all' && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Form Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {formCategories.map(category => (
                  <Card 
                    key={category.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardHeader className="text-center">
                      <category.icon className={`h-12 w-12 mx-auto mb-2 ${category.color}`} />
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-center">
                        <Badge variant="secondary">
                          {category.forms.length} forms
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Help Section */}
          <Card className="mt-8 bg-muted/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Need Help with Forms?</h3>
                  <p className="text-muted-foreground mb-4">
                    All forms are designed to meet professional standards and regulatory requirements. 
                    If you need assistance completing any form or have questions about requirements, 
                    please contact your supervisor or professional body.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Contact Support
                    </Button>
                    <Button variant="outline" size="sm">
                      View Guidelines
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfessionalForms;