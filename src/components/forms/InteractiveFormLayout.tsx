import { ReactNode, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Printer, Save, Clock, Check, Loader2, Shield } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import gsap from 'gsap';

interface InteractiveFormLayoutProps {
  title: string;
  description: string;
  source?: string;
  sourceUrl?: string;
  children: ReactNode;
  onSave?: () => void;
  onSaveDraft?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  lastSaved?: string | null;
  isSaving?: boolean;
  hasDraft?: boolean;
  onRestoreDraft?: () => void;
  onDiscardDraft?: () => void;
}

const InteractiveFormLayout = ({
  title,
  description,
  source,
  sourceUrl,
  children,
  onSave,
  onSaveDraft,
  onPrint,
  onDownload,
  lastSaved,
  isSaving,
  hasDraft,
  onRestoreDraft,
  onDiscardDraft
}: InteractiveFormLayoutProps) => {
  const navigate = useNavigate();
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    if (headerRef.current) {
      tl.fromTo(headerRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 });
    }
    if (formRef.current) {
      tl.fromTo(formRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2');
    }
    return () => { tl.kill(); };
  }, []);

  useEffect(() => {
    if (hasDraft && onRestoreDraft && onDiscardDraft) {
      setShowDraftPrompt(true);
    }
  }, [hasDraft, onRestoreDraft, onDiscardDraft]);

  const handleRestoreDraft = () => {
    onRestoreDraft?.();
    setShowDraftPrompt(false);
  };

  const handleDiscardDraft = () => {
    onDiscardDraft?.();
    setShowDraftPrompt(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Draft Restore Prompt */}
          {showDraftPrompt && (
            <Card className="mb-6 border-primary/30 bg-primary/[0.03] shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">Unsaved draft found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Would you like to continue where you left off?</p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <Button variant="ghost" size="sm" onClick={handleDiscardDraft} className="text-xs">
                      Discard
                    </Button>
                    <Button size="sm" onClick={handleRestoreDraft} className="text-xs">
                      Restore Draft
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header Section */}
          <div ref={headerRef} className="mb-6 opacity-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/practitioner/forms')}
                className="gap-1.5 self-start text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Forms
              </Button>
              
              <div className="flex items-center gap-2">
                {/* Auto-save indicator */}
                {lastSaved && (
                  <Badge variant="outline" className="gap-1 font-normal text-xs h-7 border-border/50">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 text-primary" />
                        Saved {lastSaved}
                      </>
                    )}
                  </Badge>
                )}
                
                {onSaveDraft && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onSaveDraft} 
                    disabled={isSaving}
                    className="gap-1.5 h-8"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Save Draft</span>
                  </Button>
                )}
                {onSave && (
                  <Button variant="outline" size="sm" onClick={onSave} className="gap-1.5 h-8">
                    <Save className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                )}
                {onPrint && (
                  <Button variant="ghost" size="sm" onClick={onPrint} className="gap-1.5 h-8">
                    <Printer className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Print</span>
                  </Button>
                )}
                {onDownload && (
                  <Button variant="ghost" size="sm" onClick={onDownload} className="gap-1.5 h-8">
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                )}
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1.5 max-w-2xl">{description}</p>
            
            {source && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>{source}</span>
                {sourceUrl && (
                  <a 
                    href={sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View source →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Form Content */}
          <div ref={formRef} className="opacity-0">
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {children}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default InteractiveFormLayout;
