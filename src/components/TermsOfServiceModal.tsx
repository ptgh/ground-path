import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from 'gsap';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServiceModal = ({ isOpen, onClose }: TermsOfServiceModalProps) => {
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
        <div className="flex items-start justify-between p-6 border-b border-border bg-white/80 backdrop-blur-sm">
          <h2 className="text-2xl font-light text-foreground">Terms of Service</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors shrink-0 mt-0.5"
          >
            <X className="h-5 w-5 text-muted-foreground/80" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            <section>
              <h3 className="text-lg font-medium text-foreground mb-3">1. Professional Services</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                groundpath provides professional social work, counseling, and mental health support services. Services are provided by qualified practitioners registered with relevant professional bodies and operating under applicable codes of ethics and practice standards.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-foreground mb-3">2. Client Responsibilities</h3>
              <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
                <p>As a client, you agree to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide accurate and complete information</li>
                  <li>Attend scheduled appointments or provide reasonable notice of cancellation</li>
                  <li>Actively participate in the therapeutic process</li>
                  <li>Respect professional boundaries</li>
                  <li>Pay fees as agreed</li>
                  <li>Inform us of any changes to your circumstances that may affect treatment</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-foreground mb-3">3. Cancellation and Refund Policy</h3>
              <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
                <p><strong>Cancellation:</strong> Appointments may be cancelled or rescheduled with at least 24 hours notice without penalty.</p>
                <p><strong>Late Cancellation:</strong> Cancellations with less than 24 hours notice may incur a fee.</p>
                <p><strong>No Show:</strong> Failure to attend without notice may result in full session fee charges.</p>
                <p><strong>Refunds:</strong> Refunds for services will be considered on a case-by-case basis in accordance with Australian Consumer Law.</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-foreground mb-3">4. Professional Boundaries</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Our professional relationship is governed by ethical guidelines that maintain clear boundaries between practitioner and client. This includes limitations on personal relationships, gift-giving, and contact outside of professional settings.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-foreground mb-3">5. Limitations of Liability</h3>
              <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
                <p>While we provide professional services to the highest standards:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>We cannot guarantee specific outcomes or results</li>
                  <li>Our liability is limited to the extent permitted by law</li>
                  <li>Professional indemnity insurance is maintained for service provision</li>
                  <li>Clients retain responsibility for their own decisions and actions</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-foreground mb-3">6. Emergency Situations</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Our services are not designed for emergency mental health crises. In emergency situations, contact emergency services (000), Lifeline (13 11 14), or present to your nearest hospital emergency department.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-foreground mb-3">7. Confidentiality</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                All information shared during sessions is confidential and protected under professional obligations, except where disclosure is required by law or to prevent serious harm.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-foreground mb-3">8. Complaints and Feedback</h3>
              <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
                <p>We welcome feedback and take complaints seriously. You may:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Discuss concerns directly with your practitioner</li>
                  <li>Contact us via email at connect@groundpath.com.au</li>
                  <li>Lodge complaints with the relevant professional body (AASW, ACA)</li>
                  <li>Contact the Health Care Complaints Commission if applicable</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-foreground mb-3">9. Service Modifications</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We reserve the right to modify services, fees, or terms with reasonable notice. Significant changes will be communicated to clients in advance.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-foreground mb-3">10. Governing Law</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                These terms are governed by the laws of Western Australia and the Commonwealth of Australia. Any disputes will be subject to the jurisdiction of Western Australian courts.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-medium text-foreground mb-3">11. Contact Information</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                For questions regarding these terms, please contact us at 
                <a href="mailto:connect@groundpath.com.au" className="text-primary hover:text-primary/80 ml-1">
                  connect@groundpath.com.au
                </a>
              </p>
            </section>

            <p className="text-xs text-muted-foreground/80 mt-6 pb-6">
              Last updated: December 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;