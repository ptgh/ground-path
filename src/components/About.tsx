
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
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Services Info Box */}
            <div className="fade-in bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">
                    Qualified & Experienced Social Work
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    At Ground Path, we are a team of qualified professionals with Master of Social Work degrees, providing person-centred, evidence-based support grounded in the AASW Code of Ethics and best-practice standards.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">
                    Ongoing Professional Development
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Our team members are either registered with the AASW and ACA, or PACFA, or completing registration with postgraduate training. All staff undertake regular clinical supervision and training.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">
                    NDIS Services
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm mb-3">
                    High-quality services for plan-managed and self-managed participants:
                  </p>
                  <div className="text-gray-600 space-y-1 mb-3 text-sm">
                    <div>Counselling and therapeutic support</div>
                    <div>Psychosocial recovery coaching</div>
                    <div>Support coordination</div>
                    <div>Community participation support</div>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Delivered with trauma-informed, culturally respectful approach.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats/Highlights */}
            <div className="fade-in space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-center">
                  <div className="text-xl font-light text-sage-600 mb-1">MSW</div>
                  <div className="text-gray-600 mb-1 text-xs">Master of Social Work</div>
                  <div className="text-xs text-gray-500">Qualified professionals with advanced degrees</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-center">
                  <div className="text-xl font-light text-sage-600 mb-1">AASW</div>
                  <div className="text-gray-600 mb-1 text-xs">Professional Registration</div>
                  <div className="text-xs text-gray-500">Australian Association of Social Workers</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-center">
                  <div className="text-xl font-light text-sage-600 mb-1">SWE</div>
                  <div className="text-gray-600 mb-1 text-xs">Professional Registration</div>
                  <div className="text-xs text-gray-500">Social Work England</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-center">
                  <div className="text-xl font-light text-sage-600 mb-1">ACA</div>
                  <div className="text-gray-600 mb-1 text-xs">Registered Counsellors</div>
                  <div className="text-xs text-gray-500">Australian Counselling Association</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-center">
                  <div className="text-xl font-light text-sage-600 mb-1">NDIS</div>
                  <div className="text-gray-600 mb-1 text-xs">National Disability Insurance Scheme</div>
                  <div className="text-xs text-gray-500">Plan-managed & self-managed support</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-center">
                  <div className="text-xl font-light text-sage-600 mb-1">2</div>
                  <div className="text-gray-600 mb-1 text-xs">Countries Registered</div>
                  <div className="text-xs text-gray-500">Australia & UK</div>
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
