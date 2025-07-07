import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from 'gsap';

interface MSWModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MSWModal = ({ isOpen, onClose }: MSWModalProps) => {
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
          <h2 className="text-2xl font-light text-gray-900">Master of Social Work</h2>
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
              <h3 className="text-lg font-medium text-gray-900 mb-3">Advanced Professional Qualification</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                The Master of Social Work (MSW) is a graduate-level professional degree that provides advanced knowledge, skills, and competencies for social work practice. Our practitioners hold MSW qualifications from AASW-accredited programs, ensuring comprehensive preparation for professional practice.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Core Competencies</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>MSW programs develop expertise in:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Advanced clinical assessment and intervention</li>
                  <li>Evidence-based practice methodologies</li>
                  <li>Ethical decision-making and professional boundaries</li>
                  <li>Cultural competency and anti-oppressive practice</li>
                  <li>Trauma-informed approaches to healing</li>
                  <li>Research and evaluation skills</li>
                  <li>Policy analysis and advocacy</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Specialised Training</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>Our MSW training includes specialisation in:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Mental health and clinical social work</li>
                  <li>Individual, family, and group therapy</li>
                  <li>Crisis intervention and risk assessment</li>
                  <li>Disability support and NDIS frameworks</li>
                  <li>Community development and social justice</li>
                  <li>Program evaluation and quality improvement</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Practical Experience</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                MSW programs require extensive supervised field placement, providing hands-on experience in diverse practice settings. This practical component ensures graduates are well-prepared for the complexities of professional social work practice.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Recognition</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                MSW qualifications are recognised as the standard for advanced social work practice in Australia and internationally. This ensures our services meet the highest professional standards and client expectations.
              </p>
            </section>

            <p className="text-xs text-gray-500 mt-6 pb-6">
              Academic transcripts and qualification certificates available upon request
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MSWModal;