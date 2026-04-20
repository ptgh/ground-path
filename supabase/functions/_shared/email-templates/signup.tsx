/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandHeader } from './brand-header.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to get started with groundpath</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Welcome to{' '}
          <Link href={siteUrl} style={link}>
            <strong>groundpath</strong>
          </Link>
          — professional social work, counselling and mental health support grounded in care.
        </Text>
        <Text style={text}>
          Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to complete your registration:
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Verify My Email
          </Button>
        </Section>
        <Text style={smallText}>
          This link will expire shortly. If the button doesn't work, copy and paste the URL below into your browser:
        </Text>
        <Text style={urlText}>{confirmationUrl}</Text>
        <Hr style={divider} />
        <Text style={footer}>
          If you didn't create an account with groundpath, you can safely ignore this email.
        </Text>
        <Text style={footerContact}>
          groundpath · connect@groundpath.com.au · +61 410 883 659
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#f8faf8',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}
const container = {
  backgroundColor: '#ffffff',
  maxWidth: '560px',
  margin: '40px auto',
  borderRadius: '8px',
  border: '1px solid #d4ddd4',
  overflow: 'hidden' as const,
}
const logoSection = { padding: '28px 32px 0' }
const logoText = {
  fontSize: '20px',
  fontWeight: '700' as const,
  color: '#4a7c4f',
  margin: '0',
  letterSpacing: '-0.3px',
}
const divider = { borderColor: '#d4ddd4', margin: '20px 32px' }
const h1 = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#0a0f1a',
  margin: '0 0 16px',
  padding: '0 32px',
}
const text = {
  fontSize: '15px',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: '0 0 16px',
  padding: '0 32px',
}
const smallText = {
  fontSize: '13px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: '20px 0 8px',
  padding: '0 32px',
}
const urlText = {
  fontSize: '12px',
  color: '#6b7280',
  lineHeight: '1.4',
  margin: '0 0 16px',
  padding: '0 32px',
  wordBreak: 'break-all' as const,
}
const link = { color: '#4a7c4f', textDecoration: 'underline' }
const buttonSection = { padding: '8px 32px 8px', textAlign: 'left' as const }
const button = {
  backgroundColor: '#4a7c4f',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '12px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px', padding: '0 32px' }
const footerContact = { fontSize: '11px', color: '#bbbbbb', margin: '0 0 28px', padding: '0 32px' }
