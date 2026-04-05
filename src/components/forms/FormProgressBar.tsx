import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';

interface FormProgressBarProps {
  /** Number of answered questions */
  answered: number;
  /** Total number of questions */
  total: number;
  /** Label override */
  label?: string;
}

const FormProgressBar = ({ answered, total, label }: FormProgressBarProps) => {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  const isComplete = answered >= total;

  return (
    <div className="sticky top-[72px] z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1" />
        <div className="flex items-center gap-1.5 min-w-fit">
          {isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
          <span className="text-xs font-medium text-muted-foreground">
            {label ?? `${answered}/${total} answered`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FormProgressBar;
