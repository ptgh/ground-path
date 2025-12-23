-- Add status column to form_submissions for draft/completed states
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed' CHECK (status IN ('draft', 'completed'));

-- Make client_id nullable for practitioner-only forms (like Reflective Practice)
ALTER TABLE form_submissions 
ALTER COLUMN client_id DROP NOT NULL;