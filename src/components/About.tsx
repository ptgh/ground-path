
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

          {/* Main Content - Services Style Card */}
          <div className="grid md:grid-cols-1 gap-6 mb-12">
            <div className="fade-in bg-white rounded-xl p-8 hover:shadow-lg transition-shadow duration-300 shadow-sm">
              <div className="space-y-8">
                {/* Qualified & Experienced Social Work */}
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4">
                    Qualified & Experienced Social Work
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    At Ground Path, we are a team of qualified professionals with Master of Social Work degrees and extensive experience in mental health, disability services, and child protection. We provide person-centred, evidence-informed support underpinned by care, cultural safety, and ethical practice. Our approach is grounded in the Australian Association of Social Workers (AASW) Code of Ethics and aligned with best-practice mental health and community care standards.
                  </p>
                </div>

                {/* Ongoing Professional Development */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-medium text-gray-900 mb-4">
                    Ongoing Professional Development
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    Our team members are either:
                  </p>
                  <ul className="text-gray-600 space-y-2 mb-4 ml-4">
                    <li>• Registered with the Australian Counselling Association (ACA) or PACFA</li>
                    <li>• Or in the final stages of completing registration, supported by postgraduate counselling training</li>
                  </ul>
                  <p className="text-gray-600 leading-relaxed">
                    Ground Path is committed to continual growth and professional development. All staff undertake regular clinical supervision and training to ensure we meet the diverse and evolving needs of our clients.
                  </p>
                </div>

                {/* NDIS Services */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-medium text-gray-900 mb-4">
                    NDIS Services for Plan- and Self-Managed Participants
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    Ground Path offers high-quality, flexible services to NDIS participants who are plan-managed or self-managed (we do not currently provide supports to NDIA-managed participants). We follow the NDIS Code of Conduct and maintain full compliance with ethical and legal standards for unregistered providers.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    We offer:
                  </p>
                  <ul className="text-gray-600 space-y-2 mb-4 ml-4">
                    <li>• Counselling and therapeutic support (Improved Daily Living – Capacity Building)</li>
                    <li>• Psychosocial recovery coaching</li>
                    <li>• Support coordination</li>
                    <li>• Community participation and social inclusion support</li>
                  </ul>
                  <p className="text-gray-600 leading-relaxed">
                    All services are delivered with a trauma-informed, culturally respectful, and recovery-oriented approach.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats/Highlights */}
          <div className="fade-in grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-light text-sage-600 mb-2">MSW</div>
                <div className="text-gray-600">Master of Social Work</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-light text-sage-600 mb-2">100%</div>
                <div className="text-gray-600">NDIS & Professional Screening</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-light text-sage-600 mb-2">ACA</div>
                <div className="text-gray-600">Registered Members</div>
                <div className="text-sm text-gray-500 mt-1">Australia</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
