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
    if (mockDataMode) {
      // Pick a random mock image and send it to the LLM for description
      const idx = Math.floor(Math.random() * mockExploreImages.length);
      const mockImage = mockExploreImages[idx];
      setCapturedImage(mockImage); // Set the mock image as the background
      setViewState(ViewState.Loading);
      try {
        const { base64: mockBase64, mimeType } = await fetchImageAsBase64(mockImage);
        if (!mockBase64 || !mockBase64.startsWith('data:image/')) {
          throw new Error('Failed to load mock image or convert to base64.');
        }
        console.log('Mock image base64:', mockBase64.substring(0, 100)); // Log first 100 chars
        const result = await imageAnalysisService.analyzeImage({ base64Image: mockBase64, mimeType });
        setDescription(result);
        setViewState(ViewState.Result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message);
        setViewState(ViewState.Error);
      }
    } else {
      setCapturedImage(base64Image); // Set the real camera image as the background
      setViewState(ViewState.Loading);
      try {
        const result = await imageAnalysisService.analyzeImage({ base64Image });
        setDescription(result);
        setViewState(ViewState.Result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message);
        setViewState(ViewState.Error);
      }
    }
  }, [mockDataMode]);

  /** Initiates the 'Explore' sequence by switching to the camera capture view. */
  const handleStartExplore = () => {
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
  useEffect(() => {
    if (view === ViewState.Result && description) {
      // Only move to Idle after audio finishes
      speak(description, () => {
        setViewState(ViewState.Idle);
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
