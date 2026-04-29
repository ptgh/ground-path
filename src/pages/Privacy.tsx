import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy | groundpath"
        description="How groundpath collects, uses, stores and discloses your personal information under the Australian Privacy Principles."
      />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to groundpath
        </Link>

        <h1 className="text-3xl font-light text-foreground mb-8">Privacy Policy</h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              groundpath is committed to protecting your privacy in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs). This Privacy Policy explains how we collect, use, store, and disclose your personal information. It also describes how you can access or correct your information, make a complaint, and how we will deal with that complaint.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">2. Information We Collect</h2>
            <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
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

          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">3. How We Use Your Information</h2>
            <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
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

          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">4. Information Security</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              We implement appropriate security measures to protect your personal information against unauthorized access, modification, disclosure, or destruction. This includes secure storage systems, encrypted communications, and access controls.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">5. Disclosure of Information</h2>
            <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
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

          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">6. Overseas Disclosure</h2>
            <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
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

          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">7. Third-Party Service Providers (Subprocessors)</h2>
            <div className="text-muted-foreground leading-relaxed text-sm space-y-3">
              <p>We engage the following third-party service providers to help deliver our services:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium text-foreground border-b border-border">Service</th>
                      <th className="text-left p-3 font-medium text-foreground border-b border-border">Purpose</th>
                      <th className="text-left p-3 font-medium text-foreground border-b border-border">Country</th>
                      <th className="text-left p-3 font-medium text-foreground border-b border-border">Data Processed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/60">
                      <td className="p-3 font-medium text-foreground">Supabase</td>
                      <td className="p-3">Authentication & database</td>
                      <td className="p-3">US</td>
                      <td className="p-3">Account data, messages, profile information</td>
                    </tr>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <td className="p-3 font-medium text-foreground">ElevenLabs</td>
                      <td className="p-3">AI voice counselling</td>
                      <td className="p-3">US</td>
                      <td className="p-3">Voice audio data (processed in real-time, not stored permanently)</td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="p-3 font-medium text-foreground">Resend</td>
                      <td className="p-3">Email notifications</td>
                      <td className="p-3">US</td>
                      <td className="p-3">Email address, notification content</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-foreground">OpenAI</td>
                      <td className="p-3">AI assistant features</td>
                      <td className="p-3">US</td>
                      <td className="p-3">Conversation context for AI-powered tools</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">8. AI and Automated Decision-Making</h2>
            <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
              <p>groundpath uses artificial intelligence technologies to enhance our service delivery:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>AI Voice Counselling:</strong> We use ElevenLabs to power AI voice counselling agents (Sarah and James) that provide conversational wellbeing support.</li>
                <li><strong>AI Assistant:</strong> We use OpenAI to power our text-based AI assistant, which provides general information and helps navigate our services.</li>
              </ul>
              <p>
                These AI tools assist with information delivery and general wellbeing support. They do not make clinical decisions, diagnoses, or treatment recommendations. All clinical decisions are made by qualified human practitioners.
              </p>
              <p className="text-xs text-muted-foreground/80 italic">
                From 10 December 2026, we will provide additional information about substantially automated decisions that significantly affect your rights, as required by amendments to the Privacy Act 1988.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">9. Your Rights</h2>
            <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
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
            <h2 className="text-lg font-medium text-foreground mb-3">10. Retention of Records</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              We retain your personal information for the period required by professional standards and legal obligations, typically seven years from the last service provision, or longer if required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">11. Complaints</h2>
            <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
              <p>
                If you believe we have breached your privacy or mishandled your personal information, you may lodge a complaint by emailing us at{' '}
                <a href="mailto:connect@groundpath.com.au" className="text-primary hover:text-primary/80">
                  connect@groundpath.com.au
                </a>.
              </p>
              <p>
                We will acknowledge your complaint within <strong>7 days</strong> and aim to resolve it within <strong>30 days</strong>.
              </p>
              <p>
                If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at{' '}
                <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                  www.oaic.gov.au
                </a>{' '}
                or by calling <strong>1300 363 992</strong>.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at{' '}
              <a href="mailto:connect@groundpath.com.au" className="text-primary hover:text-primary/80">
                connect@groundpath.com.au
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground mb-3">13. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              We may update this Privacy Policy from time to time. Changes will be posted on our website with the effective date clearly indicated.
            </p>
          </section>

          <p className="text-xs text-muted-foreground/80 mt-6 pb-6">
            Last updated: April 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
