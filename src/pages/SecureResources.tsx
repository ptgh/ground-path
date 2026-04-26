import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Download, FileText, Loader2, Search, Clock } from 'lucide-react';
import Header from '@/components/Header';
import SEO from '@/components/SEO';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

interface DownloadLogEntry {
  id: string;
  resource_id: string | null;
  succeeded: boolean;
  failure_reason: string | null;
  created_at: string;
}

const formatBytes = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const SecureResources = () => {
  const { user, loading: authLoading } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [history, setHistory] = useState<DownloadLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [{ data: res }, { data: log }] = await Promise.all([
          supabase
            .from('secure_resources')
            .select('id, title, description, category, mime_type, size_bytes, created_at')
            .eq('is_published', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('secure_resource_downloads')
            .select('id, resource_id, succeeded, failure_reason, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);
        if (cancelled) return;
        setResources((res ?? []) as Resource[]);
        setHistory((log ?? []) as DownloadLogEntry[]);
      } catch (err) {
        console.error('Error loading secure resources', err);
        toast.error('Could not load resources');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth?redirect=/secure-resources" replace />;
  }

  const handleDownload = async (resource: Resource) => {
    try {
      setDownloadingId(resource.id);
      const { data, error } = await supabase.functions.invoke('secure-resource-download', {
        body: { resource_id: resource.id },
      });
      if (error || !data?.url) {
        throw new Error(error?.message || 'Could not generate download link');
      }
      // Open the short-lived signed URL — browser handles the file download
      window.open(data.url as string, '_blank', 'noopener,noreferrer');
      toast.success(`Downloading ${resource.title}`);

      // Refresh local history
      const { data: log } = await supabase
        .from('secure_resource_downloads')
        .select('id, resource_id, succeeded, failure_reason, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setHistory((log ?? []) as DownloadLogEntry[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      toast.error(message);
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = resources.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      (r.description?.toLowerCase().includes(q) ?? false) ||
      r.category.toLowerCase().includes(q)
    );
  });

  const lookupTitle = (id: string | null) =>
    id ? resources.find((r) => r.id === id)?.title ?? 'Removed resource' : 'Unknown';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Secure Resources" noindex />
      <Header />
      <main className="flex-1 pt-[73px]">
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
          <header className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Secure Resources</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              These files are only available to signed-in members. Each download is logged
              for clinical audit and accountability. Download links expire after 60 seconds.
            </p>
          </header>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center space-y-2">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-foreground font-medium">No resources available yet</p>
                <p className="text-sm text-muted-foreground">
                  An administrator will publish resources here soon.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((r) => (
                <Card key={r.id} className="border-border/60">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{r.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] px-2 py-0 capitalize">
                            {r.category}
                          </Badge>
                          {r.size_bytes && (
                            <span className="text-[11px] text-muted-foreground">
                              {formatBytes(r.size_bytes)}
                            </span>
                          )}
                        </div>
                      </div>
                      <FileText className="h-5 w-5 text-muted-foreground/60 flex-shrink-0" />
                    </div>
                    {r.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{r.description}</p>
                    )}
                    <Button
                      onClick={() => handleDownload(r)}
                      disabled={downloadingId === r.id}
                      size="sm"
                      className="w-full gap-1.5"
                    >
                      {downloadingId === r.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Preparing…
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" /> Download
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {history.length > 0 && (
            <section className="space-y-3 pt-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" /> Your recent downloads
              </h2>
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {lookupTitle(h.resource_id)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(h.created_at), 'PPp')}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          h.succeeded
                            ? 'border-sage-300 text-sage-700'
                            : 'border-destructive/40 text-destructive'
                        }
                      >
                        {h.succeeded ? 'Downloaded' : h.failure_reason ?? 'Failed'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default SecureResources;
