import * as React from 'npm:react@18.3.1';
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22';
import {
  main, container, header, logoLink, logoImg, content, h1, text, hr,
  footerSection, footerText, footerLink, LOGO_URL, FOOTER_LINES,
} from './_shared.ts';

interface Props { name?: string }

export const OtherAckEmail = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We've received your message.</Preview>
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
            We've received your message and will respond within two business days
            (Monday–Friday, AEST/AEDT).
          </Text>

          <Hr style={hr} />

          <Text style={text}>
            Warm regards,<br />
            The Groundpath team
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={footerText}>{FOOTER_LINES.contact}</Text>
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

export const otherAckText = (name?: string) => `${name ? `Thanks, ${name}.` : 'Thanks for getting in touch.'}

We've received your message and will respond within two business days (Monday–Friday, AEST/AEDT).

Warm regards,
The Groundpath team

—
${FOOTER_LINES.contact}
https://groundpath.com.au/privacy
${FOOTER_LINES.rights}
`;

export const otherAckSubject = "We got your message — Groundpath";
