import * as React from 'npm:react@18.3.1';
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22';
import {
  main, container, header, logoLink, logoImg, content, h1, text, hr,
  crisisBox, crisisTitle, crisisText, footerSection, footerText, footerLink,
  LOGO_URL, FOOTER_LINES,
} from './_shared.ts';

interface Props { name?: string }

export const ClientAckEmail = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We've received your message — a member of the Groundpath team will be in touch shortly.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Link href="https://groundpath.com.au" style={logoLink}>
            <Img src={LOGO_URL} width="44" height="44" alt="groundpath" style={logoImg} />
          </Link>
        </Section>

        <Section style={content}>
          <Heading style={h1}>
            {name ? `Thank you, ${name}` : 'Thank you for reaching out'}
          </Heading>

          <Text style={text}>
            We've received your message and a member of the Groundpath team will respond
            within one business day (Monday–Friday, AEST/AEDT). You don't need to do anything else
            for now — we'll be in touch at the email address you provided.
          </Text>

          <Section style={crisisBox}>
            <Text style={crisisTitle}>If you need help right now</Text>
            <Text style={crisisText}>
              If you're in immediate distress or having thoughts of suicide or self-harm,
              please reach out to one of the services below who can help straight away:
            </Text>
            <Text style={crisisText}>• Lifeline: <b>13 11 14</b> (24/7)</Text>
            <Text style={crisisText}>• 13YARN: <b>13 92 76</b> (24/7, Aboriginal &amp; Torres Strait Islander crisis support)</Text>
            <Text style={crisisText}>• Suicide Call Back Service: <b>1300 659 467</b></Text>
            <Text style={crisisText}>• Beyond Blue: <b>1300 22 4636</b></Text>
            <Text style={crisisText}>• Emergency: <b>000</b></Text>
            <Text style={crisisText}>Or go to your nearest hospital emergency department.</Text>
          </Section>

          <Text style={text}>
            Groundpath connects Australians with registered social workers and mental health
            practitioners — including NDIS-funded support — through secure telehealth and
            in-person sessions. Once we've read your message we'll match you with the right
            person on our team.
          </Text>

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

export const clientAckText = (name?: string) => `${name ? `Thank you, ${name}.` : 'Thank you for reaching out.'}

We've received your message and a member of the Groundpath team will respond within one business day (Monday–Friday, AEST/AEDT). You don't need to do anything else for now.

IF YOU NEED HELP RIGHT NOW
If you're in immediate distress or having thoughts of suicide or self-harm, please contact one of these services:
- Lifeline: 13 11 14 (24/7)
- 13YARN: 13 92 76 (24/7, Aboriginal & Torres Strait Islander crisis support)
- Suicide Call Back Service: 1300 659 467
- Beyond Blue: 1300 22 4636
- Emergency: 000
Or go to your nearest hospital emergency department.

Groundpath connects Australians with registered social workers and mental health practitioners, including NDIS-funded support, through secure telehealth and in-person sessions.

Warm regards,
The Groundpath team

—
${FOOTER_LINES.contact}
${FOOTER_LINES.registration}
https://groundpath.com.au/privacy
${FOOTER_LINES.rights}
`;

export const clientAckSubject = "We've received your message — Groundpath";
