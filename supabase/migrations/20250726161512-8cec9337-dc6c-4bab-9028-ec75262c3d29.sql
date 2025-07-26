-- Create clients table for professional client management
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practitioner_id UUID NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    contact_phone TEXT,
    contact_email TEXT,
    emergency_contact JSONB DEFAULT '{}',
    presenting_concerns TEXT,
    intake_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discharged')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_submissions table for tracking completed forms
CREATE TABLE public.form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    practitioner_id UUID NOT NULL,
    form_type TEXT NOT NULL,
    form_data JSONB NOT NULL DEFAULT '{}',
    score NUMERIC,
    interpretation TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Practitioners can view their own clients" 
ON public.clients 
FOR SELECT 
USING (practitioner_id = auth.uid());

CREATE POLICY "Practitioners can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (practitioner_id = auth.uid());

CREATE POLICY "Practitioners can update their own clients" 
ON public.clients 
FOR UPDATE 
USING (practitioner_id = auth.uid());

CREATE POLICY "Practitioners can delete their own clients" 
ON public.clients 
FOR DELETE 
USING (practitioner_id = auth.uid());

-- Create policies for form_submissions table
CREATE POLICY "Practitioners can view their own form submissions" 
ON public.form_submissions 
FOR SELECT 
USING (practitioner_id = auth.uid());

CREATE POLICY "Practitioners can create form submissions" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (practitioner_id = auth.uid());

CREATE POLICY "Practitioners can update their own form submissions" 
ON public.form_submissions 
FOR UPDATE 
USING (practitioner_id = auth.uid());

CREATE POLICY "Practitioners can delete their own form submissions" 
ON public.form_submissions 
FOR DELETE 
USING (practitioner_id = auth.uid());

-- Create triggers for updated_at columns
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_submissions_updated_at
    BEFORE UPDATE ON public.form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();