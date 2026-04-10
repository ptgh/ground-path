-- Allow clients to update their own booking requests (for cancellation)
CREATE POLICY "Clients can update own booking requests"
ON public.booking_requests
FOR UPDATE
USING (auth.uid() = client_user_id)
WITH CHECK (auth.uid() = client_user_id);