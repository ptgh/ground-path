const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-light text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              Ground Path is committed to protecting your privacy in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs). This Privacy Policy explains how we collect, use, store, and disclose your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="text-gray-600 leading-relaxed space-y-3">
              <p>We may collect the following types of personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
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
            <h2 className="text-xl font-medium text-gray-900 mb-4">3. How We Use Your Information</h2>
            <div className="text-gray-600 leading-relaxed space-y-3">
              <p>We use your personal information to:</p>
              <ul className="list-disc pl-6 space-y-2">
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
            <h2 className="text-xl font-medium text-gray-900 mb-4">4. Information Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement appropriate security measures to protect your personal information against unauthorized access, modification, disclosure, or destruction. This includes secure storage systems, encrypted communications, and access controls.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">5. Disclosure of Information</h2>
            <div className="text-gray-600 leading-relaxed space-y-3">
              <p>We may disclose your personal information in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With your explicit consent</li>
                <li>When required by law or court order</li>
                <li>To prevent serious harm to yourself or others</li>
                <li>For professional supervision purposes (de-identified where possible)</li>
                <li>To other healthcare providers involved in your care (with consent)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">6. Your Rights</h2>
            <div className="text-gray-600 leading-relaxed space-y-3">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of information (subject to professional requirements)</li>
                <li>Withdraw consent for information use</li>
                <li>Make a complaint about privacy practices</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">7. Retention of Records</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal information for the period required by professional standards and legal obligations, typically seven years from the last service provision, or longer if required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at 
              <a href="mailto:connect@groundpath.com.au" className="text-sage-600 hover:text-sage-700 ml-1">
                connect@groundpath.com.au
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on our website with the effective date clearly indicated.
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-8">
            Last updated: December 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;