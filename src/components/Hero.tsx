
const Hero = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

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
            
            <a 
              href="https://www.mable.com.au" 
              target="_blank" 
              rel="noopener noreferrer"
              className="border-2 border-sage-600 text-sage-600 px-8 py-4 rounded-lg hover:bg-sage-600 hover:text-white transition-all duration-300 font-medium text-lg"
            >
              View on Mable
            </a>
          </div>

          {/* Secondary CTAs */}
          <div className="fade-in mt-8 flex flex-wrap gap-4 justify-center text-sm">
            <button 
              onClick={() => scrollToSection('services')}
              className="text-gray-600 hover:text-sage-600 transition-colors underline underline-offset-4"
            >
              View Services & Rates
            </button>
            <span className="text-gray-300">•</span>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-gray-600 hover:text-sage-600 transition-colors underline underline-offset-4"
            >
              About Paul
            </button>
            <span className="text-gray-300">•</span>
            <button className="text-gray-600 hover:text-sage-600 transition-colors underline underline-offset-4">
              Join Mailing List
            </button>
          </div>
        </div>

        {/* Professional Credentials */}
        <div className="fade-in mt-16 text-center">
          <div className="inline-flex items-center space-x-8 bg-gray-50 px-8 py-4 rounded-lg">
            <span className="text-sm text-gray-600 font-medium">AASW Accredited</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-600 font-medium">NDIS Registered</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-600 font-medium">Fully Insured</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
