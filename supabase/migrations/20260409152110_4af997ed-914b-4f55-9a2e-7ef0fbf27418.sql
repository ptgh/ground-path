
-- Practitioner availability slots
CREATE TABLE public.practitioner_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practitioner_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  specific_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.practitioner_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can manage own availability"
  ON public.practitioner_availability FOR ALL
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Anyone can view availability"
  ON public.practitioner_availability FOR SELECT
  USING (true);

CREATE INDEX idx_availability_practitioner ON public.practitioner_availability (practitioner_id);
CREATE INDEX idx_availability_day ON public.practitioner_availability (day_of_week);

CREATE TRIGGER update_availability_updated_at
  BEFORE UPDATE ON public.practitioner_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Booking requests
CREATE TABLE public.booking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practitioner_id UUID NOT NULL,
  client_user_id UUID NOT NULL,
  requested_date DATE NOT NULL,
  requested_start_time TIME NOT NULL,
  requested_end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending',
  session_type TEXT NOT NULL DEFAULT 'video',
  notes TEXT,
  practitioner_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can create booking requests"
  ON public.booking_requests FOR INSERT
  WITH CHECK (auth.uid() = client_user_id);

CREATE POLICY "Clients can view own booking requests"
  ON public.booking_requests FOR SELECT
  USING (auth.uid() = client_user_id);

CREATE POLICY "Practitioners can view their booking requests"
  ON public.booking_requests FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update their booking requests"
  ON public.booking_requests FOR UPDATE
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Admins can view all booking requests"
  ON public.booking_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_booking_practitioner ON public.booking_requests (practitioner_id);
CREATE INDEX idx_booking_client ON public.booking_requests (client_user_id);
CREATE INDEX idx_booking_date ON public.booking_requests (requested_date);
CREATE INDEX idx_booking_status ON public.booking_requests (status);

CREATE TRIGGER update_booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
