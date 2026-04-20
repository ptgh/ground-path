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
            <img
              src="https://groundpath.com.au/email/groundpath-logo.png"
              width="44"
              height="44"
              alt="groundpath"
              style={logoImg}
            />
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
              <div style={articleHeader}>
                <Heading style={articleTitle}>{article.title}</Heading>
                <Button href={`https://groundpath.com.au/article/${article.link.split('/').pop()}`} style={compactButton}>
                  Read More
                </Button>
              </div>
              <Text style={articleSummary}>{article.summary}</Text>
            </Section>
          ))}

          {/* Professional Resources */}
          <Hr style={divider} />
          
          <Heading style={h2}>Professional Resources</Heading>
          
          <Section style={resourceSection}>
            <Text style={resourceTitle}>Assessment Tools</Text>
            <Text style={resourceDescription}>
              Access standardized assessment forms including PHQ-9, GAD-7, DASS-21, and more.
            </Text>
            <Button href="https://groundpath.com.au/professional-forms" style={resourceButton}>
              Access Tools
            </Button>
          </Section>

          <Section style={resourceSection}>
            <Text style={resourceTitle}>CPD Tracking</Text>
            <Text style={resourceDescription}>
              Track your continuing professional development hours and requirements.
            </Text>
            <Button href="https://groundpath.com.au/professional-forms" style={resourceButton}>
              Track CPD
            </Button>
          </Section>

          <Section style={resourceSection}>
            <Text style={resourceTitle}>Professional Support</Text>
            <Text style={resourceDescription}>
              Connect with our team for professional guidance and support.
            </Text>
            <Button href="mailto:connect@groundpath.com.au" style={resourceButton}>
              Get Support
            </Button>
          </Section>
        </Section>

        {/* Stay Connected */}
        <Hr style={divider} />
        
        <Section style={footerSection}>
          <Heading style={footerTitle}>Stay Connected</Heading>
          
          <Section style={socialSection}>
            <Button href="https://groundpath.com.au" style={cleanButton}>
              Visit Website
            </Button>
            <Button href="mailto:connect@groundpath.com.au" style={cleanButton}>
              Contact Us
            </Button>
            <Button href="https://groundpath.com.au/resources" style={cleanButton}>
              Resources
            </Button>
          </Section>
          
          <Text style={footerText}>
            groundpath - Supporting social work professionals with evidence-based tools and resources.
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
            You're receiving this because you subscribed to groundpath updates.{' '}
            <Link href={unsubscribeUrl} style={unsubscribeLink}>
              Unsubscribe
            </Link>
          </Text>
          
          <Text style={copyrightText}>
            © 2024 groundpath. All rights reserved.
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
  display: 'inline-block',
  textDecoration: 'none',
};

const logoImg = {
  display: 'inline-block',
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: '0',
  outline: 'none',
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

const articleHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '15px',
  marginBottom: '10px',
};

const compactButton = {
  backgroundColor: '#7B9B85',
  color: '#ffffff',
  padding: '6px 12px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: '500',
  display: 'inline-block',
  whiteSpace: 'nowrap',
  minWidth: 'auto',
};

const resourceButton = {
  backgroundColor: '#7B9B85',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: '500',
  display: 'inline-block',
};

const cleanButton = {
  backgroundColor: '#ffffff',
  border: '1px solid #7B9B85',
  color: '#7B9B85',
  padding: '8px 16px',
  margin: '0 4px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontSize: '13px',
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