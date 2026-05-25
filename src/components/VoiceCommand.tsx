import { Mic, MicOff, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Make typescript happy for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceCommandProps {
  onCommand: (command: string) => void;
}

export function VoiceCommand({ onCommand }: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onCommand(transcript.toLowerCase());
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
           setError("Izin mikrofon ditolak");
        } else {
           setError("Kesalahan pengenalan suara");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setError("Browser tidak mendukung Voice API");
    }
  }, [onCommand]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Error starting recognition", err);
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl flex items-center justify-between gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)] w-full">
      <div className="flex items-center gap-6">
        <button
          onClick={toggleListening}
          className="relative group transition-all active:scale-95 cursor-pointer border-none bg-transparent p-0 m-0"
        >
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
            isListening 
              ? "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]" 
              : "bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]"
          )}>
            {isListening ? <Mic className="w-8 h-8 text-white" /> : <MicOff className="w-8 h-8 text-white" />}
          </div>
          {isListening && (
            <div className={cn(
              "absolute -inset-2 border rounded-full animate-ping opacity-20",
              isListening ? "border-rose-500/50" : "border-indigo-500/50"
            )}></div>
          )}
        </button>
        <div>
          <h3 className={cn(
            "text-xs font-bold uppercase tracking-widest mb-1",
            isListening ? "text-rose-300" : "text-indigo-300"
          )}>
            Voice Assistant
          </h3>
          <p className="text-sm text-slate-300 font-medium italic">
            {isListening ? '"Mendengarkan..."' : '"Nyalakan Lampu Teras"'}
          </p>
          <div className="mt-2 flex gap-1 items-center h-2">
            {isListening ? (
              <>
                <div className="h-1 w-2 bg-rose-400 rounded-full animate-pulse"></div>
                <div className="h-2 w-2 bg-rose-400 rounded-full animate-pulse delay-75"></div>
                <div className="h-1 w-2 bg-rose-400 rounded-full animate-pulse delay-150"></div>
              </>
            ) : (
              <>
                <div className="h-1 w-2 bg-indigo-400 rounded-full opacity-30"></div>
                <div className="h-1 w-4 bg-indigo-400 rounded-full opacity-60"></div>
                <div className="h-1 w-2 bg-indigo-400 rounded-full opacity-30"></div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-1 text-rose-500 text-xs bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
          <AlertCircle className="w-3 h-3" />
          <span className="font-medium tracking-wide uppercase text-[10px]">{error}</span>
        </div>
      )}
    </div>
  );
}
