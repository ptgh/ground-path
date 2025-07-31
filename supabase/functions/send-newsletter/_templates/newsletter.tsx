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

interface NewsletterEmailProps {
  subject: string;
  previewText: string;
  articles: Array<{
    title: string;
    summary: string;
    link: string;
    category: string;
  }>;
  unsubscribeUrl: string;
}

export const NewsletterEmail = ({
  subject,
  previewText,
  articles,
  unsubscribeUrl,
}: NewsletterEmailProps) => (
  <Html>
    <Head />
    <Preview>{previewText}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://vzwhccciarvirzqmvldl.supabase.co/storage/v1/object/public/resources/ground-path-logo.png"
            width="200"
            height="60"
            alt="Ground Path"
            style={logo}
          />
        </Section>

        <Section style={content}>
          <Heading style={h1}>{subject}</Heading>
          
          <Text style={greeting}>
            Hello Professional,
          </Text>
          
          <Text style={text}>
            Welcome to your latest curated collection of professional development resources, industry updates, and best practice insights from Ground Path.
          </Text>

          <Section style={articlesSection}>
            <Heading style={h2}>This Week's Highlights</Heading>
            
            {articles.map((article, index) => (
              <Section key={index} style={articleCard}>
                <Text style={categoryTag}>{article.category}</Text>
                <Heading style={articleTitle}>{article.title}</Heading>
                <Text style={articleSummary}>{article.summary}</Text>
                <Button style={readMoreButton} href={article.link}>
                  Read More
                </Button>
              </Section>
            ))}
          </Section>

          <Hr style={hr} />

          <Section style={resourcesSection}>
            <Heading style={h2}>Professional Resources</Heading>
            <Text style={text}>
              Don't forget to explore our comprehensive collection of assessment tools and professional forms:
            </Text>
            
            <Section style={resourceGrid}>
              <Section style={resourceItem}>
                <Text style={resourceTitle}>Assessment Tools</Text>
                <Text style={resourceDesc}>PHQ-9, GAD-7, DASS-21, and more validated assessment instruments</Text>
                <Button style={resourceButton} href="https://groundpath.com.au/professional-forms">
                  Explore Tools
                </Button>
              </Section>
              
              <Section style={resourceItem}>
                <Text style={resourceTitle}>CPD Tracking</Text>
                <Text style={resourceDesc}>Log and track your continuing professional development hours</Text>
                <Button style={resourceButton} href="https://groundpath.com.au/professional-forms">
                  Start Logging
                </Button>
              </Section>
            </Section>
          </Section>

          <Hr style={hr} />
          
          <Section style={footerContent}>
            <Text style={text}>
              <strong>Stay Connected</strong>
            </Text>
            <Text style={text}>
              Follow us for daily updates and professional insights:
            </Text>
            <Text style={text}>
              🌐 <Link href="https://groundpath.com.au" style={footerLink}>groundpath.com.au</Link><br />
              📧 <Link href="mailto:info@groundpath.com.au" style={footerLink}>info@groundpath.com.au</Link><br />
              💼 <Link href="https://linkedin.com/company/ground-path" style={footerLink}>LinkedIn</Link>
            </Text>
          </Section>
        </Section>

        <Section style={footerSection}>
          <Text style={footerText}>
            © 2024 Ground Path. All rights reserved.<br />
            Supporting social workers and mental health professionals across Australia.
          </Text>
          <Text style={footerText}>
            <Link href={unsubscribeUrl} style={unsubscribeLink}>
              Unsubscribe
            </Link>
            {' | '}
            <Link href="https://groundpath.com.au/contact" style={footerLink}>
              Contact us
            </Link>
            {' | '}
            <Link href="https://groundpath.com.au" style={footerLink}>
              Visit website
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
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
}

const header = {
  textAlign: 'center' as const,
  padding: '20px 0',
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
}

const logo = {
  margin: '0 auto',
}

const content = {
  padding: '24px 40px',
}

const h1 = {
  color: '#1e293b',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0 20px 0',
  lineHeight: '1.3',
}

const h2 = {
  color: '#334155',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '24px 0 16px 0',
}

const greeting = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  fontWeight: '500',
}

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const articlesSection = {
  margin: '32px 0',
}

const articleCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
}

const categoryTag = {
  color: '#6366f1',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
}

const articleTitle = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '8px 0',
  lineHeight: '1.4',
}

const articleSummary = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0 16px 0',
}

const readMoreButton = {
  backgroundColor: '#6366f1',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '8px 16px',
  transition: 'all 0.3s ease',
}

const resourcesSection = {
  margin: '32px 0',
}

const resourceGrid = {
  display: 'flex',
  gap: '16px',
  margin: '16px 0',
}

const resourceItem = {
  flex: '1',
  backgroundColor: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
}

const resourceTitle = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const resourceDesc = {
  color: '#64748b',
  fontSize: '13px',
  lineHeight: '18px',
  margin: '0 0 12px 0',
}

const resourceButton = {
  backgroundColor: 'transparent',
  border: '2px solid #6366f1',
  borderRadius: '6px',
  color: '#6366f1',
  fontSize: '13px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '6px 12px',
  transition: 'all 0.3s ease',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
}

const footerContent = {
  margin: '24px 0',
  textAlign: 'center' as const,
}

const footerSection = {
  textAlign: 'center' as const,
  padding: '20px 40px',
  borderTop: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
}

const footerText = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
}

const footerLink = {
  color: '#6366f1',
  textDecoration: 'underline',
}

const unsubscribeLink = {
  color: '#64748b',
  textDecoration: 'underline',
}