
import { useState } from 'react';
import { Mail, Phone, Linkedin, MessageCircle, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContactFormSubmission } from '@/hooks/useMailingList';
import { contactFormSchema, checkRateLimit } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import MailingListModal from './MailingListModal';

import { scrollToSectionWithOffset } from '@/lib/utils';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isMailingListOpen, setIsMailingListOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const contactFormMutation = useContactFormSubmission();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Rate limiting check
    const clientIdentifier = `contact_${formData.email}_${Date.now().toString().slice(0, -3)}`;
    if (!checkRateLimit(clientIdentifier, 3, 300000)) { // 3 requests per 5 minutes
      toast({
        title: "Too many requests",
        description: "Please wait a few minutes before submitting again.",
        variant: "destructive"
      });
      return;
    }

    // Validate form data
    try {
      const validatedData = contactFormSchema.parse({
        name: formData.name,
        email: formData.email,
        subject: formData.subject || 'General Enquiry',
        message: formData.message
      });

      await contactFormMutation.mutateAsync({
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
        status: 'new'
      });

      // Reset form on success
      if (!contactFormMutation.error) {
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (error) {
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path[0];
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      toast({
        title: "Validation Error",
        description: "Please check your input and try again.",
        variant: "destructive"
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subject: value
    }));
  };

  return (
    <>
      {/* Booking Section */}
      <section id="booking" className="py-20 bg-muted/40 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="fade-in text-3xl sm:text-4xl font-light text-foreground mb-4">
              Book a Session
            </h2>
            <div className="fade-in w-20 h-1 bg-primary mx-auto mb-6"></div>
            <p className="fade-in text-lg text-muted-foreground max-w-2xl mx-auto">
              Select an available time to request a session through our secure booking system.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-xl p-6 shadow-sm mb-6">
              <div className="py-4 mb-3">
                <p className="text-sm text-muted-foreground mb-3 text-center">Book a session through our secure online booking.</p>
                <button
                  onClick={() => window.location.href = '/book'}
                  className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Book a Session
                </button>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => setIsMailingListOpen(true)}
                  className="w-full border border-primary text-primary py-3 px-4 rounded-lg hover:bg-primary/5 transition-colors font-medium"
                >
                  Join Mailing List
                </button>
                <button
                  onClick={() => {
                    if (!scrollToSectionWithOffset('practitioners', 96)) {
                      window.location.href = '/#practitioners';
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 border border-primary text-primary py-3 px-4 rounded-lg hover:bg-primary/5 transition-colors font-medium"
                >
                  <MessageCircle className="h-4 w-4" />
                  Send a Secure Message
                </button>
                <p className="text-xs text-muted-foreground text-center">Choose a practitioner above to start a secure conversation.</p>
              </div>
            </div>

            {/* Professional Standards */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h4 className="font-medium text-foreground mb-4">Professional Standards</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>✓ Professional indemnity insurance maintained</div>
                <div>✓ Cultural safety principles integrated</div>
                <div>✓ Complaints process available via AASW</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-background scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="fade-in text-3xl sm:text-4xl font-light text-foreground mb-4">
              Get in Touch
            </h2>
            <div className="fade-in w-20 h-1 bg-primary mx-auto mb-6"></div>
            <p className="fade-in text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a question? Send us a message and we'll get back to you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Information */}
            <div className="fade-in flex flex-col">
              <div className="flex-1">
                <h3 className="text-xl font-medium text-foreground mb-6">Contact Information</h3>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-center space-x-4">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">Email</div>
                      <a href="mailto:connect@groundpath.com.au" className="text-primary hover:text-primary">
                        connect@groundpath.com.au
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">Phone</div>
                      <a href="tel:+61410883659" className="text-primary hover:text-primary">
                        +61 410 883 659
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">WhatsApp</div>
                      <a href="https://wa.me/61410883659" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary">
                        +61 410 883 659
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Linkedin className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">LinkedIn</div>
                      <a href="https://www.linkedin.com/company/groundpath" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary">
                        groundpath
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="h-5 w-5 text-primary mt-0.5">📍</div>
                       <div>
                         <div className="font-medium text-foreground">Service Delivery</div>
                         <div className="text-muted-foreground">
                           All sessions online via secure video<br />
                           In-person sessions coming soon (Perth, WA)
                         </div>
                       </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Contact Form */}
          <div className="fade-in">
            <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-sm flex flex-col">
              <h3 className="text-xl font-medium text-foreground mb-6">Send a Message</h3>
              
              <div className="space-y-4 flex-1">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Subject
                  </label>
                  <Select value={formData.subject} onValueChange={handleSelectChange}>
                    <SelectTrigger className="w-full px-4 py-3 h-12 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border rounded-lg shadow-lg z-50">
                      <SelectItem value="booking">Booking Enquiry</SelectItem>
                      <SelectItem value="services">Services Information</SelectItem>
                      <SelectItem value="ndis">NDIS Support</SelectItem>
                      <SelectItem value="general">General Enquiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className={`w-full h-full min-h-[100px] px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                      errors.message ? 'border-red-500' : 'border-border'
                    }`}
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                  {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={contactFormMutation.isPending}
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {contactFormMutation.isPending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
        </div>
      </section>

      <MailingListModal 
        isOpen={isMailingListOpen} 
        onClose={() => setIsMailingListOpen(false)} 
      />
    </>
  );
};

export default Contact;
