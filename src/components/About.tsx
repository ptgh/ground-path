
import { useState } from 'react';
import MSWModal from './MSWModal';
import ProfessionalIndemnityModal from './ProfessionalIndemnityModal';
import AASWRegistrationModal from './AASWRegistrationModal';
import CPDModal from './CPDModal';
import SWEModal from './SWEModal';
import NDISModal from './NDISModal';
import CountriesModal from './CountriesModal';

const About = () => {
  const [isMSWOpen, setIsMSWOpen] = useState(false);
  const [isProfessionalIndemnityOpen, setIsProfessionalIndemnityOpen] = useState(false);
  const [isAASWOpen, setIsAASWOpen] = useState(false);
  const [isCPDOpen, setIsCPDOpen] = useState(false);
  const [isSWEOpen, setIsSWEOpen] = useState(false);
  const [isNDISOpen, setIsNDISOpen] = useState(false);
  const [isCountriesOpen, setIsCountriesOpen] = useState(false);

  return (
    <section id="about" className="py-20 bg-gray-50">
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
                    Professional Standards & Compliance
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    All team members maintain current professional registration, undertake regular clinical supervision, and meet annual CPD requirements. Cultural safety principles and comprehensive feedback processes ensure the highest standards of ethical practice.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">
                    Service Delivery & Approach
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    We offer flexible service delivery including telehealth consultations and in-person sessions. Our evidence-based therapeutic approaches are trauma-informed and culturally responsive, with quality assurance through regular supervision and client feedback processes to ensure optimal outcomes.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">
                    NDIS Services
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm mb-3">
                    High-quality services for plan-managed and self-managed participants including counselling and therapeutic support, psychosocial recovery coaching, support coordination, and community participation support.
                  </p>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Delivered with trauma-informed, culturally respectful approach.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats/Highlights */}
            <div className="fade-in space-y-5">
              <button 
                onClick={() => setIsMSWOpen(true)}
                className="w-full bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="text-center">
                  <div className="text-lg font-light text-sage-600 mb-1">MSW</div>
                  <div className="text-gray-600 mb-1 text-xs">Master of Social Work</div>
                  <div className="text-xs text-gray-500">Qualified professionals with advanced degrees</div>
                </div>
              </button>

              <button 
                onClick={() => setIsAASWOpen(true)}
                className="w-full bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="text-center">
                  <div className="text-lg font-light text-sage-600 mb-1">AASW</div>
                  <div className="text-gray-600 mb-1 text-xs">Professional Registration</div>
                  <div className="text-xs text-gray-500">Australian Association of Social Workers</div>
                </div>
              </button>

              <button 
                onClick={() => setIsCPDOpen(true)}
                className="w-full bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="text-center">
                  <div className="text-lg font-light text-sage-600 mb-1">CPD</div>
                  <div className="text-gray-600 mb-1 text-xs">Continuing Professional Development</div>
                  <div className="text-xs text-gray-500">30+ hours annual training</div>
                </div>
              </button>

              <button 
                onClick={() => setIsSWEOpen(true)}
                className="w-full bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="text-center">
                  <div className="text-lg font-light text-sage-600 mb-1">SWE</div>
                  <div className="text-gray-600 mb-1 text-xs">Professional Registration</div>
                  <div className="text-xs text-gray-500">Social Work England</div>
                </div>
              </button>

              <button 
                onClick={() => setIsNDISOpen(true)}
                className="w-full bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="text-center">
                  <div className="text-lg font-light text-sage-600 mb-1">NDIS</div>
                  <div className="text-gray-600 mb-1 text-xs">National Disability Insurance Scheme</div>
                  <div className="text-xs text-gray-500">Plan-managed & self-managed support</div>
                </div>
              </button>

              <button 
                onClick={() => setIsCountriesOpen(true)}
                className="w-full bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="text-center">
                  <div className="text-lg font-light text-sage-600 mb-1">UK & AUS</div>
                  <div className="text-gray-600 mb-1 text-xs">Dual Country Registration</div>
                  <div className="text-xs text-gray-500">Australia & United Kingdom</div>
                </div>
              </button>

              <button 
                onClick={() => setIsProfessionalIndemnityOpen(true)}
                className="w-full bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="text-center">
                  <div className="text-lg font-light text-sage-600 mb-1">Professional Indemnity</div>
                  <div className="text-gray-600 mb-1 text-xs">Insurance Coverage</div>
                  <div className="text-xs text-gray-500">Client protection & professional liability</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <MSWModal 
        isOpen={isMSWOpen} 
        onClose={() => setIsMSWOpen(false)} 
      />
      <ProfessionalIndemnityModal 
        isOpen={isProfessionalIndemnityOpen} 
        onClose={() => setIsProfessionalIndemnityOpen(false)} 
      />
      <AASWRegistrationModal 
        isOpen={isAASWOpen} 
        onClose={() => setIsAASWOpen(false)} 
      />
      <CPDModal 
        isOpen={isCPDOpen} 
        onClose={() => setIsCPDOpen(false)} 
      />
      <SWEModal 
        isOpen={isSWEOpen} 
        onClose={() => setIsSWEOpen(false)} 
      />
      <NDISModal 
        isOpen={isNDISOpen} 
        onClose={() => setIsNDISOpen(false)} 
      />
      <CountriesModal 
        isOpen={isCountriesOpen} 
        onClose={() => setIsCountriesOpen(false)} 
      />
    </section>
  );
};

export default About;
