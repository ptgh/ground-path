-- Add source_url column to newsletter_articles for citations
ALTER TABLE public.newsletter_articles 
ADD COLUMN source_url TEXT,
ADD COLUMN source_name TEXT;