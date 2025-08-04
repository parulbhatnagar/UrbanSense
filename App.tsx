import React, { useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { ViewState, Coordinates, DirectionStep, RouteDetails } from './types';
import { createImageAnalysisService } from './services/aiService.ts';
import { getDirections, calculateDistance } from './services/navigationService.ts';
import CameraCapture from './components/CameraCapture.tsx';
import { CompassIcon, BusIcon, AlertTriangleIcon, SettingsIcon, CameraIcon, ChevronLeftIcon, MicrophoneIcon, ShieldAlertIcon } from './components/icons.tsx';

/**
 * @file This is the main application component for UrbanSense.
 * It manages state, renders views, and handles all user interactions and business logic.
 */

const imageAnalysisService = createImageAnalysisService();

/**
 * A utility function to speak text using the browser's SpeechSynthesis API.
 * It includes error handling and a callback for when speech completes.
 * @param {string} text - The text to be spoken.
 * @param {() => void} [onEnd] - An optional callback function to execute when speech ends.
 */
const speak = (text: string, onEnd?: () => void) => {
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
  const utterance = new SpeechSynthesisUtterance(text);
  const handleSpeechEnd = () => {
    utterance.onend = null;
    utterance.onerror = null;
    onEnd?.();
  };
  utterance.onend = handleSpeechEnd;
  utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
    if (event.error !== 'interrupted') {
      console.error(`SpeechSynthesis Error: ${event.error}`);
    }
    handleSpeechEnd();
  };
  setTimeout(() => window.speechSynthesis.speak(utterance), 50);
};

/**
 * Plays a short audio and haptic confirmation feedback.
 * Used to confirm that a voice command has been recognized.
 */
const playConfirmationFeedback = () => {
  if (navigator.vibrate) navigator.vibrate(100);
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    console.error("Could not play confirmation sound:", e);
  }
};

/**
 * A utility function that captures an image from the camera without using a React component.
 * This is useful for programmatic capture inside an effect or interval.
 * @returns A promise that resolves with the Base64 encoded image string.
 */
const captureImagePromise = (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not available on this browser.");
      }
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            reject(new Error("Could not get canvas context."));
          }
          stream?.getTracks().forEach(track => track.stop());
        }, 500); // Wait for focus/exposure
      };
    } catch (err) {
      stream?.getTracks().forEach(track => track.stop());
      reject(err);
    }
  });
};

/**
 * Formats a distance in meters into a user-friendly string (e.g., "500 meters" or "1.2 kilometers").
 * @param {number} meters - The distance in meters.
 * @returns {string} The formatted distance string.
 */
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} meters`;
  }
  const kilometers = meters / 1000;
  // Round to one decimal place for kilometers
  return `${kilometers.toFixed(1)} kilometers`;
};


/** A reusable, styled button component for primary actions. */
interface ActionButtonProps {
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, label, icon, className = '', ariaLabel, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-center px-6 py-4 bg-brand-yellow text-brand-dark font-bold rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-brand-light disabled:bg-brand-gray disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    aria-label={ariaLabel || label}
  >
    {icon && <span className="mr-3">{icon}</span>}
    {label}
  </button>
);

/** The footer component containing the main navigation actions. */
const AppFooter: React.FC<{ onExploreClick: () => void; onSettingsClick: () => void; onNavigateClick: () => void; onSosClick: () => void; }> = ({ onExploreClick, onSettingsClick, onNavigateClick, onSosClick }) => (
  <footer className="grid grid-cols-4 gap-2 w-full p-4 border-t border-brand-gray">
    <button onClick={onExploreClick} className="flex flex-col items-center justify-center space-y-2 text-brand-light" aria-label="Explore surroundings">
      <CameraIcon className="w-8 h-8"/>
      <span className="text-sm">Explore</span>
    </button>
    <button onClick={onNavigateClick} className="flex flex-col items-center justify-center space-y-2 text-brand-light" aria-label="Navigate to a destination">
      <CompassIcon className="w-8 h-8"/>
      <span className="text-sm">Navigate</span>
    </button>
    <button onClick={onSosClick} className="flex flex-col items-center justify-center space-y-2 text-red-400" aria-label="Trigger SOS Emergency Call">
      <ShieldAlertIcon className="w-8 h-8"/>
      <span className="text-sm font-bold">SOS</span>
    </button>
    <button onClick={onSettingsClick} className="flex flex-col items-center justify-center space-y-2 text-brand-light">
      <SettingsIcon className="w-8 h-8"/>
      <span className="text-sm">Settings</span>
    </button>
  </footer>
);

/** The initial view of the app, featuring a large button to activate voice commands. */
const IdleView: React.FC<{ onActivateListening: () => void; }> = ({ onActivateListening }) => (
    <button
        onClick={onActivateListening}
        className="flex-grow flex flex-col items-center justify-center p-6 text-center w-full focus:outline-none focus:ring-4 focus:ring-brand-yellow/50 hover:bg-brand-yellow/10 transition-colors"
        aria-label="Tap to speak"
    >
        <MicrophoneIcon className="w-24 h-24 text-brand-yellow mb-6" />
        <span className="text-3xl font-bold text-brand-yellow">Tap to Speak</span>
        <p className="text-brand-gray mt-4">Or use a footer button to start</p>
    </button>
);

/** The view when the app is actively listening for a voice command. The entire area is tappable to stop. */
const ListeningForCommandView: React.FC<{ onStopListening: () => void; }> = ({ onStopListening }) => (
    <button 
        onClick={onStopListening} 
        className="flex-grow flex flex-col items-center justify-center p-6 text-center w-full h-full focus:outline-none focus:ring-4 focus:ring-brand-yellow/50"
        aria-label='Listening for a command. Tap anywhere to stop.'
    >
        <MicrophoneIcon className="w-24 h-24 text-brand-yellow animate-pulse" />
        <p className="text-2xl font-bold text-brand-yellow mt-12" aria-live="polite">Listening...</p>
        <p className="text-lg text-brand-gray mt-2">Say "Explore", "Navigate", or "SOS"</p>
        <p className="text-sm text-brand-gray mt-8">(Tap anywhere to stop)</p>
    </button>
);

/** A view that shows a loading spinner and a message. */
const LoadingView: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex-grow flex flex-col items-center justify-center p-6" role="status" aria-live="polite">
    <div className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-brand-light text-lg">{message}</p>
  </div>
);

/** The view that displays the result of an image analysis. */
const ResultView: React.FC<{ description: string; onReset: () => void; backgroundImage: string | null; }> = ({ description, onReset, backgroundImage }) => (
    <div
        className="flex-grow flex flex-col bg-cover bg-center relative"
        style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none' }}
    >
        <div className="absolute inset-0 bg-brand-dark/75"></div>
        <div className="relative flex-grow flex flex-col p-6 text-brand-light justify-between overflow-y-auto">
            <div>
                <h2 className="text-xl font-bold text-brand-yellow mb-4">Scene Description</h2>
                <p className="text-lg whitespace-pre-wrap">{description}</p>
            </div>
            <div className="mt-6">
                <ActionButton onClick={onReset} label="Explore Again" icon={<CameraIcon />} />
            </div>
        </div>
    </div>
);


/** The view that displays an error message. */
const ErrorView: React.FC<{ message: string; onReset: () => void }> = ({ message, onReset }) => (
  <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
    <AlertTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
    <h2 className="text-xl font-bold text-red-400 mb-2">An Error Occurred</h2>
    <p className="text-brand-light mb-8">{message}</p>
    <ActionButton onClick={onReset} label="Try Again" />
  </div>
);

/** The settings view, allowing users to configure voice commands and SOS contact. */
const SettingsView: React.FC<{ 
    onBack: () => void; 
    voiceEnabled: boolean; 
    onVoiceToggle: (enabled: boolean) => void;
    sosContact: string;
    onSosContactChange: (contact: string) => void;
}> = ({ onBack, voiceEnabled, onVoiceToggle, sosContact, onSosContactChange }) => (
  <div className="flex-grow flex flex-col p-6 text-brand-light overflow-y-auto">
    <div className="flex items-center mb-8">
      <button onClick={onBack} className="mr-4 p-2" aria-label="Go back">
        <ChevronLeftIcon className="w-8 h-8" />
      </button>
      <h1 className="text-2xl font-bold">Settings</h1>
    </div>
    <div className="flex items-center justify-between bg-brand-gray/20 p-4 rounded-lg">
      <label htmlFor="voice-toggle" className="text-lg">Enable Voice Commands</label>
      <button
        id="voice-toggle"
        role="switch"
        aria-checked={voiceEnabled}
        onClick={() => onVoiceToggle(!voiceEnabled)}
        className={`${voiceEnabled ? 'bg-brand-yellow' : 'bg-brand-gray'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}
      >
        <span className={`${voiceEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
      </button>
    </div>
    <div className="mt-8">
        <label htmlFor="sos-contact" className="block text-lg mb-2">Emergency Contact</label>
        <p className="text-sm text-brand-gray mb-2">Enter a phone number to call when you say "SOS".</p>
        <input
            id="sos-contact"
            type="tel"
            value={sosContact}
            onChange={(e) => onSosContactChange(e.target.value)}
            placeholder="e.g., +15551234567"
            className="w-full bg-brand-dark border border-brand-gray rounded-lg p-3 text-brand-light focus:outline-none focus:ring-2 focus:ring-brand-yellow"
        />
    </div>
  </div>
);

/** The view for active turn-by-turn navigation, which is a large tappable area for on-demand guidance. */
const NavigationView: React.FC<{ destination: string; instruction: string; onCancel: () => void; onRequestUpdate: () => void; }> = ({ destination, instruction, onCancel, onRequestUpdate }) => (
    <div className="flex-grow flex flex-col bg-brand-dark text-brand-light justify-between text-center">
        <button
            onClick={onRequestUpdate}
            className="flex-grow flex flex-col p-6 items-center justify-center focus:outline-none focus:ring-4 focus:ring-brand-yellow/50"
            aria-label="Tap to get updated visual guidance"
        >
            <p className="text-brand-gray text-lg">Navigating to</p>
            <h2 className="text-3xl font-bold text-brand-yellow mb-8 capitalize">{destination}</h2>
            <div className="min-h-[100px] flex items-center justify-center">
                <p className="text-2xl text-brand-light" aria-live="assertive">{instruction}</p>
            </div>
            <p className="text-brand-gray mt-auto pt-8">Tap screen for updated guidance</p>
        </button>
        <div className="p-6">
            <ActionButton onClick={onCancel} label="Cancel Navigation" className="bg-red-600 hover:bg-red-700" />
        </div>
    </div>
);


const App: React.FC = () => {
  const [view, setViewState] = useState<ViewState>(ViewState.Idle);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [voiceCommandEnabled, setVoiceCommandEnabled] = useState(true);
  const [sosContact, setSosContact] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [destination, setDestination] = useState('');
  const [navigationInstruction, setNavigationInstruction] = useState('');
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const locationWatcherId = useRef<number | null>(null);
  
  /** 
   * A ref to flag when a voice command has been successfully processed.
   * This is crucial for solving a race condition in the Web Speech API where the `onend`
   * event might fire and try to restart the listener *after* a command has already been
   * handled and a state transition has begun. This flag prevents that incorrect restart.
   */
  const commandHandledRef = useRef(false);

  /** Cancels an active navigation, stopping GPS tracking and returning to the appropriate state. */
  const handleCancelNavigation = useCallback(() => {
    if (locationWatcherId.current) navigator.geolocation.clearWatch(locationWatcherId.current);
    window.speechSynthesis.cancel();
    setDestination('');
    setNavigationInstruction('');
    setRouteDetails(null);
    setCurrentStepIndex(0);
    if (voiceCommandEnabled) {
      setViewState(ViewState.ListeningForCommand);
    } else {
      setViewState(ViewState.Idle);
    }
  }, [voiceCommandEnabled]);
  
  /** Resets the application to its initial idle state, stopping all active processes. */
  const resetApp = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    handleCancelNavigation();
    setViewState(ViewState.Idle);
    setDescription('');
    setError(null);
    setCapturedImage(null);
  }, [handleCancelNavigation]);
  
  /** Handles the successful capture of an image, sending it to the AI service for analysis. */
  const handleCapture = useCallback(async (base64Image: string) => {
    setCapturedImage(base64Image);
    setViewState(ViewState.Loading);
    try {
      const result = await imageAnalysisService.analyzeImage(base64Image);
      setDescription(result);
      setViewState(ViewState.Result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
      setViewState(ViewState.Error);
    }
  }, []);

  /** Initiates the 'Explore' sequence by switching to the camera capture view. */
  const handleStartExplore = () => {
    setViewState(ViewState.Capturing);
  };
  
  /** Initiates the 'Navigate' sequence by prompting for a destination. */
  const handleStartNavigation = () => {
    setViewState(ViewState.PromptingForDestination);
  };
  
  /** Handles the SOS feature, triggering a phone call to the saved contact. */
  const handleTriggerSos = useCallback(() => {
    if (sosContact) {
      speak(`Calling your emergency contact now.`, () => {
        window.location.href = `tel:${sosContact}`;
      });
    } else {
      speak("No emergency contact is set. Please add one in the settings screen.", () => {
        setViewState(ViewState.Settings); // Guide user to settings
      });
    }
  }, [sosContact]);


  /** Activates the voice command loop. */
  const handleActivateVoiceLoop = () => {
    if (voiceCommandEnabled) {
      setViewState(ViewState.ListeningForCommand);
    } else {
      speak("Voice commands are disabled. Please enable them in settings to use this feature.");
    }
  };
  
  /** Requests and provides on-demand combined navigational guidance. */
  const handleRequestNavigationalGuidance = useCallback(async () => {
    if (!routeDetails || currentStepIndex >= routeDetails.steps.length) return;
    setNavigationInstruction("Getting updated guidance...");
    const instruction = routeDetails.steps[currentStepIndex].instruction;
    try {
        const image = await captureImagePromise();
        const combinedGuidance = await imageAnalysisService.generateNavigationalGuidance(image, instruction);
        setNavigationInstruction(combinedGuidance);
        speak(combinedGuidance);
    } catch (err) {
        console.error("Failed to get combined guidance:", err);
        setNavigationInstruction(instruction); // Fallback to basic instruction
        speak(instruction);
    }
  }, [routeDetails, currentStepIndex]);
  
  /** Effect to load settings from localStorage on initial mount. */
  useEffect(() => {
    const savedVoiceSetting = localStorage.getItem('voiceCommandEnabled');
    if (savedVoiceSetting !== null) {
      setVoiceCommandEnabled(JSON.parse(savedVoiceSetting));
    }
    const savedSosContact = localStorage.getItem('sosContact');
    if (savedSosContact) {
      setSosContact(savedSosContact);
    }
  }, []);

  /** Effect to manage the lifecycle of the SpeechRecognition API based on app state. */
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      if (voiceCommandEnabled) setVoiceCommandEnabled(false);
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
      console.error("Speech recognition error:", event.error);
      let userMessage = `A speech recognition error occurred: ${event.error}.`;
      if (event.error === 'network') {
          userMessage = "I'm having trouble connecting to the voice service. Please check your internet connection and try again.";
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          userMessage = "Voice commands are disabled because microphone access was denied. Please enable permissions in your browser settings.";
          setVoiceCommandEnabled(false);
      }
      setError(userMessage);
      setViewState(ViewState.Error);
    };

    recognition.onend = () => {
      if (commandHandledRef.current) {
        commandHandledRef.current = false;
        return;
      }
      
      setViewState(currentView => {
        if (voiceCommandEnabled && [ViewState.ListeningForCommand, ViewState.ListeningForDestination, ViewState.AwaitingNavigationConfirmation].includes(currentView)) { 
           try { recognition.start(); } catch(e) { /* ignore if already stopping */ }
        }
        return currentView;
      });
    };

    const shouldBeListening = voiceCommandEnabled && [ViewState.ListeningForCommand, ViewState.ListeningForDestination, ViewState.AwaitingNavigationConfirmation].includes(view);
    
    if (shouldBeListening) {
      commandHandledRef.current = false;
      try { recognition.start(); } catch(e) { /* already started */ }
    } else {
      recognition.stop();
    }
    
    return () => recognition.stop();
  }, [view, voiceCommandEnabled, handleCancelNavigation, handleStartExplore, handleStartNavigation, handleTriggerSos]);

  /** Effect to handle all text-to-speech actions based on the current view state. */
  useEffect(() => {
    if (view === ViewState.Result && description) {
      speak(description, () => {
        if (voiceCommandEnabled) setViewState(ViewState.ListeningForCommand);
      });
    } else if (view === ViewState.PromptingForDestination) {
        speak("Where would you like to go?", () => {
            setViewState(ViewState.ListeningForDestination);
        });
    } else if (view === ViewState.AwaitingNavigationConfirmation && routeDetails) {
        const confirmationMessage = `I found ${routeDetails.destinationName}, which is about ${formatDistance(routeDetails.totalDistance)} away. Do you want to proceed?`;
        speak(confirmationMessage);
    } else if (view === ViewState.Error && error) {
      speak(error, () => {
          if (voiceCommandEnabled) setViewState(ViewState.ListeningForCommand);
          else resetApp();
      });
    }
  }, [view, description, error, voiceCommandEnabled, resetApp, routeDetails, destination]);
  
  /** Effect to fetch directions when the app enters the FetchingDirections state. */
  useEffect(() => {
    if (view !== ViewState.FetchingDirections) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const startCoords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        try {
          const fetchedRoute = await getDirections(startCoords, destination);
          setRouteDetails(fetchedRoute);
          setViewState(ViewState.AwaitingNavigationConfirmation);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to fetch directions.");
          setViewState(ViewState.Error);
        }
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        setError("Could not get your location. Please ensure location services are enabled and permissions are granted.");
        setViewState(ViewState.Error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [view, destination]);
  
  /** Effect for GPS tracking and initial guidance during active navigation. */
  useEffect(() => {
    if (view !== ViewState.NavigationActive || !routeDetails) return;

    if (locationWatcherId.current) navigator.geolocation.clearWatch(locationWatcherId.current);
    locationWatcherId.current = navigator.geolocation.watchPosition(
      (position) => {
        const currentLocation: Coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        const nextWaypoint = routeDetails.steps[currentStepIndex];
        if (!nextWaypoint) return;
        const distanceToNextStep = calculateDistance(currentLocation, nextWaypoint.location);
        if (distanceToNextStep < 15) { 
          setCurrentStepIndex(i => i + 1);
        }
      },
      (geoError) => console.error("Geolocation watch error:", geoError),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    const giveInitialGuidanceForStep = () => {
        if (currentStepIndex >= routeDetails.steps.length) {
            speak("You have arrived at your destination.", handleCancelNavigation);
            return;
        }
        const instruction = routeDetails.steps[currentStepIndex].instruction;
        setNavigationInstruction(instruction);
        speak(instruction);
    };

    giveInitialGuidanceForStep();

    return () => {
      if (locationWatcherId.current) navigator.geolocation.clearWatch(locationWatcherId.current);
    };
  }, [view, routeDetails, currentStepIndex, handleCancelNavigation]);


  /** Renders the main content based on the current application view state. */
  const renderContent = () => {
    switch (view) {
      case ViewState.Capturing:
        return <CameraCapture onCapture={handleCapture} onError={(msg) => { setError(msg); setViewState(ViewState.Error); }} />;
      case ViewState.Loading:
        return <LoadingView message="Analyzing surroundings..." />;
      case ViewState.Result:
        return <ResultView description={description} onReset={resetApp} backgroundImage={capturedImage} />;
      case ViewState.Error:
        return <ErrorView message={error || 'An unknown error occurred.'} onReset={resetApp} />;
      case ViewState.Settings:
        return <SettingsView 
            onBack={() => setViewState(ViewState.Idle)} 
            voiceEnabled={voiceCommandEnabled} 
            onVoiceToggle={(enabled) => { setVoiceCommandEnabled(enabled); localStorage.setItem('voiceCommandEnabled', JSON.stringify(enabled)); }}
            sosContact={sosContact}
            onSosContactChange={(contact) => { setSosContact(contact); localStorage.setItem('sosContact', contact); }}
        />;
      case ViewState.PromptingForDestination:
        return <LoadingView message="Please wait..." />;
      case ViewState.ListeningForDestination:
        return <LoadingView message="Listening for destination..." />;
      case ViewState.FetchingDirections:
      case ViewState.AwaitingNavigationConfirmation:
        return (
          <div className="flex-grow flex flex-col justify-center items-center p-6 space-y-8">
            <LoadingView 
              message={view === ViewState.FetchingDirections ? `Finding the nearest ${destination}...` : "Waiting for confirmation..."} 
            />
            <div className="w-full max-w-xs">
                <ActionButton onClick={handleCancelNavigation} label="Cancel" className="bg-red-600 hover:bg-red-700"/>
            </div>
          </div>
        );
      case ViewState.NavigationActive:
        return <NavigationView 
            destination={routeDetails?.destinationName || destination} 
            instruction={navigationInstruction} 
            onCancel={handleCancelNavigation} 
            onRequestUpdate={handleRequestNavigationalGuidance}
        />;
      case ViewState.ListeningForCommand:
        return <ListeningForCommandView onStopListening={resetApp} />;
      case ViewState.Idle:
      default:
        return <IdleView onActivateListening={handleActivateVoiceLoop} />;
    }
  };

  const showFooter = ![ViewState.Settings, ViewState.NavigationActive, ViewState.Capturing].includes(view);

  return (
    <main className="flex flex-col h-screen bg-brand-dark text-brand-light font-sans" aria-live="assertive">
      <div className="flex-grow flex flex-col">{renderContent()}</div>
      {showFooter && (
         <AppFooter 
          onExploreClick={handleStartExplore}
          onSettingsClick={() => setViewState(ViewState.Settings)} 
          onNavigateClick={handleStartNavigation}
          onSosClick={handleTriggerSos}
        />
      )}
    </main>
  );
};

export default App;