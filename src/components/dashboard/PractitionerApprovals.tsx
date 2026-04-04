import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle2, XCircle, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingPractitioner {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  profession: string | null;
  verification_status: string | null;
  professional_verified: boolean | null;
  directory_approved: boolean | null;
  practice_location: string | null;
  bio: string | null;
}

const PractitionerApprovals = () => {
  const [practitioners, setPractitioners] = useState<PendingPractitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchPractitioners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, profession, verification_status, professional_verified, directory_approved, practice_location, bio')
      .eq('user_type', 'practitioner')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPractitioners(data as PendingPractitioner[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPractitioners();
  }, []);

  const handleApproval = async (userId: string, approved: boolean) => {
    setUpdating(userId);
    const { error } = await supabase
      .from('profiles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ directory_approved: approved } as any)
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to update approval status');
    } else {
      toast.success(approved ? 'Practitioner approved for directory' : 'Practitioner removed from directory');
      fetchPractitioners();
    }
    setUpdating(null);
  };

  const pending = practitioners.filter(p => !p.directory_approved);
  const approved = practitioners.filter(p => p.directory_approved);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Pending Approval
          </CardTitle>
          <CardDescription>
            Practitioners awaiting directory approval. Only approved practitioners appear on the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending practitioners</p>
          ) : (
            <div className="space-y-3">
              {pending.map(p => (
                <div key={p.user_id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {p.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.display_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground">{p.profession || 'No profession set'}</p>
                    {p.practice_location && (
                      <p className="text-xs text-muted-foreground/70">{p.practice_location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.professional_verified && (
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Verified</Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">{p.verification_status}</Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApproval(p.user_id, true)}
                    disabled={updating === p.user_id}
                    className="gap-1"
                  >
                    {updating === p.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Approved Practitioners
          </CardTitle>
          <CardDescription>
            These practitioners are visible on the site and available for messaging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approved.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No approved practitioners yet</p>
          ) : (
            <div className="space-y-3">
              {approved.map(p => (
                <div key={p.user_id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {p.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.display_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground">{p.profession || 'No profession set'}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Listed</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproval(p.user_id, false)}
                    disabled={updating === p.user_id}
                    className="gap-1 text-muted-foreground"
                  >
                    {updating === p.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PractitionerApprovals;
