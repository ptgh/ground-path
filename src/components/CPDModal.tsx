import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from 'gsap';

interface CPDModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CPDModal = ({ isOpen, onClose }: CPDModalProps) => {
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
          <h2 className="text-2xl font-light text-gray-900">Continuing Professional Development</h2>
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
              <h3 className="text-lg font-medium text-gray-900 mb-3">Annual Requirements</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                groundpath practitioners exceed minimum CPD requirements, completing a minimum of 30 hours of continuing professional development annually. This commitment ensures our practice remains current with emerging research, best-practice guidelines, and evolving professional standards.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Training Areas</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>Our CPD activities cover diverse areas including:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Evidence-based therapeutic interventions</li>
                  <li>Trauma-informed practice and healing approaches</li>
                  <li>Cultural competency and inclusive practice</li>
                  <li>Mental health assessment and intervention</li>
                  <li>Ethical practice and professional boundaries</li>
                  <li>Risk assessment and safety planning</li>
                  <li>NDIS frameworks and disability support</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Currency</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>We maintain professional currency through:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Regular attendance at professional conferences</li>
                  <li>Participation in workshops and seminars</li>
                  <li>Engagement with professional literature and research</li>
                  <li>Peer consultation and professional networks</li>
                  <li>Online learning modules and webinars</li>
                  <li>Reflective practice and case study analysis</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Skill Development</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Targeted skill development focuses on emerging therapeutic modalities, technology integration in practice, and specialised interventions for diverse client populations. This includes training in telehealth delivery, digital privacy, and remote therapeutic relationship building.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Documentation & Compliance</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                All CPD activities are documented and maintained in accordance with AASW requirements. Professional development plans are reviewed annually and aligned with practice goals, client feedback, and emerging professional challenges.
              </p>
            </section>

            <p className="text-xs text-gray-500 mt-6 pb-6">
              CPD portfolio and certificates available upon request
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CPDModal;