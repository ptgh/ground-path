import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Header/Footer retained for the defence-in-depth Access denied fallback only.
// AdminLayout supplies the outer chrome for the authorised render path.
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle, RefreshCw, Loader2, Inbox, Mail, CheckCircle2, Send,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

type IntakeType = 'client' | 'practitioner' | 'other';
type IntakeSource = 'form' | 'inbox';
type IntakeStatus = 'new' | 'in_progress' | 'resolved';
type AckStatus = 'pending' | 'sent' | 'failed' | 'skipped';

interface ContactRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: IntakeStatus;
  intake_type: IntakeType;
  intake_source: IntakeSource;
  external_message_id: string | null;
  acknowledgement_status: AckStatus | null;
  acknowledged_at: string | null;
  acknowledgement_error: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditRow {
  id: string;
  created_at: string;
  function_name: string;
  action: string;
  status: string;
  error_message: string | null;
  target: string | null;
  request_metadata: Record<string, unknown> | null;
}

const PAGE_SIZE = 25;

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(1, Math.floor(diffMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

function truncate(s: string, n = 60): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + '…';
}

function intakeTypeBadge(t: IntakeType) {
  const map: Record<IntakeType, string> = {
    client: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
    practitioner: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
    other: 'bg-muted text-muted-foreground border-border hover:bg-muted',
  };
  return <Badge variant="outline" className={map[t]}>{t}</Badge>;
}

function intakeSourceBadge(s: IntakeSource) {
  return s === 'form'
    ? <Badge className="bg-primary text-primary-foreground hover:bg-primary">form</Badge>
    : <Badge variant="outline">inbox</Badge>;
}

function ackBadge(s: AckStatus | null) {
  if (!s) return <Badge variant="outline" className="text-muted-foreground">—</Badge>;
  const map: Record<AckStatus, string> = {
    sent: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
    pending: 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100',
    skipped: 'bg-muted text-muted-foreground border-border hover:bg-muted',
    failed: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15',
  };
  return <Badge variant="outline" className={map[s]}>{s}</Badge>;
}

function statusBadge(s: IntakeStatus) {
  const map: Record<IntakeStatus, string> = {
    new: 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
    resolved: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  };
  return <Badge variant="outline" className={map[s]}>{s.replace('_', ' ')}</Badge>;
}

const AdminIntake = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authorised, setAuthorised] = useState<boolean | null>(null);

  const [rows, setRows] = useState<ContactRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());
  const [, forceTick] = useState(0);

  const [stats, setStats] = useState<{ new24: number; newAll: number; ackPending: number; awaiting: number } | null>(null);

  const [page, setPage] = useState(0);
  const [filterType, setFilterType] = useState<IntakeType | 'all'>('all');
  const [filterSource, setFilterSource] = useState<IntakeSource | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<IntakeStatus | 'all'>('new');

  const [selected, setSelected] = useState<ContactRow | null>(null);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [marking, setMarking] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmResend, setConfirmResend] = useState(false);
  const [forceResend, setForceResend] = useState(false);

  // Auth gate (mirrors AdminM365Hub)
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/practitioner/auth'); return; }
    (async () => {
      const { data } = await supabase.rpc('is_m365_authorised', { _user_id: user.id });
      setAuthorised(!!data);
    })();
  }, [user, authLoading, navigate]);

  const loadStats = useCallback(async () => {
    const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [a, b, c, d] = await Promise.all([
      supabase.from('contact_forms').select('id', { count: 'exact', head: true })
        .eq('status', 'new').gte('created_at', since24),
      supabase.from('contact_forms').select('id', { count: 'exact', head: true })
        .eq('status', 'new'),
      supabase.from('contact_forms').select('id', { count: 'exact', head: true })
        .eq('acknowledgement_status', 'pending'),
      supabase.from('contact_forms').select('id', { count: 'exact', head: true })
        .eq('status', 'new').lt('created_at', since24),
    ]);
    setStats({
      new24: a.count ?? 0,
      newAll: b.count ?? 0,
      ackPending: c.count ?? 0,
      awaiting: d.count ?? 0,
    });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('contact_forms')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (filterType !== 'all') q = q.eq('intake_type', filterType);
      if (filterSource !== 'all') q = q.eq('intake_source', filterSource);
      if (filterStatus !== 'all') q = q.eq('status', filterStatus);
      const { data, count, error } = await q;
      if (error) throw error;
      setRows((data ?? []) as ContactRow[]);
      setTotalCount(count ?? 0);
      setRefreshedAt(new Date());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load intake');
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterSource, filterStatus]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadStats(), loadRows()]);
  }, [loadStats, loadRows]);

  // Initial + filter changes
  useEffect(() => {
    if (authorised) refreshAll();
  }, [authorised, refreshAll]);

  // Auto-refresh on tab focus
  useEffect(() => {
    if (!authorised) return;
    const onFocus = () => refreshAll();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [authorised, refreshAll]);

  // Re-render the relative-time indicator every 5s
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [filterType, filterSource, filterStatus]);

  const loadAudit = useCallback(async (row: ContactRow) => {
    setAuditLoading(true);
    setAuditRows([]);
    try {
      // Single query: match by metadata->>'contact_form_id' = row.id
      // OR (target = row.email AND created_at within ±5 minutes of row.created_at)
      const created = new Date(row.created_at).getTime();
      const lo = new Date(created - 5 * 60 * 1000).toISOString();
      const hi = new Date(created + 5 * 60 * 1000).toISOString();
      const orFilter = [
        `request_metadata->>contact_form_id.eq.${row.id}`,
        `and(target.eq.${row.email},created_at.gte.${lo},created_at.lte.${hi})`,
      ].join(',');
      const { data, error } = await supabase
        .from('m365_audit_log')
        .select('id, created_at, function_name, action, status, error_message, target, request_metadata')
        .or(orFilter)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setAuditRows((data ?? []) as AuditRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load audit trail');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const openRow = (row: ContactRow) => {
    setSelected(row);
    void loadAudit(row);
  };

  const writeAdminAudit = async (action: 'mark_responded' | 'resend_acknowledgement', row: ContactRow, status: 'success' | 'error', errorMessage?: string) => {
    await supabase.from('m365_audit_log').insert({
      function_name: 'admin-intake',
      action,
      status,
      target: row.email,
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      error_message: errorMessage ?? null,
      request_metadata: { contact_form_id: row.id, admin_user_id: user?.id ?? null },
    });
  };

  const markResponded = async () => {
    if (!selected) return;
    setMarking(true);
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('contact_forms')
        .update({ status: 'resolved', responded_at: nowIso })
        .eq('id', selected.id)
        .select('*')
        .single();
      if (error) throw error;
      await writeAdminAudit('mark_responded', selected, 'success');
      const updated = data as ContactRow;
      setSelected(updated);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      void loadStats();
      toast.success('Marked as responded');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to mark responded';
      await writeAdminAudit('mark_responded', selected, 'error', msg);
      toast.error(msg);
    } finally {
      setMarking(false);
    }
  };

  const resendAck = async () => {
    if (!selected) return;
    setResending(true);
    setConfirmResend(false);
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-acknowledgement', {
        body: { contact_form_id: selected.id },
      });
      if (error) throw error;
      await writeAdminAudit('resend_acknowledgement', selected, 'success');
      // Re-fetch the row
      const { data: refreshed } = await supabase
        .from('contact_forms').select('*').eq('id', selected.id).single();
      if (refreshed) {
        const r = refreshed as ContactRow;
        setSelected(r);
        setRows((prev) => prev.map((x) => (x.id === r.id ? r : x)));
      }
      void loadStats();
      void loadAudit(selected);
      toast.success(data?.skipped ? `Acknowledgement skipped (${data.reason ?? 'already sent'})` : 'Acknowledgement re-sent');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to resend acknowledgement';
      await writeAdminAudit('resend_acknowledgement', selected, 'error', msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);

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
              <CardDescription>The Intake view requires admin role and an allow-listed email.</CardDescription>
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

  const replyHref = selected
    ? `mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`
    : '#';

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Inbox className="h-6 w-6 text-primary" /> Intake
            </h2>
            <p className="text-sm text-muted-foreground">
              Public contact form submissions and triaged inbox messages requiring response.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>updated {relativeTime(refreshedAt.toISOString())}</span>
            <Button size="sm" variant="outline" onClick={refreshAll} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="New (last 24h)" value={stats?.new24} />
          <StatTile label="New (all time)" value={stats?.newAll} />
          <StatTile label="Acknowledgement pending" value={stats?.ackPending} tone={stats?.ackPending ? 'amber' : 'default'} />
          <StatTile label="Awaiting response > 24h" value={stats?.awaiting} tone={stats?.awaiting ? 'destructive' : 'default'} />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Type</span>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as IntakeType | 'all')}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="practitioner">Practitioner</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Source</span>
              <Select value={filterSource} onValueChange={(v) => setFilterSource(v as IntakeSource | 'all')}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="inbox">Inbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as IntakeStatus | 'all')}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              {totalCount} match{totalCount === 1 ? '' : 'es'}
            </div>
          </CardContent>
        </Card>

        {/* Rows */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ack</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…</TableCell></TableRow>
                )}
                {!loading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No intake matches these filters.</TableCell></TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => openRow(r)}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </TableCell>
                    <TableCell>{intakeTypeBadge(r.intake_type)}</TableCell>
                    <TableCell>{intakeSourceBadge(r.intake_source)}</TableCell>
                    <TableCell className="max-w-[280px]"><span title={r.subject}>{truncate(r.subject)}</span></TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell>{ackBadge(r.acknowledgement_status)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">{relativeTime(r.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t">
                <div className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setAuditRows([]); } }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 pr-6">
                  <span className="truncate">{selected.subject}</span>
                </SheetTitle>
                <SheetDescription>
                  From <span className="font-medium text-foreground">{selected.name}</span> &lt;{selected.email}&gt; · {relativeTime(selected.created_at)}
                </SheetDescription>
                <div className="flex flex-wrap gap-2 pt-1">
                  {intakeTypeBadge(selected.intake_type)}
                  {intakeSourceBadge(selected.intake_source)}
                  {statusBadge(selected.status)}
                  {ackBadge(selected.acknowledgement_status)}
                </div>
              </SheetHeader>

              <div className="space-y-5 py-5">
                {/* Message body */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Message</h3>
                  <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </section>

                {/* Metadata */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Metadata</h3>
                  <dl className="grid grid-cols-[140px_1fr] gap-y-1.5 text-sm">
                    <Meta k="Intake type" v={selected.intake_type} />
                    <Meta k="Intake source" v={selected.intake_source} />
                    <Meta k="Status" v={selected.status} />
                    <Meta k="Acknowledgement" v={selected.acknowledgement_status ?? '—'} />
                    {selected.acknowledged_at && <Meta k="Acknowledged at" v={new Date(selected.acknowledged_at).toLocaleString('en-AU')} />}
                    {selected.acknowledgement_error && <Meta k="Ack error" v={selected.acknowledgement_error} mono />}
                    {selected.external_message_id && <Meta k="External msg id" v={selected.external_message_id} mono />}
                    {selected.responded_at && <Meta k="Responded at" v={new Date(selected.responded_at).toLocaleString('en-AU')} />}
                    <Meta k="Created" v={new Date(selected.created_at).toLocaleString('en-AU')} />
                    <Meta k="Updated" v={new Date(selected.updated_at).toLocaleString('en-AU')} />
                  </dl>
                </section>

                {/* Audit trail */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Audit trail</h3>
                  {auditLoading ? (
                    <div className="text-sm text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin inline mr-2" /> Loading…</div>
                  ) : auditRows.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No audit entries found.</div>
                  ) : (
                    <ol className="space-y-2">
                      {auditRows.map((a) => (
                        <li key={a.id} className="rounded-md border border-border/60 bg-card p-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{a.function_name} · {a.action}</span>
                            <Badge
                              variant="outline"
                              className={
                                a.status === 'success' ? 'bg-green-100 text-green-800 border-green-200' :
                                a.status === 'error' ? 'bg-destructive/15 text-destructive border-destructive/30' :
                                'bg-muted text-muted-foreground border-border'
                              }
                            >
                              {a.status}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleString('en-AU')}</div>
                          {a.error_message && <div className="text-destructive mt-1 break-words">{a.error_message}</div>}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>

              <div className="sticky bottom-0 -mx-6 px-6 py-3 border-t bg-background/95 backdrop-blur flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={markResponded}
                  disabled={marking || selected.status === 'resolved'}
                >
                  {marking ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                  Mark responded
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={replyHref}><Mail className="h-3 w-3 mr-2" /> Open reply in mail</a>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmResend(true)} disabled={resending}>
                  {resending ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Send className="h-3 w-3 mr-2" />}
                  Resend acknowledgement
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmResend} onOpenChange={setConfirmResend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend acknowledgement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will re-send the acknowledgement email to <span className="font-medium text-foreground">{selected?.email}</span>. They will receive a new message in their inbox.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resendAck}>Resend</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const StatTile = ({ label, value, tone = 'default' }: { label: string; value: number | undefined; tone?: 'default' | 'amber' | 'destructive' }) => {
  const toneClass =
    tone === 'amber' ? 'text-amber-700' :
    tone === 'destructive' ? 'text-destructive' :
    'text-foreground';
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${toneClass}`}>
        {value === undefined ? <Loader2 className="h-5 w-5 animate-spin" /> : value}
      </div>
    </div>
  );
};

const Meta = ({ k, v, mono }: { k: string; v: string; mono?: boolean }) => (
  <>
    <dt className="text-muted-foreground">{k}</dt>
    <dd className={mono ? 'font-mono text-xs break-all' : 'break-words'}>{v}</dd>
  </>
);

export default AdminIntake;
