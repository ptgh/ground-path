import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CalendarCheck, Video, MessageSquare, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: CalendarCheck,
    title: 'Book Online',
    description: 'Choose a time that suits you through our secure Halaxy booking system. Available appointments are shown in real-time.',
  },
  {
    icon: MessageSquare,
    title: 'Receive Confirmation',
    description: 'You\'ll receive a confirmation email with your session details and a secure telehealth session link.',
  },
  {
    icon: Video,
    title: 'Join via Halaxy Telehealth',
    description: 'At your scheduled time, click the telehealth link to join your session. No additional software required — it works in your browser.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Confidential',
    description: 'All sessions are encrypted and conducted in a private, secure environment meeting Australian privacy standards.',
  },
];

const HowSessionsWork = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const cards = sectionRef.current.querySelectorAll('.session-step');
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-4">
            How Sessions Work
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All sessions are currently conducted online via Halaxy Telehealth — simple, secure, and accessible from anywhere.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="session-step bg-card rounded-xl p-6 text-center hover:shadow-md transition-shadow duration-300 border border-border/50"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <step.icon className="h-6 w-6" />
              </div>
              <div className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
                Step {index + 1}
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <a
            href="https://www.halaxy.com/profile/groundpath/location/1353667"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg"
          >
            <CalendarCheck className="h-4 w-4" />
            Book an Online Session
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowSessionsWork;
