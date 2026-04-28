/**
 * Shared style tokens for ack email templates.
 * Mirrors the existing mailing-list-confirmation styling so all groundpath
 * transactional emails feel like one family.
 */
export const SAGE = '#7B9B85';
export const SAGE_DARK = '#6B8A74';
export const TEXT = '#374151';
export const MUTED = '#6b7280';
export const BORDER = '#e5e7eb';
export const SOFT_BG = '#f8faf9';

export const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

export const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

export const header = {
  textAlign: 'center' as const,
  padding: '20px 0',
  borderBottom: '1px solid #eaeaea',
};

export const logoImg = {
  display: 'inline-block',
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: '0',
  outline: 'none',
};

export const logoLink = {
  display: 'inline-block',
  textDecoration: 'none',
};

export const content = { padding: '24px 40px' };

export const h1 = {
  color: SAGE,
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
};

export const text = {
  color: TEXT,
  fontSize: '16px',
  lineHeight: '24px',
  margin: '14px 0',
};

export const muted = {
  color: MUTED,
  fontSize: '13px',
  lineHeight: '20px',
  margin: '8px 0',
};

export const hr = { borderColor: BORDER, margin: '28px 0' };

export const footerSection = {
  textAlign: 'center' as const,
  padding: '20px 40px',
  borderTop: `1px solid ${BORDER}`,
  backgroundColor: SOFT_BG,
};

export const footerText = {
  color: MUTED,
  fontSize: '12px',
  lineHeight: '18px',
  margin: '4px 0',
};

export const footerLink = { color: MUTED, textDecoration: 'underline' };

export const crisisBox = {
  border: `1px solid ${SAGE}`,
  borderLeft: `4px solid ${SAGE}`,
  backgroundColor: SOFT_BG,
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0 28px',
};

export const crisisTitle = {
  color: SAGE_DARK,
  fontSize: '15px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

export const crisisText = {
  color: TEXT,
  fontSize: '14px',
  lineHeight: '22px',
  margin: '6px 0',
};

export const button = {
  backgroundColor: SAGE,
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
  padding: '12px 24px',
  backgroundImage: `linear-gradient(135deg, ${SAGE} 0%, ${SAGE_DARK} 100%)`,
};

export const LOGO_URL = 'https://groundpath.com.au/email/groundpath-logo.png';

/** Standard footer copy used across the three ack emails. */
export const FOOTER_LINES = {
  contact: 'connect@groundpath.com.au · +61 410 883 659',
  registration:
    'groundpath practitioners are AHPRA / AASW registered. We adhere to AASW and ACA codes of ethics.',
  rights: '© groundpath. All rights reserved.',
};
