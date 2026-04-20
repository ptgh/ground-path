import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mailingListService } from '@/services/mailingListService';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Download,
  Search,
  RefreshCw,
  Send,
  Users,
  Upload,
  Mail,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: 'pending' | 'confirmed' | 'unsubscribed' | string | null;
  source: string;
  subscription_date: string | null;
  confirmation_token: string | null;
}

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'unsubscribed'] as const;

const statusVariant = (status: string | null) => {
  switch (status) {
    case 'confirmed':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'pending':
      return 'bg-muted text-muted-foreground border-border';
    case 'unsubscribed':
      return 'bg-destructive/10 text-destructive border-destructive/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const csvEscape = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const AdminMailingList = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const data = await mailingListService.getSubscribers();
      setSubscribers((data ?? []) as Subscriber[]);
    } catch (err) {
      console.error('Failed to load subscribers', err);
      toast({
        title: 'Failed to load subscribers',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && isAdmin()) {
      loadSubscribers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subscribers.filter((s) => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return (
        s.email.toLowerCase().includes(term) ||
        (s.name ?? '').toLowerCase().includes(term)
      );
    });
  }, [subscribers, statusFilter, search]);

  const counts = useMemo(() => {
    const acc = { all: subscribers.length, pending: 0, confirmed: 0, unsubscribed: 0 };
    subscribers.forEach((s) => {
      if (s.status === 'pending') acc.pending += 1;
      else if (s.status === 'confirmed') acc.confirmed += 1;
      else if (s.status === 'unsubscribed') acc.unsubscribed += 1;
    });
    return acc;
  }, [subscribers]);

  const handleExportCsv = () => {
    const header = ['email', 'name', 'status', 'source', 'subscription_date'];
    const rows = filtered.map((s) =>
      [s.email, s.name ?? '', s.status ?? '', s.source ?? '', s.subscription_date ?? '']
        .map(csvEscape)
        .join(','),
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `mailing-list-${statusFilter}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Export ready',
      description: `${filtered.length} subscriber${filtered.length === 1 ? '' : 's'} exported.`,
    });
  };

  const handleResendConfirmation = async (subscriber: Subscriber) => {
    if (!supabase) {
      toast({
        title: 'Email service unavailable',
        description: 'Supabase client is not configured.',
        variant: 'destructive',
      });
      return;
    }
    if (!subscriber.confirmation_token) {
      toast({
        title: 'No confirmation token',
        description: 'This subscriber has already confirmed or has no token on file.',
        variant: 'destructive',
      });
      return;
    }
    setResendingId(subscriber.id);
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'mailing_list_confirmation',
          to: subscriber.email,
          data: {
            token: subscriber.confirmation_token,
            confirmationUrl: `https://groundpath.com.au/confirm?token=${subscriber.confirmation_token}`,
            name: subscriber.name ?? undefined,
          },
        },
      });
      if (error) throw error;
      toast({
        title: 'Confirmation email resent',
        description: `Sent to ${subscriber.email}`,
      });
    } catch (err) {
      console.error('Resend failed', err);
      toast({
        title: 'Failed to resend',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setResendingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/practitioner/auth" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/practitioner/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Mailing List Admin" description="Manage groundpath mailing list subscribers" path="/admin/mailing-list" />
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Mailing List
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage subscribers, export CSV, and resend confirmation emails.
          </p>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(['all', 'confirmed', 'pending', 'unsubscribed'] as const).map((key) => (
            <Card
              key={key}
              className={`cursor-pointer transition-colors ${statusFilter === key ? 'border-primary' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {key}
                </div>
                <div className="text-2xl font-semibold text-foreground mt-1">
                  {counts[key]}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-base">Subscribers ({filtered.length})</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={loadSubscribers} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt === 'all' ? 'All statuses' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No subscribers match the current filters.
              </div>
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-foreground">{s.email}</TableCell>
                        <TableCell className="text-muted-foreground">{s.name ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusVariant(s.status)}>
                            {s.status ?? 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{s.source}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {s.subscription_date
                            ? new Date(s.subscription_date).toLocaleDateString()
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.status === 'pending' && s.confirmation_token ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendConfirmation(s)}
                              disabled={resendingId === s.id}
                            >
                              {resendingId === s.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Resend
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminMailingList;
