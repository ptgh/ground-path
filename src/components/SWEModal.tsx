import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from 'gsap';

interface SWEModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SWEModal = ({ isOpen, onClose }: SWEModalProps) => {
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
        <div className="flex items-start justify-between p-6 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
          <h2 className="text-2xl font-light text-gray-900">Social Work England Registration</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors shrink-0 mt-0.5"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">UK Professional Registration</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Social Work England (SWE) is the professional regulator for social workers in England. Our registration with SWE demonstrates compliance with rigorous professional standards and enables provision of social work services to UK clients, including remote consultations and London-based sessions.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Standards Framework</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>SWE registration requires adherence to the Professional Standards Framework, including:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Knowledge and skills for effective practice</li>
                  <li>Values and ethics in professional relationships</li>
                  <li>Diversity, rights, and social justice</li>
                  <li>Professional development and accountability</li>
                  <li>Safeguarding and risk management</li>
                  <li>Leadership and professional influence</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Continuing Professional Development</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                SWE requires 30 hours of continuing professional development every two years, including evidence of reflection and learning application. This ensures our practice remains current with UK standards and best practices.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">International Practice</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>SWE registration enables:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Remote social work consultations with UK clients</li>
                  <li>In-person sessions when visiting London</li>
                  <li>Supervision for UK-based social workers</li>
                  <li>Cross-cultural practice expertise</li>
                  <li>International perspective on social work practice</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Quality Assurance</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                SWE maintains public protection through robust fitness to practice procedures, professional conduct investigations, and ongoing monitoring of registered practitioners. This provides additional assurance of professional competence and ethical practice.
              </p>
            </section>

            <p className="text-xs text-gray-500 mt-6 pb-6">
              SWE registration certificate and professional development records available upon request
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SWEModal;