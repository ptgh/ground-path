
-- Add attachment metadata and resource fields to client_messages
ALTER TABLE public.client_messages
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_size integer,
  ADD COLUMN IF NOT EXISTS resource_url text,
  ADD COLUMN IF NOT EXISTS resource_title text,
  ADD COLUMN IF NOT EXISTS resource_description text;

-- Allow participants to update messages (needed for mark as read)
CREATE POLICY "Receivers can update messages"
  ON public.client_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Create private storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: participants can upload to their conversation folder
CREATE POLICY "Conversation participants can upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id::text = (storage.foldername(name))[1]
        AND (auth.uid() = user_id OR auth.uid() = practitioner_id)
    )
  );

-- Storage RLS: participants can view/download
CREATE POLICY "Conversation participants can view"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id::text = (storage.foldername(name))[1]
        AND (auth.uid() = user_id OR auth.uid() = practitioner_id)
    )
  );

-- Storage RLS: participants can delete their own uploads
CREATE POLICY "Participants can delete own uploads"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.conversations
      WHERE auth.uid() = user_id OR auth.uid() = practitioner_id
    )
  );
