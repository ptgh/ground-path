import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { toast } from 'sonner';
import { messagingService } from '@/services/messagingService';

interface VoiceRecorderProps {
  onRecorded: (blob: Blob, durationMs: number) => void;
  disabled?: boolean;
}

export const VoiceRecorder = ({ onRecorded, disabled }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    // Check browser support first
    const support = messagingService.isVoiceRecordingSupported();
    if (!support.supported) {
      toast.error(support.reason || 'Voice recording is not supported in your browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick a supported MIME type
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            mimeType = 'audio/ogg';
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const durationMs = Date.now() - startTimeRef.current;
        stream.getTracks().forEach(t => t.stop());
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDuration(0);
        onRecorded(blob, durationMs);
      };

      mediaRecorder.onerror = () => {
        stream.getTracks().forEach(t => t.stop());
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRecording(false);
        setDuration(0);
        toast.error('Recording failed. Please try again.');
      };

      mediaRecorder.start();
      setRecording(true);
      intervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        toast.error('Microphone access was denied. Please allow microphone access in your browser settings and try again.');
      } else if (err?.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone and try again.');
      } else {
        toast.error('Could not start recording. Please check your microphone and try again.');
      }
    }
  }, [onRecorded]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-destructive font-medium animate-pulse flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          {formatDuration(duration)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-destructive hover:text-destructive"
          onClick={stopRecording}
          title="Stop recording"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
      onClick={startRecording}
      disabled={disabled}
      title="Record voice note"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
};
