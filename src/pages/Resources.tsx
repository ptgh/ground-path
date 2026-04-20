import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ExternalLink, 
  Search, 
  Phone,
  X,
  Heart,
  Users,
  Info,
  Globe
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { AIAssistant } from "@/components/AIAssistant";
import { gsap } from 'gsap';

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [country, setCountry] = useState<'AU' | 'UK'>('AU');
  const buttonsRef = useRef<HTMLDivElement>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // GSAP button animations
  useEffect(() => {
    if (buttonsRef.current) {
      const buttons = buttonsRef.current.querySelectorAll('.resource-cta');
      
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
  }, [country]);

  // Australian Emergency Contacts
  const emergencyContactsAU = [
    {
      title: "Lifeline Australia",
      description: "24/7 crisis support and suicide prevention",
      type: "phone",
      url: "13 11 14",
      category: "Crisis Support",
      icon: <Phone className="h-5 w-5" />
    },
    {
      title: "Kids Helpline",
      description: "24/7 phone and online counselling for young people aged 5-25",
      type: "phone", 
      url: "1800 55 1800",
      category: "Youth Support",
      icon: <Phone className="h-5 w-5" />
    },
    {
      title: "1800RESPECT",
      description: "National sexual assault, domestic and family violence counselling",
      type: "phone",
      url: "1800 737 732",
      category: "Family Violence",
      icon: <Phone className="h-5 w-5" />
    },
    {
      title: "Beyond Blue",
      description: "Depression, anxiety and suicide prevention support",
      type: "phone",
      url: "1300 22 4636",
      category: "Mental Health",
      icon: <Phone className="h-5 w-5" />
    },
    {
      title: "Suicide Call Back Service",
      description: "24/7 professional telephone and online counselling",
      type: "phone",
      url: "1300 659 467",
      category: "Crisis Support",
      icon: <Phone className="h-5 w-5" />
    },
    {
      title: "MensLine Australia",
      description: "24/7 support for men with family and relationship concerns",
      type: "phone",
      url: "1300 78 99 78",
      category: "Men's Support",
      icon: <Phone className="h-5 w-5" />
    }
  ];

  // UK Emergency Contacts
  const emergencyContactsUK = [
    {
      title: "Samaritans",
      description: "24/7 emotional support for anyone in distress",
      type: "phone",
      url: "116 123",
      category: "Crisis Support",
      icon: <Phone className="h-5 w-5" />
    },
    {
      title: "Mind Infoline",
      description: "Mental health information and support",
      type: "phone",
      url: "0300 123 3393",
      category: "Mental Health",
      icon: <Phone className="h-5 w-5" />
    },
    {
      title: "Childline",
      description: "Free counselling for children and young people",
      type: "phone",
      url: "0800 1111",
      category: "Youth Support",
      icon: <Phone className="h-5 w-5" />
    },
    {
      title: "National Domestic Abuse Helpline",
      description: "24-hour freephone for domestic abuse support",
      type: "phone",
      url: "0808 2000 247",
      category: "Family Violence",
      icon: <Phone className="h-5 w-5" />
    },
    {
      title: "Shout Crisis Text Line",
      description: "Free 24/7 text support for anyone in crisis",
      type: "phone",
      url: "Text SHOUT to 85258",
      category: "Crisis Support",
      icon: <Phone className="h-5 w-5" />
    },
    {
      title: "CALM (Campaign Against Living Miserably)",
      description: "Support for men in crisis, 5pm-midnight daily",
      type: "phone",
      url: "0800 58 58 58",
      category: "Men's Support",
      icon: <Phone className="h-5 w-5" />
    }
  ];

  // Australian Support Services
  const supportServicesAU = [
    {
      title: "NDIS (National Disability Insurance Scheme)",
      description: "Government support for people with disability",
      type: "external",
      url: "https://www.ndis.gov.au/participants",
      category: "Disability",
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "Medicare Mental Health",
      description: "Medicare-subsidised mental health services",
      type: "external",
      url: "https://www.servicesaustralia.gov.au/mental-health-and-medicare",
      category: "Health Services",
      icon: <Heart className="h-5 w-5" />
    },
    {
      title: "Headspace",
      description: "Mental health support for young people 12-25",
      type: "external",
      url: "https://headspace.org.au/",
      category: "Youth Services",
      icon: <Heart className="h-5 w-5" />
    },
    {
      title: "Carers Australia",
      description: "Support and resources for carers",
      type: "external",
      url: "https://www.carersaustralia.com.au/",
      category: "Carer Support",
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "Open Arms Veterans & Families Counselling",
      description: "Free counselling for veterans and families",
      type: "phone",
      url: "1800 011 046",
      category: "Veterans",
      icon: <Phone className="h-5 w-5" />
    }
  ];

  // UK Support Services
  const supportServicesUK = [
    {
      title: "NHS Talking Therapies",
      description: "Free NHS therapy for anxiety and depression",
      type: "external",
      url: "https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/nhs-talking-therapies/",
      category: "Health Services",
      icon: <Heart className="h-5 w-5" />
    },
    {
      title: "CAMHS (Child & Adolescent Mental Health Services)",
      description: "NHS mental health services for under 18s",
      type: "external",
      url: "https://www.nhs.uk/mental-health/nhs-voluntary-charity-services/nhs-services/children-young-people-mental-health-services-cypmhs/",
      category: "Youth Services",
      icon: <Heart className="h-5 w-5" />
    },
    {
      title: "Citizens Advice",
      description: "Free, independent advice on legal, financial and other matters",
      type: "external",
      url: "https://www.citizensadvice.org.uk/",
      category: "General Advice",
      icon: <Info className="h-5 w-5" />
    },
    {
      title: "Carers UK",
      description: "Support and resources for carers",
      type: "external",
      url: "https://www.carersuk.org/",
      category: "Carer Support",
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "Combat Stress",
      description: "Mental health support for veterans",
      type: "external",
      url: "https://combatstress.org.uk/",
      category: "Veterans",
      icon: <Users className="h-5 w-5" />
    }
  ];

  // Australian Information Resources
  const informationAU = [
    {
      title: "Black Dog Institute",
      description: "Information and resources on mental health conditions",
      type: "external",
      url: "https://www.blackdoginstitute.org.au/",
      category: "Mental Health",
      icon: <Info className="h-5 w-5" />
    },
    {
      title: "SANE Australia",
      description: "Mental health information and support programs",
      type: "external",
      url: "https://www.sane.org/",
      category: "Mental Health",
      icon: <Info className="h-5 w-5" />
    },
    {
      title: "ReachOut",
      description: "Online mental health resources for young people",
      type: "external",
      url: "https://au.reachout.com/",
      category: "Youth",
      icon: <Info className="h-5 w-5" />
    },
    {
      title: "Blue Knot Foundation",
      description: "Resources for complex trauma survivors",
      type: "external",
      url: "https://blueknot.org.au/",
      category: "Trauma",
      icon: <Heart className="h-5 w-5" />
    }
  ];

  // UK Information Resources
  const informationUK = [
    {
      title: "Mind",
      description: "Mental health information and support",
      type: "external",
      url: "https://www.mind.org.uk/",
      category: "Mental Health",
      icon: <Info className="h-5 w-5" />
    },
    {
      title: "Rethink Mental Illness",
      description: "Advice and information on mental illness",
      type: "external",
      url: "https://www.rethink.org/",
      category: "Mental Health",
      icon: <Info className="h-5 w-5" />
    },
    {
      title: "Young Minds",
      description: "Mental health resources for young people and parents",
      type: "external",
      url: "https://www.youngminds.org.uk/",
      category: "Youth",
      icon: <Info className="h-5 w-5" />
    },
    {
      title: "The Survivors Trust",
      description: "Resources for survivors of rape and sexual abuse",
      type: "external",
      url: "https://www.thesurvivorstrust.org/",
      category: "Trauma",
      icon: <Heart className="h-5 w-5" />
    }
  ];

  // Get current resources based on country
  const emergencyContacts = country === 'AU' ? emergencyContactsAU : emergencyContactsUK;
  const supportServices = country === 'AU' ? supportServicesAU : supportServicesUK;
  const informationResources = country === 'AU' ? informationAU : informationUK;

  const allResources = [
    ...emergencyContacts,
    ...supportServices,
    ...informationResources
  ];

  const filteredResources = allResources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmergencyContacts = emergencyContacts.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSupportServices = supportServices.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInformation = informationResources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const NoResults = () => (
    <div className="text-center py-12">
      <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">No resources found</h3>
      <p className="text-muted-foreground">Try adjusting your search terms or browse all resources.</p>
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ResourceCard = ({ resource }: { resource: any }) => (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sage-100 text-sage-600">
              {resource.icon}
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">{resource.title}</CardTitle>
              <Badge variant="secondary" className="mt-1 bg-sage-50 text-sage-700">
                {resource.category}
              </Badge>
            </div>
          </div>
          {resource.type === 'external' && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
          {resource.type === 'phone' && <Phone className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <CardDescription className="text-muted-foreground mb-4 flex-grow">
          {resource.description}
        </CardDescription>
        <Button 
          variant="outline" 
          className="resource-cta w-full mt-auto"
          onClick={() => {
            if (resource.type === 'phone') {
              const phoneNumber = resource.url.replace(/\s/g, '');
              if (phoneNumber.startsWith('Text')) {
                // Text-based services — copy instruction so user can act on it
                if (navigator.clipboard) {
                  void navigator.clipboard.writeText(resource.url);
                }
                window.alert(`${resource.title}\n\n${resource.url}\n\n(Copied to clipboard)`);
              } else {
                window.open(`tel:${phoneNumber}`, '_self');
              }
            } else {
              window.open(resource.url, '_blank', 'noopener,noreferrer');
            }
          }}
        >
          {resource.type === 'phone' ? `Call ${resource.url}` : 'Access Resource'}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Client Resources" description="Mental health resources, self-help tools, and educational content for your wellbeing journey." path="/resources" />
      <Header />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-light text-foreground mb-4">
              Client Resources
            </h1>
            <div className="w-20 h-1 bg-sage-600 mx-auto mb-6"></div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Support resources, helplines, and information for clients and people seeking help
            </p>
          </div>

          {/* Country selector removed — AU only for now. UK resources preserved in code for future admin toggle. */}

          {/* Search Bar */}
          <div className="mb-8 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Searching for "{searchTerm}" - {filteredResources.length} result{filteredResources.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="emergency" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="inline-flex rounded-lg border border-border p-1 bg-muted h-auto">
                <TabsTrigger value="emergency" className="data-[state=active]:bg-sage-600 data-[state=active]:text-white text-xs sm:text-sm px-4 py-2 rounded-md">
                  Emergency
                </TabsTrigger>
                <TabsTrigger value="support" className="data-[state=active]:bg-sage-600 data-[state=active]:text-white text-xs sm:text-sm px-4 py-2 rounded-md">
                  Support
                </TabsTrigger>
                <TabsTrigger value="information" className="data-[state=active]:bg-sage-600 data-[state=active]:text-white text-xs sm:text-sm px-4 py-2 rounded-md">
                  Information
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-sage-600 data-[state=active]:text-white text-xs sm:text-sm px-4 py-2 rounded-md">
                  All
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="emergency" ref={buttonsRef}>
              {filteredEmergencyContacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEmergencyContacts.map((resource, index) => (
                    <ResourceCard key={index} resource={resource} />
                  ))}
                </div>
              ) : (
                <NoResults />
              )}
            </TabsContent>

            <TabsContent value="support">
              {filteredSupportServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSupportServices.map((resource, index) => (
                    <ResourceCard key={index} resource={resource} />
                  ))}
                </div>
              ) : (
                <NoResults />
              )}
            </TabsContent>

            <TabsContent value="information">
              {filteredInformation.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInformation.map((resource, index) => (
                    <ResourceCard key={index} resource={resource} />
                  ))}
                </div>
              ) : (
                <NoResults />
              )}
            </TabsContent>

            <TabsContent value="all">
              {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResources.map((resource, index) => (
                    <ResourceCard key={index} resource={resource} />
                  ))}
                </div>
              ) : (
                <NoResults />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
      <AIAssistant />
    </div>
  );
};

export default Resources;