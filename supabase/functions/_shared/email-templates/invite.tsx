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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join groundpath</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>⟳ groundpath</Text>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>groundpath</strong>
          </Link>
          — professional social work, counselling and mental health support. Click below to accept and create your account.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Accept Invitation
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
        <Text style={footerContact}>
          groundpath · connect@groundpath.com.au · +61 410 883 659
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#f8faf8', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { backgroundColor: '#ffffff', maxWidth: '560px', margin: '40px auto', borderRadius: '8px', border: '1px solid #d4ddd4', overflow: 'hidden' as const }
const logoSection = { padding: '28px 32px 0' }
const logoText = { fontSize: '20px', fontWeight: '700' as const, color: '#4a7c4f', margin: '0', letterSpacing: '-0.3px' }
const divider = { borderColor: '#d4ddd4', margin: '20px 32px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0a0f1a', margin: '0 0 16px', padding: '0 32px' }
const text = { fontSize: '15px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 16px', padding: '0 32px' }
const link = { color: '#4a7c4f', textDecoration: 'underline' }
const buttonSection = { padding: '8px 32px 8px', textAlign: 'left' as const }
const button = { backgroundColor: '#4a7c4f', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '8px', padding: '12px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px', padding: '0 32px' }
const footerContact = { fontSize: '11px', color: '#bbbbbb', margin: '0 0 28px', padding: '0 32px' }
