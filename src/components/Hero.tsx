import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Mic } from 'lucide-react';
import MailingListModal from './MailingListModal';

const Hero = () => {
  const [isMailingListOpen, setIsMailingListOpen] = useState(false);
  const ctaButtonsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (ctaButtonsRef.current) {
      const buttons = ctaButtonsRef.current.querySelectorAll('.hero-cta');
      
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
            Social Work, Counselling & Mental Health Support — Online & In-Person
          </p>

          {/* CTA Buttons */}
          <div ref={ctaButtonsRef} className="fade-in flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center items-center max-w-2xl mx-auto">
            <button 
              onClick={() => scrollToSection('contact')}
              className="hero-cta bg-primary text-primary-foreground px-4 sm:px-6 py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto min-w-[140px]"
            >
              Book a Session
            </button>
            <button 
              onClick={() => scrollToSection('services')}
              className="hero-cta bg-sage-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-sage-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto min-w-[140px]"
            >
              View Services & Rates
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="hero-cta bg-sage-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-sage-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto min-w-[140px]"
            >
              About
            </button>
            <button 
              onClick={() => setIsMailingListOpen(true)}
              className="hero-cta bg-sage-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-sage-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto min-w-[140px]"
            >
              Join Mailing List
            </button>
            <button 
              onClick={() => navigate('/voice-session')}
              className="hero-cta bg-primary text-primary-foreground px-4 sm:px-6 py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto min-w-[140px] flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Voice Counselling
            </button>
          </div>
        </div>

        {/* Professional Credentials */}
        <div className="fade-in mt-12 sm:mt-16 text-center">
          <div className="inline-flex flex-col lg:flex-row items-center lg:space-x-4 space-y-2 lg:space-y-0 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg max-w-4xl mx-auto">
            <span className="text-xs sm:text-sm text-gray-600 font-medium text-center">Accredited Social Workers</span>
            <span className="text-gray-300 hidden lg:inline">•</span>
            <span className="text-xs sm:text-sm text-gray-600 font-medium text-center">NDIS Services</span>
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