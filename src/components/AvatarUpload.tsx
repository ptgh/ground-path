import { useState, useRef } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  size?: 'sm' | 'md' | 'lg';
  onUploadComplete?: (url: string) => void;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

const AvatarUpload = ({ size = 'md', onUploadComplete }: AvatarUploadProps) => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image under 2MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { data: existingFiles } = await supabase.storage.from('avatars').list(user.id);
      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage.from('avatars').remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      await updateProfile({ avatar_url: avatarUrl });
      toast({ title: 'Photo updated', description: 'Your profile photo has been updated.' });
      onUploadComplete?.(avatarUrl);
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({ title: 'Upload failed', description: error.message || 'Could not upload photo.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setUploading(true);
    try {
      const { data: existingFiles } = await supabase.storage.from('avatars').list(user.id);
      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage.from('avatars').remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }
      await updateProfile({ avatar_url: null });
      toast({ title: 'Photo removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Could not remove photo.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-lg font-medium">
            {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Change Photo'}
        </Button>
        {profile?.avatar_url && (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={uploading} className="text-destructive hover:text-destructive">
            <X className="h-3.5 w-3.5 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
};

export default AvatarUpload;
