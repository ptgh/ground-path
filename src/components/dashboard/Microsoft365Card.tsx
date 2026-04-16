import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, Video, Stethoscope, AlertTriangle } from 'lucide-react';

interface IntegrationStatus {
  connection_status: string;
  organizer_email: string | null;
  connected_at: string | null;
  teams_enabled: boolean;
  calendar_enabled: boolean;
}

interface DiagCheck {
  status: 'pass' | 'fail' | 'warn';
  detail?: string;
}

type DiagResult = Record<string, DiagCheck>;

const Microsoft365Card = () => {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      const { data } = await supabase
        .from('org_microsoft_integration')
        .select('connection_status, organizer_email, connected_at, teams_enabled, calendar_enabled')
        .eq('provider', 'microsoft')
        .maybeSingle();
      setStatus(data as IntegrationStatus | null);
    } catch {
      // No integration row yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Please log in first'); return; }

      const { data, error } = await supabase.functions.invoke('microsoft-org-connect', {
        body: { organizer_email: 'connect@groundpath.com.au' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Microsoft 365 connected successfully');
      await fetchStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      toast.error(msg);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('microsoft-org-disconnect');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Microsoft 365 disconnected');
      await fetchStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Disconnect failed';
      toast.error(msg);
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = status?.connection_status === 'connected';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="h-4 w-4 text-sage-600" />
          Microsoft 365 Integration
        </CardTitle>
        <CardDescription>
          Org-managed Teams meetings and calendar sync for native bookings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {isConnected ? 'Connected' : 'Not connected'}
                  </span>
                  <Badge
                    variant="outline"
                    className={isConnected
                      ? 'text-xs border-green-300 text-green-700 bg-green-50'
                      : 'text-xs border-muted-foreground/30 text-muted-foreground'}
                  >
                    {isConnected ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {isConnected && status?.organizer_email && (
                  <p className="text-xs text-muted-foreground pl-6">
                    Organizer: {status.organizer_email}
                  </p>
                )}
                {isConnected && status?.connected_at && (
                  <p className="text-xs text-muted-foreground pl-6">
                    Connected: {new Date(status.connected_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {disconnecting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                Disconnect Microsoft 365
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={connecting}
                className="bg-sage-600 hover:bg-sage-700 text-white"
              >
                {connecting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                Connect Microsoft 365
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Microsoft365Card;
