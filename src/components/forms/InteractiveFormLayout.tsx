import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Printer, Save } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface InteractiveFormLayoutProps {
  title: string;
  description: string;
  source?: string;
  sourceUrl?: string;
  children: ReactNode;
  onSave?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

const InteractiveFormLayout = ({
  title,
  description,
  source,
  sourceUrl,
  children,
  onSave,
  onPrint,
  onDownload
}: InteractiveFormLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/practitioner/forms')}
                className="gap-2 self-start"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Forms
              </Button>
              
              <div className="flex flex-wrap gap-2">
                {onSave && (
                  <Button variant="outline" size="sm" onClick={onSave} className="min-w-[80px]">
                    <Save className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                )}
                {onPrint && (
                  <Button variant="outline" size="sm" onClick={onPrint} className="min-w-[80px]">
                    <Printer className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Print</span>
                  </Button>
                )}
                {onDownload && (
                  <Button variant="outline" size="sm" onClick={onDownload} className="min-w-[80px]">
                    <Download className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                )}
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-4">{description}</p>
            
            {source && (
              <div className="text-sm text-muted-foreground border-l-2 border-muted pl-4">
                <span className="font-medium">Source:</span> {source}
                {sourceUrl && (
                  <a 
                    href={sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    (View Original)
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Form Content */}
          <Card className="shadow-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              {children}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default InteractiveFormLayout;