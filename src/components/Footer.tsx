
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

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <svg width="32" height="32" viewBox="0 0 40 40">
                <path
                  d="M20 6 C 28 8, 32 16, 30 24 C 28 30, 22 32, 16 30 C 12 28, 10 24, 12 20 C 13 18, 15 17, 17 18 C 18 18.5, 18.5 19, 18 19.5"
                  fill="none"
                  stroke="#7B9B85"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-lg font-light tracking-wide">groundpath</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Professional social work and mental health support, grounded in care and evidence-based practice.
            </p>
            <div className="bg-white rounded-lg p-2 inline-block">
              <QRCodeSVG
                value="https://groundpath.com.au"
                size={80}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="M"
              />
            </div>
            <p className="text-gray-500 text-xs mt-1.5">Scan to visit</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><button type="button" onClick={() => handleSectionNavigation('about')} className="text-gray-400 hover:text-white transition-colors">About</button></li>
              <li><button type="button" onClick={() => handleSectionNavigation('services')} className="text-gray-400 hover:text-white transition-colors">Services & Rates</button></li>
              <li><button type="button" onClick={() => navigate('/resources')} className="text-gray-400 hover:text-white transition-colors">Resources</button></li>
              <li><button type="button" onClick={() => handleSectionNavigation('newsletter')} className="text-gray-400 hover:text-white transition-colors">Newsletter</button></li>
              <li><button type="button" onClick={() => handleSectionNavigation('contact')} className="text-gray-400 hover:text-white transition-colors">Contact</button></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-medium mb-4">Contact</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p><a href="mailto:connect@groundpath.com.au" className="hover:text-white transition-colors">connect@groundpath.com.au</a></p>
              <p><a href="tel:+61410883659" className="hover:text-white transition-colors">+61 410 883 659</a></p>
              <p>Perth, Western Australia</p>
              
              <div className="pt-2">
                <a href="https://www.linkedin.com/company/groundpath" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
                <a href="https://www.halaxy.com/profile/groundpath/location/1353667" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white transition-colors ml-4">
                  <img src="https://cdn.halaxy.com/h/images/logo.png" alt="Halaxy" className="h-4 w-auto brightness-0 invert opacity-70" loading="lazy" />
                  Halaxy
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400">
            <span className="whitespace-nowrap">© 2026 groundpath. All rights reserved.</span> • <span className="whitespace-nowrap">ABN: 98 434 283 298</span> • <a href="https://www.aasw.asn.au" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap hover:text-white transition-colors duration-300">AASW Member</a> • <a href="https://www.socialworkengland.org.uk" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap hover:text-white transition-colors duration-300">SWE Registered</a>
          </div>
          <div className="text-sm text-gray-400 mt-4 md:mt-0 space-x-4">
            <button 
              onClick={() => setIsPrivacyOpen(true)}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button 
              onClick={() => setIsTermsOpen(true)}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button 
              onClick={() => setIsABNOpen(true)}
              className="hover:text-white transition-colors"
            >
              ABN Lookup
            </button>
          </div>
        </div>
      </div>

      <PrivacyPolicyModal 
        isOpen={isPrivacyOpen} 
        onClose={() => setIsPrivacyOpen(false)} 
      />
      <TermsOfServiceModal 
        isOpen={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
      />
      <ABNLookupModal 
        isOpen={isABNOpen} 
        onClose={() => setIsABNOpen(false)} 
      />
    </footer>
  );
};

export default Footer;
