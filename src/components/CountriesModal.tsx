import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from 'gsap';

interface CountriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CountriesModal = ({ isOpen, onClose }: CountriesModalProps) => {
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
          <h2 className="text-2xl font-light text-gray-900">International Registration</h2>
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
              <h3 className="text-lg font-medium text-gray-900 mb-3">Dual Country Registration</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Ground Path practitioners maintain professional registration in both Australia and the United Kingdom, enabling comprehensive service delivery across international boundaries and ensuring adherence to the highest professional standards in both jurisdictions.
              </p>
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-3">🇦🇺 Australia</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-2">AASW Registration</h4>
                    <p className="text-gray-600 text-sm">
                      Full membership with the Australian Association of Social Workers, ensuring compliance with Australian professional standards and ethical frameworks.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-2">Practice Areas</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• In-person sessions (Perth-based)</li>
                      <li>• NDIS services (plan & self-managed)</li>
                      <li>• Telehealth across Australia</li>
                      <li>• Clinical supervision</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-3">🇬🇧 United Kingdom</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-2">Social Work England</h4>
                    <p className="text-gray-600 text-sm">
                      Professional registration with Social Work England, maintaining UK practice standards and continuing professional development requirements.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-2">Practice Areas</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Remote consultations with UK clients</li>
                      <li>• In-person sessions (London visits)</li>
                      <li>• Cross-cultural practice expertise</li>
                      <li>• International supervision</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Cross-Cultural Competency</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>Our international registration enables unique cross-cultural practice capabilities:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Understanding of both Australian and UK social work frameworks</li>
                  <li>Experience with diverse cultural contexts and practice settings</li>
                  <li>Knowledge of international best practices and evidence-based approaches</li>
                  <li>Ability to provide culturally sensitive support to international clients</li>
                  <li>Expertise in managing complex cross-border practice considerations</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Standards Alignment</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Both registrations require adherence to rigorous professional standards, ongoing supervision, and continuous professional development. This dual registration ensures our practice meets the highest international standards while providing clients with confidence in our professional competence and ethical practice.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Service Accessibility</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>Our international registration enables flexible service delivery:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Telehealth sessions across time zones</li>
                  <li>In-person appointments in both countries</li>
                  <li>Support for expatriate communities</li>
                  <li>International relocation support</li>
                  <li>Cross-cultural family therapy and support</li>
                </ul>
              </div>
            </section>

            <p className="text-xs text-gray-500 mt-6 pb-6">
              Professional registration certificates and CPD records available upon request for both jurisdictions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountriesModal;