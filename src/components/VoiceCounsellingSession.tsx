import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, Globe, CheckCircle2, Heart, Brain, Users, CloudRain, Briefcase, Sparkles, NotebookPen, CalendarCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useConversation } from "@elevenlabs/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import sarahAvatar from "@/assets/counsellor-sarah.jpg";
import jamesAvatar from "@/assets/counsellor-james.jpg";

type VoiceState = "setup" | "connecting" | "connected" | "error" | "idle";
type CounsellorGender = "female" | "male";
type Country = "AU" | "UK" | "OTHER";

interface VoiceCounsellingSessionProps {
  onClose: () => void;
  initialCountry?: Country;
}

interface CounsellorPersona {
  name: string;
  gender: CounsellorGender;
  agentId: string;
  initial: string;
  description: string;
  avatar: string;
}

const COUNSELLORS: CounsellorPersona[] = [
  {
    name: "Sarah",
    gender: "female",
    agentId: "agent_4601kk4rj7shffj8tvr67jecwxvz",
    initial: "S",
    description: "Warm, empathetic counsellor with experience in anxiety and depression support",
    avatar: sarahAvatar,
  },
  {
    name: "James",
    gender: "male",
    agentId: "agent_5001kk4t1016em09c3vxtt4yz0g3",
    initial: "J",
    description: "Calm, supportive counsellor specialising in stress management and wellbeing",
    avatar: jamesAvatar,
  },
];

// Focus topics — pre-frame the session so the counsellor opens with relevant context
const FOCUS_TOPICS: { id: string; label: string; icon: typeof Heart; prompt: string }[] = [
  { id: 'open', label: 'Just talk', icon: Sparkles, prompt: 'The user wants an open, exploratory conversation. Begin by gently asking what is on their mind today.' },
  { id: 'anxiety', label: 'Anxiety', icon: Brain, prompt: 'The user wants to talk about anxiety. Open with warmth and validate that anxiety is common and manageable. Use grounding techniques if helpful.' },
  { id: 'low-mood', label: 'Low mood', icon: CloudRain, prompt: 'The user wants to talk about low mood or sadness. Open with empathy, validate their feelings, and gently explore what has been going on.' },
  { id: 'relationships', label: 'Relationships', icon: Heart, prompt: 'The user wants to talk about a relationship — partner, family, or friend. Open with curiosity and a non-judgemental stance.' },
  { id: 'work-stress', label: 'Work / study', icon: Briefcase, prompt: 'The user wants to talk about work or study stress. Open by asking what is feeling most overwhelming right now.' },
  { id: 'grief', label: 'Grief or loss', icon: Users, prompt: 'The user wants to talk about grief or loss. Open with deep empathy, allow space, and avoid rushing toward solutions.' },
];

// Countries kept for future admin toggle - currently AU only
const COUNTRIES: { value: Country; label: string }[] = [
  { value: "AU", label: "Australia" },
  // { value: "UK", label: "UK" },
  // { value: "OTHER", label: "Global" },
];

const CONNECTION_TIMEOUT_MS = 15_000;
const KEEPALIVE_INTERVAL_MS = 5_000;

const getCountryResources = (country: Country) => {
  if (country === "AU") {
    return "Australian resources: Lifeline 13 11 14, Beyond Blue 1300 22 4636, Emergency 000. Guide users to beyondblue.org.au, headspace.org.au, NDIS ndis.gov.au. IMPORTANT: Always say phone numbers as individual digits, for example say 'one three, one one, one four' not 'thirteen eleven fourteen'.";
  } else if (country === "UK") {
    return "UK resources: Samaritans 116 123, Mind 0300 123 3393, Emergency 999, NHS Mental Health 111 Option 2. Guide users to mind.org.uk, nhs.uk/mental-health. IMPORTANT: Always say phone numbers as individual digits, for example say 'one one six, one two three' not 'one hundred and sixteen, one twenty three'.";
  }
  return "If in crisis, contact your local emergency services. Encourage seeking local mental health support.";
};

const detectCountryFromTimezone = (): Country => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith("Australia/")) return "AU";
    if (tz.startsWith("Europe/London") || tz === "GB") return "UK";
  } catch { /* ignore timezone detection failure */ }
  return "OTHER";
};

const VoiceCounsellingSession = ({ onClose, initialCountry }: VoiceCounsellingSessionProps) => {
  const navigate = useNavigate();
  const [voiceState, setVoiceState] = useState<VoiceState>("setup");
  const [selectedCounsellor, setSelectedCounsellor] = useState<CounsellorPersona | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('open');
  const [country, setCountry] = useState<Country>("AU");
  const [countryOpen, setCountryOpen] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pulseScale, setPulseScale] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionNote, setReflectionNote] = useState("");

  const animFrameRef = useRef<number>(0);
  const sessionStartedRef = useRef(false);
  const mountedRef = useRef(true);
  const wasConnectedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userInitiatedEndRef = useRef(false);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const greetingReceivedRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convRef = useRef<any>(null);
  const contextSentRef = useRef(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptBufferRef = useRef<string[]>([]);

  const focusTopic = FOCUS_TOPICS.find((t) => t.id === selectedTopic) ?? FOCUS_TOPICS[0];

  const counsellorContext = selectedCounsellor
    ? `You are ${selectedCounsellor.name}, a compassionate and professional AI counsellor for groundpath. You provide supportive, non-judgmental mental health guidance. You are NOT a replacement for professional therapy — always recommend professional help for serious concerns. ${getCountryResources(country)} Keep responses conversational and brief (2-4 sentences) for voice. Be warm, use active listening, and validate emotions. If you detect crisis indicators (suicidal ideation, self-harm), immediately provide crisis resources. Never diagnose or prescribe medication. Introduce yourself naturally as ${selectedCounsellor.name} from groundpath. SESSION FOCUS: ${focusTopic.prompt}`
    : "";

  const counsellorContextRef = useRef(counsellorContext);
  counsellorContextRef.current = counsellorContext;

  const clearConnectionTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const clearKeepalive = useCallback(() => {
    if (keepaliveRef.current) {
      clearInterval(keepaliveRef.current);
      keepaliveRef.current = null;
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      if (mountedRef.current) {
        wasConnectedRef.current = true;
        clearConnectionTimeout();
        setVoiceState("connected");
        sessionStartTimeRef.current = Date.now();
        setElapsedSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          if (mountedRef.current && sessionStartTimeRef.current) {
            setElapsedSeconds(Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
          }
        }, 1000);
      }
    },
    onDisconnect: () => {
      if (mountedRef.current) {
        clearConnectionTimeout();
        clearKeepalive();
        if (!wasConnectedRef.current) {
          setVoiceState("error");
          setErrorMessage("Connection failed. Please check your internet and try again.");
          sessionStartedRef.current = false;
        } else if (userInitiatedEndRef.current) {
          setVoiceState("idle");
          sessionStartedRef.current = false;
        } else {
          setVoiceState("error");
          setErrorMessage("Connection lost. Tap to reconnect.");
          sessionStartedRef.current = false;
        }
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMessage: (message: any) => {
      if (message?.type === "user_transcript") {
        const transcript = message?.user_transcription_event?.user_transcript;
        if (transcript) {
          setLastTranscript(transcript);
          transcriptBufferRef.current.push(`You: ${transcript}`);
        }
      } else if (message?.type === "agent_response" || message?.role === "agent") {
        const response = message?.agent_response_event?.agent_response || message?.message;
        if (response) {
          setLastReply(response);
          transcriptBufferRef.current.push(`${selectedCounsellor?.name ?? 'Counsellor'}: ${response}`);
        }

        if (!greetingReceivedRef.current) {
          greetingReceivedRef.current = true;
          setTimeout(() => {
            if (!mountedRef.current) return;
            const conv = convRef.current;
            if (!conv) return;
            try {
              conv.sendContextualUpdate(counsellorContextRef.current);
            } catch { /* ignore non-critical API call failure */ }
            setTimeout(() => {
              if (!mountedRef.current) return;
              try {
                conv.sendUserMessage(`*Now introduce yourself as ${selectedCounsellor?.name} from groundpath, a supportive counselling service.*`);
              } catch { /* ignore non-critical API call failure */ }
            }, 1500);
          }, 3000);
        }
      }
    },
    onError: () => {
      if (mountedRef.current) {
        clearConnectionTimeout();
        clearKeepalive();
        setVoiceState("error");
        setErrorMessage("Connection error. Tap to retry.");
        sessionStartedRef.current = false;
      }
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  convRef.current = conversation;

  useEffect(() => {
    if (voiceState === "connected" && !contextSentRef.current) {
      contextSentRef.current = true;
      keepaliveRef.current = setInterval(() => {
        try { conversation.sendUserActivity(); } catch { /* ignore keepalive failure */ }
      }, KEEPALIVE_INTERVAL_MS);
    }
  }, [voiceState, conversation]);

  // Audio visualisation
  useEffect(() => {
    if (conversation.isSpeaking || voiceState === "connected") {
      let phase = 0;
      const speed = conversation.isSpeaking ? 0.1 : 0.04;
      const intensity = conversation.isSpeaking ? 0.2 : 0.08;
      const tick = () => {
        phase += speed;
        setPulseScale(1 + Math.sin(phase) * intensity + (conversation.isSpeaking ? Math.sin(phase * 2.7) * 0.06 : 0));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } else {
      cancelAnimationFrame(animFrameRef.current);
      setPulseScale(1);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [conversation.isSpeaking, voiceState]);

  // Close country dropdown on outside click
  useEffect(() => {
    if (!countryOpen) return;
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [countryOpen]);

  const startConversation = useCallback(async () => {
    if (sessionStartedRef.current || !selectedCounsellor) return;
    sessionStartedRef.current = true;
    wasConnectedRef.current = false;
    contextSentRef.current = false;
    userInitiatedEndRef.current = false;
    greetingReceivedRef.current = false;
    setVoiceState("connecting");
    setLastTranscript("");
    setLastReply("");
    setErrorMessage("");

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) return;

      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current && !wasConnectedRef.current) {
          setVoiceState("error");
          setErrorMessage("Connection timeout. Please check your network and try again.");
          sessionStartedRef.current = false;
          try { conversation.endSession(); } catch { /* ignore cleanup error */ }
        }
      }, CONNECTION_TIMEOUT_MS);

      console.log("[VoiceSession] Starting session with agent:", selectedCounsellor.agentId);
      
      // Try WebRTC first, fall back to WebSocket if it fails
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (conversation.startSession as any)({
          agentId: selectedCounsellor.agentId,
        });
      } catch (webrtcErr) {
        console.warn("[VoiceSession] Default connection failed, trying websocket:", webrtcErr?.message);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (conversation.startSession as any)({
          agentId: selectedCounsellor.agentId,
          connectionType: "websocket",
        });
      }
    } catch (err) {
      console.error("[VoiceSession] Connection error:", err);
      if (mountedRef.current) {
        clearConnectionTimeout();
        clearKeepalive();
        setVoiceState("error");
        setErrorMessage(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Microphone access is required. Please allow microphone access and try again."
            : `Failed to start session: ${err?.message || "Unknown error"}. Tap to retry.`
        );
        sessionStartedRef.current = false;
      }
    }
  }, [conversation, selectedCounsellor, clearConnectionTimeout, clearKeepalive]);

  const endSession = useCallback(async () => {
    userInitiatedEndRef.current = true;
    clearConnectionTimeout();
    clearKeepalive();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    try { await conversation.endSession(); } catch { /* ignore cleanup error */ }
    // If session had real engagement (>30s), offer reflection screen; otherwise close.
    if (wasConnectedRef.current && elapsedSeconds >= 30) {
      setShowReflection(true);
    } else {
      onClose();
    }
  }, [conversation, onClose, clearConnectionTimeout, clearKeepalive, elapsedSeconds]);

  const saveReflection = useCallback(() => {
    try {
      const key = 'groundpath_ai_reflections';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const entry = {
        id: `r-${Date.now()}`,
        date: new Date().toISOString(),
        counsellor: selectedCounsellor?.name,
        topic: focusTopic.label,
        durationSeconds: elapsedSeconds,
        note: reflectionNote.trim(),
      };
      existing.unshift(entry);
      // Keep last 25 reflections only
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 25)));
    } catch { /* ignore storage failure */ }
  }, [reflectionNote, selectedCounsellor, focusTopic, elapsedSeconds]);

  const retryConnection = useCallback(() => {
    sessionStartedRef.current = false;
    wasConnectedRef.current = false;
    contextSentRef.current = false;
    userInitiatedEndRef.current = false;
    greetingReceivedRef.current = false;
    startConversation();
  }, [startConversation]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearConnectionTimeout();
      clearKeepalive();
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [clearConnectionTimeout, clearKeepalive]);

  // Suppress SDK crash
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      if (err instanceof TypeError && typeof err.message === "string" && err.message.includes("error_event")) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  const handleSelectCounsellor = (counsellor: CounsellorPersona) => {
    setSelectedCounsellor(counsellor);
  };

  const handleStartSession = () => {
    if (selectedCounsellor) {
      startConversation();
    }
  };

  const isListening = voiceState === "connected" && !conversation.isSpeaking;
  const isSpeaking = voiceState === "connected" && conversation.isSpeaking;
  const isActive = isListening || isSpeaking;

  const stateLabel =
    voiceState === "connecting"
      ? `Connecting to ${selectedCounsellor?.name}...`
      : voiceState === "error"
      ? errorMessage
      : voiceState === "idle"
      ? "Session ended"
      : isSpeaking
      ? `${selectedCounsellor?.name} is speaking...`
      : "Listening...";

  const ringColor = isSpeaking
    ? "hsla(125, 30%, 45%, 0.5)"
    : isListening
    ? "hsla(125, 30%, 60%, 0.5)"
    : "hsla(0, 0%, 50%, 0.15)";

  const ringColorFaint = isSpeaking
    ? "hsla(125, 30%, 45%, 0.2)"
    : isListening
    ? "hsla(125, 30%, 60%, 0.2)"
    : "transparent";

  const glowColor = isSpeaking
    ? "hsla(125, 30%, 45%, 0.25)"
    : isListening
    ? "hsla(125, 30%, 60%, 0.25)"
    : "none";

  const selectedCountry = COUNTRIES.find((c) => c.value === country)!;

  // Setup screen - counsellor selection
  if (voiceState === "setup") {
    return createPortal(
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <div className="relative max-w-md w-[calc(100%-2rem)] max-h-[90vh] bg-card border-2 border-border rounded-2xl shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>

          <div className="p-6 pt-8 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">AI Counselling Session</h2>
            <p className="text-muted-foreground text-sm mb-1">
              Choose your counsellor and start a free, confidential voice session.
            </p>
            <p className="text-muted-foreground text-xs italic mb-6">
              This is AI-powered support, not a replacement for professional therapy.
            </p>

            {/* Country selector hidden - AU only for now. Restore COUNTRIES array to re-enable */}

            {/* Counsellor Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {COUNSELLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleSelectCounsellor(c)}
                  className={`p-5 rounded-2xl border-2 transition-all duration-200 text-center group ${
                    selectedCounsellor?.name === c.name
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted/50 active:bg-muted"
                  }`}
                >
                  <div className="relative mx-auto mb-3 w-20 h-20">
                    <Avatar className="h-20 w-20 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                      <AvatarImage src={c.avatar} alt={c.name} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                        {c.initial}
                      </AvatarFallback>
                    </Avatar>
                    {selectedCounsellor?.name === c.name && (
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-foreground font-medium">{c.name}</h3>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{c.description}</p>
                </button>
              ))}
            </div>

            {/* Focus topic chooser */}
            <div className="text-left mb-5">
              <p className="text-xs font-medium text-foreground/80 mb-2 text-center">What would you like to focus on?</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {FOCUS_TOPICS.map((t) => {
                  const Icon = t.icon;
                  const active = selectedTopic === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTopic(t.id)}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                        active
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                      aria-pressed={active}
                    >
                      <Icon className="h-3 w-3" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleStartSession}
              disabled={!selectedCounsellor}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 active:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Start Voice Session
            </button>

            {/* Trust strip */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] text-muted-foreground">
              <div className="flex flex-col items-center gap-0.5"><span className="font-semibold text-foreground/80">Free</span><span>No signup</span></div>
              <div className="flex flex-col items-center gap-0.5"><span className="font-semibold text-foreground/80">Private</span><span>Not recorded</span></div>
              <div className="flex flex-col items-center gap-0.5"><span className="font-semibold text-foreground/80">24/7</span><span>Anytime</span></div>
            </div>

            <p className="text-muted-foreground text-[10px] mt-4 pb-2">
              By starting, you consent to microphone access. Conversations are private and not stored on our servers.
            </p>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Reflection screen — shown after a meaningful session ends
  if (showReflection) {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const handleSaveAndClose = () => { saveReflection(); onClose(); };
    const handleSkip = () => onClose();
    const handleBookHuman = () => { saveReflection(); onClose(); navigate('/book'); };

    return createPortal(
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="relative max-w-md w-[calc(100%-2rem)] max-h-[90vh] bg-card border-2 border-border rounded-2xl shadow-2xl overflow-y-auto">
          <div className="p-6 pt-7 text-center">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <NotebookPen className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Session ended</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {minutes > 0 ? `${minutes} min ${seconds}s` : `${seconds}s`} with {selectedCounsellor?.name} · {focusTopic.label}
            </p>

            <div className="text-left mb-4">
              <label htmlFor="reflection" className="text-xs font-medium text-foreground/80 mb-1.5 block">
                One thing to take with you (optional)
              </label>
              <textarea
                id="reflection"
                value={reflectionNote}
                onChange={(e) => setReflectionNote(e.target.value)}
                placeholder="A thought, feeling, or insight from the conversation…"
                rows={4}
                maxLength={500}
                className="w-full text-sm bg-background border border-border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Saved privately to this device only · {reflectionNote.length}/500</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSaveAndClose}
                disabled={!reflectionNote.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Save reflection
              </button>
              <button
                onClick={handleBookHuman}
                className="w-full py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors inline-flex items-center justify-center gap-2"
              >
                <CalendarCheck className="h-4 w-4" />
                Book a human practitioner
              </button>
              <button
                onClick={handleSkip}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Close without saving
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground italic mt-4">
              If anything came up that feels heavy, please reach out — Lifeline 13 11 14, Beyond Blue 1300 22 4636, or 000 in an emergency.
            </p>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Active voice session screen
  return createPortal(
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center">
      <style>{`
        @keyframes voice-wave-1 {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.18); opacity: 0.15; }
        }
        @keyframes voice-wave-2 {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.32); opacity: 0.08; }
        }
        @keyframes voice-wave-3 {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.48); opacity: 0.03; }
        }
        @keyframes voice-wave-speak-1 {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          25% { transform: scale(1.22); opacity: 0.25; }
          75% { transform: scale(1.12); opacity: 0.35; }
        }
        @keyframes voice-wave-speak-2 {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          33% { transform: scale(1.38); opacity: 0.12; }
          66% { transform: scale(1.28); opacity: 0.2; }
        }
        @keyframes voice-wave-speak-3 {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          40% { transform: scale(1.55); opacity: 0.05; }
          80% { transform: scale(1.42); opacity: 0.1; }
        }
      `}</style>

      <button
        onClick={endSession}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-muted-foreground hover:bg-muted/80 transition-colors text-sm"
      >
        <X className="w-4 h-4" />
        <span>End Session</span>
      </button>

      <p className="text-muted-foreground text-xs mb-2 tracking-wider uppercase">
        AI Counselling
      </p>
      <h2 className="text-foreground text-lg font-medium mb-1">{selectedCounsellor?.name}</h2>
      <p className="text-muted-foreground text-[11px] mb-8">
        groundpath • {country === "AU" ? "Australia" : country === "UK" ? "United Kingdom" : "International"}
      </p>

      {/* Avatar with pulse rings */}
      <div className="relative mb-10" style={{ width: 200, height: 200 }}>
        {isActive && (
          <>
            <div
              className="absolute rounded-full border-2 pointer-events-none"
              style={{
                inset: -8,
                borderColor: ringColor,
                animation: isSpeaking
                  ? "voice-wave-speak-1 1.4s ease-in-out infinite"
                  : "voice-wave-1 2.2s ease-in-out infinite",
              }}
            />
            <div
              className="absolute rounded-full border pointer-events-none"
              style={{
                inset: -18,
                borderColor: ringColorFaint,
                animation: isSpeaking
                  ? "voice-wave-speak-2 1.8s ease-in-out infinite 0.2s"
                  : "voice-wave-2 2.8s ease-in-out infinite 0.3s",
              }}
            />
            <div
              className="absolute rounded-full border pointer-events-none"
              style={{
                inset: -30,
                borderColor: ringColorFaint,
                animation: isSpeaking
                  ? "voice-wave-speak-3 2.2s ease-in-out infinite 0.4s"
                  : "voice-wave-3 3.5s ease-in-out infinite 0.6s",
              }}
            />
          </>
        )}

        <div
          className="absolute inset-0 rounded-full border-2 transition-all duration-200 pointer-events-none"
          style={{ transform: `scale(${pulseScale})`, borderColor: ringColor }}
        />

        <Avatar
          className="h-[200px] w-[200px] border-2 transition-colors duration-300"
          style={{
            borderColor: isListening
              ? "hsl(125, 30%, 60%)"
              : isSpeaking
              ? "hsl(125, 30%, 45%)"
              : "hsl(0, 0%, 70%)",
            boxShadow: isActive ? `0 0 60px ${glowColor}, 0 0 120px ${glowColor}` : "none",
          }}
        >
          <AvatarImage src={selectedCounsellor?.avatar} alt={selectedCounsellor?.name} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-5xl font-semibold">
            {selectedCounsellor?.initial}
          </AvatarFallback>
        </Avatar>

        {voiceState === "connecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {voiceState === "error" && (
          <button
            onClick={retryConnection}
            className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-full cursor-pointer"
          >
            <span className="text-destructive text-xs font-medium">Tap to retry</span>
          </button>
        )}
      </div>

      {/* State label */}
      <p className={`text-sm font-medium mb-2 ${voiceState === "error" ? "text-destructive" : "text-foreground"}`}>
        {stateLabel}
      </p>

      {voiceState === "error" && (
        <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 max-w-sm text-center mb-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Connection blocked?</span> Browser extensions (ad blockers, privacy tools, VPNs) can block voice connections.
            Try <span className="font-medium">Incognito mode</span> or <span className="font-medium">Safari</span> if this persists.
          </p>
        </div>
      )}

      {/* Transcripts */}
      <div className="max-w-md w-full px-6 space-y-2">
        {lastTranscript && (
          <div className="bg-muted/50 border border-border rounded-lg px-4 py-2">
            <p className="text-xs text-muted-foreground mb-0.5">You said:</p>
            <p className="text-sm text-foreground">{lastTranscript}</p>
          </div>
        )}
        {lastReply && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
            <p className="text-xs text-primary mb-0.5">{selectedCounsellor?.name}:</p>
            <p className="text-sm text-foreground">{lastReply}</p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="absolute bottom-6 text-muted-foreground text-[10px] text-center max-w-sm px-4">
        AI counselling support — not a replacement for professional care. If in crisis, contact emergency services immediately.
      </p>
    </div>,
    document.body
  );
};

export default VoiceCounsellingSession;
