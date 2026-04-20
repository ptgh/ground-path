
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import TermsOfServiceModal from './TermsOfServiceModal';
import ABNLookupModal from './ABNLookupModal';
import { scrollToSectionWithOffset } from '@/lib/utils';

const Footer = () => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isABNOpen, setIsABNOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSectionNavigation = (sectionId: string) => {
    const doScroll = () => {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return true;
      }

      return scrollToSectionWithOffset(sectionId, 96);
    };

    if (location.pathname !== '/') {
      navigate('/');
      const tryScroll = (attempts = 0) => {
        if (doScroll()) return;
        if (attempts < 10) setTimeout(() => tryScroll(attempts + 1), 100);
      };
      setTimeout(() => tryScroll(), 200);
      return;
    }

    doScroll();
  };

  const linkClass =
    "text-surface-dark-muted hover:text-surface-dark-foreground transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

  return (
    <footer className="bg-surface-dark text-surface-dark-foreground py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <svg width="32" height="32" viewBox="0 0 40 40" aria-hidden="true">
                <path
                  d="M20 6 C 28 8, 32 16, 30 24 C 28 30, 22 32, 16 30 C 12 28, 10 24, 12 20 C 13 18, 15 17, 17 18 C 18 18.5, 18.5 19, 18 19.5"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-lg font-light tracking-wide">groundpath</span>
            </div>
            <p className="text-surface-dark-muted text-sm leading-relaxed mb-4">
              Professional social work and mental health support, grounded in care and evidence-based practice.
            </p>
            <div className="bg-background rounded-lg p-2 inline-block">
              <QRCodeSVG
                value="https://groundpath.com.au"
                size={80}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="M"
              />
            </div>
            <p className="text-surface-dark-muted text-xs mt-1.5 opacity-70">Scan to visit</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><button type="button" onClick={() => handleSectionNavigation('about')} className={linkClass}>About</button></li>
              <li><button type="button" onClick={() => handleSectionNavigation('services')} className={linkClass}>Services & Rates</button></li>
              <li><button type="button" onClick={() => navigate('/resources')} className={linkClass}>Resources</button></li>
              <li><button type="button" onClick={() => handleSectionNavigation('newsletter')} className={linkClass}>Newsletter</button></li>
              <li><button type="button" onClick={() => handleSectionNavigation('contact')} className={linkClass}>Contact</button></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-medium mb-4">Contact</h3>
            <div className="space-y-2 text-sm text-surface-dark-muted">
              <p><a href="mailto:connect@groundpath.com.au" className="hover:text-surface-dark-foreground transition-colors">connect@groundpath.com.au</a></p>
              <p><a href="tel:+61410883659" className="hover:text-surface-dark-foreground transition-colors">+61 410 883 659</a></p>
              <p>Perth, Western Australia</p>

              <div className="pt-2">
                <a href="https://www.linkedin.com/company/groundpath" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-surface-dark-foreground transition-colors" aria-label="groundpath on LinkedIn">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
                <a href="https://teams.microsoft.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-surface-dark-foreground transition-colors ml-4" aria-label="Microsoft Teams">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.404 4.478c.608 0 1.101.493 1.101 1.101v5.506c0 .608-.493 1.101-1.101 1.101h-.55v3.855c0 1.825-1.48 3.305-3.305 3.305h-4.957c-1.825 0-3.305-1.48-3.305-3.305V8.537h-.55c-.608 0-1.101-.493-1.101-1.101V5.579c0-.608.493-1.101 1.101-1.101h12.667zM16.55 2c1.214 0 2.199.984 2.199 2.199S17.763 6.398 16.55 6.398s-2.199-.984-2.199-2.199S15.335 2 16.55 2zM9.89 5.579v7.462h5.506V5.579H9.89zm-5.506 0c-.608 0-1.101.493-1.101 1.101v4.405c0 .608.493 1.101 1.101 1.101h.55V8.537h3.305V5.579H4.384zM7.689 2c1.214 0 2.199.984 2.199 2.199S8.903 6.398 7.689 6.398 5.49 5.414 5.49 4.199 6.475 2 7.689 2z"/></svg>
                  Teams
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-surface-dark-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-surface-dark-muted">
            <span className="whitespace-nowrap">© 2026 groundpath. All rights reserved.</span> • <span className="whitespace-nowrap">ABN: 98 434 283 298</span> • <a href="https://www.aasw.asn.au" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap hover:text-surface-dark-foreground transition-colors duration-300">AASW Member</a> • <a href="https://www.aca.asn.au" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap hover:text-surface-dark-foreground transition-colors duration-300">ACA Registered</a>
          </div>
          <div className="text-sm text-surface-dark-muted mt-4 md:mt-0 space-x-4">
            <button onClick={() => setIsPrivacyOpen(true)} className={linkClass}>Privacy Policy</button>
            <span>•</span>
            <button onClick={() => setIsTermsOpen(true)} className={linkClass}>Terms of Service</button>
            <span>•</span>
            <button onClick={() => setIsABNOpen(true)} className={linkClass}>ABN Lookup</button>
          </div>
        </div>
      </div>

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsOfServiceModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <ABNLookupModal isOpen={isABNOpen} onClose={() => setIsABNOpen(false)} />
    </footer>
  );
};

export default Footer;
