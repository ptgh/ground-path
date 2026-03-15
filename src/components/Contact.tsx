
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContactFormSubmission } from '@/hooks/useMailingList';
import { contactFormSchema, checkRateLimit } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import MailingListModal from './MailingListModal';

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
    } catch (error: any) {
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
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
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="fade-in text-3xl sm:text-4xl font-light text-gray-900 mb-4">
            Get in Touch
          </h2>
          <div className="fade-in w-20 h-1 bg-sage-600 mx-auto mb-6"></div>
          <p className="fade-in text-lg text-gray-600 max-w-2xl mx-auto">
            All sessions are currently conducted online via Microsoft Teams. Book below or contact us with any questions.
          </p>
          <div className="fade-in flex justify-center mt-6">
            <a 
              href="https://www.halaxy.com/profile/groundpath/location/1353667"
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
              <span className="text-sm font-medium">Book Online via Microsoft Teams</span>
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
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
                
                <div className="flex items-start space-x-4">
                  <div className="h-5 w-5 text-sage-600 mt-0.5">📍</div>
                   <div>
                     <div className="font-medium text-gray-900">Service Delivery</div>
                     <div className="text-gray-600">
                       All sessions online via Microsoft Teams<br />
                       In-person sessions coming soon (Perth, WA)
                     </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Book an Online Session</h4>
              <p className="text-gray-600 mb-6">
                All sessions are via Microsoft Teams. Book a time that suits you and receive your meeting link automatically.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => window.open('https://www.halaxy.com/profile/groundpath/location/1353667', '_blank')}
                    className="flex-1 bg-sage-600 text-white py-3 px-4 rounded-lg hover:bg-sage-700 transition-colors font-medium"
                    aria-label="Book online session via Halaxy"
                  >
                    Book Online Session
                  </button>
                  <a 
                    href="https://www.halaxy.com/profile/groundpath/location/1353667"
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
                <button 
                  onClick={() => setIsMailingListOpen(true)}
                  className="w-full border border-sage-600 text-sage-600 py-3 px-4 rounded-lg hover:bg-sage-50 transition-colors font-medium"
                >
                  Join Mailing List
                </button>
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

          {/* Contact Form */}
          <div className="fade-in">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm h-full flex flex-col">
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

      <MailingListModal 
        isOpen={isMailingListOpen} 
        onClose={() => setIsMailingListOpen(false)} 
      />
    </section>
  );
};

export default Contact;
