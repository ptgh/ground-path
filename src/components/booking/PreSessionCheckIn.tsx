import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckInData {
  mood_score: number | null;
  mood_tags: string[];
  desired_outcome: string;
  notes_for_practitioner: string;
}

interface PreSessionCheckInProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: CheckInData) => Promise<void> | void;
  submitting?: boolean;
}

const MOODS = [
  { score: 1, emoji: '😔', label: 'Low' },
  { score: 2, emoji: '😕', label: 'Down' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😊', label: 'Great' },
];

const FEELING_TAGS = [
  'anxious', 'tired', 'hopeful', 'overwhelmed', 'calm',
  'frustrated', 'sad', 'numb', 'restless', 'grateful', 'lonely', 'motivated',
];

const TOTAL_STEPS = 4;

const PreSessionCheckIn = ({ open, onOpenChange, onComplete, submitting }: PreSessionCheckInProps) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CheckInData>({
    mood_score: null,
    mood_tags: [],
    desired_outcome: '',
    notes_for_practitioner: '',
  });

  const reset = () => {
    setStep(1);
    setData({ mood_score: null, mood_tags: [], desired_outcome: '', notes_for_practitioner: '' });
  };

  const handleClose = (next: boolean) => {
    if (!next && !submitting) reset();
    onOpenChange(next);
  };

  const toggleTag = (tag: string) => {
    setData(prev => ({
      ...prev,
      mood_tags: prev.mood_tags.includes(tag)
        ? prev.mood_tags.filter(t => t !== tag)
        : [...prev.mood_tags, tag],
    }));
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      await onComplete(data);
      reset();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-lg">A gentle check-in</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Just a few quiet questions before you book — so your practitioner can meet you where you are.
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i + 1 === step ? 'w-6 bg-primary' : i + 1 < step ? 'w-1.5 bg-primary/60' : 'w-1.5 bg-muted'
              )}
            />
          ))}
        </div>

        <div className="min-h-[260px] py-2">
          {/* Step 1 — mood scale */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-foreground">How are you feeling right now?</h3>
                <p className="text-xs text-muted-foreground mt-1">There's no right answer — go with your gut.</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map(m => (
                  <button
                    key={m.score}
                    type="button"
                    onClick={() => setData(prev => ({ ...prev, mood_score: m.score }))}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all min-h-[80px]',
                      data.mood_score === m.score
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30 scale-105'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    )}
                  >
                    <span className="text-2xl leading-none">{m.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{m.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/70 text-center italic">
                Skip if you'd rather not say.
              </p>
            </div>
          )}

          {/* Step 2 — feeling tags */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-foreground">Anything sitting with you today?</h3>
                <p className="text-xs text-muted-foreground mt-1">Tap any that fit — or skip if none feel quite right.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {FEELING_TAGS.map(tag => {
                  const selected = data.mood_tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all min-h-[32px]',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/30'
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 — desired outcome */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-foreground">What would feel like a good outcome from this session?</h3>
                <p className="text-xs text-muted-foreground mt-1">A word, a sentence, anything at all.</p>
              </div>
              <Textarea
                value={data.desired_outcome}
                onChange={e => setData(prev => ({ ...prev, desired_outcome: e.target.value }))}
                placeholder="e.g. Feel a bit lighter… get clarity on something… just feel heard…"
                className="min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="text-[11px] text-muted-foreground/70 text-right">
                {data.desired_outcome.length}/500
              </p>
            </div>
          )}

          {/* Step 4 — practitioner notes */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-foreground">Anything you'd like your practitioner to know beforehand?</h3>
                <p className="text-xs text-muted-foreground mt-1">Even a sentence helps. Optional.</p>
              </div>
              <Textarea
                value={data.notes_for_practitioner}
                onChange={e => setData(prev => ({ ...prev, notes_for_practitioner: e.target.value }))}
                placeholder="e.g. Had a tough week at work… would rather not talk about family today… new to therapy and a bit nervous…"
                className="min-h-[120px] resize-none"
                maxLength={1000}
              />
              <p className="text-[11px] text-muted-foreground/70 text-right">
                {data.notes_for_practitioner.length}/1000
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 1 || submitting}
            className="min-h-[44px]"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <span className="text-xs text-muted-foreground">{step} of {TOTAL_STEPS}</span>
          <Button
            onClick={handleNext}
            disabled={submitting}
            className="min-h-[44px]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : step === TOTAL_STEPS ? (
              'Send booking request'
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreSessionCheckIn;
