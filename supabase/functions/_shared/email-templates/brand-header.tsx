/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Img, Section } from 'npm:@react-email/components@0.0.22'

/**
 * Standard groundpath email header.
 * Compact circular icon-only logo (44×44), no wordmark text.
 * Mirrors how brands like LinkedIn render their mark in transactional emails
 * and matches the SVG spiral used in the site header (src/components/Logo.tsx).
 *
 * The hosted PNG is required because most email clients block inline SVG.
 */
export const LOGO_URL = 'https://groundpath.com.au/email/groundpath-logo.png'

export const BrandHeader = () => (
  <Section style={brandHeaderSection}>
    <Img
      src={LOGO_URL}
      width="44"
      height="44"
      alt="groundpath"
      style={brandHeaderImg}
    />
  </Section>
)

const brandHeaderSection = {
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
  padding: '24px 16px 16px',
  borderBottom: '1px solid #d4ddd4',
}

const brandHeaderImg = {
  display: 'inline-block',
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: '0',
  outline: 'none',
  textDecoration: 'none',
}
