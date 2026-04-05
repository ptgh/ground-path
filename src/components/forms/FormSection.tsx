import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Optional step indicator, e.g. "Step 2 of 5" */
  step?: string;
  /** Visual variant */
  variant?: 'default' | 'highlighted' | 'subtle';
}

const FormSection = ({ title, description, children, step, variant = 'default' }: FormSectionProps) => {
  const cardClass = variant === 'highlighted'
    ? 'border-primary/20 bg-primary/[0.02]'
    : variant === 'subtle'
      ? 'border-transparent bg-muted/30'
      : 'border-border/60';

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {step && (
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{step}</span>
        )}
      </div>
      <Card className={`shadow-sm ${cardClass}`}>
        <CardContent className="p-4 sm:p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

/** Thin divider between major form sections */
export const FormDivider = () => (
  <Separator className="my-2" />
);

export default FormSection;
