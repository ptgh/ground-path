import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface HalaxyEmbedProps {
  embedUrl: string;
  fallbackUrl?: string;
}

const FALLBACK_HALAXY_URL = 'https://www.halaxy.com/profile/groundpath/location/1353667';

const HalaxyEmbed = ({ embedUrl, fallbackUrl }: HalaxyEmbedProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const externalUrl = fallbackUrl || FALLBACK_HALAXY_URL;

  return (
    <div className="w-full">
      <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-card">
        {isLoading && (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-[520px] w-full rounded-lg" />
          </div>
        )}
        <div
          className={cn(
            'w-full overflow-hidden',
            isLoading ? 'h-0' : 'min-h-[520px]'
          )}
        >
          <iframe
            src={embedUrl}
            title="Book a session with Groundpath via Halaxy"
            className="block w-full border-0 h-[520px] sm:h-[560px] lg:h-[520px]"
            onLoad={() => setIsLoading(false)}
            allow="payment"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            scrolling="no"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Powered by Halaxy</span>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Having trouble? Book directly
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

export default HalaxyEmbed;
