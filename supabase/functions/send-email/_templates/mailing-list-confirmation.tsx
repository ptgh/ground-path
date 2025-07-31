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
          <Img
            src="https://vzwhccciarvirzqmvldl.supabase.co/storage/v1/object/public/resources/ground-path-logo.png"
            width="200"
            height="60"
            alt="Ground Path"
            style={logo}
          />
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
            <Link href="https://groundpath.com.au/contact" style={footerLink}>
              Contact us
            </Link>
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