import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import type { MessageStatus as StatusType } from '@/services/messagingService';

interface MessageStatusProps {
  status: StatusType;
  className?: string;
}

export const MessageStatus = ({ status, className = '' }: MessageStatusProps) => {
  const base = `inline-flex items-center ${className}`;

  switch (status) {
    case 'sending':
      return <Clock className={`h-3 w-3 ${base} text-white/40`} />;
    case 'failed':
      return <AlertCircle className={`h-3 w-3 ${base} text-destructive`} />;
    case 'sent':
      return <Check className={`h-3 w-3 ${base} text-white/50`} />;
    case 'delivered':
      return <CheckCheck className={`h-3 w-3 ${base} text-white/50`} />;
    case 'read':
      return <CheckCheck className={`h-3 w-3 ${base} text-blue-300`} />;
    default:
      return null;
  }
};
