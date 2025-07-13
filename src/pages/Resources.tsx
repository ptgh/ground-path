import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ExternalLink, 
  Download, 
  Search, 
  BookOpen, 
  Users, 
  Shield, 
  GraduationCap,
  Heart,
  Scale,
  FileText,
  Phone
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const professionalStandards = [
    {
      title: "AASW Code of Ethics",
      description: "Australian Association of Social Workers ethical guidelines and professional standards",
      type: "pdf",
      url: "https://www.aasw.asn.au/document/item/1201",
      category: "Ethics",
      icon: <Scale className="h-5 w-5" />
    },
    {
      title: "AASW Practice Standards",
      description: "Comprehensive practice standards for social work professionals in Australia",
      type: "pdf", 
      url: "https://www.aasw.asn.au/document/item/9545",
      category: "Standards",
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      title: "Mental Health Professional Standards",
      description: "Guidelines for mental health practitioners and counsellors",
      type: "external",
      url: "https://www.pacfa.org.au/ethics-standards/",
      category: "Mental Health",
      icon: <Heart className="h-5 w-5" />
    }
  ];

  const ndisResources = [
    {
      title: "NDIS Provider Portal",
      description: "Access the NDIS provider portal for service delivery and billing",
      type: "external",
      url: "https://www.ndis.gov.au/providers",
      category: "NDIS",
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "NDIS Practice Standards",
      description: "Quality and safeguarding requirements for NDIS providers",
      type: "pdf",
      url: "https://www.ndiscommission.gov.au/providers/registered-ndis-providers/provider-obligations-and-requirements/ndis-practice-standards",
      category: "NDIS",
      icon: <Shield className="h-5 w-5" />
    },
    {
      title: "NDIS Pricing Arrangements",
      description: "Current pricing guide and support catalogue for NDIS services",
      type: "external",
      url: "https://www.ndis.gov.au/providers/pricing-arrangements",
      category: "NDIS",
      icon: <FileText className="h-5 w-5" />
    }
  ];

  const clinicalTools = [
    {
      title: "DSM-5-TR Quick Reference",
      description: "Diagnostic criteria and assessment tools for mental health conditions",
      type: "external",
      url: "https://www.psychiatry.org/psychiatrists/practice/dsm",
      category: "Assessment",
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      title: "Outcome Measurement Tools",
      description: "Standardised assessment tools for measuring therapeutic outcomes",
      type: "pdf",
      url: "#",
      category: "Assessment",
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: "Risk Assessment Frameworks",
      description: "Comprehensive risk assessment tools for various client populations",
      type: "pdf",
      url: "#",
      category: "Risk Management",
      icon: <Shield className="h-5 w-5" />
    }
  ];

  const professionalDevelopment = [
    {
      title: "AASW CPD Requirements",
      description: "Continuing Professional Development guidelines and tracking resources",
      type: "external",
      url: "https://www.aasw.asn.au/careers-study/continuing-professional-development",
      category: "CPD",
      icon: <GraduationCap className="h-5 w-5" />
    },
    {
      title: "Supervision Guidelines",
      description: "Best practice guidelines for professional supervision in social work",
      type: "pdf",
      url: "#",
      category: "Supervision",
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "Cultural Competency Resources",
      description: "Resources for culturally responsive practice with diverse communities",
      type: "external",
      url: "#",
      category: "Cultural Practice",
      icon: <Heart className="h-5 w-5" />
    }
  ];

  const emergencyContacts = [
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
    }
  ];

  const allResources = [
    ...professionalStandards,
    ...ndisResources,
    ...clinicalTools,
    ...professionalDevelopment,
    ...emergencyContacts
  ];

  const filteredResources = allResources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ResourceCard = ({ resource }: { resource: any }) => (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-gray-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sage-100 text-sage-600">
              {resource.icon}
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">{resource.title}</CardTitle>
              <Badge variant="secondary" className="mt-1 bg-sage-50 text-sage-700">
                {resource.category}
              </Badge>
            </div>
          </div>
          {resource.type === 'pdf' && <Download className="h-4 w-4 text-gray-400" />}
          {resource.type === 'external' && <ExternalLink className="h-4 w-4 text-gray-400" />}
          {resource.type === 'phone' && <Phone className="h-4 w-4 text-gray-400" />}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-600 mb-4">
          {resource.description}
        </CardDescription>
        <Button 
          variant="outline" 
          className="w-full border-sage-200 text-sage-700 hover:bg-sage-50"
          onClick={() => {
            if (resource.type === 'phone') {
              window.open(`tel:${resource.url}`, '_self');
            } else {
              window.open(resource.url, '_blank');
            }
          }}
        >
          {resource.type === 'phone' ? `Call ${resource.url}` : 'Access Resource'}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Resources
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Essential tools, guidelines, and resources for social work and mental health professionals practicing in Australia
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-sage-500"
              />
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8 bg-gray-100">
              <TabsTrigger value="all" className="data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                All Resources
              </TabsTrigger>
              <TabsTrigger value="standards" className="data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                Standards
              </TabsTrigger>
              <TabsTrigger value="ndis" className="data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                NDIS
              </TabsTrigger>
              <TabsTrigger value="clinical" className="data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                Clinical Tools
              </TabsTrigger>
              <TabsTrigger value="development" className="data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                CPD
              </TabsTrigger>
              <TabsTrigger value="emergency" className="data-[state=active]:bg-sage-600 data-[state=active]:text-white">
                Emergency
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="standards">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {professionalStandards.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ndis">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ndisResources.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="clinical">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clinicalTools.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="development">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {professionalDevelopment.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="emergency">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {emergencyContacts.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Resources;