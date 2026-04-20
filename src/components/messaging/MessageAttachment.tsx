import { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { Message, messagingService } from '@/services/messagingService';

interface MessageAttachmentProps {
  message: Message;
  isOwn: boolean;
}

export const MessageAttachment = ({ message, isOwn }: MessageAttachmentProps) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    message.resolved_attachment_url || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Resolve URL on demand if we have a path but no resolved URL
  useEffect(() => {
    if (message.attachment_path && !resolvedUrl && !error) {
      setLoading(true);
      messagingService.getSignedUrl(message.attachment_path)
        .then(url => setResolvedUrl(url))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [message.attachment_path, resolvedUrl, error]);

  const attachmentUrl = resolvedUrl || message.attachment_url;

  if (loading && message.attachment_path) {
    return (
      <div className="mt-1.5 text-[10px] text-muted-foreground animate-pulse">
        Loading attachment…
      </div>
    );
  }

  if (error && message.attachment_path) {
    return (
      <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`}>
        <AlertCircle className="h-3 w-3" />
        Attachment unavailable
      </div>
    );
  }

  // Voice note
  if (message.attachment_type === 'voice_note' && attachmentUrl) {
    return (
      <div className="mt-1.5">
        <audio controls preload="metadata" className="max-w-[220px] h-8" style={{ filter: isOwn ? 'invert(1) hue-rotate(180deg)' : 'none' }}>
          <source src={attachmentUrl} type="audio/webm" />
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
  if (message.attachment_type === 'image' && attachmentUrl) {
    return (
      <div className="mt-1.5">
        <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={attachmentUrl}
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
  if (message.attachment_type === 'file' && attachmentUrl) {
    const sizeStr = message.attachment_size
      ? message.attachment_size > 1024 * 1024
        ? `${(message.attachment_size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(message.attachment_size / 1024)} KB`
      : '';

    return (
      <a
        href={attachmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-1.5 flex items-center gap-2 rounded-lg p-2 ${
          isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-background hover:bg-accent'
        } transition-colors`}
      >
        <FileText className={`h-5 w-5 flex-shrink-0 ${isOwn ? 'text-white/80' : 'text-primary'}`} />
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
          <ExternalLink className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isOwn ? 'text-white/70' : 'text-primary'}`} />
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

  // Legacy attachment_url fallback (no path stored)
  if (message.attachment_url && !message.attachment_path) {
    return (
      <a
        href={message.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-xs underline mt-1 block ${isOwn ? 'text-white/80' : 'text-primary'}`}
      >
        📎 Attachment
      </a>
    );
  }

  return null;
};
