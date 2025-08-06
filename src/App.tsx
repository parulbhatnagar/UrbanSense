import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ViewState, Coordinates, DirectionStep, RouteDetails } from './types';
import { createImageAnalysisService } from './services/aiService';
import { getDirections, calculateDistance } from './services/navigationService';
import CameraCapture from './components/CameraCapture';
import ActionButton from './components/ActionButton';
import AppFooter from './components/AppFooter';
import SettingsView from './components/SettingsView';
import NavigationView from './components/NavigationView';
import IdleView from './components/IdleView';
import LoadingView from './components/LoadingView';
import ErrorView from './components/ErrorView';
import ResultView from './components/ResultView';
import ListeningForCommandView from './components/ListeningForCommandView';
import CallingScreen from './components/CallingScreen';
import PermissionsScreen from './components/PermissionsScreen';
import MainContentRouter from './components/MainContentRouter';
import useSpeechSynthesis from './appLogic/useSpeechSynthesis';
import useConfirmationFeedback from './appLogic/useConfirmationFeedback';
import useCameraCapturePromise from './appLogic/useCameraCapturePromise';
import formatDistance from './appLogic/formatDistance.ts';
import { useSosHandler } from './appLogic/useSosHandler';
import { usePermissions } from './appLogic/usePermissions';
import { useCancelNavigation } from './appLogic/useNavigationHandlers';
import { useSpeechRecognitionManager } from './appLogic/useSpeechRecognitionManager';
import { fetchImageAsBase64 } from './appLogic/imageUtils';

/**
 * @file This is the main application component for UrbanSense.
 * It manages state, renders views, and handles all user interactions and business logic.
 */

const imageAnalysisService = createImageAnalysisService();

const mockExploreImages = [
  '/testData/Closed-Sidewalk-with-Pedestrian-Pass-through-New-York-City-June-2024-1.jpeg',
  '/testData/Delhi-Chandni-Chowk-cycle-rickshaw-drivers-at-end-of-street-scaled.jpeg',
  '/testData/people-standing-at-a-local-bus-stand-in-new-delhi-waiting-for-public-transport-2D8RF54.jpeg',
  '/testData/people-walking-on-the-sidewalk-along-the-street-of-new-york-city-ny-D5F4R7.jpeg',
];
const mockExploreDescriptions = [
  'A closed sidewalk in New York City with a pedestrian pass-through. There are barriers and a person walking.',
  'Cycle rickshaw drivers at the end of a busy street in Delhi’s Chandni Chowk.',
  'People standing at a local bus stand in New Delhi, waiting for public transport.',
  'People walking on the sidewalk along a street in New York City.',
];

/** The main application component */
const App: React.FC = () => {
  const speak = useSpeechSynthesis();
  const playConfirmationFeedback = useConfirmationFeedback();
  const captureImagePromise = useCameraCapturePromise();

  const [view, setViewState] = useState<ViewState>(ViewState.Idle);
  // Track where Explore was started from
  const [prevViewBeforeExplore, setPrevViewBeforeExplore] = useState<ViewState | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [voiceCommandEnabled, setVoiceCommandEnabled] = useState(true);
  const [sosContact, setSosContact] = useState('');
  const [sosContactName, setSosContactName] = useState('');
  const [sosContactNumber, setSosContactNumber] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mockDataMode, setMockDataMode] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(() => {
    const saved = localStorage.getItem('permissionsGranted');
    return saved === 'true';
  });
  
  const [destination, setDestination] = useState('');
  const [navigationInstruction, setNavigationInstruction] = useState('');
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showCallingScreen, setShowCallingScreen] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const locationWatcherId = useRef<number | null>(null);
  
  /** 
   * A ref to flag when a voice command has been successfully processed.
   * This is crucial for solving a race condition in the Web Speech API where the `onend`
   * event might fire and try to restart the listener *after* a command has already been
   * handled and a state transition has begun. This flag prevents that incorrect restart.
   */
  const commandHandledRef = useRef(false);
  
  /**
   * Ref to lock the entire Explore flow (capture, analyze, TTS) until TTS is finished.
   * Prevents double processing and double TTS.
   */
  const isLockedRef = useRef(false);

  /**
   * Ref to track if TTS is currently in progress (including error/interrupted)
   */
  const ttsInProgressRef = useRef(false);

  /** Cancels an active navigation, stopping GPS tracking and returning to the appropriate state. */
  const handleCancelNavigation = useCancelNavigation({
    locationWatcherId,
    setDestination,
    setNavigationInstruction,
    setRouteDetails,
    setCurrentStepIndex,
    setViewState,
    voiceCommandEnabled
  });
  
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
    console.log('[Explore] handleCapture called. isLockedRef:', isLockedRef.current, 'ttsInProgressRef:', ttsInProgressRef.current);
    if (isLockedRef.current || ttsInProgressRef.current) {
      console.log('[Explore] Flow is locked or TTS in progress, skipping capture.');
      return;
    }
    isLockedRef.current = true;
    console.log('[Explore] handleCapture: lock set.');

    if (mockDataMode) {
      // Pick a random mock image and send it to the LLM for description
      const idx = Math.floor(Math.random() * mockExploreImages.length);
      const mockImage = mockExploreImages[idx];
      setViewState(ViewState.Loading);
      console.log('[Explore] Mock mode: selected image', mockImage);
      try {
        const { base64: mockBase64, mimeType } = await fetchImageAsBase64(mockImage);
        if (!mockBase64 || !mockBase64.startsWith('data:image/')) {
          throw new Error('Failed to load mock image or convert to base64.');
        }
        console.log('[Explore] Mock image base64:', mockBase64.substring(0, 100));
        const result = await imageAnalysisService.analyzeImage({ base64Image: mockBase64, mimeType });
        console.log('[Explore] Mock description:', result);
        // Only set description and transition if not already in Result and TTS not running
        if (ttsInProgressRef.current || view === ViewState.Result) {
          console.log('[Explore] Skipping setDescription/setViewState: TTS in progress or already in Result.');
        } else {
          setCapturedImage(mockImage);
          setDescription(result);
          setViewState(ViewState.Result);
          console.log('[Explore] setDescription and setViewState(Result) called.');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message);
        setViewState(ViewState.Error);
        isLockedRef.current = false;
      }
    } else {
      setViewState(ViewState.Loading);
      console.log('[Explore] Real mode: captured image', base64Image ? base64Image.substring(0, 100) : '');
      try {
        const result = await imageAnalysisService.analyzeImage({ base64Image });
        console.log('[Explore] Real description:', result);
        // Only set description and transition if not already in Result and TTS not running
        if (ttsInProgressRef.current || view === ViewState.Result) {
          console.log('[Explore] Skipping setDescription/setViewState: TTS in progress or already in Result.');
        } else {
          setCapturedImage(base64Image);
          setDescription(result);
          setViewState(ViewState.Result);
          console.log('[Explore] setDescription and setViewState(Result) called.');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message);
        setViewState(ViewState.Error);
        isLockedRef.current = false;
      }
    }
  }, [mockDataMode, view]);

  /** Initiates the 'Explore' sequence by switching to the camera capture view. */
  const handleStartExplore = () => {
    // Store where we started from
    setPrevViewBeforeExplore(view);
    if (mockDataMode) {
      // In mock mode, just trigger handleCapture with a dummy value; it will handle picking a mock image
      handleCapture('');
    } else {
      setViewState(ViewState.Capturing);
    }
  };
  
  /** Initiates the 'Navigate' sequence by prompting for a destination. */
  const handleStartNavigation = () => {
    setViewState(ViewState.PromptingForDestination);
  };
  
  /** Handles the SOS feature, triggering a phone call to the saved contact. */
  const handleTriggerSos = useSosHandler({
    sosContactName,
    sosContactNumber,
    mockDataMode,
    speak,
    setShowCallingScreen,
    setViewState
  });
  
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
    const savedSosContactName = localStorage.getItem('sosContactName');
    if (savedSosContactName) setSosContactName(savedSosContactName);
    const savedSosContactNumber = localStorage.getItem('sosContactNumber');
    if (savedSosContactNumber) setSosContactNumber(savedSosContactNumber);
    const savedMockDataMode = localStorage.getItem('mockDataMode');
    if (savedMockDataMode !== null) {
      setMockDataMode(JSON.parse(savedMockDataMode));
    }
  }, []);

  useSpeechRecognitionManager({
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
  });

  /** Effect to handle all text-to-speech actions based on the current view state. */
  // Only trigger TTS for Result view when a new description is set
  const lastSpokenDescriptionRef = useRef<string | null>(null);
  useEffect(() => {
    console.log('[Explore] TTS effect:', { view, description, prevViewBeforeExplore });
    if (view === ViewState.Result && description && lastSpokenDescriptionRef.current !== description) {
      lastSpokenDescriptionRef.current = description;
      ttsInProgressRef.current = true;
      console.log('[Explore] TTS: speak() called with description:', description);
      speak(description, () => {
        ttsInProgressRef.current = false;
        console.log('[Explore] TTS: speak() callback fired.');
        setViewState(ViewState.Idle);
        setPrevViewBeforeExplore(null);
        lastSpokenDescriptionRef.current = null;
        isLockedRef.current = false; // UNLOCK after TTS is done or error
      });
    }
    // Reset ref if we leave Result view
    if (view !== ViewState.Result) {
      lastSpokenDescriptionRef.current = null;
    }
    if (view === ViewState.PromptingForDestination) {
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
        isLockedRef.current = false; // UNLOCK on error
      });
    }
  }, [view, description, error, voiceCommandEnabled, resetApp, routeDetails, destination, prevViewBeforeExplore, speak]);
  
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
          const fetchedRoute = await getDirections(startCoords, destination, mockDataMode);
          setRouteDetails(fetchedRoute);
          setViewState(ViewState.AwaitingNavigationConfirmation);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to fetch directions.");
          setViewState(ViewState.Error);
        }
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        setError("Unable to retrieve your location. Please check your location settings.");
        setViewState(ViewState.Error);
      }
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

  const requestPermissions = usePermissions(setPermissionsGranted);

  const handleExploreAgain = () => {
    setViewState(ViewState.ListeningForCommand);
  };

  const renderContent = () => {
    if (showCallingScreen) {
      return <CallingScreen contactName={sosContactName} contactNumber={sosContactNumber} />;
    }
    if (!permissionsGranted) {
      return <PermissionsScreen onGrant={requestPermissions} />;
    }
    return (
      <MainContentRouter
        view={view}
        handleCapture={handleCapture}
        setError={setError}
        setViewState={setViewState}
        description={description}
        handleExploreAgain={handleExploreAgain}
        capturedImage={capturedImage}
        error={error}
        resetApp={resetApp}
        voiceCommandEnabled={voiceCommandEnabled}
        setVoiceCommandEnabled={setVoiceCommandEnabled}
        sosContactName={sosContactName}
        setSosContactName={setSosContactName}
        sosContactNumber={sosContactNumber}
        setSosContactNumber={setSosContactNumber}
        mockDataMode={mockDataMode}
        setMockDataMode={setMockDataMode}
        destination={destination}
        handleCancelNavigation={handleCancelNavigation}
        viewState={view}
        navigationInstruction={navigationInstruction}
        routeDetails={routeDetails}
        handleRequestNavigationalGuidance={handleRequestNavigationalGuidance}
      />
    );
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
