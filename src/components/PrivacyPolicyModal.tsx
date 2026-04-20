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
          opacity: 0, scale: 0.9, y: -20, duration: 0.2, ease: "power2.in",
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
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div 
        ref={contentRef}
        className="relative bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border bg-card/80 backdrop-blur-sm">
          <h2 className="text-2xl font-light text-foreground">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0 mt-0.5"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">

            {/* 1. Introduction */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">1. Introduction</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                groundpath is committed to protecting your privacy in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs). This Privacy Policy explains how we collect, use, store, and disclose your personal information. It also describes how you can access or correct your information, make a complaint, and how we will deal with that complaint.
              </p>
            </section>

            {/* 2. Information We Collect */}
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
                  <li>Voice data: If you use our AI voice counselling feature, audio data is processed in real-time by our voice technology provider</li>
                  <li>Usage data: Pages visited, features used, and session duration (collected via Google Analytics if enabled)</li>
                </ul>
              </div>
            </section>

            {/* 3. How We Use Your Information */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">3. How We Use Your Information</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>We use your personal information to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide professional social work and counselling services</li>
                  <li>Maintain accurate treatment records</li>
                  <li>Process payments and manage billing</li>
                  <li>Communicate with you about your care</li>
                  <li>Meet professional and legal obligations</li>
                  <li>Improve our services</li>
                  <li>Deliver AI voice counselling sessions via our voice technology provider, where audio is processed in real-time to generate responses</li>
                  <li>Power AI assistant features that provide general wellbeing information and support navigation of our services</li>
                </ul>
              </div>
            </section>

            {/* 4. Information Security */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">4. Information Security</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                We implement appropriate security measures to protect your personal information against unauthorized access, modification, disclosure, or destruction. This includes secure storage systems, encrypted communications, and access controls.
              </p>
            </section>

            {/* 5. Disclosure of Information */}
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
                  <li>To third-party service providers who assist us in delivering our services (see Section 7 below)</li>
                </ul>
              </div>
            </section>

            {/* 6. Overseas Disclosure */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">6. Overseas Disclosure</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>
                  In the course of providing our services, personal information may be disclosed to overseas recipients. Our technology service providers are primarily located in the <strong>United States</strong>, including:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Supabase</strong> (United States) — database hosting and authentication</li>
                  <li><strong>ElevenLabs</strong> (United States) — AI voice counselling processing</li>
                  <li><strong>Resend</strong> (United States) — email delivery</li>
                  <li><strong>OpenAI</strong> (United States) — AI assistant features</li>
                </ul>
                <p>
                  We take reasonable steps to ensure overseas recipients handle your information consistently with the Australian Privacy Principles.
                </p>
              </div>
            </section>

            {/* 7. Third-Party Service Providers */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">7. Third-Party Service Providers (Subprocessors)</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-3">
                <p>We engage the following third-party service providers to help deliver our services:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 font-medium text-gray-700 border-b border-gray-200">Service</th>
                        <th className="text-left p-3 font-medium text-gray-700 border-b border-gray-200">Purpose</th>
                        <th className="text-left p-3 font-medium text-gray-700 border-b border-gray-200">Country</th>
                        <th className="text-left p-3 font-medium text-gray-700 border-b border-gray-200">Data Processed</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-700">Supabase</td>
                        <td className="p-3">Authentication & database</td>
                        <td className="p-3">US</td>
                        <td className="p-3">Account data, messages, profile information</td>
                      </tr>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <td className="p-3 font-medium text-gray-700">ElevenLabs</td>
                        <td className="p-3">AI voice counselling</td>
                        <td className="p-3">US</td>
                        <td className="p-3">Voice audio data (processed in real-time, not stored permanently)</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-700">Resend</td>
                        <td className="p-3">Email notifications</td>
                        <td className="p-3">US</td>
                        <td className="p-3">Email address, notification content</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-gray-700">OpenAI</td>
                        <td className="p-3">AI assistant features</td>
                        <td className="p-3">US</td>
                        <td className="p-3">Conversation context for AI-powered tools</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 8. AI and Automated Decision-Making */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">8. AI and Automated Decision-Making</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>groundpath uses artificial intelligence technologies to enhance our service delivery:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>AI Voice Counselling:</strong> We use ElevenLabs to power AI voice counselling agents (Sarah and James) that provide conversational wellbeing support.</li>
                  <li><strong>AI Assistant:</strong> We use OpenAI to power our text-based AI assistant, which provides general information and helps navigate our services.</li>
                </ul>
                <p>
                  These AI tools assist with information delivery and general wellbeing support. They do not make clinical decisions, diagnoses, or treatment recommendations. All clinical decisions are made by qualified human practitioners.
                </p>
                <p className="text-xs text-gray-500 italic">
                  From 10 December 2026, we will provide additional information about substantially automated decisions that significantly affect your rights, as required by amendments to the Privacy Act 1988.
                </p>
              </div>
            </section>

            {/* 9. Your Rights */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">9. Your Rights</h3>
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

            {/* 10. Retention of Records */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">10. Retention of Records</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                We retain your personal information for the period required by professional standards and legal obligations, typically seven years from the last service provision, or longer if required by law.
              </p>
            </section>

            {/* 11. Complaints */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">11. Complaints</h3>
              <div className="text-gray-600 leading-relaxed text-sm space-y-2">
                <p>
                  If you believe we have breached your privacy or mishandled your personal information, you may lodge a complaint by emailing us at{' '}
                  <a href="mailto:connect@groundpath.com.au" className="text-sage-600 hover:text-sage-700">
                    connect@groundpath.com.au
                  </a>.
                </p>
                <p>
                  We will acknowledge your complaint within <strong>7 days</strong> and aim to resolve it within <strong>30 days</strong>.
                </p>
                <p>
                  If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at{' '}
                  <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-sage-600 hover:text-sage-700">
                    www.oaic.gov.au
                  </a>{' '}
                  or by calling <strong>1300 363 992</strong>.
                </p>
              </div>
            </section>

            {/* 12. Contact Us */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">12. Contact Us</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at{' '}
                <a href="mailto:connect@groundpath.com.au" className="text-sage-600 hover:text-sage-700">
                  connect@groundpath.com.au
                </a>
              </p>
            </section>

            {/* 13. Changes to This Policy */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-3">13. Changes to This Policy</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                We may update this Privacy Policy from time to time. Changes will be posted on our website with the effective date clearly indicated.
              </p>
            </section>

            <p className="text-xs text-gray-500 mt-6 pb-6">
              Last updated: April 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
