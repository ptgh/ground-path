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
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/practitioner/forms')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Forms
              </Button>
              
              <div className="flex gap-2">
                {onSave && (
                  <Button variant="outline" size="sm" onClick={onSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                )}
                {onPrint && (
                  <Button variant="outline" size="sm" onClick={onPrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                )}
                {onDownload && (
                  <Button variant="outline" size="sm" onClick={onDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground text-lg mb-4">{description}</p>
            
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
            <CardContent className="p-8">
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