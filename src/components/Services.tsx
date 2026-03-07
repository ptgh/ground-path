
const Services = () => {
  const services = [
    {
      name: "Mental Health Support",
      format: "Telehealth (50 mins)",
      rate: "$120",
      description: "Social Worker providing professional support via secure video calls"
    },
    {
      name: "Psychosocial Recovery Coaching",
      format: "Telehealth or In-person",
      rate: "$100",
      description: "NDIS-funded support for psychosocial recovery and daily living skills",
      ndis: true
    },
    {
      name: "ACA Counselling Support",
      format: "Telehealth (50 mins)",
      rate: "$80",
      description: "Coming soon - ACA registration in progress",
      comingSoon: true
    },
    {
      name: "In-Person Support",
      format: "60 minutes",
      rate: "$110-130",
      description: "Face-to-face sessions in Perth, with London availability on request"
    }
  ];

  return (
    <section id="services" className="py-20 bg-white">
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
          {services.map((service, index) => (
            <div key={index} className={`fade-in bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300 ${service.comingSoon ? 'opacity-75' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-medium text-gray-900">{service.name}</h3>
                </div>
                <div className="flex gap-2">
                  {service.comingSoon && (
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
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
            </div>
          ))}
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
