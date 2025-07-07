import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from 'gsap';

interface AASWRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AASWRegistrationModal = ({ isOpen, onClose }: AASWRegistrationModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Animate in
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
      // Animate out
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
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        ref={contentRef}
        className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-white/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
          <h2 className="text-2xl font-light text-gray-900">AASW Professional Registration</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Australian Association of Social Workers</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Ground Path practitioners maintain active membership with the Australian Association of Social Workers (AASW), the national professional body for social workers in Australia. AASW Member #486997 represents our commitment to professional excellence and ethical practice.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Code of Ethics</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>Our practice is guided by the AASW Code of Ethics, which emphasises:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Respect for persons and their inherent dignity</li>
                  <li>Social justice and human rights advocacy</li>
                  <li>Professional competence and integrity</li>
                  <li>Culturally respectful practice</li>
                  <li>Confidentiality and privacy protection</li>
                  <li>Professional accountability and transparency</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Standards</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>AASW membership requires adherence to rigorous professional standards:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Master of Social Work qualification from AASW-accredited program</li>
                  <li>Annual renewal of membership and professional registration</li>
                  <li>Compliance with continuing professional development requirements</li>
                  <li>Regular clinical supervision with qualified supervisors</li>
                  <li>Adherence to scope of practice guidelines</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Quality Assurance</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                The AASW provides ongoing quality assurance through professional standards monitoring, complaint processes, and peer review mechanisms. This ensures that all services meet the highest standards of professional social work practice.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Complaints Process</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Clients have access to independent complaint processes through the AASW Professional Standards Committee. This provides an additional layer of protection and accountability beyond internal complaint mechanisms.
              </p>
            </section>

            <p className="text-xs text-gray-500 mt-6 pb-6">
              AASW membership certificate and ethical guidelines available upon request
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AASWRegistrationModal;