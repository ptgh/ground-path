import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, FolderTree, Search,
  Mail, Loader2, BookOpen, ExternalLink, Database, FlaskConical,
} from 'lucide-react';

interface ConnectorStatus {
  connector: string;
  configured: boolean;
  outcome: 'verified' | 'skipped' | 'failed' | 'not_configured' | 'unreachable';
  latency_ms?: number;
  error?: string;
}

interface DriveItem {
  id: string; name: string; size: number | null; webUrl: string | null;
  lastModified: string | null; isFolder: boolean; mimeType: string | null;
}

interface SearchResult {
  chunk_id: string; document_id: string; document_name: string;
  document_path: string | null; chunk_index: number; content: string; similarity: number;
}

interface InboxItem {
  id: string; subject: string; from: string | null; fromName: string | null;
  receivedAt: string; webLink: string; summary: string;
}

const PRETTY: Record<string, string> = {
  microsoft_outlook: 'Outlook', microsoft_excel: 'Excel',
  microsoft_onedrive: 'OneDrive', microsoft_onenote: 'OneNote',
  microsoft_powerpoint: 'PowerPoint', microsoft_word: 'Word',
  microsoft_teams: 'Teams',
};

const AdminM365Hub = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authorised, setAuthorised] = useState<boolean | null>(null);

  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);

  const [folderItems, setFolderItems] = useState<DriveItem[]>([]);
  const [folderPath, setFolderPath] = useState('/Groundpath');
  const [folderLoading, setFolderLoading] = useState(false);

  const [syncRunning, setSyncRunning] = useState(false);
  const [lastSync, setLastSync] = useState<{ at: string; changed: number; failed: number } | null>(null);
  const [docCount, setDocCount] = useState<number | null>(null);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);

  // Integration smoke tests
  type SmokeResult = { at: string; ok: boolean; status: number | null; body: unknown };
  const [excelTesting, setExcelTesting] = useState(false);
  const [excelResult, setExcelResult] = useState<SmokeResult | null>(null);
  const [teamsTesting, setTeamsTesting] = useState(false);
  const [teamsResult, setTeamsResult] = useState<SmokeResult | null>(null);
  const [wordTesting, setWordTesting] = useState(false);
  const [wordResult, setWordResult] = useState<SmokeResult | null>(null);
  const [pptTesting, setPptTesting] = useState(false);
  const [pptResult, setPptResult] = useState<SmokeResult | null>(null);

  // Authorisation gate
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/practitioner/auth'); return; }
    (async () => {
      const { data } = await supabase.rpc('is_m365_authorised', { _user_id: user.id });
      setAuthorised(!!data);
    })();
  }, [user, authLoading, navigate]);

  const loadHealth = async () => {
    setHealthLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ms-connection-health');
      if (error) throw error;
      setConnectors(data?.connectors ?? []);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Health check failed'); }
    finally { setHealthLoading(false); }
  };

  const loadFolder = async (path = folderPath) => {
    setFolderLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(`ms-onedrive-list?path=${encodeURIComponent(path)}`);
      if (error) throw error;
      setFolderItems(data?.items ?? []);
      setFolderPath(data?.path ?? path);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Folder load failed'); }
    finally { setFolderLoading(false); }
  };

  const loadKbStatus = async () => {
    const { count } = await supabase.from('kb_documents').select('id', { count: 'exact', head: true }).eq('status', 'active');
    setDocCount(count ?? 0);
    const { data } = await supabase.from('kb_sync_runs').select('finished_at, files_changed, files_failed')
      .order('started_at', { ascending: false }).limit(1).maybeSingle();
    if (data?.finished_at) setLastSync({ at: data.finished_at, changed: data.files_changed, failed: data.files_failed });
  };

  const runSync = async () => {
    setSyncRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('ms-kb-sync', { body: {} });
      if (error) throw error;
      toast.success(`Sync done: ${data.filesChanged} changed, ${data.filesFailed} failed of ${data.filesSeen}`);
      await loadKbStatus();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Sync failed'); }
    finally { setSyncRunning(false); }
  };

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('ms-kb-search', { body: { query } });
      if (error) throw error;
      setSearchResults(data?.results ?? []);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Search failed'); }
    finally { setSearching(false); }
  };

  const loadInbox = async () => {
    setInboxLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ms-outlook-triage');
      if (error) throw error;
      setInbox(data?.messages ?? []);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Inbox load failed'); }
    finally { setInboxLoading(false); }
  };

  const runExcelTest = async () => {
    setExcelTesting(true);
    const nowIso = new Date().toISOString();
    const callerEmail = user?.email ?? 'unknown';
    const payload = {
      filePath: 'Groundpath/Logs/ops.xlsx',
      tableName: 'OpsLog',
      values: [[
        nowIso,
        'test',
        'smoke_test',
        'Groundpath/Logs/ops.xlsx#OpsLog',
        'success',
        callerEmail,
        0,
        `Smoke test from AdminM365Hub at ${nowIso}`,
      ]],
    };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://vzwhccciarvirzqmvldl.supabase.co/functions/v1/ms-excel-log`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* keep raw text */ }
      setExcelResult({ at: nowIso, ok: res.ok, status: res.status, body: parsed });
      if (res.ok) toast.success('OpsLog append succeeded');
      else toast.error(`OpsLog append failed (HTTP ${res.status})`);
    } catch (e) {
      setExcelResult({ at: nowIso, ok: false, status: null, body: { error: e instanceof Error ? e.message : String(e) } });
      toast.error('Network error invoking ms-excel-log');
    } finally {
      setExcelTesting(false);
    }
  };

  const runTeamsTest = async () => {
    setTeamsTesting(true);
    const nowIso = new Date().toISOString();
    const payload = {
      configKey: 'teams.alerts',
      subject: 'Smoke test',
      bodyHtml: `<p>Test message from AdminM365Hub at ${nowIso}</p>`,
      importance: 'normal' as const,
    };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://vzwhccciarvirzqmvldl.supabase.co/functions/v1/ms-teams-notify`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* keep raw */ }
      setTeamsResult({ at: nowIso, ok: res.ok, status: res.status, body: parsed });
      if (res.ok) toast.success('Teams channel post succeeded');
      else toast.error(`Teams channel post failed (HTTP ${res.status})`);
    } catch (e) {
      setTeamsResult({ at: nowIso, ok: false, status: null, body: { error: e instanceof Error ? e.message : String(e) } });
      toast.error('Network error invoking ms-teams-notify');
    } finally {
      setTeamsTesting(false);
    }
  };

  const invokeSmoke = async (
    fnName: string,
    payload: Record<string, unknown>,
    setResult: (r: SmokeResult) => void,
    setBusy: (b: boolean) => void,
    successMsg: string,
  ) => {
    setBusy(true);
    const nowIso = new Date().toISOString();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://vzwhccciarvirzqmvldl.supabase.co/functions/v1/${fnName}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* keep raw */ }
      setResult({ at: nowIso, ok: res.ok, status: res.status, body: parsed });
      if (res.ok) toast.success(successMsg);
      else toast.error(`${fnName} failed (HTTP ${res.status})`);
    } catch (e) {
      setResult({ at: nowIso, ok: false, status: null, body: { error: e instanceof Error ? e.message : String(e) } });
      toast.error(`Network error invoking ${fnName}`);
    } finally {
      setBusy(false);
    }
  };

  const runWordTest = () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return invokeSmoke('ms-word-create', {
      filename: `smoke-test-${stamp}.docx`,
      title: 'Smoke test memo',
      bodyMarkdown: `# Smoke test\n\nGenerated by AdminM365Hub at ${new Date().toISOString()} by ${user?.email ?? 'unknown'}.\n\n- Verifies docx build\n- Verifies OneDrive upload\n- Verifies OpsLog audit row`,
      folderPath: 'Groundpath/Generated/SmokeTests',
    }, setWordResult, setWordTesting, 'Word doc created');
  };

  const runPptTest = () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return invokeSmoke('ms-powerpoint-create', {
      filename: `smoke-test-${stamp}.pptx`,
      title: 'Smoke test deck',
      subtitle: `Generated ${new Date().toISOString()}`,
      slides: [
        { title: 'Round-trip check', bullets: ['Build pptx in edge', 'Upload via OneDrive', 'Append OpsLog row'] },
        { title: 'Caller', bullets: [user?.email ?? 'unknown'] },
      ],
      folderPath: 'Groundpath/Generated/SmokeTests',
    }, setPptResult, setPptTesting, 'PowerPoint deck created');
  };

  useEffect(() => {
    if (authorised) { loadHealth(); loadFolder(); loadKbStatus(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorised]);

  if (authLoading || authorised === null) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!authorised) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container max-w-2xl py-16">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Access denied</CardTitle>
              <CardDescription>The Microsoft 365 Hub requires admin role and an allow-listed email.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Contact the administrator to add your email to the M365 allow-list, then return to this page.
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-6xl py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Microsoft 365 Hub</h1>
          <p className="text-sm text-muted-foreground">
            Operations layer for the <code className="text-xs px-1 py-0.5 bg-muted rounded">connect@groundpath.com.au</code> account.
            Knowledge base, inbox triage, and content management — all admin-only and audited.
          </p>
        </div>

        {/* Connection health */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Database className="h-4 w-4 text-primary" /> Connection health</CardTitle>
              <CardDescription>Live status for each Microsoft connector via the Lovable gateway.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={loadHealth} disabled={healthLoading}>
              {healthLoading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />} Test all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {(connectors.length ? connectors : Array.from({ length: 7 }).map((_, i) => ({ connector: `loading-${i}`, configured: false, outcome: 'not_configured' as const })))
                .map((c) => {
                  const ok = c.outcome === 'verified' || c.outcome === 'skipped';
                  return (
                    <div key={c.connector} className="flex items-center gap-2 p-2 rounded-md border border-border/60 bg-card text-sm">
                      {!c.configured ? <XCircle className="h-4 w-4 text-muted-foreground" />
                        : ok ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                        : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      <span className="font-medium">{PRETTY[c.connector] ?? c.connector}</span>
                      {c.latency_ms != null && <span className="text-xs text-muted-foreground ml-auto">{c.latency_ms}ms</span>}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Knowledge base */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-primary" /> Knowledge base</CardTitle>
              <CardDescription>
                Indexed documents from the OneDrive <code className="text-xs px-1 bg-muted rounded">/Groundpath/</code> folder.
                {docCount !== null && <> {docCount} active document{docCount === 1 ? '' : 's'}.</>}
                {lastSync && <> Last sync {new Date(lastSync.at).toLocaleString('en-AU')} — {lastSync.changed} updated, {lastSync.failed} skipped.</>}
              </CardDescription>
            </div>
            <Button size="sm" onClick={runSync} disabled={syncRunning}>
              {syncRunning ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />} Sync now
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Search the knowledge base… e.g. 'cancellation policy'" value={query}
                onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }} />
              <Button onClick={runSearch} disabled={searching || query.trim().length < 2}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {searchResults && (
              <div className="space-y-2">
                {searchResults.length === 0 && <p className="text-sm text-muted-foreground">No matches. Try syncing first if the folder is new.</p>}
                {searchResults.map((r) => (
                  <div key={r.chunk_id} className="p-3 rounded-md border border-border/60 bg-muted/20 text-sm">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Badge variant="outline" className="text-xs">{(r.similarity * 100).toFixed(0)}% match</Badge>
                      <span className="truncate">{r.document_path ?? r.document_name}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OneDrive folder browse */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><FolderTree className="h-4 w-4 text-primary" /> OneDrive: {folderPath}</CardTitle>
            <CardDescription>Browse the Groundpath folder. Click a file to open in Office Online.</CardDescription>
          </CardHeader>
          <CardContent>
            {folderLoading ? <Skeleton className="h-32 w-full" /> : folderItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Folder is empty or doesn't exist. Create <code className="text-xs px-1 bg-muted rounded">/Groundpath/</code> in OneDrive and add your SOPs, policies, and reference docs.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {folderItems.map((it) => (
                  <li key={it.id} className="flex items-center gap-2 py-2 text-sm">
                    {it.isFolder ? <FolderTree className="h-4 w-4 text-amber-500" /> : <BookOpen className="h-4 w-4 text-muted-foreground" />}
                    <span className="flex-1 truncate">{it.name}</span>
                    {it.size != null && <span className="text-xs text-muted-foreground">{(it.size / 1024).toFixed(0)}kb</span>}
                    {it.webUrl && <a href={it.webUrl} target="_blank" rel="noopener noreferrer" className="text-primary"><ExternalLink className="h-3.5 w-3.5" /></a>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Outlook triage */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4 text-primary" /> Inbox triage</CardTitle>
              <CardDescription>Latest unread messages with AI-generated one-line summaries.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={loadInbox} disabled={inboxLoading}>
              {inboxLoading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />} Load inbox
            </Button>
          </CardHeader>
          <CardContent>
            {inbox.length === 0 ? (
              <p className="text-sm text-muted-foreground">Click Load inbox to fetch unread messages from connect@groundpath.com.au.</p>
            ) : (
              <ul className="space-y-2">
                {inbox.map((m) => (
                  <li key={m.id} className="p-3 rounded-md border border-border/60 bg-muted/20 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate flex-1">{m.subject}</span>
                      {m.webLink && <a href={m.webLink} target="_blank" rel="noopener noreferrer" className="text-primary"><ExternalLink className="h-3.5 w-3.5" /></a>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">From {m.fromName || m.from} · {new Date(m.receivedAt).toLocaleString('en-AU')}</p>
                    <p className="text-sm">{m.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Integration smoke tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-primary" /> Integration smoke tests
            </CardTitle>
            <CardDescription>
              Single-row round-trip checks for each Microsoft connector. Use these after any config or
              credential change to confirm Graph path resolution and the gateway are healthy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
                <h3 className="text-sm font-semibold">Excel — ms-excel-log</h3>
                <span className="text-xs text-muted-foreground">
                  Appends to <code className="text-xs px-1 bg-muted rounded">Groundpath/Logs/ops.xlsx#OpsLog</code>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={runExcelTest} disabled={excelTesting}>
                  {excelTesting
                    ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Running…</>
                    : <><FlaskConical className="h-3 w-3 mr-2" /> Test OpsLog append</>}
                </Button>
                {excelResult && (
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    {excelResult.ok
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                    Last run {new Date(excelResult.at).toLocaleString('en-AU')} · HTTP {excelResult.status ?? 'n/a'} · {excelResult.ok ? 'success' : 'failed'}
                  </span>
                )}
              </div>
              {excelResult && (
                <pre className="text-xs p-3 rounded-md border border-border/60 bg-muted/40 overflow-x-auto whitespace-pre-wrap break-words max-h-96">
{JSON.stringify({ status: excelResult.status, ok: excelResult.ok, body: excelResult.body }, null, 2)}
                </pre>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
                <h3 className="text-sm font-semibold">Teams — ms-teams-notify</h3>
                <span className="text-xs text-muted-foreground">
                  Posts to <code className="text-xs px-1 bg-muted rounded">teams.alerts</code> (ops-alerts channel)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={runTeamsTest} disabled={teamsTesting}>
                  {teamsTesting
                    ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Running…</>
                    : <><FlaskConical className="h-3 w-3 mr-2" /> Test channel post</>}
                </Button>
                {teamsResult && (
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    {teamsResult.ok
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                    Last run {new Date(teamsResult.at).toLocaleString('en-AU')} · HTTP {teamsResult.status ?? 'n/a'} · {teamsResult.ok ? 'success' : 'failed'}
                  </span>
                )}
              </div>
              {teamsResult && (
                <pre className="text-xs p-3 rounded-md border border-border/60 bg-muted/40 overflow-x-auto whitespace-pre-wrap break-words max-h-96">
{JSON.stringify({ status: teamsResult.status, ok: teamsResult.ok, body: teamsResult.body }, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center pt-4">
          All actions on this page are logged to the M365 audit trail. PowerPoint generation, Word drafting, and Excel snapshots ship in the next iteration.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default AdminM365Hub;
