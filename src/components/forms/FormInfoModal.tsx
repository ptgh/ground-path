import React from 'react';
import { X, FileText, Calendar, ExternalLink, Download, ClipboardCheck, Star, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface FormInfo {
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

interface FormInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormInfo | null;
  onDownload?: () => void;
  onFill?: () => void;
}

const FormInfoModal: React.FC<FormInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  form,
  onDownload,
  onFill
}) => {
  if (!form) return null;

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'standardized-assessments': 'Standardized Assessment',
      'clinical-assessments': 'Clinical Assessment',
      'crisis-safety': 'Crisis & Safety Planning',
      'client-management': 'Client Management',
      'professional-development': 'Professional Development'
    };
    return labels[category] || category;
  };

  const getFormTypeInfo = (formType: string) => {
    switch (formType) {
      case 'interactive':
        return {
          label: 'Interactive Form',
          description: 'This form can be filled out digitally within the app with automatic scoring and interpretation where applicable.',
          color: 'bg-primary/10 text-primary'
        };
      case 'pdf':
        return {
          label: 'PDF Document',
          description: 'A downloadable PDF form that can be printed or filled electronically using a PDF reader.',
          color: 'bg-secondary text-secondary-foreground'
        };
      case 'template':
        return {
          label: 'Template',
          description: 'A template document that provides structure for documentation and record-keeping.',
          color: 'bg-muted text-muted-foreground'
        };
      default:
        return {
          label: 'Document',
          description: 'A professional document for clinical use.',
          color: 'bg-muted text-muted-foreground'
        };
    }
  };

  const formTypeInfo = getFormTypeInfo(form.formType);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold leading-tight pr-8">
                {form.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                {form.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={formTypeInfo.color}>
              {formTypeInfo.label}
            </Badge>
            <Badge variant="outline">
              {getCategoryLabel(form.category)}
            </Badge>
            {form.required && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                <Star className="h-3 w-3 mr-1" />
                Required
              </Badge>
            )}
          </div>

          <Separator />

          {/* Form Type Description */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              About this Form
            </h4>
            <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
              {formTypeInfo.description}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="font-medium">{new Date(form.lastUpdated).toLocaleDateString()}</span>
            </div>
            
            {form.source && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Source:</div>
                <div className="text-sm bg-muted/30 rounded-lg p-3">
                  {form.source}
                  {form.sourceUrl && (
                    <a 
                      href={form.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline mt-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Original Source
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            {form.formType === 'interactive' && onFill && (
              <Button 
                onClick={onFill}
                className="w-full"
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Fill Interactive Form
              </Button>
            )}
            
            {onDownload && (
              <Button 
                variant={form.formType === 'interactive' ? 'outline' : 'default'}
                onClick={onDownload}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
            
            {form.formType !== 'interactive' && onFill && (
              <Button 
                variant="outline"
                onClick={onFill}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Open Form
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormInfoModal;
