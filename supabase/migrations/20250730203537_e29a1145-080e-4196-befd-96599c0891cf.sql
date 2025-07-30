-- Fix mailing list RLS policies to allow public subscriptions

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Anyone can subscribe to mailing list" ON public.mailing_list;
DROP POLICY IF EXISTS "Users can confirm their own subscription" ON public.mailing_list;

-- Create new policy for public INSERT operations
CREATE POLICY "Enable public subscription" 
ON public.mailing_list 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create policy for updating subscriptions (confirmation, unsubscribe)
CREATE POLICY "Enable subscription updates"
ON public.mailing_list
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Create policy for reading subscription status (for confirmation)
CREATE POLICY "Enable subscription confirmation reads"
ON public.mailing_list
FOR SELECT
TO anon, authenticated
USING (confirmation_token IS NOT NULL OR unsubscribe_token IS NOT NULL);