import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import {
  shortName,
  initials,
  isProfileIncomplete,
  type NameParts,
} from '@/lib/displayName';

interface ClientIdentityHeaderProps {
  /** Raw display_name from the profile (may be null/empty) */
  displayName?: string | null;
  /** Stable user_id used for the fallback handle */
  userId: string;
  /** Optional avatar image URL */
  avatarUrl?: string | null;
  /** Whether to render the role chip (default: true) */
  role?: NameParts['role'];
  /** Layout density */
  size?: 'sm' | 'md';
  /** Optional secondary text (e.g. "click for details") */
  hint?: string;
  /** Override the chip label (defaults to "Client" / "Practitioner") */
  chipLabel?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Single source of truth for how a participant's identity is presented
 * everywhere a dropdown / popover / header surface shows them.
 *
 * Renders: Avatar (initials fallback) + "Paul H." + Role chip
 * (+ "Profile incomplete" badge when display_name is missing).
 */
export const ClientIdentityHeader = ({
  displayName,
  userId,
  avatarUrl,
  role = 'client',
  size = 'md',
  hint,
  chipLabel,
  className = '',
}: ClientIdentityHeaderProps) => {
  const label = shortName({ displayName, userId, role });
  const initialsLabel = initials(displayName) === '?'
    ? label.charAt(0).toUpperCase()
    : initials(displayName);
  const incomplete = isProfileIncomplete(displayName);
  const chip = chipLabel ?? (role === 'practitioner' ? 'Practitioner' : 'Client');

  const avatarSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const titleSize = size === 'sm' ? 'text-sm' : 'text-sm';

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <Avatar className={`${avatarSize} flex-shrink-0`}>
        <AvatarImage src={avatarUrl || undefined} alt={label} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
          {initialsLabel}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 text-left">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`${titleSize} font-semibold text-foreground truncate`}>
            {label}
          </span>
          <Badge
            variant="outline"
            className="h-4 px-1.5 text-[9px] border-sage-300 text-sage-700 font-normal"
          >
            {chip}
            {!incomplete && <span className="ml-1 opacity-70">({initialsLabel})</span>}
          </Badge>
          {incomplete && (
            <Badge
              variant="outline"
              className="h-4 px-1.5 text-[9px] border-amber-300 text-amber-700 font-normal gap-0.5"
            >
              <AlertCircle className="h-2.5 w-2.5" />
              Profile incomplete
            </Badge>
          )}
        </div>
        {hint && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{hint}</p>
        )}
      </div>
    </div>
  );
};

export default ClientIdentityHeader;
