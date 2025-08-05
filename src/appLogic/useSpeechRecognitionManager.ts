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
  commandHandledRef
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
}) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      if (voiceCommandEnabled) setViewState(false as any); // disables voice
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
    }
    const recognition = recognitionRef.current;
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      setViewState(currentView => {
        if (currentView === ViewState.ListeningForDestination) {
          commandHandledRef.current = true;
          setDestination(transcript);
          return ViewState.FetchingDirections;
        }
        if (currentView === ViewState.AwaitingNavigationConfirmation) {
          commandHandledRef.current = true;
          if (transcript.includes('yes') || transcript.includes('proceed')) {
            playConfirmationFeedback();
            return ViewState.NavigationActive;
          } else {
            speak("Okay, cancelling navigation.", handleCancelNavigation);
            return currentView;
          }
        }
        if (currentView === ViewState.ListeningForCommand) {
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
          } else {
            speak("I didn't catch that. You can say 'Explore', 'Navigate', or 'SOS'.");
          }
        }
        return currentView;
      });
    };
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'audio-capture') return;
      let userMessage = `A speech recognition error occurred: ${event.error}.`;
      if (event.error === 'network') {
        userMessage = "I'm having trouble connecting to the voice service. Please check your internet connection and try again.";
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        userMessage = "Voice commands are disabled because microphone access was denied. Please enable permissions in your browser settings.";
        setViewState(false as any);
      }
      speak(userMessage);
      setViewState(ViewState.Error);
    };
    recognition.onend = () => {
      if (commandHandledRef.current) {
        commandHandledRef.current = false;
        return;
      }
      setViewState(currentView => {
        if (voiceCommandEnabled && [ViewState.ListeningForCommand, ViewState.ListeningForDestination, ViewState.AwaitingNavigationConfirmation].includes(currentView)) {
          try { recognition.start(); } catch (e) { }
        }
        return currentView;
      });
    };
    const shouldBeListening = voiceCommandEnabled && [ViewState.ListeningForCommand, ViewState.ListeningForDestination, ViewState.AwaitingNavigationConfirmation].includes(view);
    if (shouldBeListening) {
      commandHandledRef.current = false;
      try { recognition.start(); } catch (e) { }
    } else {
      recognition.stop();
    }
    return () => recognition.stop();
  }, [view, voiceCommandEnabled, setViewState, playConfirmationFeedback, speak, handleStartExplore, handleStartNavigation, handleTriggerSos, handleCancelNavigation, setDestination]);

  return recognitionRef;
}
