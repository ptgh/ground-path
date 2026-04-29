import React, { useMemo } from 'react';
import { Bot, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Note } from '@/services/notesService';

interface ConvMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onDelete?: (id: string) => void;
}

/**
 * Parse a stored AI-conversation transcript ("You: ...\n\n---\n\nAI Assistant: ...")
 * back into structured messages, used as a fallback when conversation_data is empty.
 */
const parseTranscript = (content?: string): ConvMessage[] => {
  if (!content) return [];
  const segments = content.split(/\n*---\n*/g);
  return segments
    .map((seg, idx) => {
      const trimmed = seg.trim();
      if (!trimmed) return null;
      const userMatch = trimmed.match(/^(?:You|User)\s*:\s*([\s\S]*)$/i);
      const aiMatch = trimmed.match(/^(?:AI Assistant|Assistant|AI)\s*:\s*([\s\S]*)$/i);
      if (userMatch) {
        return { id: `t-${idx}`, role: 'user' as const, content: userMatch[1].trim() };
      }
      if (aiMatch) {
        return { id: `t-${idx}`, role: 'assistant' as const, content: aiMatch[1].trim() };
      }
      // Unrecognised — treat as user text so it isn't dropped.
      return { id: `t-${idx}`, role: 'user' as const, content: trimmed };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
};

const AIConversationViewModal: React.FC<Props> = ({ open, onOpenChange, note, onDelete }) => {
  const messages = useMemo<ConvMessage[]>(() => {
    if (!note) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stored = (note.conversation_data as any)?.messages;
    if (Array.isArray(stored) && stored.length > 0) {
      return stored as ConvMessage[];
    }
    return parseTranscript(note.content);
  }, [note]);

  if (!note) return null;

  const hasAssistant = messages.some((m) => m.role === 'assistant');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl p-0 h-[85vh] max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 sm:p-6 border-b border-border">
          <DialogTitle className="text-base sm:text-lg pr-8">{note.title}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(note.created_at).toLocaleString('en-AU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' · '}
            {messages.length} message{messages.length === 1 ? '' : 's'}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 p-4 sm:p-6">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              This conversation has no stored messages.
            </p>
          ) : (
            <div className="space-y-4">
              {!hasAssistant && (
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-200">
                  Only the original question was saved for this conversation. New AI conversations
                  will store the full thread.
                </div>
              )}
              {messages.map((m, idx) => (
                <div
                  key={m.id ?? idx}
                  className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'
                    }`}
                  >
                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`flex-1 min-w-0 ${m.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block px-3 py-2 rounded-lg max-w-[85%] text-left ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted/60 text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                    {m.timestamp && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 sm:p-6 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          {onDelete ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                onDelete(note.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete conversation
            </Button>
          ) : <span />}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIConversationViewModal;
