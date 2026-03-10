import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VoiceCounsellingSession from "@/components/VoiceCounsellingSession";
import { Mic } from "lucide-react";

const COUNTRY_KEY = 'groundpath_client_country';

const VoiceSessionPage = () => {
  const [showSession, setShowSession] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full text-center">
          <div className="bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Mic className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-4">
            Free Voice Counselling
          </h1>
          <p className="text-muted-foreground mb-2">
            Speak with an AI counsellor in a private, supportive voice session.
            Choose between male or female counsellors, with resources tailored to your location.
          </p>
          <p className="text-muted-foreground text-sm mb-8 italic">
            This is AI-powered support and does not replace professional therapy. 
            For professional sessions, <a href="https://www.halaxy.com/book/lachlan-mcdonald/location/138057" target="_blank" rel="noopener noreferrer" className="text-primary underline">book with a practitioner</a>.
          </p>

          <button
            onClick={() => setShowSession(true)}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-xl text-lg font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Voice Session
          </button>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-foreground font-medium text-sm">Free</p>
              <p className="text-muted-foreground text-xs">No cost, no signup</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-foreground font-medium text-sm">Private</p>
              <p className="text-muted-foreground text-xs">Not recorded</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-foreground font-medium text-sm">24/7</p>
              <p className="text-muted-foreground text-xs">Available anytime</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {showSession && (
        <VoiceCounsellingSession 
          onClose={() => setShowSession(false)} 
          initialCountry={(localStorage.getItem(COUNTRY_KEY) as 'AU' | 'UK' | 'OTHER') || undefined}
        />
      )}
    </div>
  );
};

export default VoiceSessionPage;
