-- Create newsletter articles table
CREATE TABLE public.newsletter_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  author_name TEXT,
  featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_articles ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Articles are publicly readable" 
ON public.newsletter_articles 
FOR SELECT 
USING (status = 'published');

-- Create policies for admin write access
CREATE POLICY "Admins can manage articles" 
ON public.newsletter_articles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_newsletter_articles_updated_at
BEFORE UPDATE ON public.newsletter_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample articles for the newsletter
INSERT INTO public.newsletter_articles (title, summary, content, category, slug, author_name, featured) VALUES
(
  'New NDIS Practice Standards: What Social Workers Need to Know',
  'The NDIS Quality and Safeguards Commission has released updated practice standards affecting support coordination and psychosocial disability services. Learn about the key changes and compliance requirements.',
  '<h2>Key Changes in NDIS Practice Standards</h2><p>The NDIS Quality and Safeguards Commission has introduced significant updates to practice standards that directly impact social workers providing support coordination and psychosocial disability services.</p><h3>What''s New</h3><ul><li>Enhanced documentation requirements for support plans</li><li>Stricter compliance monitoring for psychosocial interventions</li><li>New training requirements for support coordinators</li></ul><h3>Implementation Timeline</h3><p>These changes take effect from March 2024, with a 6-month transition period for existing providers.</p>',
  'NDIS COMPLIANCE',
  'ndis-practice-standards-2024',
  'Ground Path Team',
  true
),
(
  'Evidence-Based Approaches to Trauma-Informed Care',
  'Recent research highlights effective trauma-informed care strategies for working with vulnerable populations. Discover practical techniques and assessment tools for your practice.',
  '<h2>Latest Research in Trauma-Informed Care</h2><p>New studies reveal innovative approaches to trauma-informed care that significantly improve outcomes for vulnerable populations.</p><h3>Key Findings</h3><ul><li>Importance of cultural safety in trauma interventions</li><li>Role of peer support in recovery processes</li><li>Integration of mindfulness techniques</li></ul><h3>Practical Applications</h3><p>Learn how to implement these evidence-based strategies in your daily practice.</p>',
  'BEST PRACTICES',
  'trauma-informed-care-approaches',
  'Dr. Sarah Mitchell',
  true
),
(
  'Mental Health Assessment Tools: PHQ-9 and GAD-7 Updates',
  'Updated guidelines for using PHQ-9 and GAD-7 assessments in clinical practice, including scoring interpretations and follow-up recommendations.',
  '<h2>Updated Assessment Guidelines</h2><p>Recent updates to PHQ-9 and GAD-7 assessment tools provide clearer guidance for clinical interpretation and follow-up care.</p><h3>Key Updates</h3><ul><li>Revised scoring thresholds</li><li>Enhanced cultural considerations</li><li>New follow-up protocols</li></ul>',
  'ASSESSMENT TOOLS',
  'mental-health-assessment-updates',
  'Clinical Team',
  false
),
(
  'Professional Development: Upcoming CPD Opportunities',
  'Explore upcoming workshops, webinars, and certification programs designed specifically for social workers and mental health professionals.',
  '<h2>Continuing Professional Development</h2><p>Stay current with the latest professional development opportunities designed for social work and mental health professionals.</p><h3>Upcoming Events</h3><ul><li>Advanced Clinical Skills Workshop - March 15</li><li>NDIS Best Practices Webinar - March 22</li><li>Trauma-Informed Care Certification - April 5</li></ul>',
  'PROFESSIONAL DEVELOPMENT',
  'professional-development-opportunities',
  'Education Team',
  false
);