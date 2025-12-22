-- Update existing articles with source URLs
UPDATE public.newsletter_articles 
SET source_url = 'https://www.ndiscommission.gov.au/providers/registered-ndis-providers/provider-obligations-and-requirements/ndis-practice-standards',
    source_name = 'NDIS Quality and Safeguards Commission'
WHERE slug = 'ndis-practice-standards-2024';

UPDATE public.newsletter_articles 
SET source_url = 'https://blueknot.org.au/resources/understanding-trauma-and-abuse/',
    source_name = 'Blue Knot Foundation'
WHERE slug = 'trauma-informed-care-approaches';

UPDATE public.newsletter_articles 
SET source_url = 'https://www.blackdoginstitute.org.au/resources-support/clinician-resources/',
    source_name = 'Black Dog Institute'
WHERE slug = 'mental-health-assessment-updates';

UPDATE public.newsletter_articles 
SET source_url = 'https://www.aasw.asn.au/professional-development/cpd',
    source_name = 'Australian Association of Social Workers'
WHERE slug = 'professional-development-opportunities';