import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import MailingListModal from './MailingListModal';

const Hero = () => {
  const [isMailingListOpen, setIsMailingListOpen] = useState(false);
  const ctaButtonsRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (ctaButtonsRef.current) {
      const buttons = ctaButtonsRef.current.querySelectorAll('.secondary-cta');
      
      buttons.forEach((button) => {
        const handleMouseEnter = () => {
          gsap.to(button, {
            scale: 1.05,
            y: -2,
            duration: 0.3,
            ease: "power2.out"
          });
        };
        
        const handleMouseLeave = () => {
          gsap.to(button, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        };
        
        button.addEventListener('mouseenter', handleMouseEnter);
        button.addEventListener('mouseleave', handleMouseLeave);
        
        return () => {
          button.removeEventListener('mouseenter', handleMouseEnter);
          button.removeEventListener('mouseleave', handleMouseLeave);
        };
      });
    }
  }, []);

  return (
    <section id="home" className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="fade-in text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-tight">
            Support Grounded in{' '}
            <span className="text-sage-600 font-normal">Care</span>
          </h1>
          
          {/* Subheading */}
          <p className="fade-in text-xl sm:text-2xl text-gray-600 mb-12 font-light leading-relaxed">
            AASW Social Work & Mental Health Support — Online & In-Person
          </p>

          {/* CTA Buttons */}
          <div className="fade-in flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => scrollToSection('contact')}
              className="bg-sage-600 text-white px-8 py-4 rounded-lg hover:bg-sage-700 transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Book a Session
            </button>
          </div>

          {/* Secondary CTAs */}
          <div ref={ctaButtonsRef} className="fade-in mt-8 flex flex-wrap gap-4 justify-center">
            <button 
              onClick={() => scrollToSection('services')}
              className="secondary-cta bg-sage-600 text-white px-6 py-3 rounded-lg hover:bg-sage-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              View Services & Rates
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="secondary-cta bg-sage-600 text-white px-6 py-3 rounded-lg hover:bg-sage-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              About
            </button>
            <button 
              onClick={() => setIsMailingListOpen(true)}
              className="secondary-cta bg-sage-600 text-white px-6 py-3 rounded-lg hover:bg-sage-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Join Mailing List
            </button>
          </div>
        </div>

        {/* Professional Credentials */}
        <div className="fade-in mt-16 text-center">
          <div className="inline-flex items-center space-x-8 bg-gray-50 px-8 py-4 rounded-lg">
            <span className="text-sm text-gray-600 font-medium">AASW Accredited Mental Health Social Worker</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-600 font-medium">NDIS Services</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-600 font-medium">Professional Indemnity Insurance</span>
          </div>
        </div>
      </div>

      <MailingListModal 
        isOpen={isMailingListOpen} 
        onClose={() => setIsMailingListOpen(false)} 
      />
    </section>
  );
};

export default Hero;