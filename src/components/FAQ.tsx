import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface QA { q: string; a: string; }
interface Group { title: string; items: QA[]; }

const groups: Group[] = [
  {
    title: 'Fees & Rates',
    items: [
      {
        q: 'How much does a session cost?',
        a: 'Standard sessions are 50 minutes. Each practitioner sets their own rate, which is shown clearly before you book. Indicative range is shown on the homepage and on each practitioner\'s profile. 30, 45 and 60 minute sessions are also available where the practitioner offers them.',
      },
      {
        q: 'When am I charged?',
        a: 'You add a card when you book — nothing is charged at that point. Your practitioner charges the session fee only after the appointment has taken place.',
      },
      {
        q: 'What is included in the rate?',
        a: 'A 50-minute video session, the practitioner\'s preparation time, secure documentation, and any short follow-up message they send through the platform.',
      },
      {
        q: 'Can I get a refund if I cancel?',
        a: 'Cancellations more than 24 hours before the session are free of charge. Late cancellations or no-shows may be charged at the practitioner\'s discretion. Contact your practitioner directly through Messages if circumstances change.',
      },
    ],
  },
  {
    title: 'NDIS',
    items: [
      {
        q: 'Do you accept NDIS participants?',
        a: 'Yes — Self-managed and Plan-managed NDIS participants are welcome. Agency-managed participants are subject to NDIS price caps; talk to your practitioner before booking.',
      },
      {
        q: 'What can NDIS funding cover here?',
        a: 'Psychosocial Recovery Coaching, Counselling, and Capacity Building supports delivered by Mental Health Social Workers — depending on your plan goals and supports.',
      },
      {
        q: 'How does invoicing work for NDIS?',
        a: 'Your practitioner will issue an itemised invoice after each session, with line items aligned to NDIS support categories. Plan managers can pay these directly.',
      },
    ],
  },
  {
    title: 'Medicare & Private Health',
    items: [
      {
        q: 'Can I claim through Medicare?',
        a: 'Medicare rebates require an Accredited Mental Health Social Worker (AMHSW) and a Mental Health Care Plan from your GP. AMHSW services are coming soon — until then, sessions are private-pay.',
      },
      {
        q: 'Do private health funds rebate counselling?',
        a: 'Some funds rebate registered counsellor or social worker sessions under their extras cover. Check with your fund for specifics. We provide receipts that include the practitioner\'s registration details.',
      },
    ],
  },
  {
    title: 'Sessions & Practitioners',
    items: [
      {
        q: 'How do online sessions work?',
        a: 'Sessions are delivered over a secure Microsoft Teams video link. You\'ll get the link 24 hours before your appointment via email and in your dashboard.',
      },
      {
        q: 'How do I choose the right practitioner?',
        a: 'Browse Our Practitioners on the homepage or visit /book. Each profile shows their qualifications, registrations, specialisations, and upcoming availability. You can also send a message before booking.',
      },
      {
        q: 'Can I reschedule?',
        a: 'Yes — message your practitioner directly through the platform. They\'ll work with you to find a time that fits.',
      },
      {
        q: 'What if I need a different practitioner?',
        a: 'You can book with any practitioner on the directory. There\'s no commitment to stay with one — your wellbeing comes first.',
      },
    ],
  },
  {
    title: 'Privacy & Crisis Support',
    items: [
      {
        q: 'How is my information protected?',
        a: 'All communication is encrypted in transit and at rest. Practitioners follow Australian privacy law and AASW/ACA ethical codes. Notes are visible only to your practitioner unless you specifically request a release.',
      },
      {
        q: 'What if I\'m in crisis right now?',
        a: 'groundpath is not a crisis service. If you are in immediate danger, call 000. For 24/7 support: Lifeline 13 11 14, Beyond Blue 1300 22 4636, 13YARN 13 92 76, or text 0477 13 11 14.',
      },
      {
        q: 'Are practitioners mandatory reporters?',
        a: 'Yes. Practitioners must report disclosures involving immediate harm to a child or to yourself. They will explain confidentiality and its limits at your first session.',
      },
    ],
  },
];

const FAQ = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const items = sectionRef.current.querySelectorAll('.faq-fade');
    if (items.length === 0) return;
    gsap.fromTo(
      items,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      },
    );
  }, []);

  // Build FAQPage JSON-LD for SEO.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: groups.flatMap((g) =>
      g.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    ),
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="py-20 bg-background scroll-mt-20"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-3">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <h2 id="faq-heading" className="text-3xl sm:text-4xl font-light text-foreground mb-3">
            Frequently asked
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you might want to know before your first session — fees, NDIS, privacy and more.
          </p>
        </div>

        <Accordion type="multiple" className="space-y-3">
          {groups.map((group) => (
            <AccordionItem
              key={group.title}
              value={group.title}
              className="faq-fade rounded-xl border border-border/60 bg-card px-4"
            >
              <AccordionTrigger className="text-left text-sm font-medium uppercase tracking-wide text-primary/80 hover:no-underline py-4">
                {group.title}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <Accordion type="single" collapsible className="divide-y divide-border/60">
                  {group.items.map((item, idx) => (
                    <AccordionItem
                      key={item.q}
                      value={`${group.title}-${idx}`}
                      className="border-0"
                    >
                      <AccordionTrigger className="text-left text-sm sm:text-base font-medium text-foreground hover:no-underline py-3">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-3">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="text-xs text-muted-foreground/70 text-center mt-8">
          Have a question we haven&apos;t answered? <a href="#contact" className="text-primary underline">Send us a message</a> — we usually reply within one business day.
        </p>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
};

export default FAQ;
