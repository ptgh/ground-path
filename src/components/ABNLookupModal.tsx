import { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { gsap } from 'gsap';

interface ABNLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ABNLookupModal = ({ isOpen, onClose }: ABNLookupModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      gsap.set(modalRef.current, { display: 'flex' });
      gsap.fromTo(backdropRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
      gsap.fromTo(contentRef.current, 
        { opacity: 0, scale: 0.9, y: 30 }, 
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out", delay: 0.1 }
      );
    } else if (modalRef.current) {
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.2, ease: "power2.in" });
      gsap.to(contentRef.current, 
        { 
          opacity: 0, 
          scale: 0.9, 
          y: -20, 
          duration: 0.2, 
          ease: "power2.in",
          onComplete: () => {
            if (modalRef.current) {
              gsap.set(modalRef.current, { display: 'none' });
            }
          }
        }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 hidden"
    >
      <div 
        ref={backdropRef}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div 
        ref={contentRef}
        className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/20"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
          <h2 className="text-2xl font-light text-gray-900">ABN Lookup</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Business Registration Details</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                ground path is registered as a business entity in Australia. Our Australian Business Number (ABN) provides transparency and verification of our legitimate business operations.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">ABN Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Business Name:</span>
                  <span className="text-sm text-gray-900">groundpath</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">ABN:</span>
                  <span className="text-sm text-gray-900 whitespace-nowrap">98 434 283 298</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Verification</h3>
              <p className="text-gray-600 leading-relaxed text-sm mb-4">
                Our ABN registration can be independently verified through the Australian Business Register (ABR), which is maintained by the Australian Taxation Office. This provides clients with confidence in our legitimate business operations.
              </p>
              
              <a
                href="https://abr.business.gov.au/ABN/View?id=98434283298"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                <span>View on ABR Website</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Business Compliance</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                ABN registration ensures compliance with Australian business regulations and taxation requirements. This registration supports professional accountability and client protection through established regulatory frameworks.
              </p>
            </section>

            <p className="text-xs text-gray-500 mt-6 pb-6">
              ABN details are publicly accessible and regularly updated through the Australian Business Register
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABNLookupModal;