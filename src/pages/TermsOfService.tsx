const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-light text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">1. Professional Services</h2>
            <p className="text-gray-600 leading-relaxed">
              Ground Path provides professional social work, counseling, and mental health support services. Services are provided by qualified practitioners registered with relevant professional bodies and operating under applicable codes of ethics and practice standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">2. Client Responsibilities</h2>
            <div className="text-gray-600 leading-relaxed space-y-3">
              <p>As a client, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
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
            <h2 className="text-xl font-medium text-gray-900 mb-4">3. Cancellation and Refund Policy</h2>
            <div className="text-gray-600 leading-relaxed space-y-3">
              <p><strong>Cancellation:</strong> Appointments may be cancelled or rescheduled with at least 24 hours notice without penalty.</p>
              <p><strong>Late Cancellation:</strong> Cancellations with less than 24 hours notice may incur a fee.</p>
              <p><strong>No Show:</strong> Failure to attend without notice may result in full session fee charges.</p>
              <p><strong>Refunds:</strong> Refunds for services will be considered on a case-by-case basis in accordance with Australian Consumer Law.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">4. Professional Boundaries</h2>
            <p className="text-gray-600 leading-relaxed">
              Our professional relationship is governed by ethical guidelines that maintain clear boundaries between practitioner and client. This includes limitations on personal relationships, gift-giving, and contact outside of professional settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">5. Limitations of Liability</h2>
            <div className="text-gray-600 leading-relaxed space-y-3">
              <p>While we provide professional services to the highest standards:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We cannot guarantee specific outcomes or results</li>
                <li>Our liability is limited to the extent permitted by law</li>
                <li>Professional indemnity insurance is maintained for service provision</li>
                <li>Clients retain responsibility for their own decisions and actions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">6. Emergency Situations</h2>
            <p className="text-gray-600 leading-relaxed">
              Our services are not designed for emergency mental health crises. In emergency situations, contact emergency services (000), Lifeline (13 11 14), or present to your nearest hospital emergency department.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">7. Confidentiality</h2>
            <p className="text-gray-600 leading-relaxed">
              All information shared during sessions is confidential and protected under professional obligations, except where disclosure is required by law or to prevent serious harm.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">8. Complaints and Feedback</h2>
            <div className="text-gray-600 leading-relaxed space-y-3">
              <p>We welcome feedback and take complaints seriously. You may:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Discuss concerns directly with your practitioner</li>
                <li>Contact us via email at connect@groundpath.com.au</li>
                <li>Lodge complaints with the relevant professional body (AASW, ACA)</li>
                <li>Contact the Health Care Complaints Commission if applicable</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">9. Service Modifications</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify services, fees, or terms with reasonable notice. Significant changes will be communicated to clients in advance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">10. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These terms are governed by the laws of Western Australia and the Commonwealth of Australia. Any disputes will be subject to the jurisdiction of Western Australian courts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions regarding these terms, please contact us at 
              <a href="mailto:connect@groundpath.com.au" className="text-sage-600 hover:text-sage-700 ml-1">
                connect@groundpath.com.au
              </a>
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

export default TermsOfService;