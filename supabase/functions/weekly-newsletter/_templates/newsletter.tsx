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
  Button,
  Hr,
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface NewsletterProps {
  subscriberName?: string;
  articles: Array<{
    title: string;
    summary: string;
    url: string;
    category: string;
  }>;
  weeklyTip: string;
  unsubscribeUrl: string;
}

export const NewsletterEmail = ({
  subscriberName,
  articles,
  weeklyTip,
  unsubscribeUrl,
}: NewsletterProps) => (
  <Html>
    <Head />
    <Preview>Your Weekly Social Work Resources from Ground Path</Preview>
    <Body style={main}>
      <Container style={container}>
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
          <Text style={headerText}>Professional Social Work Resources</Text>
        </Section>

        <Section style={content}>
          <Heading style={h1}>This Week in Social Work</Heading>
          
          {subscriberName && (
            <Text style={greeting}>Hi {subscriberName},</Text>
          )}
          
          <Text style={introText}>
            Here's your curated selection of the most important social work insights, resources, and opportunities from this week.
          </Text>

          <Section style={tipSection}>
            <Text style={tipTitle}>Weekly Professional Tip</Text>
            <Text style={tipContent}>{weeklyTip}</Text>
          </Section>

          <Section style={articlesSection}>
            <Heading style={h2}>Curated Articles & Resources</Heading>
            
            {articles.map((article, index) => (
              <Section key={index} style={articleItem}>
                <Text style={articleCategory}>{article.category}</Text>
                <div style={articleHeader}>
                  <Heading style={articleTitle}>{article.title}</Heading>
                  <Button href={article.url} style={compactButton}>
                    Read More
                  </Button>
                </div>
                <Text style={articleSummary}>{article.summary}</Text>
              </Section>
            ))}
          </Section>

          <Section style={ctaSection}>
            <Text style={ctaTitle}>Enhance Your Practice</Text>
            <Text style={ctaText}>
              Access our comprehensive suite of professional assessment tools and forms designed specifically for social workers.
            </Text>
            <Button style={primaryButton} href="https://groundpath.com.au/professional-forms">
              Explore Professional Tools
            </Button>
          </Section>

          <Section style={servicesSection}>
            <Text style={servicesTitle}>Connect with Professional Support</Text>
            <Text style={servicesText}>
              Need professional consultation or support? Our experienced team is here to help.
            </Text>
            <Button style={outlineButton} href="https://www.halaxy.com/book/groundpath/location/125730">
              Book a Consultation
            </Button>
          </Section>

          <Hr style={hr} />
          
          <Text style={footer}>
            Thank you for being part of the Ground Path community. We're committed to supporting your professional development and practice excellence.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={footerText}>
            © 2024 Ground Path. All rights reserved.<br />
            Supporting social workers and mental health professionals across Australia.
          </Text>
          <Text style={footerText}>
            <Link href="https://groundpath.com.au" style={footerLink}>
              Visit our website
            </Link>
            {' | '}
            <Link href="mailto:connect@groundpath.com.au" style={footerLink}>
              Contact us
            </Link>
            {' | '}
            <Link href={unsubscribeUrl} style={footerLink}>
              Unsubscribe
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default NewsletterEmail

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const header = {
  textAlign: 'center' as const,
  padding: '20px 0',
  borderBottom: '1px solid #eaeaea',
}

const logo = {
  margin: '0 auto',
}

const logoLink = {
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  gap: '12px',
  justifyContent: 'center',
  marginBottom: '8px',
}

const logoSvg = {
  display: 'block',
}

const logoText = {
  fontSize: '24px',
  fontWeight: '300',
  color: '#7B9B85',
  letterSpacing: '2px',
  margin: '0',
}

const headerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '8px 0 0 0',
}

const content = {
  padding: '24px 40px',
}

const h1 = {
  color: '#6b7280',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
}

const h2 = {
  color: '#374151',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '32px 0 16px 0',
}

const greeting = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const introText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0 32px 0',
}

const tipSection = {
  backgroundColor: '#f8faf9',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
  borderLeft: '4px solid #7B9B85',
}

const tipTitle = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const tipContent = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const articlesSection = {
  margin: '32px 0',
}

const articleItem = {
  margin: '24px 0',
  padding: '20px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
}

const articleCategory = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
  letterSpacing: '0.5px',
}

const articleTitle = {
  color: '#374151',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  lineHeight: '24px',
}

const articleSummary = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px 0',
}

const readMoreLink = {
  color: '#7B9B85',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
}

const ctaTitle = {
  color: '#374151',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const ctaText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 20px 0',
}

const servicesSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '20px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
}

const servicesTitle = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const servicesText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px 0',
}

const button = {
  backgroundColor: '#7B9B85',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
}

const secondaryButton = {
  backgroundColor: 'transparent',
  border: '2px solid #7B9B85',
  borderRadius: '8px',
  color: '#7B9B85',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
}

const primaryButton = {
  backgroundColor: '#7B9B85',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
}

const outlineButton = {
  backgroundColor: '#ffffff',
  border: '2px solid #7B9B85',
  borderRadius: '12px',
  color: '#7B9B85',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
}

const articleHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '15px',
  marginBottom: '10px',
}

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
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
}

const footerSection = {
  textAlign: 'center' as const,
  padding: '20px 40px',
  borderTop: '1px solid #eaeaea',
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
}

const footerLink = {
  color: '#6b7280',
  textDecoration: 'underline',
}