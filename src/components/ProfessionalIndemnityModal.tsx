import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from 'gsap';

interface ProfessionalIndemnityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfessionalIndemnityModal = ({ isOpen, onClose }: ProfessionalIndemnityModalProps) => {
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
          <h2 className="text-2xl font-light text-gray-900">Professional Indemnity</h2>
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
              <h3 className="text-lg font-medium text-gray-900 mb-3">Comprehensive Coverage</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Ground Path maintains comprehensive professional indemnity insurance in accordance with professional standards and Australian legal requirements. Our coverage protects both practitioners and clients, ensuring peace of mind for all parties involved in the therapeutic relationship.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Client Protection</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>Our professional indemnity insurance provides protection for:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Professional negligence claims</li>
                  <li>Breach of professional duty</li>
                  <li>Errors or omissions in service delivery</li>
                  <li>Loss of documents or confidential information</li>
                  <li>Defamation claims arising from professional practice</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Coverage Details</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>Our policy includes:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Minimum $20 million coverage per claim</li>
                  <li>Retroactive coverage for past services</li>
                  <li>Run-off coverage following retirement</li>
                  <li>Legal costs and defence expenses</li>
                  <li>Crisis counselling and support services</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Standards</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Our insurance is maintained through recognised professional indemnity providers who specialise in social work and mental health services. Coverage is reviewed annually and updated to reflect current practice requirements and industry standards.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Continuous Protection</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Professional indemnity coverage is maintained continuously throughout active practice and includes provision for claims made after retirement or cessation of practice. This ensures long-term protection for both practitioners and clients.
              </p>
            </section>

            <p className="text-xs text-gray-500 mt-6 pb-6">
              Insurance certificate available upon request
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalIndemnityModal;