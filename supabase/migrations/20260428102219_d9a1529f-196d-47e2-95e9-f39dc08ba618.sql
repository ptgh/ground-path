ALTER TABLE public.contact_forms
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledgement_status TEXT
    CHECK (acknowledgement_status IN ('pending', 'sent', 'failed', 'skipped')),
  ADD COLUMN IF NOT EXISTS acknowledgement_error TEXT;

UPDATE public.contact_forms
SET acknowledgement_status = 'skipped',
    acknowledgement_error = 'Pre-existing row, ack feature not yet live at insert time'
WHERE acknowledgement_status IS NULL;

ALTER TABLE public.contact_forms
  ALTER COLUMN acknowledgement_status SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_contact_forms_ack_pending
  ON public.contact_forms (acknowledgement_status, created_at)
  WHERE acknowledgement_status = 'pending';