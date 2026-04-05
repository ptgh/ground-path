import { ReactNode } from 'react';

interface ScoredQuestionItemProps {
  index: number;
  total: number;
  isAnswered: boolean;
  children: ReactNode;
}

/** Wraps a single scored question with visual grouping, numbering badge, and answered state */
const ScoredQuestionItem = ({ index, total, isAnswered, children }: ScoredQuestionItemProps) => {
  return (
    <div
      className={`relative rounded-lg border p-4 sm:p-5 transition-colors duration-200 ${
        isAnswered
          ? 'border-primary/20 bg-primary/[0.02]'
          : 'border-border/50 bg-background'
      }`}
    >
      {/* Question number badge */}
      <div className="absolute -top-2.5 left-3 sm:left-4">
        <span
          className={`inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-semibold ${
            isAnswered
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {index}/{total}
        </span>
      </div>
      <div className="pt-1">
        {children}
      </div>
    </div>
  );
};

export default ScoredQuestionItem;
