import { FileText, Image, Download, ExternalLink } from 'lucide-react';
import { Message } from '@/services/messagingService';

interface MessageAttachmentProps {
  message: Message;
  isOwn: boolean;
}

export const MessageAttachment = ({ message, isOwn }: MessageAttachmentProps) => {
  // Voice note
  if (message.attachment_type === 'voice_note' && message.attachment_url) {
    return (
      <div className="mt-1.5">
        <audio controls preload="metadata" className="max-w-[220px] h-8" style={{ filter: isOwn ? 'invert(1) hue-rotate(180deg)' : 'none' }}>
          <source src={message.attachment_url} type="audio/webm" />
          Your browser does not support audio playback.
        </audio>
        {message.attachment_name && (
          <span className={`text-[10px] block mt-0.5 ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`}>
            {message.attachment_name}
          </span>
        )}
      </div>
    );
  }

  // Image attachment
  if (message.attachment_type === 'image' && message.attachment_url) {
    return (
      <div className="mt-1.5">
        <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
          <img
            src={message.attachment_url}
            alt={message.attachment_name || 'Image'}
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
            loading="lazy"
          />
        </a>
        {message.attachment_name && (
          <span className={`text-[10px] block mt-0.5 ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`}>
            {message.attachment_name}
          </span>
        )}
      </div>
    );
  }

  // File attachment
  if (message.attachment_type === 'file' && message.attachment_url) {
    const sizeStr = message.attachment_size
      ? message.attachment_size > 1024 * 1024
        ? `${(message.attachment_size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(message.attachment_size / 1024)} KB`
      : '';

    return (
      <a
        href={message.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-1.5 flex items-center gap-2 rounded-lg p-2 ${
          isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-background hover:bg-accent'
        } transition-colors`}
      >
        <FileText className={`h-5 w-5 flex-shrink-0 ${isOwn ? 'text-white/80' : 'text-sage-600'}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-medium truncate ${isOwn ? 'text-white' : 'text-foreground'}`}>
            {message.attachment_name || 'File'}
          </p>
          {sizeStr && (
            <p className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`}>{sizeStr}</p>
          )}
        </div>
        <Download className={`h-3.5 w-3.5 flex-shrink-0 ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`} />
      </a>
    );
  }

  // Resource link
  if (message.resource_url) {
    return (
      <a
        href={message.resource_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-1.5 block rounded-lg p-2.5 border ${
          isOwn
            ? 'border-white/20 bg-white/10 hover:bg-white/15'
            : 'border-border bg-background hover:bg-accent'
        } transition-colors`}
      >
        <div className="flex items-start gap-2">
          <ExternalLink className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isOwn ? 'text-white/70' : 'text-sage-600'}`} />
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold truncate ${isOwn ? 'text-white' : 'text-foreground'}`}>
              {message.resource_title || message.resource_url}
            </p>
            {message.resource_description && (
              <p className={`text-[10px] mt-0.5 line-clamp-2 ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`}>
                {message.resource_description}
              </p>
            )}
            <p className={`text-[10px] mt-0.5 truncate ${isOwn ? 'text-white/40' : 'text-muted-foreground/70'}`}>
              {message.resource_url}
            </p>
          </div>
        </div>
      </a>
    );
  }

  // Legacy attachment_url fallback
  if (message.attachment_url) {
    return (
      <a
        href={message.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-xs underline mt-1 block ${isOwn ? 'text-white/80' : 'text-sage-600'}`}
      >
        📎 Attachment
      </a>
    );
  }

  return null;
};
