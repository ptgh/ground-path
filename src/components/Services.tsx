import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToSectionWithOffset } from '@/lib/utils';
import { useBookingMode } from '@/hooks/useBookingMode';

gsap.registerPlugin(ScrollTrigger);

const Services = () => {
  const { mode: bookingMode } = useBookingMode();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const cards = sectionRef.current.querySelectorAll('.service-card');
    if (cards.length > 0) {
      gsap.fromTo(cards,
        { opacity: 0, y: 30, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.6, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );
    }

    const bookable = sectionRef.current.querySelectorAll('.service-card-bookable');
    bookable.forEach((card) => {
      const enter = () => gsap.to(card, { scale: 1.02, y: -4, duration: 0.3, ease: 'power2.out' });
      const leave = () => gsap.to(card, { scale: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
    });
  }, []);
  const videoLabel = bookingMode === 'native_beta' ? 'Online via Secure Video' : 'Online via Halaxy Telehealth';
  const services = [
    {
      name: "Mental Health Support",
      format: videoLabel,
      rate: "$100",
      description: `Social Worker providing professional support via secure ${bookingMode === 'native_beta' ? 'video' : 'Halaxy Telehealth video'} calls`
    },
    {
      name: "Psychosocial Recovery Coaching",
      format: videoLabel,
      rate: "$100",
      description: "NDIS-funded support for psychosocial recovery and daily living skills — delivered online",
      ndis: true
    },
    {
      name: "Accredited Mental Health Social Worker (AMHSW)",
      format: videoLabel,
      rate: "$100",
      description: "AMHSW registration currently in progress — service coming soon",
      comingSoon: true
    },
    {
      name: "Counselling Support",
      format: videoLabel,
      rate: "$100",
      description: "Professional counselling sessions delivered by qualified social workers — ACA Registered"
    },
    {
      name: "In-Person Support",
      format: "Perth, WA",
      rate: "$100",
      description: `Face-to-face sessions coming soon — currently all sessions are conducted online via ${bookingMode === 'native_beta' ? 'secure video' : 'Halaxy Telehealth'}`,
      comingSoon: true
    }
  ];

  return (
    <section id="services" ref={sectionRef} className="py-20 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="fade-in text-3xl sm:text-4xl font-light text-gray-900 mb-4">
            Services & Rates
          </h2>
          <div className="fade-in w-20 h-1 bg-sage-600 mx-auto mb-6"></div>
          <p className="fade-in text-lg text-gray-600 max-w-2xl mx-auto">
            Professional, affordable mental health and social work services tailored to your needs
          </p>
        </div>

        {/* Services Grid */}
         <div className="grid md:grid-cols-2 gap-6 mb-12">
          {services.map((service, index) => {
            const isBookable = !service.comingSoon;
            const CardTag = isBookable ? 'a' : 'div';
            const cardProps = isBookable ? {
              href: "#booking",
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                scrollToSectionWithOffset('booking', 96);
              },
            } : {};
            return (
            <CardTag key={index} {...cardProps} className={`service-card ${isBookable ? 'service-card-bookable' : ''} bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300 block ${service.comingSoon ? 'opacity-75' : 'cursor-pointer'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-medium text-gray-900">{service.name}</h3>
                </div>
                <div className="flex gap-2">
                  {service.comingSoon && (
                    <span className="bg-sage-50 text-sage-600 border border-sage-200 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase whitespace-nowrap">
                      Coming Soon
                    </span>
                  )}
                  {service.ndis && (
                    <span className="bg-sage-100 text-sage-700 px-3 py-1 rounded-full text-sm font-medium">
                      NDIS
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium text-gray-900">{service.format}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate (AUD):</span>
                  <span className="font-medium text-sage-600 text-lg">{service.rate}</span>
                </div>
                
                <p className="text-gray-600 text-sm mt-4 pt-4 border-t border-gray-200">
                  {service.description}
                </p>
              </div>
            </CardTag>
          );
          })}
        </div>

        {/* Important Notes */}
        <div className="fade-in bg-sage-50 rounded-xl p-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Important Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-sage-700 mb-2">✅ NDIS Accepted</h4>
              <p className="text-gray-600 text-sm">
                Plan-managed and Self-managed NDIS participants welcome
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">❌ Medicare Billing</h4>
              <p className="text-gray-600 text-sm">
                Medicare billing not yet available - private rates apply
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
