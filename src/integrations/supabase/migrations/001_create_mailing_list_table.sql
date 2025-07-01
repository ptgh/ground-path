
-- Create mailing_list table
CREATE TABLE IF NOT EXISTS mailing_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'unsubscribed')) DEFAULT 'pending',
    subscription_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmation_token TEXT,
    source TEXT NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_mailing_list_email ON mailing_list(email);
CREATE INDEX IF NOT EXISTS idx_mailing_list_status ON mailing_list(status);
CREATE INDEX IF NOT EXISTS idx_mailing_list_confirmation_token ON mailing_list(confirmation_token);

-- Create contact_forms table
CREATE TABLE IF NOT EXISTS contact_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT CHECK (status IN ('new', 'in_progress', 'resolved')) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on status and created_at for admin queries
CREATE INDEX IF NOT EXISTS idx_contact_forms_status ON contact_forms(status);
CREATE INDEX IF NOT EXISTS idx_contact_forms_created_at ON contact_forms(created_at DESC);

-- Enable Row Level Security
ALTER TABLE mailing_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_forms ENABLE ROW LEVEL SECURITY;

-- Create policies for mailing_list
CREATE POLICY "Anyone can subscribe to mailing list" ON mailing_list
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can confirm their own subscription" ON mailing_list
    FOR UPDATE USING (confirmation_token IS NOT NULL);

-- Create policies for contact_forms
CREATE POLICY "Anyone can submit contact forms" ON contact_forms
    FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_mailing_list_updated_at BEFORE UPDATE ON mailing_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_forms_updated_at BEFORE UPDATE ON contact_forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
