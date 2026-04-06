import { UserCheck, ShieldCheck, CalendarClock, MonitorSmartphone } from 'lucide-react';

const differentiators = [
  {
    icon: UserCheck,
    title: 'Direct Practitioner Access',
    description: 'Connect directly with a qualified practitioner — no marketplace matching or algorithms.',
  },
  {
    icon: ShieldCheck,
    title: 'AASW Registered Social Worker',
    description: 'Qualified AASW registered social worker delivering evidence-based mental health support across Australia.',
  },
  {
    icon: CalendarClock,
    title: 'No Subscriptions or Lock-In',
    description: 'Your sessions, your pace — pay per session with no contracts or recurring fees.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Flexible Delivery',
    description: 'Telehealth via Halaxy Telehealth with in-person options — whatever suits you best.',
  },
];

const HowGroundpathIsDifferent = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            How Groundpath is Different
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mb-4 rounded-full" />
          <p className="text-muted-foreground max-w-xl mx-auto">
            Qualified support from a real practitioner — not a subscription platform.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {differentiators.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowGroundpathIsDifferent;
