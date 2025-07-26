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
      id: 'standardized-assessments',
      title: 'Standardized Assessments',
      description: 'Validated clinical assessment tools and questionnaires',
      icon: ClipboardCheck,
      color: 'text-emerald-600',
      forms: [
        {
          id: 'phq-9',
          title: 'PHQ-9 Depression Questionnaire',
          description: 'Patient Health Questionnaire for depression screening',
          category: 'standardized-assessments',
          required: true,
          formType: 'interactive',
          downloadUrl: '/forms/PHQ-9.pdf',
          lastUpdated: '2024-01-20'
        },
        {
          id: 'gad-7',
          title: 'GAD-7 Anxiety Scale',
          description: 'Generalized Anxiety Disorder 7-item scale',
          category: 'standardized-assessments',
          required: true,
          formType: 'interactive',
          downloadUrl: '/forms/GAD-7.pdf',
          lastUpdated: '2024-01-20'
        },
        {
          id: 'dass-21',
          title: 'DASS-21 Scale',
          description: 'Depression, Anxiety and Stress Scale - 21 Items',
          category: 'standardized-assessments',
          required: false,
          formType: 'interactive',
          downloadUrl: '/forms/DASS-21.pdf',
          lastUpdated: '2024-01-18'
        },
        {
          id: 'beck-depression',
          title: 'Beck Depression Inventory',
          description: 'BDI-II for assessing depression severity',
          category: 'standardized-assessments',
          required: false,
          formType: 'pdf',
          downloadUrl: '/forms/BDI-II.pdf',
          lastUpdated: '2024-01-15'
        }
      ]
    },
    {
      id: 'clinical-assessments',
      title: 'Clinical Assessments',
      description: 'Professional clinical evaluation and diagnostic tools',
      icon: Brain,
      color: 'text-blue-600',
      forms: [
        {
          id: 'mental-status-exam',
          title: 'Mental Status Examination',
          description: 'Comprehensive mental state assessment',
          category: 'clinical-assessments',
          required: true,
          formType: 'interactive',
          downloadUrl: '/forms/MSE.pdf',
          lastUpdated: '2024-01-22'
        },
        {
          id: 'suicide-risk-assessment',
          title: 'Suicide Risk Assessment',
          description: 'Comprehensive suicide risk evaluation tool',
          category: 'clinical-assessments',
          required: true,
          formType: 'interactive',
          downloadUrl: '/forms/Suicide-Risk-Assessment.pdf',
          lastUpdated: '2024-01-20'
        },
        {
          id: 'gaf-scale',
          title: 'Global Assessment of Functioning',
          description: 'GAF scale for overall functioning assessment',
          category: 'clinical-assessments',
          required: false,
          formType: 'interactive',
          downloadUrl: '/forms/GAF.pdf',
          lastUpdated: '2024-01-18'
        }
      ]
    },
    {
      id: 'crisis-safety',
      title: 'Crisis & Safety Planning',
      description: 'Emergency intervention and safety planning tools',
      icon: AlertTriangle,
      color: 'text-red-600',
      forms: [
        {
          id: 'safety-planning',
          title: 'Stanley-Brown Safety Plan',
          description: 'Evidence-based safety planning intervention',
          category: 'crisis-safety',
          required: true,
          formType: 'interactive',
          downloadUrl: '/forms/Safety-Plan.pdf',
          lastUpdated: '2024-01-25'
        },
        {
          id: 'crisis-intervention',
          title: 'Crisis Intervention Form',
          description: 'Documentation for crisis intervention sessions',
          category: 'crisis-safety',
          required: true,
          formType: 'interactive',
          downloadUrl: '/forms/Crisis-Intervention.pdf',
          lastUpdated: '2024-01-22'
        },
        {
          id: 'incident-report',
          title: 'Critical Incident Report',
          description: 'Report critical incidents and adverse events',
          category: 'crisis-safety',
          required: true,
          formType: 'template',
          downloadUrl: '/forms/Incident-Report.pdf',
          lastUpdated: '2024-01-20'
        }
      ]
    },
    {
      id: 'client-management',
      title: 'Client Management',
      description: 'General client intake, assessment and case management',
      icon: User,
      color: 'text-indigo-600',
      forms: [
        {
          id: 'client-intake',
          title: 'Client Intake Assessment',
          description: 'Comprehensive client information and background',
          category: 'client-management',
          required: true,
          formType: 'interactive',
          downloadUrl: '/forms/Client-Intake.pdf',
          lastUpdated: '2024-01-24'
        },
        {
          id: 'treatment-plan',
          title: 'Treatment Planning Form',
          description: 'Structured treatment goals and intervention planning',
          category: 'client-management',
          required: true,
          formType: 'interactive',
          downloadUrl: '/forms/Treatment-Plan.pdf',
          lastUpdated: '2024-01-23'
        },
        {
          id: 'progress-notes',
          title: 'Session Progress Notes',
          description: 'Template for documenting therapy and case sessions',
          category: 'client-management',
          required: false,
          formType: 'template',
          downloadUrl: '/forms/Progress-Notes.pdf',
          lastUpdated: '2024-01-22'
        },
        {
          id: 'case-review',
          title: 'Case Review Summary',
          description: 'Comprehensive case review and planning template',
          category: 'client-management',
          required: false,
          formType: 'template',
          downloadUrl: '/forms/Case-Review.pdf',
          lastUpdated: '2024-01-20'
        }
      ]
    },
    {
      id: 'professional-development',
      title: 'Professional Development',
      description: 'Supervision, CPD tracking and professional growth tools',
      icon: Shield,
      color: 'text-purple-600',
      forms: [
        {
          id: 'supervision-record',
          title: 'Clinical Supervision Record',
          description: 'Document supervision sessions and learning outcomes',
          category: 'professional-development',
          required: true,
          formType: 'template',
          downloadUrl: '/forms/Supervision-Record.pdf',
          lastUpdated: '2024-01-25'
        },
        {
          id: 'cpd-log',
          title: 'CPD Activity Log',
          description: 'Track continuing professional development hours',
          category: 'professional-development',
          required: false,
          formType: 'interactive',
          downloadUrl: '/forms/CPD-Log.pdf',
          lastUpdated: '2024-01-24'
        },
        {
          id: 'reflective-practice',
          title: 'Reflective Practice Journal',
          description: 'Structured reflection on professional practice',
          category: 'professional-development',
          required: false,
          formType: 'template',
          downloadUrl: '/forms/Reflective-Practice.pdf',
          lastUpdated: '2024-01-22'
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
    switch (action) {
      case 'view':
        if (form.downloadUrl) {
          window.open(form.downloadUrl, '_blank');
        }
        break;
      case 'download':
        if (form.downloadUrl) {
          const link = document.createElement('a');
          link.href = form.downloadUrl;
          link.download = `${form.title.replace(/\s+/g, '-')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        break;
      case 'fill':
        // Open interactive form or print view
        if (form.formType === 'interactive') {
          // Navigate to form filling interface
          console.log('Opening interactive form:', form.title);
        } else {
          window.print();
        }
        break;
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {getFilteredForms().map(form => {
              const FormTypeIcon = getFormTypeIcon(form.formType);
              const typeBadge = getFormTypeBadge(form.formType);
              
              return (
                <Card key={form.id} className="group hover:shadow-lg transition-all duration-200 flex flex-col">
                  <CardHeader className="pb-3 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FormTypeIcon className="h-5 w-5 text-primary" />
                        {form.required && (
                          <Star className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight">{form.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{form.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground">
                        Last updated: {new Date(form.lastUpdated).toLocaleDateString()}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleFormAction(form, 'view')}
                          className="col-span-2"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleFormAction(form, 'download')}
                          className="px-2"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {form.formType === 'interactive' && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleFormAction(form, 'fill')}
                          className="w-full"
                        >
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          Fill Interactive Form
                        </Button>
                      )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {formCategories.map(category => (
                  <Card 
                    key={category.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardHeader className="text-center pb-3">
                      <category.icon className={`h-10 w-10 mx-auto mb-2 ${category.color} group-hover:scale-110 transition-transform duration-200`} />
                      <CardTitle className="text-base leading-tight">{category.title}</CardTitle>
                      <CardDescription className="text-xs leading-relaxed">{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 text-center">
                      <Badge variant="secondary" className="text-xs">
                        {category.forms.length} forms
                      </Badge>
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