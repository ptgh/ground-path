

const About = () => {
  return (
    <section id="ground-path" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="fade-in flex items-center justify-center space-x-3 mb-4">
              <svg width="32" height="32" viewBox="0 0 40 40">
                <path
                  d="M20 6 C 28 8, 32 16, 30 24 C 28 30, 22 32, 16 30 C 12 28, 10 24, 12 20 C 13 18, 15 17, 17 18 C 18 18.5, 18.5 19, 18 19.5"
                  fill="none"
                  stroke="#7B9B85"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h2 className="text-3xl sm:text-4xl font-light text-gray-900">
                ground path
              </h2>
            </div>
            <div className="fade-in w-20 h-1 bg-sage-600 mx-auto"></div>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6">
              <div className="fade-in">
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Qualified & Experienced Social Work
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  We are qualified professionals with Master of Social Work degrees and experience in mental health, disability services, and child protection. We provide person-centred, evidence-informed support grounded in the AASW Code of Ethics.
                </p>
              </div>

              <div className="fade-in">
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Ongoing Professional Development
                </h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Our team members are either:
                </p>
                <ul className="text-gray-600 space-y-2 mb-4 ml-4">
                  <li>• Registered with the Australian Counselling Association (ACA) or PACFA</li>
                  <li>• Or completing registration with postgraduate counselling training</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">
                  All staff undertake regular clinical supervision and training to meet our clients' diverse needs.
                </p>
              </div>

              <div className="fade-in">
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  NDIS Services
                </h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                  We offer flexible services to plan-managed and self-managed NDIS participants, following the NDIS Code of Conduct with full ethical compliance.
                </p>
                <ul className="text-gray-600 space-y-2 mb-4 ml-4">
                  <li>• Counselling and therapeutic support</li>
                  <li>• Psychosocial recovery coaching</li>
                  <li>• Support coordination</li>
                  <li>• Community participation support</li>
                </ul>
                <p className="text-gray-600 leading-relaxed">
                  All services are trauma-informed, culturally respectful, and recovery-oriented.
                </p>
              </div>
            </div>

            {/* Stats/Highlights */}
            <div className="fade-in space-y-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="text-center">
                  <div className="text-3xl font-light text-sage-600 mb-2">MSW</div>
                  <div className="text-gray-600">Master of Social Work</div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="text-center">
                  <div className="text-3xl font-light text-sage-600 mb-2">ACA</div>
                  <div className="text-gray-600">Australian Counselling</div>
                  <div className="text-sm text-gray-500 mt-1">Association Registered</div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="text-center">
                  <div className="text-3xl font-light text-sage-600 mb-2">100%</div>
                  <div className="text-gray-600">NDIS Compliant</div>
                  <div className="text-sm text-gray-500 mt-1">Fully Screened</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

