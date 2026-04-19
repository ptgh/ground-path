-- 1. Add session rate to practitioner profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS session_rate_cents INTEGER,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'aud';

-- 2. Stripe customer mapping (one row per client user)
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stripe customer"
  ON public.stripe_customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- (Inserts/updates happen via service-role only — no public write policy.)

CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Saved payment methods (cards)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  brand TEXT,
  last4 TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON public.payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- (All writes go through edge functions with service-role key.)

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Session charges (one row per practitioner-initiated charge)
CREATE TABLE IF NOT EXISTS public.session_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_request_id UUID,
  practitioner_id UUID NOT NULL,
  client_user_id UUID NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  stripe_receipt_url TEXT,
  hosted_invoice_url TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'aud',
  status TEXT NOT NULL DEFAULT 'pending', -- pending | succeeded | failed | refunded
  failure_reason TEXT,
  charged_at TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_session_charges_practitioner ON public.session_charges(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_session_charges_client ON public.session_charges(client_user_id);
CREATE INDEX IF NOT EXISTS idx_session_charges_booking ON public.session_charges(booking_request_id);
ALTER TABLE public.session_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own charges"
  ON public.session_charges FOR SELECT
  TO authenticated
  USING (auth.uid() = client_user_id);

CREATE POLICY "Practitioners can view their charges"
  ON public.session_charges FOR SELECT
  TO authenticated
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Admins can view all charges"
  ON public.session_charges FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- (All writes happen via edge functions using service-role key.)

CREATE TRIGGER update_session_charges_updated_at
  BEFORE UPDATE ON public.session_charges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();