import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from 'gsap';

interface DocumentTransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentTransparencyModal = ({ isOpen, onClose }: DocumentTransparencyModalProps) => {
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
        className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-white/20"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
          <h2 className="text-2xl font-light text-gray-900">Document Transparency</h2>
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
              <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Credentials & Qualifications</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Ground Path maintains transparent access to all professional credentials, qualifications, and registration documents. We provide documentation in multiple accessible formats to ensure transparency and client confidence.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Available Documents</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>The following documentation is available for review:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Master of Social Work qualification certificate</li>
                  <li>AASW membership certificate and registration</li>
                  <li>Professional indemnity insurance certificate</li>
                  <li>Continuing Professional Development portfolio</li>
                  <li>Academic transcripts and qualifications</li>
                  <li>Supervisor agreements and clinical supervision records</li>
                  <li>Professional references and endorsements</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Document Formats</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>Documentation is provided in accessible formats:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>PDF:</strong> High-quality portable documents for printing and archiving</li>
                  <li><strong>EPUB:</strong> Accessible e-book format for screen readers and mobile devices</li>
                  <li><strong>MOBI:</strong> Kindle-compatible format for e-reader accessibility</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Request Process</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Professional documentation can be requested via email at connect@groundpath.com.au. Documents are typically provided within 2 business days. All documents include verification details and can be independently authenticated with issuing bodies.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Privacy & Security</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Document sharing follows strict privacy protocols. Personal identification details are redacted where appropriate, while maintaining document authenticity and verification capabilities. All document transmission uses secure, encrypted channels.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Independent Verification</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Clients are encouraged to independently verify credentials with relevant professional bodies including AASW, academic institutions, and insurance providers. Contact details for verification purposes are provided with each document set.
              </p>
            </section>

            <p className="text-xs text-gray-500 mt-6 pb-6">
              Document transparency supports informed decision-making and professional accountability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentTransparencyModal;