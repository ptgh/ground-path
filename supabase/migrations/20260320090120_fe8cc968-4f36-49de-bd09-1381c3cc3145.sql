-- Add notification_preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email_messages": true}'::jsonb;

-- Clean up duplicate storage policies (keep the well-named ones)
DROP POLICY IF EXISTS "Conversation participants can view" ON storage.objects;
DROP POLICY IF EXISTS "Participants can delete own uploads" ON storage.objects;