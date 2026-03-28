'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface AudioBraindumpProps {
  onTranscript: (text: string) => void;
}

export default function AudioBraindump({ onTranscript }: AudioBraindumpProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript.trim());
      } else {
        setTranscript(interimTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  // Spacebar hold-to-talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body && !isListening) {
        e.preventDefault();
        startListening();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body && isListening) {
        e.preventDefault();
        stopListening();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isListening]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      // Already started
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);

    // Commit transcript as task
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript('');
    }
  }, [transcript, onTranscript]);

  if (!supported) return null;

  return (
    <>
      {/* Mic button — floating frosted glass */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={isListening ? stopListening : startListening}
        className={`fixed bottom-8 left-8 w-12 h-12 rounded-full flex items-center justify-center z-40 backdrop-blur-xl border transition-all ${
          isListening
            ? 'bg-red-500/20 border-red-400/40 shadow-[0_0_20px_rgba(255,100,100,0.3)]'
            : 'bg-white/10 border-[var(--color-border)] hover:bg-white/20 shadow-lg'
        }`}
      >
        {isListening ? (
          <MicOff className="w-5 h-5 text-red-400" />
        ) : (
          <Mic className="w-5 h-5 text-[var(--color-gold)]" />
        )}

        {/* Pulsing ring when active */}
        {isListening && (
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full border-2 border-red-400/40"
          />
        )}
      </motion.button>

      {/* Live transcript overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-8 right-8 max-w-md z-40"
          >
            <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-[var(--color-gold)]/30 px-5 py-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-3 h-3 text-[var(--color-gold)] animate-spin" />
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] font-semibold">
                  Listening...
                </span>
              </div>
              <p className="text-white text-sm leading-relaxed min-h-[20px]">
                {transcript || (
                  <span className="text-white/40 italic">Speak your task...</span>
                )}
              </p>
              <p className="text-[10px] text-white/30 mt-2">
                Hold spacebar · Tap mic to stop
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
