-- Reset acknowledgement state for rows broken by the temporary
-- 401 misconfiguration on send-contact-acknowledgement. Limited to the
-- last 24h so we don't disturb older test data.
UPDATE public.contact_forms
SET acknowledgement_status = 'pending',
    acknowledged_at = NULL,
    acknowledgement_error = NULL
WHERE acknowledgement_status IN ('pending', 'failed')
  AND created_at > now() - interval '24 hours';