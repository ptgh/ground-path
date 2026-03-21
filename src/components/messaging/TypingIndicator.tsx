interface TypingIndicatorProps {
  names?: string[];
}

export const TypingIndicator = ({ names }: TypingIndicatorProps) => {
  if (!names || names.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <div className="flex gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-[11px] text-muted-foreground italic">Typing…</span>
    </div>
  );
};
