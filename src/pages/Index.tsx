
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import HowSessionsWork from '../components/HowSessionsWork';
import VoiceCounsellingSection from '../components/VoiceCounsellingSection';
import Newsletter from '../components/Newsletter';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import { AIAssistant } from '../components/AIAssistant';
import NewsletterTest from '../components/NewsletterTest';
import { Button } from '@/components/ui/button';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Index = () => {
  const [showNewsletterTest, setShowNewsletterTest] = useState(false);

  useEffect(() => {
    // Initialize GSAP animations with better targeting
    const fadeElements = document.querySelectorAll('.fade-in');
    if (fadeElements.length > 0) {
      gsap.fromTo(fadeElements, 
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.2,
          scrollTrigger: {
            trigger: fadeElements[0],
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }

    // Logo animation with better targeting
    const logoElements = document.querySelectorAll('.logo-animate');
    if (logoElements.length > 0) {
      gsap.fromTo(logoElements,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 1, delay: 0.3 }
      );
    }

    // Secondary CTA buttons animation with better targeting
    const ctaElements = document.querySelectorAll('.secondary-cta');
    if (ctaElements.length > 0) {
      gsap.fromTo(ctaElements,
        { opacity: 0, y: 10 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.1,
          delay: 1.2,
          ease: "power2.out"
        }
      );
    }

    // Prevent scroll restoration on page load (fixes mobile scroll-to-top issue)
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <HowSessionsWork />
        <VoiceCounsellingSection />
        <Newsletter />
        <Contact />
      </main>
      <Footer />
      <AIAssistant />
      
      {/* Admin/Test Newsletter Button - Show in development or with special query param */}
      {(process.env.NODE_ENV === 'development' || window.location.search.includes('admin=true')) && (
        <div className="fixed bottom-20 right-4">
          <Button
            onClick={() => setShowNewsletterTest(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            size="sm"
          >
            Test Newsletter
          </Button>
        </div>
      )}
      
      <NewsletterTest 
        isOpen={showNewsletterTest} 
        onClose={() => setShowNewsletterTest(false)} 
      />
    </div>
  );
};

export default Index;
