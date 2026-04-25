
import { useEffect, useState, lazy, Suspense } from 'react';
import Header from '../components/Header';
import CrisisDisclaimer from '../components/CrisisDisclaimer';
import Hero from '../components/Hero';
import SEO from '../components/SEO';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';

// Lazy-load below-the-fold sections to shrink the main bundle
const About = lazy(() => import('../components/About'));
const Services = lazy(() => import('../components/Services'));
const HowSessionsWork = lazy(() => import('../components/HowSessionsWork'));
const HowGroundpathIsDifferent = lazy(() => import('../components/HowGroundpathIsDifferent'));
const VoiceCounsellingSection = lazy(() => import('../components/VoiceCounsellingSection'));
const Newsletter = lazy(() => import('../components/Newsletter'));
const FAQ = lazy(() => import('../components/FAQ'));
const Contact = lazy(() => import('../components/Contact'));
const Footer = lazy(() => import('../components/Footer'));
const PractitionerList = lazy(() =>
  import('../components/PractitionerCard').then((m) => ({ default: m.PractitionerList })),
);
const NewsletterTest = lazy(() => import('../components/NewsletterTest'));
const Button = lazy(() =>
  import('@/components/ui/button').then((m) => ({ default: m.Button })),
);

const SectionFallback = () => (
  <div className="py-12 flex items-center justify-center">
    <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

gsap.registerPlugin(ScrollTrigger);

const Index = () => {
  const [showNewsletterTest, setShowNewsletterTest] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-background">
      <SEO path="/" />
      <CrisisDisclaimer />
      <Header />
      <main>
        <Hero />
        <Suspense fallback={<SectionFallback />}>
          <About />
          <Services />
          <HowGroundpathIsDifferent />
          <HowSessionsWork />
          <VoiceCounsellingSection />
          {/* Our Practitioners */}
          <section id="practitioners" className="py-20 bg-accent/30 scroll-mt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-3">Our Practitioners</h2>
                <div className="w-16 h-1 bg-primary mx-auto mb-4 rounded-full" />
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Connect directly with a qualified mental health professional. Send a message or book an online session.
                </p>
              </div>
              <PractitionerList />
              {/* Book a Session CTA */}
              <div className="text-center mt-10">
                <button
                  onClick={() => navigate('/book')}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg text-base"
                >
                  <CalendarCheck className="h-5 w-5" />
                  Book an Online Session
                </button>
              </div>
            </div>
          </section>
          <FAQ />
          <Newsletter />
          <Contact />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>

      {/* Admin/Test Newsletter Button - Show in development or with special query param */}
      {(import.meta.env.DEV || window.location.search.includes('admin=true')) && (
        <div className="fixed bottom-20 right-4">
          <Suspense fallback={null}>
            <Button
              onClick={() => setShowNewsletterTest(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              size="sm"
            >
              Test Newsletter
            </Button>
          </Suspense>
        </div>
      )}

      <Suspense fallback={null}>
        <NewsletterTest
          isOpen={showNewsletterTest}
          onClose={() => setShowNewsletterTest(false)}
        />
      </Suspense>
    </div>
  );
};

export default Index;
