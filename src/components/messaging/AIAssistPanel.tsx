import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Loader2, Send, ClipboardCopy, NotebookPen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/services/messagingService';
import { toast } from 'sonner';

interface AIAssistPanelProps {
  messages: Message[];
  onClose: () => void;
  onInsertDraft: (text: string) => void;
  onSaveToNotes?: (text: string) => Promise<void>;
  isPractitioner: boolean;
}

const QUICK_PROMPTS = [
  'Suggest a warm, reflective response to the client.',
  'Summarise this thread in 3 bullet points for my notes.',
  'Identify any risk indicators in the recent messages.',
  'Draft a treatment-plan summary based on this conversation.',
  'What AASW ethical principles apply to what we are discussing?',
];

export const AIAssistPanel = ({ messages, onClose, onInsertDraft, onSaveToNotes, isPractitioner }: AIAssistPanelProps) => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (prompt?: string) => {
    const userPrompt = (prompt ?? input).trim();
    if (!userPrompt || loading) return;
    setLoading(true);
    setResponse('');
    try {
      // Sanitize: strip names from recent context
      const recent = messages.slice(-10).map((m) => ({
        role: m.sender_id === messages[messages.length - 1]?.sender_id ? 'practitioner' : 'client',
        content: (m.message_text || '').replace(/\b[A-Z][a-z]+\b/g, '[name]'),
      }));
      const contextText = recent
        .map((m) => `${m.role === 'practitioner' ? 'Practitioner' : 'Client'}: ${m.content}`)
        .join('\n');

      const fullPrompt = `Context (sanitized recent messages, names removed):\n${contextText}\n\nPractitioner question: ${userPrompt}`;

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message: fullPrompt, conversationHistory: [] },
      });

      if (error) throw error;
      setResponse(data?.response || 'No response.');
    } catch (err) {
      console.error('AI assist error', err);
      toast.error('Could not get an AI suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isPractitioner) return null;

  return (
    <div className="border-l border-border bg-card w-full md:w-80 flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-sage-50 to-background">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sage-600" />
          <h3 className="text-sm font-semibold">AI Assist</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close AI assist">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3 space-y-2 overflow-y-auto flex-1">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Names are removed before sending. AI is a suggestion engine — review before using.
        </p>

        <div className="space-y-1">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="w-full text-left text-xs p-2 rounded-md border border-border hover:bg-accent/50 disabled:opacity-50 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {response && (
          <div className="rounded-md border border-sage-200 bg-sage-50/50 p-3 mt-2 space-y-2">
            <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground">{response}</p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => { onInsertDraft(response); toast.success('Inserted as draft.'); }}
              >
                <Send className="h-3 w-3 mr-1" /> Insert as draft
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={async () => { await navigator.clipboard.writeText(response); toast.success('Copied.'); }}
              >
                <ClipboardCopy className="h-3 w-3 mr-1" /> Copy
              </Button>
              {onSaveToNotes && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={async () => {
                    try { await onSaveToNotes(response); toast.success('Saved to Personal Notes.'); }
                    catch { toast.error('Could not save.'); }
                  }}
                >
                  <NotebookPen className="h-3 w-3 mr-1" /> Save to notes
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border space-y-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this conversation…"
          className="text-xs min-h-[60px] resize-none"
          disabled={loading}
        />
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          size="sm"
          className="w-full h-8 text-xs bg-sage-600 hover:bg-sage-700 text-white"
        >
          {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
          Ask AI
        </Button>
      </div>
    </div>
  );
};
