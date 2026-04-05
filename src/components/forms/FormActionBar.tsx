import { Button } from '@/components/ui/button';
import { Save, FileDown, Printer, CheckCircle2, Loader2 } from 'lucide-react';

interface FormActionBarProps {
  /** Primary action label */
  submitLabel: string;
  onSubmit?: () => void;
  onSaveDraft?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  isSaving?: boolean;
  isSubmitting?: boolean;
  /** If true, show as form type="submit" */
  isFormSubmit?: boolean;
}

const FormActionBar = ({
  submitLabel,
  onSubmit,
  onSaveDraft,
  onPrint,
  onDownload,
  isSaving,
  isSubmitting,
  isFormSubmit = true,
}: FormActionBarProps) => {
  return (
    <div className="border-t border-border/40 pt-6 mt-8">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Secondary actions */}
        <div className="flex items-center gap-2 order-2 sm:order-1">
          {onSaveDraft && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="gap-1.5"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Draft
            </Button>
          )}
          {onPrint && (
            <Button type="button" variant="ghost" size="sm" onClick={onPrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          )}
          {onDownload && (
            <Button type="button" variant="ghost" size="sm" onClick={onDownload} className="gap-1.5">
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          )}
        </div>

        {/* Primary action */}
        <div className="sm:ml-auto order-1 sm:order-2">
          <Button
            type={isFormSubmit ? 'submit' : 'button'}
            onClick={isFormSubmit ? undefined : onSubmit}
            size="lg"
            className="w-full sm:w-auto gap-2 px-8"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FormActionBar;
