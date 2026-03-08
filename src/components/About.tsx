
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
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">
                    Qualified & Experienced Social Work
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    At Ground Path, we provide person-centred, evidence-based support grounded in the AASW Code of Ethics and best-practice standards.
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
                  <p className="text-gray-600 leading-relaxed text-sm">
                    High-quality services for plan-managed and self-managed participants including counselling and therapeutic support, psychosocial recovery coaching, support coordination, and community participation support. Delivered with trauma-informed, culturally respectful approach.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats/Highlights */}
            <div className="fade-in space-y-4">
              <button 
                onClick={() => setIsMSWOpen(true)}
                className="w-full bg-white h-24 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="flex flex-col items-center justify-center h-full px-4 py-2 space-y-0.5">
                  <div className="text-lg font-light text-sage-600">MSW</div>
                  <div className="text-gray-600 text-xs">Master of Social Work</div>
                  <div className="text-xs text-gray-500 text-center">Qualified professionals with advanced degrees</div>
                </div>
              </button>

               <button 
                 onClick={() => setIsAASWOpen(true)}
                 className="w-full bg-white h-24 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
               >
                 <div className="flex flex-col items-center justify-center h-full px-4 py-2 space-y-0.5">
                   <div className="text-lg font-light text-sage-600">AASW</div>
                   <div className="text-gray-600 text-xs">Professional Registration</div>
                   <div className="text-xs text-gray-500 text-center">Australian Association of Social Workers (AASW)</div>
                 </div>
               </button>

              <button 
                onClick={() => setIsCPDOpen(true)}
                className="w-full bg-white h-24 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="flex flex-col items-center justify-center h-full px-4 py-2 space-y-0.5">
                  <div className="text-lg font-light text-sage-600">CPD</div>
                  <div className="text-gray-600 text-xs">Continuing Professional Development</div>
                  <div className="text-xs text-gray-500 text-center">30+ hours annual training</div>
                </div>
              </button>

               <button 
                 onClick={() => setIsSWEOpen(true)}
                 className="w-full bg-white h-24 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
               >
                 <div className="flex flex-col items-center justify-center h-full px-4 py-2 space-y-0.5">
                   <div className="text-lg font-light text-sage-600">SWE</div>
                   <div className="text-gray-600 text-xs">Professional Registration</div>
                   <div className="text-xs text-gray-500 text-center">Social Work England (SWE)</div>
                 </div>
               </button>

              <button 
                onClick={() => setIsNDISOpen(true)}
                className="w-full bg-white h-24 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="flex flex-col items-center justify-center h-full px-4 py-2 space-y-0.5">
                  <div className="text-lg font-light text-sage-600">NDIS</div>
                  <div className="text-gray-600 text-xs">National Disability Insurance Scheme</div>
                  <div className="text-xs text-gray-500 text-center">Plan-managed & self-managed support</div>
                </div>
              </button>

              <button 
                onClick={() => setIsCountriesOpen(true)}
                className="w-full bg-white h-24 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="flex flex-col items-center justify-center h-full px-4 py-2 space-y-0.5">
                  <div className="text-lg font-light text-sage-600">UK & AUS</div>
                  <div className="text-gray-600 text-xs">Dual Country Registration</div>
                  <div className="text-xs text-gray-500 text-center">Australia & United Kingdom</div>
                </div>
              </button>

               <button 
                onClick={() => setIsProfessionalIndemnityOpen(true)}
                className="w-full bg-white h-24 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="flex flex-col items-center justify-center h-full px-4 py-2 space-y-0.5">
                  <div className="text-lg font-light text-sage-600">Professional Indemnity</div>
                  <div className="text-gray-600 text-xs">Insurance Coverage</div>
                  <div className="text-xs text-gray-500 text-center">Client protection & professional liability</div>
                </div>
              </button>

              <div className="w-full bg-white h-24 rounded-xl shadow-lg border border-gray-100">
                <div className="flex flex-col items-center justify-center h-full px-4 py-2 space-y-0.5">
                  <div className="text-lg font-light text-sage-600">AMHSW</div>
                  <div className="text-gray-600 text-xs">Accredited Mental Health Social Worker</div>
                  <div className="text-xs text-gray-500 text-center">Registration in progress</div>
                </div>
              </div>

              <div className="w-full bg-white h-24 rounded-xl shadow-lg border border-gray-100">
                <div className="flex flex-col items-center justify-center h-full px-4 py-2 space-y-0.5">
                  <div className="text-lg font-light text-sage-600">ACA</div>
                  <div className="text-gray-600 text-xs">Australian Counselling Association</div>
                  <div className="text-xs text-gray-500 text-center">Registration in progress</div>
                </div>
              </div>

              <div className="w-full bg-white h-24 rounded-xl shadow-lg border border-gray-100">
                <div className="flex flex-col items-center justify-center h-full px-4 py-2 space-y-0.5">
                  <div className="text-lg font-light text-sage-600">Qualifications</div>
                  <div className="text-gray-600 text-xs">Academic & Professional</div>
                  <div className="text-xs text-gray-500 text-center">BCom, MSW, GradCert Counselling (in progress)</div>
                </div>
              </div>
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
