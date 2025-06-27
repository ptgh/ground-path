
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
                  With qualified experienced staff and Master of Social Work degrees, we provide expertise in mental health support, NDIS services, and child protection. Our approach is grounded in care, respect, and evidence-based practice.
                </p>
              </div>

              <div className="fade-in">
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Ongoing Professional Development
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Currently completing Graduate Certificate in Counselling at Monash University, our workers are committed to expanding their skills to better serve our clients' diverse needs.
                </p>
              </div>

              <div className="fade-in">
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Professional Credentials
                </h3>
                <ul className="text-gray-600 space-y-3">
                  <li>• Accredited by AASW (Australian Association of Social Workers)</li>
                  <li>• Registered with Social Work England</li>
                  <li>• Fully insured professional practice</li>
                  <li>• NDIS-screened provider</li>
                  <li>• Working with Children Check certified</li>
                </ul>
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
                  <div className="text-3xl font-light text-sage-600 mb-2">100%</div>
                  <div className="text-gray-600">NDIS & Professional Screening</div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="text-center">
                  <div className="text-3xl font-light text-sage-600 mb-2">2</div>
                  <div className="text-gray-600">Countries Registered</div>
                  <div className="text-sm text-gray-500 mt-1">Australia & UK</div>
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
