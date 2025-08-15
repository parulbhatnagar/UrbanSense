import { useEffect, useRef } from 'react';
import { ViewState } from '../types';

export function useSpeechRecognitionManager({
  view,
  voiceCommandEnabled,
  setViewState,
  playConfirmationFeedback,
  speak,
  handleStartExplore,
  handleStartNavigation,
  handleTriggerSos,
  handleCancelNavigation,
  setDestination,
  commandHandledRef,
  ttsActive,
}: {
  view: ViewState;
  voiceCommandEnabled: boolean;
  setViewState: (v: ViewState | ((v: ViewState) => ViewState)) => void;
  playConfirmationFeedback: () => void;
  speak: (text: string, cb?: () => void) => void;
  handleStartExplore: () => void;
  handleStartNavigation: () => void;
  handleTriggerSos: () => void;
  handleCancelNavigation: () => void;
  setDestination: (d: string) => void;
  commandHandledRef: React.MutableRefObject<boolean>;
  ttsActive: boolean;
}) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Tracks whether recognition is currently started (prevents InvalidStateError)
  const isListeningRef = useRef(false);
  // Wrapper ref exposed to consumers; provides safe start/stop methods
  const wrapperRef = useRef<any>({ start: () => {}, stop: () => {}, raw: null, isListening: false });

  useEffect(() => {
    console.debug('[SR] useSpeechRecognitionManager effect start', { view, voiceCommandEnabled });
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn('[SR] Web Speech API not available in this browser.');
      if (voiceCommandEnabled) setViewState(false as any); // disables voice
      return;
    }
    if (!recognitionRef.current) {
      console.debug('[SR] Creating new SpeechRecognition instance');
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
    }
    const recognition = recognitionRef.current;
    // initialize wrapper methods
    wrapperRef.current.raw = recognition;
    wrapperRef.current.start = () => {
      if (!recognition) return;
      if (isListeningRef.current) {
        console.debug('[SR] start called but already listening — ignoring');
        return;
      }
      try {
        recognition.start();
        // will be set to true in onstart handler
        console.debug('[SR] wrapperRef.start() called');
      } catch (e) {
        console.error('[SR] wrapperRef.start() failed', e);
      }
    };
    wrapperRef.current.stop = () => {
      if (!recognition) return;
      if (!isListeningRef.current) {
        console.debug('[SR] stop called but not listening — ignoring');
        return;
      }
      try {
        recognition.stop();
        console.debug('[SR] wrapperRef.stop() called');
      } catch (e) {
        console.error('[SR] wrapperRef.stop() failed', e);
      }
    };
    wrapperRef.current.isListening = () => isListeningRef.current;

    recognition.onstart = () => {
      isListeningRef.current = true;
      console.debug('[SR] recognition.onstart — isListeningRef set true');
      console.debug('[SR] recognition.onstart');
    };
    recognition.onnomatch = (ev: any) => { console.debug('[SR] recognition.onnomatch', ev); };
    recognition.onaudiostart = () => console.debug('[SR] recognition.onaudiostart');
    recognition.onaudioend = () => console.debug('[SR] recognition.onaudioend');

    recognition.onresult = (event) => {
      try {
        const raw = event.results[event.results.length - 1][0];
        const transcript = (raw.transcript || '').trim().toLowerCase();
        const confidence = raw.confidence ?? null;
        console.debug('[SR] onresult', { transcript, confidence, viewAtResult: view });
      } catch (e) {
        console.error('[SR] onresult parse error', e);
      }

      // Preserve previous behavior but add logging around state changes
      setViewState(currentView => {
        console.debug('[SR] Processing transcript for view', currentView);
        if (currentView === ViewState.ListeningForDestination || currentView === ViewState.ListeningForTransitDestination) {
          commandHandledRef.current = true;
          console.debug('[SR] Setting destination from voice', { currentView });
          const transcript = (event.results[event.results.length - 1][0].transcript || '').trim();
          setDestination(transcript.toLowerCase());
          if (currentView === ViewState.ListeningForTransitDestination) return ViewState.ProcessingTransitSuggestion;
          return ViewState.FetchingDirections;
        }
        if (currentView === ViewState.AwaitingNavigationConfirmation) {
          commandHandledRef.current = true;
          const transcript = (event.results[event.results.length - 1][0].transcript || '').trim().toLowerCase();
          const confidence = (event.results[event.results.length - 1][0].confidence ?? null);
          console.debug('[SR] AwaitingNavigationConfirmation transcript:', transcript, 'confidence:', confidence);
          const affirmatives = ['yes','proceed','start','ok','okay','confirm','sure','yup','yeah','go'];
          const isAffirmative = affirmatives.some(a => transcript.includes(a));
          if (isAffirmative) {
            console.debug('[SR] User confirmed navigation (matched affirmative)', transcript);
            playConfirmationFeedback();
            return ViewState.NavigationActive;
          } else {
            console.debug('[SR] User did not confirm navigation, cancelling', transcript);
            speak("Okay, cancelling navigation.", handleCancelNavigation);
            return currentView;
          }
        }
        if (currentView === ViewState.ListeningForCommand) {
          const transcript = (event.results[event.results.length - 1][0].transcript || '').trim().toLowerCase();
          console.debug('[SR] Top-level command heard:', transcript);
          if (transcript.includes('explore')) {
            commandHandledRef.current = true;
            playConfirmationFeedback();
            handleStartExplore();
          } else if (transcript.includes('navigate')) {
            commandHandledRef.current = true;
            playConfirmationFeedback();
            handleStartNavigation();
          } else if (transcript.includes('sos')) {
            commandHandledRef.current = true;
            playConfirmationFeedback();
            handleTriggerSos();
          } else if (transcript.includes('transit')) {
            // Support transit voice command if introduced
            commandHandledRef.current = true;
            playConfirmationFeedback();
            console.debug('[SR] Transit voice command detected, routing to transit start');
            setViewState(ViewState.PromptingForTransitDestination);
          } else {
            console.debug('[SR] Unrecognized top-level command');
            // Mark handled so recognition doesn't immediately restart into a loop while TTS runs
            commandHandledRef.current = true;
            speak("I didn't catch that. You can say 'Explore', 'Navigate', 'Transit', or 'SOS'.");
          }
        }
        return currentView;
      });
    };

    recognition.onerror = (event) => {
      console.error('[SR] recognition.onerror', event);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        console.debug('[SR] Non-fatal recognition error:', event.error);
        return;
      }
      // Prevent restart loop while speaking the error
      commandHandledRef.current = true;
      let userMessage = `A speech recognition error occurred: ${event.error}.`;
      if (event.error === 'network') {
        userMessage = "I'm having trouble connecting to the voice service. Please check your internet connection and try again.";
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        userMessage = "Voice commands are disabled because microphone access was denied. Please enable permissions in your browser settings.";
        console.warn('[SR] Microphone access denied — disabling voice commands');
        setViewState(false as any);
      }
      speak(userMessage);
      setViewState(ViewState.Error);
    };

    recognition.onend = () => {
      console.debug('[SR] recognition.onend fired, commandHandledRef:', commandHandledRef.current, 'ttsActive:', ttsActive);
      // mark not listening immediately
      isListeningRef.current = false;
      if (commandHandledRef.current) {
        // Reset flag and do not restart recognition immediately
        commandHandledRef.current = false;
        console.debug('[SR] commandHandledRef was set — not restarting recognition');
        return;
      }
      setViewState(currentView => {
        console.debug('[SR] recognition.onend evaluating restart for view', currentView);
        if (voiceCommandEnabled && !ttsActive && [ViewState.ListeningForCommand, ViewState.ListeningForDestination, ViewState.ListeningForTransitDestination, ViewState.AwaitingNavigationConfirmation].includes(currentView)) {
          try {
            console.debug('[SR] attempting safe restart recognition');
            wrapperRef.current?.start();
          } catch (e) {
            console.error('[SR] recognition.start() threw', e);
          }
        }
        return currentView;
      });
    };

    const shouldBeListening = voiceCommandEnabled && !ttsActive && [ViewState.ListeningForCommand, ViewState.ListeningForDestination, ViewState.ListeningForTransitDestination, ViewState.AwaitingNavigationConfirmation].includes(view);
    console.debug('[SR] shouldBeListening:', shouldBeListening, { view, ttsActive });
    if (shouldBeListening) {
      commandHandledRef.current = false;
      try {
        console.debug('[SR] calling recognition.start()');
        wrapperRef.current?.start();
      } catch (e) {
        console.error('[SR] recognition.start() failed', e);
      }
    } else {
      try {
        console.debug('[SR] calling recognition.stop()');
        wrapperRef.current?.stop();
      } catch (e) {
        console.error('[SR] recognition.stop() failed', e);
      }
    }

    return () => {
      try {
        console.debug('[SR] cleanup: stopping recognition');
        wrapperRef.current?.stop();
      } catch (e) {
        console.error('[SR] cleanup recognition.stop() failed', e);
      }
    };
  }, [view, voiceCommandEnabled, setViewState, playConfirmationFeedback, speak, handleStartExplore, handleStartNavigation, handleTriggerSos, handleCancelNavigation, setDestination, ttsActive]);

  // Expose wrapperRef so callers can call .current.start() / .current.stop() safely.
  return wrapperRef;
}
