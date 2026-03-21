
ALTER TABLE public.client_messages
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS read_at timestamptz DEFAULT NULL;

-- Backfill: mark existing read messages
UPDATE public.client_messages SET read_at = created_at WHERE is_read = true AND read_at IS NULL;
