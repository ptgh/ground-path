import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToSectionWithOffset } from '@/lib/utils';
import { useBookingMode } from '@/hooks/useBookingMode';
import { supabase } from '@/integrations/supabase/client';

gsap.registerPlugin(ScrollTrigger);

interface RateRange {
  min_cents: number;
  max_cents: number;
  practitioner_count: number;
}

const formatRateLabel = (range: RateRange | null): string => {
  if (!range || !range.min_cents || range.practitioner_count === 0) {
    return 'From $100 / 50 min';
  }
  const min = Math.round(range.min_cents / 100);
  const max = Math.round(range.max_cents / 100);
  if (min === max) return `From $${min} / 50 min`;
  return `$${min}–$${max} / 50 min`;
};

const Services = () => {
  const { mode: bookingMode } = useBookingMode();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [rateRange, setRateRange] = useState<RateRange | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('get_practitioner_rate_range', { p_duration: 50 });
      if (cancelled || error) return;
      const row = (data as RateRange[] | null)?.[0];
      if (row && row.min_cents) setRateRange(row);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
  const rateLabel = formatRateLabel(rateRange);
  const services = [
    {
      name: "Mental Health Support",
      format: videoLabel,
      description: `Social Worker providing professional support via secure ${bookingMode === 'native_beta' ? 'video' : 'Halaxy Telehealth video'} calls`
    },
    {
      name: "Psychosocial Recovery Coaching",
      format: videoLabel,
      description: "NDIS-funded support for psychosocial recovery and daily living skills — delivered online",
      ndis: true
    },
    {
      name: "Accredited Mental Health Social Worker (AMHSW)",
      format: videoLabel,
      description: "AMHSW registration currently in progress — service coming soon",
      comingSoon: true
    },
    {
      name: "Counselling Support",
      format: videoLabel,
      description: "Professional counselling sessions delivered by qualified social workers — ACA Registered"
    },
    {
      name: "In-Person Support",
      format: "Perth, WA",
      formatLabel: "Location",
      description: `Face-to-face sessions coming soon — currently all sessions are conducted online via ${bookingMode === 'native_beta' ? 'secure video' : 'Halaxy Telehealth'}`,
      comingSoon: true
    }
  ];

  return (
    <section id="services" ref={sectionRef} className="py-20 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="fade-in text-3xl sm:text-4xl font-light text-foreground mb-4">
            Services & Rates
          </h2>
          <div className="fade-in w-20 h-1 bg-primary mx-auto mb-6"></div>
          <p className="fade-in text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional, affordable mental health and social work services tailored to your needs
          </p>
        </div>

        {/* Dynamic rate banner */}
        <div className="fade-in mx-auto mb-10 max-w-xl text-center rounded-xl border border-primary/20 bg-primary/5 px-6 py-5">
          <p className="text-xs uppercase tracking-wide text-primary/80 font-medium mb-1">Standard rate</p>
          <p className="text-2xl sm:text-3xl font-light text-foreground">{rateLabel}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Each practitioner sets their own fee. 30, 45 and 60-minute sessions also available where offered. Final rate is confirmed before your session.
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
            <CardTag key={index} {...cardProps} className={`service-card ${isBookable ? 'service-card-bookable' : ''} bg-muted/40 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300 block ${service.comingSoon ? 'opacity-75' : 'cursor-pointer'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-medium text-foreground">{service.name}</h3>
                </div>
                <div className="flex gap-2">
                  {service.comingSoon && (
                    <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase whitespace-nowrap">
                      Coming Soon
                    </span>
                  )}
                  {service.ndis && (
                    <span className="bg-primary/15 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      NDIS
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-medium text-foreground">{service.format}</span>
                </div>

                <p className="text-muted-foreground text-sm mt-4 pt-4 border-t border-border">
                  {service.description}
                </p>
              </div>
            </CardTag>
          );
          })}
        </div>

        {/* Important Notes */}
        <div className="fade-in bg-primary/5 rounded-xl p-8">
          <h3 className="text-lg font-medium text-foreground mb-4">Important Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-primary mb-2">✅ NDIS Accepted</h4>
              <p className="text-muted-foreground text-sm">
                Plan-managed and Self-managed NDIS participants welcome
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">❌ Medicare Billing</h4>
              <p className="text-muted-foreground text-sm">
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
