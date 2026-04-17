-- Create booking_checkins table
CREATE TABLE public.booking_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_request_id UUID NOT NULL,
  client_user_id UUID NOT NULL,
  practitioner_id UUID NOT NULL,
  mood_score INTEGER,
  mood_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  desired_outcome TEXT,
  notes_for_practitioner TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT booking_checkins_mood_score_range CHECK (mood_score IS NULL OR (mood_score BETWEEN 1 AND 5)),
  CONSTRAINT booking_checkins_unique_booking UNIQUE (booking_request_id)
);

CREATE INDEX idx_booking_checkins_booking ON public.booking_checkins(booking_request_id);
CREATE INDEX idx_booking_checkins_practitioner ON public.booking_checkins(practitioner_id);
CREATE INDEX idx_booking_checkins_client ON public.booking_checkins(client_user_id);

-- Enable RLS
ALTER TABLE public.booking_checkins ENABLE ROW LEVEL SECURITY;

-- Clients can create their own check-ins
CREATE POLICY "Clients can create their own check-ins"
ON public.booking_checkins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_user_id);

-- Clients can view their own check-ins
CREATE POLICY "Clients can view their own check-ins"
ON public.booking_checkins
FOR SELECT
TO authenticated
USING (auth.uid() = client_user_id);

-- Clients can update their own check-ins
CREATE POLICY "Clients can update their own check-ins"
ON public.booking_checkins
FOR UPDATE
TO authenticated
USING (auth.uid() = client_user_id)
WITH CHECK (auth.uid() = client_user_id);

-- Practitioners can view check-ins for their bookings
CREATE POLICY "Practitioners can view their check-ins"
ON public.booking_checkins
FOR SELECT
TO authenticated
USING (auth.uid() = practitioner_id);

-- Admins can view all check-ins
CREATE POLICY "Admins can view all check-ins"
ON public.booking_checkins
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_booking_checkins_updated_at
BEFORE UPDATE ON public.booking_checkins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();