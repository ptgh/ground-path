import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
  Button,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface NewsletterArticle {
  title: string;
  summary: string;
  link: string;
  category: string;
}

interface NewsletterEmailProps {
  subject: string;
  previewText: string;
  articles: NewsletterArticle[];
  unsubscribeUrl?: string;
}

export const NewsletterEmail = ({
  subject,
  previewText,
  articles,
  unsubscribeUrl = 'https://groundpath.com.au/unsubscribe',
}: NewsletterEmailProps) => (
  <Html>
    <Head />
    <Preview>{previewText}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with Logo */}
        <Section style={header}>
          <Link href="https://groundpath.com.au" style={logoLink}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={logoSvg}>
              <path
                d="M20 6 C 28 8, 32 16, 30 24 C 28 30, 22 32, 16 30 C 12 28, 10 24, 12 20 C 13 18, 15 17, 17 18 C 18 18.5, 18.5 19, 18 19.5"
                fill="none"
                stroke="#7B9B85"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Text style={logoText}>ground path</Text>
          </Link>
        </Section>

        {/* Main Content */}
        <Section style={content}>
          <Heading style={h1}>{subject}</Heading>
          
          <Text style={greeting}>
            Dear Professional,
          </Text>
          
          <Text style={intro}>
            Welcome to your weekly roundup of essential social work resources, NDIS updates, and professional development opportunities. Stay ahead with evidence-based practices and industry insights.
          </Text>

          {/* This Week's Highlights */}
          <Heading style={h2}>This Week's Highlights</Heading>
          
          {articles.map((article, index) => (
            <Section key={index} style={articleCard}>
              <Text style={categoryBadge}>{article.category}</Text>
              <Heading style={articleTitle}>{article.title}</Heading>
              <Text style={articleSummary}>{article.summary}</Text>
              <Button href={article.link} style={readMoreButton}>
                Read More →
              </Button>
            </Section>
          ))}

          {/* Professional Resources */}
          <Hr style={divider} />
          
          <Heading style={h2}>Professional Resources</Heading>
          
          <Section style={resourceSection}>
            <Text style={resourceTitle}>📋 Assessment Tools</Text>
            <Text style={resourceDescription}>
              Access standardized assessment forms including PHQ-9, GAD-7, DASS-21, and more.
            </Text>
            <Link href="https://groundpath.com.au/professional-forms" style={resourceLink}>
              Access Tools →
            </Link>
          </Section>

          <Section style={resourceSection}>
            <Text style={resourceTitle}>📈 CPD Tracking</Text>
            <Text style={resourceDescription}>
              Track your continuing professional development hours and requirements.
            </Text>
            <Link href="https://groundpath.com.au/professional-forms" style={resourceLink}>
              Track CPD →
            </Link>
          </Section>

          <Section style={resourceSection}>
            <Text style={resourceTitle}>🔍 Professional Support</Text>
            <Text style={resourceDescription}>
              Connect with our team for professional guidance and support.
            </Text>
            <Link href="https://groundpath.com.au/contact" style={resourceLink}>
              Get Support →
            </Link>
          </Section>
        </Section>

        {/* Stay Connected */}
        <Hr style={divider} />
        
        <Section style={footerSection}>
          <Heading style={footerTitle}>Stay Connected</Heading>
          
          <Section style={socialSection}>
            <Link href="https://linkedin.com/company/groundpath" style={socialButton}>
              LinkedIn
            </Link>
            <Link href="https://groundpath.com.au/contact" style={socialButton}>
              Contact Us
            </Link>
            <Link href="https://groundpath.com.au" style={socialButton}>
              Visit Website
            </Link>
          </Section>
          
          <Text style={footerText}>
            Ground Path - Supporting social work professionals with evidence-based tools and resources.
          </Text>
          
          <Text style={footerText}>
            <Link href="https://groundpath.com.au" style={footerLink}>
              groundpath.com.au
            </Link>
            {' | '}
            <Link href="mailto:hello@groundpath.com.au" style={footerLink}>
              hello@groundpath.com.au
            </Link>
          </Text>
          
          <Hr style={footerDivider} />
          
          <Text style={unsubscribeText}>
            You're receiving this because you subscribed to Ground Path updates.{' '}
            <Link href={unsubscribeUrl} style={unsubscribeLink}>
              Unsubscribe
            </Link>
          </Text>
          
          <Text style={copyrightText}>
            © 2024 Ground Path. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles with sage green branding
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '0 20px',
  maxWidth: '600px',
};

const header = {
  padding: '20px 0',
  borderBottom: '2px solid #7B9B85',
  marginBottom: '30px',
};

const logoLink = {
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  gap: '12px',
};

const logoSvg = {
  display: 'block',
};

const logoText = {
  fontSize: '24px',
  fontWeight: '300',
  color: '#7B9B85',
  letterSpacing: '2px',
  margin: '0',
};

const content = {
  padding: '0 0 30px 0',
};

const h1 = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a1a1a',
  lineHeight: '1.3',
  margin: '0 0 20px 0',
};

const h2 = {
  fontSize: '22px',
  fontWeight: '600',
  color: '#7B9B85',
  lineHeight: '1.3',
  margin: '30px 0 15px 0',
};

const greeting = {
  fontSize: '16px',
  color: '#4a4a4a',
  margin: '0 0 15px 0',
};

const intro = {
  fontSize: '16px',
  color: '#4a4a4a',
  lineHeight: '1.6',
  margin: '0 0 25px 0',
};

const articleCard = {
  backgroundColor: '#f8faf9',
  border: '1px solid #e5f0e7',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 0 20px 0',
};

const categoryBadge = {
  display: 'inline-block',
  backgroundColor: '#7B9B85',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '600',
  padding: '4px 8px',
  borderRadius: '4px',
  margin: '0 0 10px 0',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const articleTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  lineHeight: '1.4',
  margin: '0 0 10px 0',
};

const articleSummary = {
  fontSize: '14px',
  color: '#4a4a4a',
  lineHeight: '1.5',
  margin: '0 0 15px 0',
};

const readMoreButton = {
  backgroundColor: '#7B9B85',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '5px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
  display: 'inline-block',
};

const resourceSection = {
  margin: '0 0 20px 0',
  padding: '15px',
  backgroundColor: '#fafbfa',
  borderLeft: '3px solid #7B9B85',
};

const resourceTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 5px 0',
};

const resourceDescription = {
  fontSize: '14px',
  color: '#4a4a4a',
  lineHeight: '1.5',
  margin: '0 0 10px 0',
};

const resourceLink = {
  color: '#7B9B85',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
};

const divider = {
  border: 'none',
  borderTop: '1px solid #e5e5e5',
  margin: '30px 0',
};

const footerSection = {
  padding: '20px 0',
};

const footerTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#7B9B85',
  margin: '0 0 15px 0',
};

const socialSection = {
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
};

const socialButton = {
  display: 'inline-block',
  backgroundColor: '#7B9B85',
  color: '#ffffff',
  padding: '8px 16px',
  margin: '0 5px',
  borderRadius: '5px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
};

const footerText = {
  fontSize: '14px',
  color: '#666666',
  lineHeight: '1.5',
  margin: '0 0 10px 0',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#7B9B85',
  textDecoration: 'none',
};

const footerDivider = {
  border: 'none',
  borderTop: '1px solid #e5e5e5',
  margin: '20px 0 15px 0',
};

const unsubscribeText = {
  fontSize: '12px',
  color: '#999999',
  textAlign: 'center' as const,
  margin: '0 0 10px 0',
};

const unsubscribeLink = {
  color: '#7B9B85',
  textDecoration: 'underline',
};

const copyrightText = {
  fontSize: '12px',
  color: '#999999',
  textAlign: 'center' as const,
  margin: '0',
};

export default NewsletterEmail;