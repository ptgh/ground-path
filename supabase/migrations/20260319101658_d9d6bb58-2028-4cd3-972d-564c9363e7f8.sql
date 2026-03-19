
-- Add attachment_path column to store stable storage paths
ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS attachment_path text;

-- Allow senders to delete their own messages
CREATE POLICY "Senders can delete messages"
ON public.client_messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Create storage RLS policies that restrict access to conversation participants
-- First drop any existing policies to avoid conflicts
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Conversation participants can upload" ON storage.objects;
  DROP POLICY IF EXISTS "Conversation participants can read" ON storage.objects;
  DROP POLICY IF EXISTS "Conversation participants can delete" ON storage.objects;
END $$;

-- Upload: only conversation participants can upload to their conversation folder
CREATE POLICY "Conversation participants can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.user_id = auth.uid() OR c.practitioner_id = auth.uid())
  )
);

-- Read: only conversation participants can read files from their conversation folder
CREATE POLICY "Conversation participants can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.user_id = auth.uid() OR c.practitioner_id = auth.uid())
  )
);

-- Delete: only conversation participants can delete files from their conversation folder
CREATE POLICY "Conversation participants can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.user_id = auth.uid() OR c.practitioner_id = auth.uid())
  )
);
