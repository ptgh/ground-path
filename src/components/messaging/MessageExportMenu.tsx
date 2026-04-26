import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, FileDown, FileText, ClipboardCopy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Message } from '@/services/messagingService';
import { messageExportService } from '@/services/messageExportService';

interface MessageExportMenuProps {
  messages: Message[];
  ownerName: string;
  otherPartyName: string;
  isSelfConversation: boolean;
}

export const MessageExportMenu = ({
  messages,
  ownerName,
  otherPartyName,
  isSelfConversation,
}: MessageExportMenuProps) => {
  const [busy, setBusy] = useState<string | null>(null);

  const ctx = { ownerName, otherPartyName, isSelfConversation };

  const guard = async (label: string, fn: () => Promise<void>) => {
    if (messages.length === 0) {
      toast.info('Nothing to export yet.');
      return;
    }
    try {
      setBusy(label);
      await fn();
      toast.success(`${label} ready.`);
    } catch (err) {
      console.error(err);
      toast.error(`Could not ${label.toLowerCase()}. Please try again.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Export & copy"
          aria-label="Export and copy options"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">
          {isSelfConversation ? 'Personal Notes' : 'Transcript'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => guard('PDF export', () => messageExportService.exportPDF(messages, ctx))}
        >
          <FileDown className="h-4 w-4 mr-2" />
          Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => guard('Text export', () => messageExportService.exportText(messages, ctx))}
        >
          <FileText className="h-4 w-4 mr-2" />
          Download as text (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => guard('Copy', () => messageExportService.copyTranscript(messages, ctx))}
        >
          <ClipboardCopy className="h-4 w-4 mr-2" />
          Copy entire transcript
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
