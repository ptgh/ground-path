import { useState, useEffect } from 'react';
import { X, Phone } from 'lucide-react';

const DISMISSED_KEY = 'crisis-disclaimer-dismissed';

const CrisisDisclaimer = () => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch { /* ignore localStorage errors */ }
  };

  if (dismissed) return null;

  return (
    <div className="bg-muted/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0 text-destructive" />
          <p>
            If you or someone you know is in crisis, please call{' '}
            <a href="tel:131114" className="font-semibold text-foreground hover:underline">
              Lifeline on 13 11 14
            </a>
            , or dial{' '}
            <a href="tel:000" className="font-semibold text-foreground hover:underline">
              000
            </a>{' '}
            for emergencies. Groundpath is not a crisis service.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Dismiss crisis disclaimer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default CrisisDisclaimer;
