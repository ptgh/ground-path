
import { useState } from 'react';
import { Mail } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with Supabase for form submission
    console.log('Form submitted:', formData);
    alert('Thank you for your message. We\'ll get back to you soon!');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
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
            Ready to start your journey? Contact us to book a session or ask any questions
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="fade-in space-y-8">
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-6">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Mail className="h-5 w-5 text-sage-600" />
                  <div>
                    <div className="font-medium text-gray-900">Email</div>
                    <a href="mailto:enquiries@groundpath.com.au" className="text-sage-600 hover:text-sage-700">
                      enquiries@groundpath.com.au
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="h-5 w-5 text-sage-600 mt-0.5">📍</div>
                  <div>
                    <div className="font-medium text-gray-900">Locations</div>
                    <div className="text-gray-600">
                      Perth-based (in-person sessions)<br />
                      London availability on request<br />
                      Telehealth Australia-wide
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="bg-white rounded-xl p-6 flex flex-col h-full">
              <h4 className="font-medium text-gray-900 mb-4">Quick Booking</h4>
              <p className="text-gray-600 mb-6 flex-grow">
                Ready to book? Use our integrated calendar system or contact us directly.
              </p>
              <div className="space-y-3 mt-auto">
                <button className="w-full bg-sage-600 text-white py-3 px-4 rounded-lg hover:bg-sage-700 transition-colors font-medium">
                  Book via Halaxy Calendar
                </button>
                <a 
                  href="https://www.mable.com.au" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full text-center border-2 border-sage-600 text-sage-600 py-3 px-4 rounded-lg hover:bg-sage-600 hover:text-white transition-colors font-medium"
                >
                  Book via Mable
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="fade-in">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm flex flex-col h-full">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Send a Message</h3>
              
              <div className="space-y-4 flex-grow">
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  />
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="booking">Booking Enquiry</option>
                    <option value="services">Services Information</option>
                    <option value="ndis">NDIS Support</option>
                    <option value="general">General Enquiry</option>
                  </select>
                </div>

                <div className="flex-grow">
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-sage-600 text-white py-3 px-4 rounded-lg hover:bg-sage-700 transition-colors font-medium mt-6"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
