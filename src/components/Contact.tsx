
import { useState } from 'react';
import { Mail, Phone, Linkedin, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContactFormSubmission } from '@/hooks/useMailingList';
import { contactFormSchema, checkRateLimit } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import MailingListModal from './MailingListModal';
import HalaxyEmbed from './booking/HalaxyEmbed';
import NativeBookingPanel from './booking/NativeBookingPanel';
import { scrollToSectionWithOffset } from '@/lib/utils';
import { useBookingMode, HALAXY_EXTERNAL_URL } from '@/hooks/useBookingMode';

const HALAXY_EMBED_URL = import.meta.env.VITE_HALAXY_EMBED_URL as string | undefined;

const Contact = () => {
  const { mode: bookingMode } = useBookingMode();
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
      <section id="booking" className="py-20 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="fade-in text-3xl sm:text-4xl font-light text-gray-900 mb-4">
              Book a Session
            </h2>
            <div className="fade-in w-20 h-1 bg-sage-600 mx-auto mb-6"></div>
            <p className="fade-in text-lg text-gray-600 max-w-2xl mx-auto">
              {bookingMode === 'native_beta'
                ? 'Select an available time to request a session. Our native booking system is in early beta.'
                : 'All sessions are currently conducted online via Halaxy Telehealth. Book a time that suits you and receive your meeting link automatically.'}
            </p>
            {bookingMode === 'halaxy' && (
              <div className="fade-in flex justify-center mt-6">
                <a 
                  href={HALAXY_EXTERNAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sage-600 hover:text-sage-700 transition-colors"
                >
                  <img 
                    src="https://cdn.halaxy.com/h/images/logo.png" 
                    alt="Halaxy booking system logo"
                    className="h-6 w-auto"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="text-sm font-medium">Book Online via Halaxy Telehealth</span>
                </a>
              </div>
            )}
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              {bookingMode === 'native_beta' ? (
                <NativeBookingPanel />
              ) : HALAXY_EMBED_URL ? (
                <div className="mb-4">
                  <HalaxyEmbed embedUrl={HALAXY_EMBED_URL} fallbackUrl={HALAXY_EXTERNAL_URL} />
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <button 
                    onClick={() => window.open(HALAXY_EXTERNAL_URL, '_blank')}
                    className="flex-1 bg-sage-600 text-white py-3 px-4 rounded-lg hover:bg-sage-700 transition-colors font-medium"
                    aria-label="Book online session via Halaxy"
                  >
                    Book Online Session
                  </button>
                  <a 
                    href={HALAXY_EXTERNAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 cursor-pointer"
                  >
                    <img 
                      src="https://cdn.halaxy.com/h/images/logo.png" 
                      alt="Halaxy Profile"
                      className="h-10 w-auto hover:opacity-80 transition-opacity cursor-pointer"
                      loading="lazy"
                    />
                  </a>
                </div>
              )}

              <div className="space-y-3">
                <button 
                  onClick={() => setIsMailingListOpen(true)}
                  className="w-full border border-sage-600 text-sage-600 py-3 px-4 rounded-lg hover:bg-sage-50 transition-colors font-medium"
                >
                  Join Mailing List
                </button>
                <button
                  onClick={() => {
                    if (!scrollToSectionWithOffset('practitioners', 96)) {
                      window.location.href = '/#practitioners';
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 border border-sage-600 text-sage-600 py-3 px-4 rounded-lg hover:bg-sage-50 transition-colors font-medium"
                >
                  <MessageCircle className="h-4 w-4" />
                  Send a Secure Message
                </button>
                <p className="text-xs text-gray-500 text-center">Choose a practitioner above to start a secure conversation.</p>
              </div>
            </div>

            {/* Professional Standards */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-4">Professional Standards</h4>
              <div className="space-y-3 text-sm text-gray-600">
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
            <h2 className="fade-in text-3xl sm:text-4xl font-light text-gray-900 mb-4">
              Get in Touch
            </h2>
            <div className="fade-in w-20 h-1 bg-sage-600 mx-auto mb-6"></div>
            <p className="fade-in text-lg text-gray-600 max-w-2xl mx-auto">
              Have a question? Send us a message and we'll get back to you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Information */}
            <div className="fade-in flex flex-col">
              <div className="flex-1">
                <h3 className="text-xl font-medium text-gray-900 mb-6">Contact Information</h3>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-center space-x-4">
                    <Mail className="h-5 w-5 text-sage-600" />
                    <div>
                      <div className="font-medium text-gray-900">Email</div>
                      <a href="mailto:connect@groundpath.com.au" className="text-sage-600 hover:text-sage-700">
                        connect@groundpath.com.au
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Phone className="h-5 w-5 text-sage-600" />
                    <div>
                      <div className="font-medium text-gray-900">Phone</div>
                      <a href="tel:+61410883659" className="text-sage-600 hover:text-sage-700">
                        +61 410 883 659
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Linkedin className="h-5 w-5 text-sage-600" />
                    <div>
                      <div className="font-medium text-gray-900">LinkedIn</div>
                      <a href="https://www.linkedin.com/company/groundpath" target="_blank" rel="noopener noreferrer" className="text-sage-600 hover:text-sage-700">
                        groundpath
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="h-5 w-5 text-sage-600 mt-0.5">📍</div>
                     <div>
                       <div className="font-medium text-gray-900">Service Delivery</div>
                       <div className="text-gray-600">
                         {bookingMode === 'native_beta'
                           ? 'All sessions online via secure video'
                           : 'All sessions online via Halaxy Telehealth'}<br />
                         In-person sessions coming soon (Perth, WA)
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Contact Form */}
          <div className="fade-in">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm flex flex-col">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Send a Message</h3>
              
              <div className="space-y-4 flex-1">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <Select value={formData.subject} onValueChange={handleSelectChange}>
                    <SelectTrigger className="w-full px-4 py-3 h-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <SelectItem value="booking">Booking Enquiry</SelectItem>
                      <SelectItem value="services">Services Information</SelectItem>
                      <SelectItem value="ndis">NDIS Support</SelectItem>
                      <SelectItem value="general">General Enquiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className={`w-full h-full min-h-[100px] px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none ${
                      errors.message ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                  {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={contactFormMutation.isPending}
                className="w-full bg-sage-600 text-white py-3 px-4 rounded-lg hover:bg-sage-700 transition-colors font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
