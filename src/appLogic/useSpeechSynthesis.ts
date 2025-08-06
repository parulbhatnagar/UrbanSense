// Custom hook for speech synthesis logic
import { useCallback } from 'react';

const useSpeechSynthesis = () => {
  const speak = useCallback((text: string, onEnd?: () => void) => {
    console.log('[TTS] speak called:', text);
    if (!('speechSynthesis' in window) || !window.speechSynthesis) {
      console.warn('[TTS] Speech Synthesis not supported.');
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    if (!text || !text.trim()) {
      console.warn('[TTS] No text to speak.');
      onEnd?.();
      return;
    }
    const utterance = new window.SpeechSynthesisUtterance(text);
    let finished = false;
    const handleSpeechEnd = () => {
      if (finished) return;
      finished = true;
      console.log('[TTS] onend fired');
      utterance.onend = null;
      utterance.onerror = null;
      onEnd?.();
    };
    utterance.onend = handleSpeechEnd;
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error('[TTS] onerror fired:', (event as any).error);
      handleSpeechEnd();
    };
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
        console.log('[TTS] speak() called');
      } catch (e) {
        console.error('[TTS] speak() exception:', e);
        handleSpeechEnd();
      }
    }, 50);
    // Fallback: if onend/onerror not called in 30s, call onEnd
    setTimeout(() => {
      if (!finished) {
        console.warn('[TTS] Fallback timeout reached, forcing onEnd');
        handleSpeechEnd();
      }
    }, 30000);
  }, []);
  return speak;
};

export default useSpeechSynthesis;
