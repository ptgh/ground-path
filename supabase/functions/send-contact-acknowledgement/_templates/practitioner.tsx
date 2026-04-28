import * as React from 'npm:react@18.3.1';
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr, Button,
} from 'npm:@react-email/components@0.0.22';
import {
  main, container, header, logoLink, logoImg, content, h1, text, hr,
  footerSection, footerText, footerLink, button, LOGO_URL, FOOTER_LINES,
} from './_shared.ts';

interface Props { name?: string }

export const PractitionerAckEmail = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for your interest in joining Groundpath.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Link href="https://groundpath.com.au" style={logoLink}>
            <Img src={LOGO_URL} width="44" height="44" alt="groundpath" style={logoImg} />
          </Link>
        </Section>

        <Section style={content}>
          <Heading style={h1}>
            {name ? `Thanks, ${name}` : 'Thanks for getting in touch'}
          </Heading>

          <Text style={text}>
            We've received your enquiry about joining the Groundpath practitioner network.
            Our team will review your details and reach out within two business days
            (Monday–Friday, AEST/AEDT).
          </Text>

          <Text style={text}>
            We're currently building a small, carefully selected team of clinicians.
            We're particularly interested in:
          </Text>
          <Text style={text}>
            • AMHSW-endorsed social workers (or those working toward endorsement)<br />
            • NDIS-registered practitioners, or clinicians willing to register<br />
            • Practitioners comfortable delivering secure telehealth sessions
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href="https://groundpath.com.au/practitioners" style={button}>
              Read more for practitioners
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            Warm regards,<br />
            The Groundpath team
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={footerText}>{FOOTER_LINES.contact}</Text>
          <Text style={footerText}>{FOOTER_LINES.registration}</Text>
          <Text style={footerText}>
            <Link href="https://groundpath.com.au/privacy" style={footerLink}>Privacy policy</Link>
            {' · '}
            <Link href="https://groundpath.com.au" style={footerLink}>groundpath.com.au</Link>
          </Text>
          <Text style={footerText}>{FOOTER_LINES.rights}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const practitionerAckText = (name?: string) => `${name ? `Thanks, ${name}.` : 'Thanks for getting in touch.'}

We've received your enquiry about joining the Groundpath practitioner network. Our team will review your details and reach out within two business days (Monday–Friday, AEST/AEDT).

We're currently building a small, carefully selected team of clinicians. We're particularly interested in:
- AMHSW-endorsed social workers (or those working toward endorsement)
- NDIS-registered practitioners, or clinicians willing to register
- Practitioners comfortable delivering secure telehealth sessions

Read more for practitioners: https://groundpath.com.au/practitioners

Warm regards,
The Groundpath team

—
${FOOTER_LINES.contact}
${FOOTER_LINES.registration}
${FOOTER_LINES.rights}
`;

export const practitionerAckSubject = 'Thanks for your interest in Groundpath';
