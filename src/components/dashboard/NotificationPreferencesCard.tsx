import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationPreferencesCardProps {
  userId: string;
  currentPrefs?: { email_messages?: boolean } | null;
}

export const NotificationPreferencesCard = ({ userId, currentPrefs }: NotificationPreferencesCardProps) => {
  const [emailMessages, setEmailMessages] = useState(currentPrefs?.email_messages !== false);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (value: boolean) => {
    setEmailMessages(value);
    setSaving(true);
    try {
      // Fetch current preferences first to avoid overwriting future fields
      const { data: current } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('user_id', userId)
        .single();

      const merged = {
        ...(current?.notification_preferences as Record<string, unknown> || {}),
        email_messages: value,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: merged } as any)
        .eq('user_id', userId);
      if (error) throw error;
      toast.success(value ? 'Email notifications enabled' : 'Email notifications disabled');
    } catch {
      setEmailMessages(!value);
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Control how you receive message notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-messages" className="text-sm font-medium">
              Email notifications for new messages
            </Label>
            <p className="text-xs text-muted-foreground">
              Receive an email when you get a new message
            </p>
          </div>
          <Switch
            id="email-messages"
            checked={emailMessages}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium text-muted-foreground">
              In-app notifications
            </Label>
            <p className="text-xs text-muted-foreground">
              Unread message badges are always enabled
            </p>
          </div>
          <Switch checked={true} disabled={true} />
        </div>
      </CardContent>
    </Card>
  );
};
