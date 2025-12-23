import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { X, Calendar, Clock, User, FileText, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FormSubmission } from '@/services/clientService';
import { Note } from '@/services/notesService';

interface FormViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: FormSubmission | Note | null;
  type: 'form' | 'note';
  onDownloadPDF?: (submission: FormSubmission) => void;
  onPrint?: (submission: FormSubmission) => void;
  getClientName?: (clientId: string) => string;
  getFormTypeColor?: (formType: string) => string;
}

const FormViewModal: React.FC<FormViewModalProps> = ({ 
  isOpen, 
  onClose, 
  data, 
  type, 
  onDownloadPDF, 
  onPrint, 
  getClientName, 
  getFormTypeColor 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Enhanced GSAP show animation
      gsap.set([overlayRef.current, modalRef.current], { 
        display: 'flex',
        opacity: 0 
      });
      gsap.set(modalRef.current, { 
        scale: 0.8, 
        y: 40, 
        rotationY: -10,
        transformPerspective: 1200
      });
      
      const tl = gsap.timeline();
      
      tl.to(overlayRef.current, { 
        opacity: 1, 
        duration: 0.3,
        ease: "power2.out"
      })
      .to(modalRef.current, { 
        opacity: 1, 
        scale: 1, 
        y: 0,
        rotationY: 0,
        duration: 0.5, 
        ease: "back.out(1.2)" 
      }, 0.1)
      .to(modalRef.current, {
        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        duration: 0.2,
        ease: "power2.out"
      }, 0.3);
      
    } else {
      // Enhanced GSAP hide animation
      const tl = gsap.timeline();
      
      tl.to(modalRef.current, { 
        opacity: 0, 
        scale: 0.9, 
        y: -20,
        rotationY: 10,
        duration: 0.25,
        ease: "power2.in"
      })
      .to(overlayRef.current, { 
        opacity: 0, 
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          gsap.set([overlayRef.current, modalRef.current], { 
            display: 'none',
            clearProps: "all" 
          });
        }
      }, 0.1);
    }
  }, [isOpen]);

  if (!data) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderFormContent = (submission: FormSubmission) => {
    const responses = submission.form_data || {};
    
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className={getFormTypeColor?.(submission.form_type) || "bg-primary/10 text-primary"}>
            {submission.form_type}
          </Badge>
          {submission.score !== undefined && (
            <Badge variant="outline">Score: {submission.score}</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{getClientName?.(submission.client_id) || 'Unknown Client'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(submission.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTime(submission.created_at)}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Responses:</h4>
          {Object.entries(responses).map(([question, answer]) => (
            <div key={question} className="bg-muted/30 rounded-lg p-3">
              <div className="font-medium text-sm mb-1">{question}</div>
              <div className="text-sm text-muted-foreground">{String(answer)}</div>
            </div>
          ))}
        </div>

        {submission.interpretation && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Interpretation:</h4>
              <div className="bg-muted/30 rounded-lg p-3 text-sm">{submission.interpretation}</div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderNoteContent = (note: Note) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(note.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTime(note.created_at)}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Content:</h4>
          <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap">
            {note.content || 'No content available'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
      style={{ display: 'none' }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-background rounded-lg shadow-lg border flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b bg-background rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {type === 'form' ? 
                `${(data as FormSubmission).form_type} Assessment` : 
                (data as Note).title
              }
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-3 sm:pt-4">
          {type === 'form' ? 
            renderFormContent(data as FormSubmission) : 
            renderNoteContent(data as Note)
          }
        </div>

        {/* Fixed Footer for actions */}
        {type === 'form' && onDownloadPDF && onPrint && (
          <div className="border-t p-4 sm:p-6 pt-3 sm:pt-4 bg-background rounded-b-lg flex-shrink-0">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrint(data as FormSubmission)}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadPDF(data as FormSubmission)}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormViewModal;