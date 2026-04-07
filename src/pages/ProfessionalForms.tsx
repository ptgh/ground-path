import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
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
import { pdfService } from '@/services/pdfService';
import FormInfoModal from '@/components/forms/FormInfoModal';

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
  source?: string;
  sourceUrl?: string;
}

const ProfessionalForms = () => {
  const { user, profile, roles } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewingForm, setViewingForm] = useState<ProfessionalForm | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const userRoles = roles.map(r => r.role);
  const isSocialWorker = userRoles.includes('social_worker');
  const isMentalHealthProfessional = userRoles.includes('mental_health_professional');

  // Scroll to top when category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory]);

  // Stagger-animate form cards on category change
  useEffect(() => {
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.form-card');
      gsap.fromTo(cards, 
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [selectedCategory]);

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
          lastUpdated: '2024-01-20',
          source: 'Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues',
          sourceUrl: 'https://www.phqscreeners.com/select-screener'
        },
        {
          id: 'gad-7',
          title: 'GAD-7 Anxiety Scale',
          description: 'Generalized Anxiety Disorder 7-item scale',
          category: 'standardized-assessments',
          required: true,
          formType: 'interactive',
          downloadUrl: '/forms/GAD-7.pdf',
          lastUpdated: '2024-01-20',
          source: 'Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues',
          sourceUrl: 'https://www.phqscreeners.com/select-screener'
        },
        {
          id: 'dass-21',
          title: 'DASS-21 Scale',
          description: 'Depression, Anxiety and Stress Scale - 21 Items',
          category: 'standardized-assessments',
          required: false,
          formType: 'interactive',
          downloadUrl: '/forms/DASS-21.pdf',
          lastUpdated: '2024-01-18',
          source: 'Psychology Foundation of Australia',
          sourceUrl: 'https://www2.psy.unsw.edu.au/dass/'
        },
        {
          id: 'k10',
          title: 'K10 – Kessler Psychological Distress Scale',
          description: '10 item screening tool measuring psychological distress widely used in Australian healthcare systems.',
          category: 'standardized-assessments',
          required: false,
          formType: 'interactive',
          downloadUrl: '/forms/K10.pdf',
          lastUpdated: '2024-01-15',
          source: 'Kessler Psychological Distress Scale',
          sourceUrl: 'https://www.abs.gov.au/ausstats/abs@.nsf/Lookup/4817.0.55.001Chapter92007-08'
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
          lastUpdated: '2024-01-22',
          source: 'Standard clinical assessment tool',
          sourceUrl: 'https://www.psychiatry.org/psychiatrists/practice/dsm'
        },
        {
          id: 'suicide-risk-assessment',
          title: 'Suicide Risk Assessment',
          description: 'Comprehensive suicide risk evaluation tool',
          category: 'clinical-assessments',
          required: true,
          formType: 'interactive',
          downloadUrl: '/forms/Suicide-Risk-Assessment.pdf',
          lastUpdated: '2024-01-20',
          source: 'Evidence-based clinical assessment',
          sourceUrl: 'https://www.sprc.org/settings/healthcare'
        },
        {
          id: 'gaf-scale',
          title: 'Global Assessment of Functioning',
          description: 'GAF scale for overall functioning assessment',
          category: 'clinical-assessments',
          required: false,
          formType: 'interactive',
          downloadUrl: '/forms/GAF.pdf',
          lastUpdated: '2024-01-18',
          source: 'American Psychiatric Association DSM-IV-TR',
          sourceUrl: 'https://www.psychiatry.org/psychiatrists/practice/dsm'
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
          lastUpdated: '2024-01-25',
          source: 'Stanley & Brown Safety Planning Intervention',
          sourceUrl: 'https://www.sprc.org/settings/healthcare'
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
          formType: 'interactive',
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
          formType: 'interactive',
          downloadUrl: '/forms/Progress-Notes.pdf',
          lastUpdated: '2024-01-22'
        },
        {
          id: 'case-review',
          title: 'Case Review Summary',
          description: 'Comprehensive case review and planning template',
          category: 'client-management',
          required: false,
          formType: 'interactive',
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
          formType: 'interactive',
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
          formType: 'interactive',
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

  const getFormTypeFromId = (formId: string): string => {
    const formTypeMap: Record<string, string> = {
      'phq-9': 'PHQ-9',
      'gad-7': 'GAD-7',
      'dass-21': 'DASS-21',
      'mental-status-exam': 'MSE',
      'suicide-risk-assessment': 'Suicide Risk Assessment',
      'gaf-scale': 'GAF',
      'safety-planning': 'Safety Plan',
      'crisis-intervention': 'Crisis Intervention',
      'client-intake': 'Client Intake',
      'treatment-plan': 'Treatment Plan',
      'cpd-log': 'CPD Log',
      'k10': 'K10',
      'incident-report': 'Incident Report'
    };
    return formTypeMap[formId] || formId;
  };

  const handleFormAction = async (form: ProfessionalForm, action: 'view' | 'download' | 'fill') => {
    const formType = getFormTypeFromId(form.id);
    
    switch (action) {
      case 'view':
        // Open the form info modal
        setViewingForm(form);
        break;
      case 'download':
        try {
          await pdfService.downloadBlankForm(formType, `${form.title.replace(/\s+/g, '-')}.pdf`);
        } catch (error) {
          console.error('Failed to download form:', error);
          // Fallback to original URL if available
          if (form.downloadUrl) {
            const link = document.createElement('a');
            link.href = form.downloadUrl;
            link.download = `${form.title.replace(/\s+/g, '-')}.pdf`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
              document.body.removeChild(link);
            }, 100);
          }
        }
        break;
      case 'fill':
        if (form.formType === 'interactive') {
          navigate(`/practitioner/forms/${form.id}/fill`);
        } else {
          // For non-interactive forms, show the blank professional form
          try {
            await pdfService.viewBlankForm(formType);
          } catch (error) {
            console.error('Failed to view form:', error);
            if (form.downloadUrl) {
              window.open(form.downloadUrl, '_blank');
            }
          }
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
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/practitioner/dashboard')}
                className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Button>
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Professional Forms</h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
                Access validated clinical tools, templates, and documentation for professional practice.
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="h-8 text-xs"
              >
                All Forms
              </Button>
              {formCategories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <category.icon className="h-3.5 w-3.5" />
                  {category.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Forms Grid */}
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {getFilteredForms().map(form => {
              const FormTypeIcon = getFormTypeIcon(form.formType);
              const typeBadge = getFormTypeBadge(form.formType);
              
              return (
                <Card key={form.id} className="form-card group hover:shadow-md hover:border-sage-300 transition-all duration-200 flex flex-col opacity-0 border-border/60">
                  <CardHeader className="pb-2 flex-1">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <FormTypeIcon className="h-4 w-4 text-sage-600" />
                        {form.required && (
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                      <Badge variant={typeBadge.variant} className="text-[10px] h-5">{typeBadge.label}</Badge>
                    </div>
                    <CardTitle className="text-base leading-snug">{form.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">{form.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2.5">
                      {form.source && (
                        <div className="text-[11px] text-muted-foreground border-l-2 border-sage-200 pl-2 leading-relaxed">
                          {form.source}
                          {form.sourceUrl && (
                            <a 
                              href={form.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline ml-1"
                            >
                              →
                            </a>
                          )}
                        </div>
                      )}
                      
                      {/* Primary: Fill/Open */}
                      <Button 
                        size="sm" 
                        onClick={() => handleFormAction(form, 'fill')}
                        className="w-full gap-1.5"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        {form.formType === 'interactive' ? 'Fill Interactive Form' : 'Open Form'}
                      </Button>

                      {/* Secondary row */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleFormAction(form, 'view')}
                          className="flex-1 gap-1.5 text-xs h-8"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleFormAction(form, 'download')}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-3.5 w-3.5" />
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
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-foreground mb-4">Browse by Category</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {formCategories.map(category => (
                   <Card 
                    key={category.id} 
                    className="cursor-pointer hover:shadow-md hover:border-sage-300 transition-all duration-200 group border-border/60"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      <category.icon className="h-7 w-7 mx-auto text-sage-600 group-hover:scale-110 transition-transform duration-200" />
                      <p className="text-sm font-medium text-foreground leading-tight">{category.title}</p>
                      <Badge variant="secondary" className="text-[10px] bg-sage-100 text-sage-700">
                        {category.forms.length} forms
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Help Section */}
          <Card className="mt-8 border-sage-200 bg-sage-50/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-sage-100 p-2.5 shrink-0">
                  <FileText className="h-5 w-5 text-sage-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Need help with forms?</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All forms meet professional standards and regulatory requirements. Contact your supervisor or professional body for guidance.
                  </p>
                  <div className="flex gap-2 pt-1">
                     <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/#contact')}>
                      Contact Support
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => window.open('https://www.aasw.asn.au/practitioner-resources/practice-standards', '_blank')}>
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

      {/* Form Info Modal */}
      <FormInfoModal
        isOpen={!!viewingForm}
        onClose={() => setViewingForm(null)}
        form={viewingForm}
        onDownload={() => {
          if (viewingForm) {
            handleFormAction(viewingForm, 'download');
            setViewingForm(null);
          }
        }}
        onFill={() => {
          if (viewingForm) {
            handleFormAction(viewingForm, 'fill');
            setViewingForm(null);
          }
        }}
      />
    </div>
  );
};

export default ProfessionalForms;