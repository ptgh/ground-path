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

interface MailingListConfirmationProps {
  name?: string;
  confirmationUrl: string;
  unsubscribeUrl: string;
}

export const MailingListConfirmationEmail = ({
  name,
  confirmationUrl,
  unsubscribeUrl,
}: MailingListConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Confirm your subscription to Ground Path - Professional Social Work Resources</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Link href="https://groundpath.com.au" style={logoLink}>
            <div style={logoContainer}>
              <svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" style={logoSvg}>
                <path d="M20 10 L20 50 L40 50 Q45 50 45 45 L45 25 Q45 20 40 20 L30 20" stroke="#7B9B85" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M55 30 Q55 20 65 20 L75 20 Q85 20 85 30 L85 35 Q85 45 75 45 L65 45 Q55 45 55 35 Z" stroke="#7B9B85" strokeWidth="3" fill="none"/>
                <path d="M55 32.5 L85 32.5" stroke="#7B9B85" strokeWidth="3" strokeLinecap="round"/>
                <path d="M100 20 L100 45 M100 20 Q100 15 105 15 L115 15 Q120 15 120 20 L120 30" stroke="#7B9B85" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M135 20 L135 45 M135 20 L150 45 M150 20 L150 45" stroke="#7B9B85" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M165 20 L165 50 L180 50" stroke="#7B9B85" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="20" y="58" fontFamily="Inter, sans-serif" fontSize="8" fill="#7B9B85" fontWeight="600">GROUND PATH</text>
              </svg>
            </div>
          </Link>
        </Section>

        <Section style={content}>
          <Heading style={h1}>Welcome to Ground Path!</Heading>
          
          {name && (
            <Text style={greeting}>Hi {name},</Text>
          )}
          
          <Text style={text}>
            Thank you for subscribing to our professional mailing list. We're excited to support your journey in social work and mental health practice.
          </Text>

          <Text style={text}>
            Please confirm your subscription to start receiving our curated content:
          </Text>

          <Section style={buttonContainer}>
            <Button pY={12} pX={24} style={button} href={confirmationUrl}>
              Confirm Your Subscription
            </Button>
          </Section>

          <Text style={benefitsTitle}>What you'll receive:</Text>
          <ul style={benefitsList}>
            <li style={benefitsItem}>Weekly curated articles on social work best practices</li>
            <li style={benefitsItem}>NDIS updates and compliance guidance</li>
            <li style={benefitsItem}>Professional development opportunities</li>
            <li style={benefitsItem}>Mental health assessment tools and resources</li>
            <li style={benefitsItem}>Industry news and policy updates</li>
            <li style={benefitsItem}>Access to professional networking opportunities</li>
          </ul>

          <Section style={ctaSection}>
            <Text style={ctaText}>
              Ready to enhance your professional practice? 
            </Text>
            <Button pY={10} pX={20} style={secondaryButton} href="https://groundpath.com.au/professional-forms">
              Explore Professional Forms
            </Button>
          </Section>

          <Hr style={hr} />
          
          <Text style={footer}>
            This email was sent to you because you subscribed to Ground Path's mailing list.<br />
            If you didn't subscribe, you can safely ignore this email.
          </Text>
          
          <Text style={footer}>
            <Link href={unsubscribeUrl} style={unsubscribeLink}>
              Unsubscribe from this list
            </Link>
          </Text>
        </Section>

        <Section style={stayConnectedSection}>
          <Text style={stayConnectedTitle}>Stay Connected</Text>
          <Text style={stayConnectedText}>
            Follow us for the latest updates, insights, and professional resources for social workers and mental health professionals across Australia.
          </Text>
          
          <Section style={socialLinksContainer}>
            <Link href="https://groundpath.com.au" style={socialButton}>
              Visit Website
            </Link>
            <Link href="https://groundpath.com.au/contact" style={socialButton}>
              Contact Us
            </Link>
            <Link href="https://groundpath.com.au/resources" style={socialButton}>
              Resources
            </Link>
          </Section>
        </Section>

        <Section style={footerSection}>
          <Text style={footerText}>
            © 2024 Ground Path. All rights reserved.<br />
            Supporting social workers and mental health professionals across Australia.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MailingListConfirmationEmail

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

const greeting = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#7B9B85',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  backgroundImage: 'linear-gradient(135deg, #7B9B85 0%, #6B8A74 100%)',
  boxShadow: '0 4px 16px 0 rgba(123, 155, 133, 0.3)',
  transition: 'all 0.3s ease',
  padding: '16px 32px',
}

const secondaryButton = {
  backgroundColor: '#ffffff',
  border: '2px solid #7B9B85',
  borderRadius: '12px',
  color: '#7B9B85',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 12px 0 rgba(123, 155, 133, 0.15)',
  padding: '14px 28px',
}

const benefitsTitle = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '24px 0 12px 0',
}

const benefitsList = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 24px 0',
  paddingLeft: '20px',
}

const benefitsItem = {
  margin: '8px 0',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
}

const ctaText = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
}

const unsubscribeLink = {
  color: '#6b7280',
  textDecoration: 'underline',
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

const logoLink = {
  display: 'block',
  textDecoration: 'none',
}

const logoContainer = {
  display: 'inline-block',
  margin: '0 auto',
}

const logoSvg = {
  display: 'block',
}

const stayConnectedSection = {
  textAlign: 'center' as const,
  padding: '32px 40px 20px',
  backgroundColor: '#f8faf9',
  borderTop: '1px solid #e5e7eb',
}

const stayConnectedTitle = {
  color: '#7B9B85',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const stayConnectedText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 24px 0',
}

const socialLinksContainer = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
  flexWrap: 'wrap' as const,
}

const socialButton = {
  display: 'inline-block',
  padding: '10px 16px',
  backgroundColor: '#ffffff',
  border: '1px solid #7B9B85',
  borderRadius: '8px',
  color: '#7B9B85',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  margin: '4px',
  transition: 'all 0.3s ease',
  boxShadow: '0 1px 3px 0 rgba(123, 155, 133, 0.1)',
}