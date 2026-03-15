import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from 'gsap';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal = ({ isOpen, onClose }: PrivacyPolicyModalProps) => {
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
        className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
          <h2 className="text-2xl font-light text-gray-900">Privacy Policy</h2>
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
              <h3 className="text-lg font-medium text-gray-900 mb-3">1. Introduction</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                groundpath is committed to protecting your privacy in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs). This Privacy Policy explains how we collect, use, store, and disclose your personal information.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">2. Information We Collect</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>We may collect the following types of personal information:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Contact details (name, email, phone number, address)</li>
                  <li>Health information relevant to service provision</li>
                  <li>Personal circumstances and background information</li>
                  <li>Session notes and treatment records</li>
                  <li>Payment and billing information</li>
                  <li>Communication records</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">3. How We Use Your Information</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>We use your personal information to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide professional social work and counseling services</li>
                  <li>Maintain accurate treatment records</li>
                  <li>Process payments and manage billing</li>
                  <li>Communicate with you about your care</li>
                  <li>Meet professional and legal obligations</li>
                  <li>Improve our services</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">4. Information Security</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                We implement appropriate security measures to protect your personal information against unauthorized access, modification, disclosure, or destruction. This includes secure storage systems, encrypted communications, and access controls.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">5. Disclosure of Information</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>We may disclose your personal information in the following circumstances:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>With your explicit consent</li>
                  <li>When required by law or court order</li>
                  <li>To prevent serious harm to yourself or others</li>
                  <li>For professional supervision purposes (de-identified where possible)</li>
                  <li>To other healthcare providers involved in your care (with consent)</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">6. Your Rights</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>You have the right to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Access your personal information</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of information (subject to professional requirements)</li>
                  <li>Withdraw consent for information use</li>
                  <li>Make a complaint about privacy practices</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">7. Retention of Records</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                We retain your personal information for the period required by professional standards and legal obligations, typically seven years from the last service provision, or longer if required by law.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">8. Contact Us</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at 
                <a href="mailto:connect@groundpath.com.au" className="text-sage-600 hover:text-sage-700 ml-1">
                  connect@groundpath.com.au
                </a>
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">9. Changes to This Policy</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                We may update this Privacy Policy from time to time. Changes will be posted on our website with the effective date clearly indicated.
              </p>
            </section>

            <p className="text-xs text-gray-500 mt-6 pb-6">
              Last updated: December 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;