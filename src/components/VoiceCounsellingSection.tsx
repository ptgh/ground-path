import { useState } from 'react';
import { Mic } from 'lucide-react';
import VoiceCounsellingSession from './VoiceCounsellingSession';

const COUNTRY_KEY = 'groundpath_client_country';

const VoiceCounsellingSection = () => {
  const [showSession, setShowSession] = useState(false);

  return (
    <section id="ai-counselling" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Mic className="w-10 h-10 text-primary" />
          </div>
          <h2 className="fade-in text-3xl sm:text-4xl font-light text-gray-900 mb-4">
            Free AI Counselling
          </h2>
          <div className="fade-in w-20 h-1 bg-sage-600 mx-auto mb-6"></div>
          <p className="fade-in text-muted-foreground mb-2">
            Speak with an AI counsellor in a private, supportive voice session.
            Choose between male or female counsellors, with resources tailored to your location.
          </p>
          <p className="fade-in text-muted-foreground text-sm mb-8 italic">
            This is AI-powered support and does not replace professional therapy.
            For professional sessions,{' '}
            <a
              href="https://www.halaxy.com/profile/groundpath/location/1353667"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              book with a practitioner
            </a>.
          </p>

          <button
            onClick={() => setShowSession(true)}
            className="fade-in bg-primary text-primary-foreground px-8 py-4 rounded-xl text-lg font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Voice Session
          </button>

          <div className="fade-in mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-lg">
              <p className="text-gray-900 font-medium text-sm">Free</p>
              <p className="text-gray-600 text-xs">No cost, no signup</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-lg">
              <p className="text-gray-900 font-medium text-sm">Private</p>
              <p className="text-gray-600 text-xs">Not recorded</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-lg">
              <p className="text-gray-900 font-medium text-sm">24/7</p>
              <p className="text-gray-600 text-xs">Available anytime</p>
            </div>
          </div>
        </div>
      </div>

      {showSession && (
        <VoiceCounsellingSession
          onClose={() => setShowSession(false)}
          initialCountry={(localStorage.getItem(COUNTRY_KEY) as 'AU' | 'UK' | 'OTHER') || undefined}
        />
      )}
    </section>
  );
};

export default VoiceCounsellingSection;
