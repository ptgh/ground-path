import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ExternalLink, 
  BookOpen, 
  GraduationCap, 
  Users, 
  Scale,
  Shield,
  Globe
} from 'lucide-react';

const ProfessionalResources = () => {
  const [country, setCountry] = useState<'AU' | 'UK'>('AU');

  // Australian Professional Resources
  const auResources = {
    standards: [
      {
        title: "AASW Code of Ethics",
        description: "Australian Association of Social Workers ethical guidelines",
        url: "https://www.aasw.asn.au/about-aasw/ethics-standards/code-of-ethics",
        category: "Ethics",
        icon: <Scale className="h-5 w-5" />
      },
      {
        title: "AASW Practice Standards",
        description: "Comprehensive practice standards for social work professionals",
        url: "https://www.aasw.asn.au/about-aasw/ethics-standards/practice-standards/",
        category: "Standards",
        icon: <BookOpen className="h-5 w-5" />
      },
      {
        title: "AHPRA Registration Standards",
        description: "Registration standards for health practitioners",
        url: "https://www.ahpra.gov.au/Registration/Registration-Standards.aspx",
        category: "Registration",
        icon: <Shield className="h-5 w-5" />
      },
      {
        title: "PACFA Ethics & Practice Standards",
        description: "Psychotherapy and Counselling Federation of Australia guidelines",
        url: "https://www.pacfa.org.au/ethics-standards/",
        category: "Standards",
        icon: <BookOpen className="h-5 w-5" />
      }
    ],
    cpd: [
      {
        title: "AASW CPD Requirements",
        description: "Continuing Professional Development guidelines and tracking",
        url: "https://www.aasw.asn.au/careers-study/continuing-professional-development",
        category: "CPD",
        icon: <GraduationCap className="h-5 w-5" />
      },
      {
        title: "AASW Supervision Guidelines",
        description: "Best practice guidelines for professional supervision",
        url: "https://www.aasw.asn.au/about-aasw/ethics-standards/supervision-standards",
        category: "Supervision",
        icon: <Users className="h-5 w-5" />
      },
      {
        title: "Mental Health Social Work CPD",
        description: "Specialized CPD for mental health social workers",
        url: "https://www.aasw.asn.au/careers-study/areas-of-practice/mental-health",
        category: "Specialization",
        icon: <GraduationCap className="h-5 w-5" />
      }
    ],
    ndis: [
      {
        title: "NDIS Provider Portal",
        description: "Access the NDIS provider portal for service delivery",
        url: "https://www.ndis.gov.au/providers",
        category: "NDIS",
        icon: <Users className="h-5 w-5" />
      },
      {
        title: "NDIS Practice Standards",
        description: "Quality and safeguarding requirements for NDIS providers",
        url: "https://www.ndiscommission.gov.au/providers/registered-ndis-providers/provider-obligations-and-requirements/ndis-practice-standards",
        category: "NDIS",
        icon: <Shield className="h-5 w-5" />
      },
      {
        title: "NDIS Pricing Arrangements",
        description: "Current pricing guide and support catalogue",
        url: "https://www.ndis.gov.au/providers/pricing-arrangements",
        category: "NDIS",
        icon: <BookOpen className="h-5 w-5" />
      }
    ],
    clinical: [
      {
        title: "Black Dog Institute Clinical Resources",
        description: "Evidence-based tools for depression and mental health assessment",
        url: "https://www.blackdoginstitute.org.au/resources-support/clinician-resources/",
        category: "Assessment",
        icon: <BookOpen className="h-5 w-5" />
      },
      {
        title: "Phoenix Australia Trauma Guidelines",
        description: "Australian guidelines for PTSD and trauma treatment",
        url: "https://www.phoenixaustralia.org/australian-guidelines-for-ptsd/",
        category: "Assessment",
        icon: <BookOpen className="h-5 w-5" />
      },
      {
        title: "Orygen Clinical Practice Resources",
        description: "Youth mental health clinical guidelines and tools",
        url: "https://www.orygen.org.au/Training/Resources/Clinical-practice",
        category: "Youth Mental Health",
        icon: <Users className="h-5 w-5" />
      },
      {
        title: "Cultural Competency Resources",
        description: "Resources for culturally responsive practice",
        url: "https://www.aihw.gov.au/reports/indigenous-australians/cultural-safety-health-care-framework",
        category: "Cultural Practice",
        icon: <Users className="h-5 w-5" />
      }
    ]
  };

  // UK Professional Resources
  const ukResources = {
    standards: [
      {
        title: "Social Work England Standards",
        description: "Professional standards for social workers in England",
        url: "https://www.socialworkengland.org.uk/standards/professional-standards/",
        category: "Standards",
        icon: <Shield className="h-5 w-5" />
      },
      {
        title: "BASW Code of Ethics",
        description: "British Association of Social Workers ethical guidelines",
        url: "https://www.basw.co.uk/about-basw/code-ethics",
        category: "Ethics",
        icon: <Scale className="h-5 w-5" />
      },
      {
        title: "HCPC Standards of Proficiency",
        description: "Health and Care Professions Council standards",
        url: "https://www.hcpc-uk.org/standards/standards-of-proficiency/social-workers-in-england/",
        category: "Standards",
        icon: <BookOpen className="h-5 w-5" />
      },
      {
        title: "BACP Ethical Framework",
        description: "British Association for Counselling and Psychotherapy standards",
        url: "https://www.bacp.co.uk/events-and-resources/ethics-and-standards/ethical-framework-for-the-counselling-professions/",
        category: "Ethics",
        icon: <Scale className="h-5 w-5" />
      }
    ],
    cpd: [
      {
        title: "Social Work England CPD",
        description: "Continuing Professional Development requirements",
        url: "https://www.socialworkengland.org.uk/cpd/",
        category: "CPD",
        icon: <GraduationCap className="h-5 w-5" />
      },
      {
        title: "BASW Professional Development",
        description: "Training and development opportunities",
        url: "https://www.basw.co.uk/cpd-and-events",
        category: "CPD",
        icon: <GraduationCap className="h-5 w-5" />
      },
      {
        title: "Research in Practice",
        description: "Evidence-based resources for social work",
        url: "https://www.researchinpractice.org.uk/",
        category: "Evidence",
        icon: <BookOpen className="h-5 w-5" />
      }
    ],
    nhs: [
      {
        title: "NHS England Mental Health",
        description: "NHS mental health services and pathways",
        url: "https://www.england.nhs.uk/mental-health/",
        category: "NHS",
        icon: <Users className="h-5 w-5" />
      },
      {
        title: "NICE Guidelines",
        description: "National Institute for Health and Care Excellence guidance",
        url: "https://www.nice.org.uk/guidance/conditions-and-diseases/mental-health-and-behavioural-conditions",
        category: "Guidelines",
        icon: <BookOpen className="h-5 w-5" />
      },
      {
        title: "Skills for Care",
        description: "Workforce development for adult social care",
        url: "https://www.skillsforcare.org.uk/",
        category: "Training",
        icon: <GraduationCap className="h-5 w-5" />
      }
    ],
    clinical: [
      {
        title: "NICE Mental Health Guidelines",
        description: "Evidence-based clinical guidelines for mental health conditions",
        url: "https://www.nice.org.uk/guidance/conditions-and-diseases/mental-health-and-behavioural-conditions",
        category: "Guidelines",
        icon: <BookOpen className="h-5 w-5" />
      },
      {
        title: "Outcome Measurement Tools (CORC)",
        description: "Standardised assessment tools for therapeutic outcomes",
        url: "https://www.corc.uk.net/outcome-experience-measures/",
        category: "Assessment",
        icon: <BookOpen className="h-5 w-5" />
      },
      {
        title: "CORE Outcome Measures",
        description: "Clinical Outcomes in Routine Evaluation system",
        url: "https://www.coresystemtrust.org.uk/",
        category: "Assessment",
        icon: <BookOpen className="h-5 w-5" />
      },
      {
        title: "Social Care Institute for Excellence",
        description: "Best practice guidance for social care",
        url: "https://www.scie.org.uk/",
        category: "Guidance",
        icon: <BookOpen className="h-5 w-5" />
      }
    ]
  };

  const resources = country === 'AU' ? auResources : ukResources;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ResourceCard = ({ resource }: { resource: any }) => (
    <Card className="hover:shadow-md transition-all duration-200 border-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-sage-100 text-sage-600 flex-shrink-0">
            {resource.icon}
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="font-medium text-foreground text-sm">{resource.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{resource.description}</p>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="secondary" className="bg-sage-50 text-sage-700 text-xs">
                {resource.category}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-sage-600 hover:text-sage-700"
                onClick={() => window.open(resource.url, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Professional Resources
            </CardTitle>
            <CardDescription>
              Standards, CPD, and clinical resources for practitioners
            </CardDescription>
          </div>
          {/* Country Selector */}
          <div className="flex rounded-lg border border-border p-0.5 bg-muted">
            <Button
              variant={country === 'AU' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCountry('AU')}
              className={country === 'AU' ? 'bg-sage-600 text-white hover:bg-sage-700 h-7' : 'h-7'}
            >
              <Globe className="h-3 w-3 mr-1" />
              AU
            </Button>
            <Button
              variant={country === 'UK' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCountry('UK')}
              className={country === 'UK' ? 'bg-sage-600 text-white hover:bg-sage-700 h-7' : 'h-7'}
            >
              <Globe className="h-3 w-3 mr-1" />
              UK
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="standards" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 h-auto p-1">
            <TabsTrigger value="standards" className="text-xs px-2 py-1.5 data-[state=active]:bg-sage-600 data-[state=active]:text-white">
              Standards
            </TabsTrigger>
            <TabsTrigger value="cpd" className="text-xs px-2 py-1.5 data-[state=active]:bg-sage-600 data-[state=active]:text-white">
              CPD
            </TabsTrigger>
            <TabsTrigger value="services" className="text-xs px-2 py-1.5 data-[state=active]:bg-sage-600 data-[state=active]:text-white">
              {country === 'AU' ? 'NDIS' : 'NHS'}
            </TabsTrigger>
            <TabsTrigger value="clinical" className="text-xs px-2 py-1.5 data-[state=active]:bg-sage-600 data-[state=active]:text-white">
              Clinical
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standards" className="space-y-3 mt-0">
            {resources.standards.map((resource, index) => (
              <ResourceCard key={index} resource={resource} />
            ))}
          </TabsContent>

          <TabsContent value="cpd" className="space-y-3 mt-0">
            {resources.cpd.map((resource, index) => (
              <ResourceCard key={index} resource={resource} />
            ))}
          </TabsContent>

          <TabsContent value="services" className="space-y-3 mt-0">
            {country === 'AU' 
              ? auResources.ndis.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))
              : ukResources.nhs.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))
            }
          </TabsContent>

          <TabsContent value="clinical" className="space-y-3 mt-0">
            {resources.clinical.map((resource, index) => (
              <ResourceCard key={index} resource={resource} />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProfessionalResources;