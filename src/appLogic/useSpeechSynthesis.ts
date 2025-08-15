// Custom hook for speech synthesis logic
import { useCallback } from 'react';

const preferedLangs = ['en-IN', 'en-GB', 'en-US', 'en'];

const pickVoiceForLang = (voices: SpeechSynthesisVoice[] | null) => {
  if (!voices || voices.length === 0) return null;
  // Prefer a voice matching one of the preferred langs
  for (const pref of preferedLangs) {
    const v = voices.find(voice => voice.lang && voice.lang.toLowerCase().startsWith(pref.toLowerCase()));
    if (v) return v;
  }
  // Fallback to first english voice
  const en = voices.find(voice => voice.lang && voice.lang.toLowerCase().startsWith('en'));
  if (en) return en;
  // Otherwise return first available voice
  return voices[0];
};

const useSpeechSynthesis = () => {
  const speak = useCallback((text: string, onEnd?: () => void) => {
    console.log('[TTS] speak called:', text);
    if (!('speechSynthesis' in window) || !window.speechSynthesis) {
      console.warn('[TTS] Speech Synthesis not supported.');
      onEnd?.();
      return;
    }
    if (!text || !text.trim()) {
      console.warn('[TTS] No text to speak.');
      onEnd?.();
      return;
    }

    const speakWithVoice = (voiceToUse: SpeechSynthesisVoice | null) => {
      const utterance = new window.SpeechSynthesisUtterance(text);
      if (voiceToUse) {
        try {
          utterance.voice = voiceToUse;
          utterance.lang = voiceToUse.lang || utterance.lang;
        } catch (e) {
          console.debug('[TTS] failed to set voice on utterance', e);
        }
      }
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
          console.debug('[TTS] speaking with voice', voiceToUse?.name || 'default');
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
    };

    // Try to get voices immediately
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      // Voices not yet loaded. Wait for onvoiceschanged once and then speak.
      console.debug('[TTS] voices not loaded yet, attaching onvoiceschanged');
      let fired = false;
      const timeoutId = setTimeout(() => {
        if (fired) return;
        fired = true;
        try {
          const loaded = window.speechSynthesis.getVoices();
          console.debug('[TTS] voices fallback after timeout', loaded.map(v => v.name + ':' + v.lang));
          const chosen = pickVoiceForLang(loaded);
          speakWithVoice(chosen);
        } catch (e) {
          console.error('[TTS] fallback voice selection failed', e);
        }
      }, 800);

      const handler = () => {
        if (fired) return;
        fired = true;
        try {
          clearTimeout(timeoutId);
          const loaded = window.speechSynthesis.getVoices();
          console.debug('[TTS] voices loaded', loaded.map(v => v.name + ':' + v.lang));
          const chosen = pickVoiceForLang(loaded);
          speakWithVoice(chosen);
        } finally {
          try { window.speechSynthesis.onvoiceschanged = null; } catch (e) { /* ignore */ }
        }
      };
      try { window.speechSynthesis.onvoiceschanged = handler; } catch(e) { console.debug('[TTS] failed to set onvoiceschanged', e); }
      return;
    }

    const chosen = pickVoiceForLang(voices);
    console.debug('[TTS] chosen voice', chosen?.name, chosen?.lang);
    speakWithVoice(chosen || null);
  }, []);
  return speak;
};

export default useSpeechSynthesis;
