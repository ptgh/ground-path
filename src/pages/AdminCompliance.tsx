import { useEffect, useState, useCallback, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
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
  AlertTriangle, RefreshCw, Loader2, ShieldCheck, Plus, Trash2, RotateCw, BellOff,
} from 'lucide-react';

type Kind = 'registration' | 'membership' | 'insurance' | 'check' | 'certification' | 'other';
const KINDS: Kind[] = ['registration', 'membership', 'insurance', 'check', 'certification', 'other'];

interface ComplianceRow {
  id: string;
  name: string;
  kind: Kind;
  owner: string;
  expires_at: string | null;
  notes: string | null;
  snoozed_until: string | null;
  last_alerted_tier: number | null;
  last_alerted_at: string | null;
  renewed_at: string | null;
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const exp = Date.UTC(y, (m ?? 1) - 1, d ?? 1);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((exp - today) / 86_400_000);
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(1, Math.floor(diffMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

function kindBadge(k: Kind) {
  const map: Record<Kind, string> = {
    registration: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
    membership: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',
    insurance: 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100',
    check: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
    certification: 'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100',
    other: 'bg-muted text-muted-foreground border-border hover:bg-muted',
  };
  return <Badge variant="outline" className={map[k]}>{k}</Badge>;
}

function daysCell(expiresAt: string | null) {
  if (!expiresAt) return <span className="text-muted-foreground">—</span>;
  const d = daysBetween(expiresAt);
  let cls = 'text-foreground';
  let label: string;
  if (d < 0) { cls = 'text-destructive font-semibold'; label = `${Math.abs(d)}d overdue`; }
  else if (d < 30) { cls = 'text-destructive font-medium'; label = `${d}d`; }
  else if (d < 90) { cls = 'text-amber-700 font-medium'; label = `${d}d`; }
  else { cls = 'text-green-700'; label = `${d}d`; }
  return <span className={cls}>{label}</span>;
}

const EMPTY_DRAFT = {
  name: '', kind: 'registration' as Kind, owner: 'practice',
  expires_at: '', notes: '',
};

const AdminCompliance = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authorised, setAuthorised] = useState<boolean | null>(null);

  const [rows, setRows] = useState<ComplianceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());

  const [selected, setSelected] = useState<ComplianceRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [renewOpen, setRenewOpen] = useState(false);
  const [renewDate, setRenewDate] = useState('');
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Auth gate (mirrors AdminIntake / AdminM365Hub)
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/practitioner/auth'); return; }
    (async () => {
      const { data } = await supabase.rpc('is_m365_authorised', { _user_id: user.id });
      setAuthorised(!!data);
    })();
  }, [user, authLoading, navigate]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('compliance_items')
        .select('*');
      if (error) throw error;
      const all = (data ?? []) as ComplianceRow[];
      // Sort: nulls last, otherwise expires_at ascending
      all.sort((a, b) => {
        if (!a.expires_at && !b.expires_at) return a.name.localeCompare(b.name);
        if (!a.expires_at) return 1;
        if (!b.expires_at) return -1;
        return a.expires_at.localeCompare(b.expires_at);
      });
      setRows(all);
      setRefreshedAt(new Date());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load compliance items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (authorised) void loadRows(); }, [authorised, loadRows]);

  const stats = useMemo(() => {
    let overdue = 0, urgent = 0, soon = 0;
    for (const r of rows) {
      if (!r.expires_at) continue;
      const d = daysBetween(r.expires_at);
      if (d < 0) overdue++;
      else if (d <= 7) urgent++;
      else if (d <= 30) soon++;
    }
    return { overdue, urgent, soon, total: rows.length };
  }, [rows]);

  const writeAdminAudit = async (
    action: 'create' | 'update' | 'renew' | 'snooze' | 'delete',
    item: { id: string; name: string },
    status: 'success' | 'error',
    errorMessage?: string,
  ) => {
    await supabase.from('m365_audit_log').insert({
      function_name: 'admin-compliance',
      action,
      status,
      target: item.name,
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      error_message: errorMessage ?? null,
      request_metadata: { compliance_item_id: item.id, admin_user_id: user?.id ?? null },
    });
  };

  const loadAudit = useCallback(async (row: ComplianceRow) => {
    setAuditLoading(true);
    setAuditRows([]);
    try {
      // Match by metadata->>'compliance_item_id' = row.id
      // OR (function_name = 'compliance-daily-check' within 24h of last_alerted_at)
      const filters: string[] = [`request_metadata->>compliance_item_id.eq.${row.id}`];
      if (row.last_alerted_at) {
        const t = new Date(row.last_alerted_at).getTime();
        const lo = new Date(t - 12 * 60 * 60 * 1000).toISOString();
        const hi = new Date(t + 12 * 60 * 60 * 1000).toISOString();
        filters.push(`and(function_name.eq.compliance-daily-check,created_at.gte.${lo},created_at.lte.${hi})`);
      }
      const { data, error } = await supabase
        .from('m365_audit_log')
        .select('id, created_at, function_name, action, status, error_message, target, request_metadata')
        .or(filters.join(','))
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setAuditRows((data ?? []) as AuditRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load audit trail');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const openRow = (row: ComplianceRow) => {
    setSelected(row);
    setCreating(false);
    setDraft({
      name: row.name,
      kind: row.kind,
      owner: row.owner,
      expires_at: row.expires_at ?? '',
      notes: row.notes ?? '',
    });
    void loadAudit(row);
  };

  const openCreate = () => {
    setSelected(null);
    setCreating(true);
    setDraft(EMPTY_DRAFT);
    setAuditRows([]);
  };

  const closeDrawer = () => {
    setSelected(null);
    setCreating(false);
  };

  const save = async () => {
    if (!draft.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        kind: draft.kind,
        owner: draft.owner.trim() || 'practice',
        expires_at: draft.expires_at || null,
        notes: draft.notes.trim() || null,
        last_alerted_tier: null, // re-evaluate next run
      };
      if (creating) {
        const { data, error } = await supabase
          .from('compliance_items').insert(payload).select('*').single();
        if (error) throw error;
        const r = data as ComplianceRow;
        await writeAdminAudit('create', { id: r.id, name: r.name }, 'success');
        toast.success('Compliance item created');
        await loadRows();
        closeDrawer();
      } else if (selected) {
        const { data, error } = await supabase
          .from('compliance_items').update(payload).eq('id', selected.id).select('*').single();
        if (error) throw error;
        const r = data as ComplianceRow;
        await writeAdminAudit('update', { id: r.id, name: r.name }, 'success');
        toast.success('Updated');
        await loadRows();
        setSelected(r);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      if (selected) await writeAdminAudit(creating ? 'create' : 'update', { id: selected.id, name: draft.name }, 'error', msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const renew = async () => {
    if (!selected || !renewDate) return;
    try {
      const { data, error } = await supabase.rpc('renew_compliance_item', {
        _id: selected.id, _new_expires_at: renewDate,
      });
      if (error) throw error;
      const r = (Array.isArray(data) ? data[0] : data) as ComplianceRow;
      await writeAdminAudit('renew', { id: selected.id, name: selected.name }, 'success');
      toast.success(`Renewed to ${renewDate}`);
      setRenewOpen(false);
      setRenewDate('');
      await loadRows();
      if (r) setSelected(r);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Renew failed';
      await writeAdminAudit('renew', { id: selected.id, name: selected.name }, 'error', msg);
      toast.error(msg);
    }
  };

  const snooze = async () => {
    if (!selected || !snoozeDate) return;
    try {
      const { data, error } = await supabase.rpc('snooze_compliance_item', {
        _id: selected.id, _snooze_until: snoozeDate,
      });
      if (error) throw error;
      const r = (Array.isArray(data) ? data[0] : data) as ComplianceRow;
      await writeAdminAudit('snooze', { id: selected.id, name: selected.name }, 'success');
      toast.success(`Snoozed until ${snoozeDate}`);
      setSnoozeOpen(false);
      setSnoozeDate('');
      await loadRows();
      if (r) setSelected(r);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Snooze failed';
      await writeAdminAudit('snooze', { id: selected.id, name: selected.name }, 'error', msg);
      toast.error(msg);
    }
  };

  const remove = async () => {
    if (!selected) return;
    setConfirmDelete(false);
    try {
      const { error } = await supabase.from('compliance_items').delete().eq('id', selected.id);
      if (error) throw error;
      await writeAdminAudit('delete', { id: selected.id, name: selected.name }, 'success');
      toast.success('Deleted');
      await loadRows();
      closeDrawer();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      await writeAdminAudit('delete', { id: selected.id, name: selected.name }, 'error', msg);
      toast.error(msg);
    }
  };

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
              <CardDescription>The Compliance view requires admin role and an allow-listed email.</CardDescription>
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

  const drawerOpen = creating || selected !== null;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" /> Compliance
            </h2>
            <p className="text-sm text-muted-foreground">
              Practice registrations, memberships, insurance, and certifications. Daily check runs at 8am Brisbane.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>updated {relativeTime(refreshedAt.toISOString())}</span>
            <Button size="sm" variant="outline" onClick={loadRows} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />}
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3 w-3 mr-2" /> Add
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Overdue" value={stats.overdue} tone={stats.overdue ? 'destructive' : 'default'} />
          <StatTile label="Expiring ≤ 7 days" value={stats.urgent} tone={stats.urgent ? 'destructive' : 'default'} />
          <StatTile label="Expiring 8–30 days" value={stats.soon} tone={stats.soon ? 'amber' : 'default'} />
          <StatTile label="Total tracked" value={stats.total} />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last alerted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No compliance items yet.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => {
                  const snoozed = r.snoozed_until && r.snoozed_until > todayIso();
                  return (
                    <TableRow key={r.id} onClick={() => openRow(r)} className="cursor-pointer">
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{kindBadge(r.kind)}</TableCell>
                      <TableCell><Badge variant="outline">{r.owner}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.expires_at ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{daysCell(r.expires_at)}</TableCell>
                      <TableCell>
                        {snoozed ? (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                            <BellOff className="h-3 w-3 mr-1" /> snoozed
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.last_alerted_at
                          ? <>tier {r.last_alerted_tier ?? '?'} · {relativeTime(r.last_alerted_at)}</>
                          : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={drawerOpen} onOpenChange={(o) => { if (!o) closeDrawer(); }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{creating ? 'New compliance item' : selected?.name}</SheetTitle>
            <SheetDescription>
              {creating ? 'Add a tracked registration, membership, insurance or certification.' : 'Edit, renew, snooze or delete this item.'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Kind</label>
                <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v as Kind })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Owner</label>
                <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Expires at</label>
              <Input type="date" value={draft.expires_at} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                {creating ? 'Create' : 'Save changes'}
              </Button>
              {!creating && selected && (
                <>
                  <Button variant="outline" onClick={() => { setRenewDate(''); setRenewOpen(true); }}>
                    <RotateCw className="h-3 w-3 mr-2" /> Renew
                  </Button>
                  <Button variant="outline" onClick={() => { setSnoozeDate(''); setSnoozeOpen(true); }}>
                    <BellOff className="h-3 w-3 mr-2" /> Snooze
                  </Button>
                  <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-3 w-3 mr-2" /> Delete
                  </Button>
                </>
              )}
            </div>

            {!creating && selected && (
              <>
                <div className="border-t pt-4 mt-4 text-xs text-muted-foreground space-y-1">
                  {selected.snoozed_until && <div>Snoozed until <span className="font-mono">{selected.snoozed_until}</span></div>}
                  {selected.renewed_at && <div>Last renewed {relativeTime(selected.renewed_at)}</div>}
                  {selected.last_alerted_at && (
                    <div>Last alerted at tier {selected.last_alerted_tier ?? '?'} · {relativeTime(selected.last_alerted_at)}</div>
                  )}
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="text-sm font-medium mb-2">Audit trail</div>
                  {auditLoading ? (
                    <div className="text-xs text-muted-foreground"><Loader2 className="h-3 w-3 inline animate-spin mr-1" />Loading…</div>
                  ) : auditRows.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No audit events yet.</div>
                  ) : (
                    <ul className="space-y-1 text-xs">
                      {auditRows.map((a) => (
                        <li key={a.id} className="flex items-baseline gap-2 border-b border-border/40 py-1">
                          <span className="font-mono text-muted-foreground">{relativeTime(a.created_at)}</span>
                          <span className="font-medium">{a.function_name}</span>
                          <span>{a.action}</span>
                          <Badge variant="outline" className={a.status === 'success' ? 'text-green-700 border-green-200' : 'text-destructive border-destructive/30'}>
                            {a.status}
                          </Badge>
                          {a.error_message && <span className="text-destructive truncate">{a.error_message}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Renew dialog */}
      <AlertDialog open={renewOpen} onOpenChange={setRenewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renew compliance item</AlertDialogTitle>
            <AlertDialogDescription>
              Set a new expiry date for <span className="font-medium text-foreground">{selected?.name}</span>. This clears alert state so the next daily check re-evaluates from the appropriate tier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input type="date" value={renewDate} onChange={(e) => setRenewDate(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={renew} disabled={!renewDate}>Renew</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Snooze dialog */}
      <AlertDialog open={snoozeOpen} onOpenChange={setSnoozeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Snooze alerts</AlertDialogTitle>
            <AlertDialogDescription>
              Suppress alerts for <span className="font-medium text-foreground">{selected?.name}</span> until the chosen date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input type="date" value={snoozeDate} onChange={(e) => setSnoozeDate(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={snooze} disabled={!snoozeDate}>Snooze</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete compliance item?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-medium text-foreground">{selected?.name}</span>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const StatTile = ({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'amber' | 'destructive' }) => {
  const toneClass =
    tone === 'amber' ? 'text-amber-700' :
    tone === 'destructive' ? 'text-destructive' :
    'text-foreground';
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
};

export default AdminCompliance;
