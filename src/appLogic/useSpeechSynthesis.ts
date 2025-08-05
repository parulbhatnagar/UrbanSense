// Custom hook for speech synthesis logic
import { useCallback } from 'react';

const useSpeechSynthesis = () => {
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window) || !window.speechSynthesis) {
      console.warn("Speech Synthesis not supported.");
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }
    const utterance = new window.SpeechSynthesisUtterance(text);
    const handleSpeechEnd = () => {
      utterance.onend = null;
      utterance.onerror = null;
      onEnd?.();
    };
    utterance.onend = handleSpeechEnd;
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if ((event as any).error !== 'interrupted') {
        console.error(`SpeechSynthesis Error: ${(event as any).error}`);
      }
      handleSpeechEnd();
    };
    setTimeout(() => window.speechSynthesis.speak(utterance), 50);
  }, []);
  return speak;
};

export default useSpeechSynthesis;
