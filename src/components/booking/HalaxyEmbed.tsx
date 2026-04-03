import { useId, useState } from 'react';
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
  const scrollContainerId = useId().replace(/:/g, '');
  const externalUrl = fallbackUrl || FALLBACK_HALAXY_URL;

  return (
    <div className="w-full">
      <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-card">
        <style>{`
          #${scrollContainerId} {
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          #${scrollContainerId}::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }
        `}</style>

        {isLoading && (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-[680px] sm:h-[720px] lg:h-[680px] w-full rounded-lg" />
          </div>
        )}
        <div
          id={scrollContainerId}
          className={cn(
            'w-full overflow-y-auto overflow-x-hidden overscroll-contain',
            isLoading ? 'h-0' : 'h-[680px] sm:h-[720px] lg:h-[680px]'
          )}
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          <iframe
            src={embedUrl}
            title="Book a session with Groundpath via Halaxy"
            className="block w-full border-0 h-[1120px] sm:h-[1180px] lg:h-[1120px]"
            onLoad={() => setIsLoading(false)}
            allow="payment"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            scrolling="yes"
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
