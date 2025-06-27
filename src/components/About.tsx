
const About = () => {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="fade-in text-3xl sm:text-4xl font-light text-gray-900 mb-4">
              About Paul Habermann
            </h2>
            <div className="fade-in w-20 h-1 bg-sage-600 mx-auto"></div>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6">
              <div className="fade-in">
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Qualified & Experienced Social Worker
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  With over 5 years of qualified experience as a social worker, I bring expertise in mental health support, NDIS services, and child protection. My approach is grounded in care, respect, and evidence-based practice.
                </p>
              </div>

              <div className="fade-in">
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Ongoing Professional Development
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Currently completing my Graduate Certificate in Counselling at Monash University, I'm committed to expanding my skills to better serve my clients' diverse needs.
                </p>
              </div>

              <div className="fade-in">
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Professional Credentials
                </h3>
                <ul className="text-gray-600 space-y-2">
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
                  <div className="text-3xl font-light text-sage-600 mb-2">5+</div>
                  <div className="text-gray-600">Years Qualified Experience</div>
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
