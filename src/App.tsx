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
  const _rawSpeak = useSpeechSynthesis();
  const [isTtsActive, setIsTtsActive] = useState(false);
  // Queue for TTS to avoid overlapping utterances causing 'interrupted' errors
  const ttsQueueRef = useRef<Array<{ text: string; onEnd?: () => void }>>([]);

  // track last spoken text/time to help dedup and avoid replays
  const lastSpokenTextRef = useRef<string | null>(null);
  const lastSpokenAtRef = useRef<number>(0);

  // Normalization used for TTS dedup checks (strip punctuation, step numbering, collapse white space)
  const normalizeForDedup = (s: string) => s.replace(/step\s*\d+[:.]*/ig, '')
    .replace(/[^\w\s]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();

  // Keep a set of normalized texts currently queued to avoid duplicate enqueues
  const ttsQueuedNormsRef = useRef<Set<string>>(new Set());

  const speakNow = useCallback((text: string, onEnd?: () => void) => {
    // mark in-progress and record last spoken info
    ttsInProgressRef.current = true;
    setIsTtsActive(true);
    lastSpokenTextRef.current = text;
    lastSpokenAtRef.current = Date.now();
    const norm = normalizeForDedup(text);
    // remove norm from queued set if present (we are now speaking it)
    ttsQueuedNormsRef.current.delete(norm);

    console.debug('[TTS-WRAP] starting speech, text:', text);
    _rawSpeak(text, () => {
      console.debug('[TTS-WRAP] speech ended for text:', text);
      ttsInProgressRef.current = false;
      setIsTtsActive(false);
      try { onEnd?.(); } catch (e) { console.error('[TTS-WRAP] onEnd callback failed', e); }
      // process next queued utterance if any
      const next = ttsQueueRef.current.shift();
      if (next) {
        // slight delay to let browser settle
        setTimeout(() => speakNow(next.text, next.onEnd), 120);
      }
    });
  }, [_rawSpeak]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    const now = Date.now();
    const norm = normalizeForDedup(text);

    // Deduplicate: if same normalized text was spoken very recently, skip
    if (lastSpokenTextRef.current && normalizeForDedup(lastSpokenTextRef.current) === norm && (now - (lastSpokenAtRef.current || 0) < 5000)) {
      console.debug('[TTS-WRAP] skipping speak: identical normalized text spoken recently', text);
      setTimeout(() => onEnd?.(), 0);
      return;
    }

    // If already queued (normalized), skip adding duplicate
    if (ttsQueuedNormsRef.current.has(norm)) {
      console.debug('[TTS-WRAP] skipping enqueue: normalized text already in queue', text);
      return;
    }

    // If TTS already in progress, enqueue the request to avoid interruption
    if (ttsInProgressRef.current) {
      console.debug('[TTS-WRAP] TTS busy, enqueueing text:', text);
      ttsQueuedNormsRef.current.add(norm);
      ttsQueueRef.current.push({ text, onEnd });
      return;
    }
    // otherwise speak immediately
    speakNow(text, onEnd);
  }, [speakNow]);

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

  /** Initiates the 'Transit' sequence by prompting for a transit destination (audio-driven). */
  const handleStartTransit = () => {
    setViewState(ViewState.PromptingForTransitDestination);
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

  // Wrapper to simulate SOS call in demo/mock mode, otherwise delegate to real handler
  const triggerSos = useCallback(() => {
    const demoName = 'Dad';
    const demoNumber = '+91 98765 43210';
    if (mockDataMode) {
      console.debug('[SOS Demo] Simulating SOS call to', demoName);
      // Set demo contact info and show calling screen
      setSosContactName(demoName);
      setSosContactNumber(demoNumber);
      setShowCallingScreen(true);

      // Announce calling and then simulate connection
      speak(`Calling ${demoName}`, () => {
        // after short delay announce connected
        setTimeout(() => {
          speak('Call connected. To end the call, press the hang up button.');
          console.debug('[SOS Demo] Simulated call connected');
        }, 1200);
      });
    } else {
      // Delegate to the real SOS handler which may perform actual dialing or platform-specific behavior
      try {
        handleTriggerSos();
      } catch (err) {
        console.error('[SOS] real handler failed', err);
      }
    }
  }, [mockDataMode, handleTriggerSos, speak]);
  
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

  const recognitionRef = useSpeechRecognitionManager({
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
    ttsActive: isTtsActive,
  });

  /** Effect to handle all text-to-speech actions based on the current view state. */
  // Only trigger TTS for Result view when a new description is set
  const lastSpokenDescriptionRef = useRef<string | null>(null);
  useEffect(() => {
    console.log('[Explore] TTS effect:', { view, description, prevViewBeforeExplore });
    if (view === ViewState.Result && description && lastSpokenDescriptionRef.current !== description) {
      lastSpokenDescriptionRef.current = description;
      // NOTE: do NOT manually set ttsInProgressRef here — speak() / speakNow will manage that flag.
      console.log('[Explore] TTS: speak() called with description:', description);
      speak(description, () => {
        // speak's onEnd should clear the in-progress flag; ensure we clear any lingering state here as well.
        ttsInProgressRef.current = false;
        console.log('[Explore] TTS: speak() callback fired.');
        // Clear any pending queued utterances to avoid replaying the same description after returning to Idle
        if (ttsQueueRef.current.length > 0) {
          console.debug('[TTS-WRAP] clearing pending TTS queue on Result end, length:', ttsQueueRef.current.length);
          ttsQueueRef.current = [];
        }
        if (ttsQueuedNormsRef.current.size > 0) {
          console.debug('[TTS-WRAP] clearing queued normalized texts on Result end, size:', ttsQueuedNormsRef.current.size);
          ttsQueuedNormsRef.current.clear();
        }
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
    } else if (view === ViewState.PromptingForTransitDestination) {
      console.debug('[TTS] Prompting for transit destination');
      speak("Where do you want to go?", () => {
        setViewState(ViewState.ListeningForTransitDestination);
      });
    } else if (view === ViewState.ProcessingTransitSuggestion) {
      console.debug('[TTS] Processing transit suggestion for destination:', destination);
      // Simple mock suggestion logic for Delhi
      const destLower = (destination || '').toLowerCase();
      let suggestion = '';
      if (mockDataMode || destLower.includes('delhi') || destLower.includes('chandni') || destLower.includes('rajiv')) {
        if (destLower.includes('chandni') || destLower.includes('chandni chowk')) {
          suggestion = 'You can take the Delhi Metro from Rajiv Chowk to Chandni Chowk on the Yellow Line.';
        } else {
          suggestion = `You can take the Delhi Metro from Rajiv Chowk to ${destination} on the Yellow Line.`;
        }
      } else {
        suggestion = `Sorry, transit suggestions are not available for ${destination} yet.`;
      }
      // Speak suggestion and return to Idle
      speak(suggestion, () => {
        console.debug('[TTS] Finished speaking transit suggestion');
        setViewState(ViewState.Idle);
        setDestination('');
      });
     } else if (view === ViewState.AwaitingNavigationConfirmation && routeDetails) {
       const confirmationMessage = `I found ${routeDetails.destinationName}, which is about ${routeDetails.totalDistance} away. Do you want to proceed?`;
       // Speak the confirmation and then explicitly start recognition to listen for the user's yes/no answer
       speak(confirmationMessage, () => {
         console.debug('[TTS] confirmation spoken, attempting to start recognition for confirmation');
         try {
           // small delay to ensure recognition is ready
           setTimeout(() => {
             try {
               recognitionRef.current?.start();
               console.debug('[SR] recognition.start() called after confirmation TTS');
             } catch (err) {
               console.error('[SR] recognition.start() failed after confirmation TTS', err);
             }
           }, 150);
         } catch (e) {
           console.error('[TTS] failed to trigger recognition after confirmation', e);
         }
       });
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

    // If mockDataMode is enabled, assume a fixed Delhi coordinate (Connaught Place / Rajiv Chowk area)
    const fetchRoute = async () => {
      try {
        let startCoords: Coordinates;
        if (mockDataMode) {
          startCoords = { latitude: 28.6329, longitude: 77.2195 };
          console.debug('[Nav] Mock mode: using Delhi start coords', startCoords);
        } else {
          // Wrap geolocation in a promise for cleaner async flow
          const pos: GeolocationPosition = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          startCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        }
        const fetchedRoute = await getDirections(startCoords, destination, mockDataMode);
        setRouteDetails(fetchedRoute);
        setViewState(ViewState.AwaitingNavigationConfirmation);
      } catch (err) {
        console.error('[Nav] fetchRoute error', err);
        setError(err instanceof Error ? err.message : "Failed to fetch directions.");
        setViewState(ViewState.Error);
      }
    };

    fetchRoute();

    return () => {
      if (locationWatcherId.current) navigator.geolocation.clearWatch(locationWatcherId.current);
    };
  }, [view, routeDetails, currentStepIndex, handleCancelNavigation]);

  const requestPermissions = usePermissions(setPermissionsGranted);

  const handleExploreAgain = () => {
    setViewState(ViewState.ListeningForCommand);
  };

  // Demo navigation images (simulate movement by swapping images between steps)
  const demoNavImages = [
    '/testData/Delhi-Chandni-Chowk-cycle-rickshaw-drivers-at-end-of-street-scaled.jpeg', // starting street view
    '/testData/people-standing-at-a-local-bus-stand-in-new-delhi-waiting-for-public-transport-2D8RF54.jpeg', // mid approach
    '/testData/delhi/MedicalStroe.png', // final medical store photo
  ];

  // State for the currently displayed demo navigation image and the LLM-generated caption/explanation
  const [navigationDemoImage, setNavigationDemoImage] = useState<string | undefined>(undefined);
  const [navigationDemoCaption, setNavigationDemoCaption] = useState<string | undefined>(undefined);

  // Guard to avoid speaking the same demo step multiple times
  const lastSpokenStepRef = useRef<number | null>(null);

  // Helper: generate an explanatory caption for a demo image + instruction using the image analysis service
  const generateImageExplanation = useCallback(async (imageUrl: string, instruction: string) => {
    try {
      const { base64, mimeType } = await fetchImageAsBase64(imageUrl);
      if (!base64) return undefined;
      // imageAnalysisService.generateNavigationalGuidance expects an image (base64 or File) and an instruction
      const explanation = await imageAnalysisService.generateNavigationalGuidance(base64, instruction);
      return explanation;
    } catch (err) {
      console.error('[Nav Demo] generateImageExplanation failed', err);
      return undefined;
    }
  }, []);

  // Helpers to normalize and merge instruction + LLM explanation to avoid near-duplicate speech
  const normalizeText = (s: string) => s
    .replace(/step\s*\d+[:.]*/ig, '')
    .replace(/[^\w\s]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const mergeInstructionAndExplanation = (instruction: string, explanation?: string) => {
    if (!explanation || explanation.trim().length === 0) return instruction;
    const instrNorm = normalizeText(instruction);
    const explNorm = normalizeText(explanation);
    if (!instrNorm) return explanation;
    if (!explNorm) return instruction;
    if (explNorm.includes(instrNorm)) return explanation; // explanation already contains instruction
    if (instrNorm.includes(explNorm)) return instruction; // instruction already contains explanation
    return `${instruction}. ${explanation}`;
  };

  // NEW: demo navigation step progression handler. In mockDataMode we will step through routeDetails.steps
  // and swap demo images between steps. We generate an LLM explanation for the current image + instruction
  // and speak a single composed utterance (instruction + explanation) once per step. On the tap after the last step, we announce arrival.
  const speakDemoStep = useCallback(async (stepIndex: number) => {
    if (!routeDetails || stepIndex >= routeDetails.steps.length) return;
    // Prevent re-speaking the same step if it was already spoken
    if (lastSpokenStepRef.current === stepIndex) {
      console.debug('[Nav Demo] speakDemoStep: step already spoken, skipping', stepIndex);
      return;
    }

    const step = routeDetails.steps[stepIndex];
    const imageUrl = demoNavImages[stepIndex] || demoNavImages[0];
    setNavigationInstruction(step.instruction);
    setNavigationDemoImage(imageUrl);
    console.debug('[Nav Demo] preparing step:', stepIndex, 'instruction:', step.instruction, 'image:', imageUrl);

    const explanation = await generateImageExplanation(imageUrl, step.instruction);
    setNavigationDemoCaption(explanation);

    // Compose a single final utterance after de-duplication
    const finalText = mergeInstructionAndExplanation(step.instruction, explanation);
    console.debug('[Nav Demo] final speech text for step', stepIndex, ':', finalText);

    // mark as spoken before enqueuing to prevent races causing duplicate enqueues
    lastSpokenStepRef.current = stepIndex;
    speak(finalText);
  }, [routeDetails, generateImageExplanation, speak]);

  const handleDemoNavigationTap = useCallback(async () => {
    if (!routeDetails) return;

    // If there are steps left, speak next step (which will also update the image/caption)
    if (currentStepIndex < routeDetails.steps.length) {
      await speakDemoStep(currentStepIndex);
      // advance the index so the next tap moves forward
      setCurrentStepIndex(idx => idx + 1);
    } else {
      // No more steps -> arrival announcement and show the medical store image
      const arrival = `You have arrived at ${routeDetails.destinationName || 'your destination'}.`;
      console.debug('[Nav Demo] announcing arrival:', arrival);
      const finalImage = demoNavImages[demoNavImages.length - 1];
      setNavigationDemoImage(finalImage);

      // generate a short caption for the final image (medical store) as well
      try {
        const finalCaption = await generateImageExplanation(finalImage, 'Front view of the destination.');
        setNavigationDemoCaption(finalCaption);
      } catch (e) {
        setNavigationDemoCaption(undefined);
      }

      // reset spoken-step guard so the next navigation session can speak from step 0 again
      lastSpokenStepRef.current = null;

      speak(arrival, () => {
        setViewState(ViewState.Idle);
        setRouteDetails(null);
        setCurrentStepIndex(0);
        setNavigationInstruction('');
        setNavigationDemoImage(undefined);
        setNavigationDemoCaption(undefined);
      });
    }
  }, [routeDetails, currentStepIndex, speakDemoStep, speak, generateImageExplanation]);

  // When navigation becomes active in mock mode, automatically show/speak the first demo step
  useEffect(() => {
    if (view === ViewState.NavigationActive && mockDataMode && routeDetails) {
      // Initialize to start and speak the first step, then advance index so tap doesn't repeat it
      setCurrentStepIndex(0);
      (async () => {
        try {
          await speakDemoStep(0);
          setCurrentStepIndex(1);
        } catch (err) {
          console.error('[Nav Demo] initial speakDemoStep failed', err);
        }
      })();
    }
  }, [view, mockDataMode, routeDetails, speakDemoStep]);

  const handleHangUp = useCallback(() => {
    console.debug('[SOS] hang up pressed');
    // Stop any active speech synthesis / recognition and return app to Idle
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.debug('[SOS] speechSynthesis.cancel failed', e);
    }
    try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }

    setShowCallingScreen(false);
    setViewState(ViewState.Idle);
    setSosContactName('');
    setSosContactNumber('');
  }, []);

  const renderContent = () => {
    if (showCallingScreen) {
      return <CallingScreen contactName={sosContactName} contactNumber={sosContactNumber} demoMode={mockDataMode} onHangUp={handleHangUp} />;
    }
    if (!permissionsGranted) {
      return <PermissionsScreen onGrant={requestPermissions} />;
    }
    return (
      <MainContentRouter
        onSettingsClick={() => setViewState(ViewState.Settings)}
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
        handleRequestNavigationalGuidance={mockDataMode ? handleDemoNavigationTap : handleRequestNavigationalGuidance}
        navigationImage={mockDataMode ? navigationDemoImage : undefined}
        navigationImageCaption={mockDataMode ? navigationDemoCaption : undefined}
      />
    );
  };

  const showFooter = ![ViewState.Settings, ViewState.NavigationActive, ViewState.Capturing].includes(view);

  return (
    <main className="flex flex-col h-screen bg-brand-dark text-brand-light font-sans" aria-live="assertive">
      {/* Fixed settings button in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setViewState(ViewState.Settings)}
          className="bg-brand-gray/80 hover:bg-brand-gray/90 p-2 rounded-full shadow-lg"
          aria-label="Open settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.807-.272-1.204-.107-.397.165-.71-.505-.78-.929l-.15-.894c-.09-.542-.56-.94-1.109.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.929-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.383.929-.78.165-.398.142-.854-.108-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.774-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.149-.894z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="flex-grow flex flex-col">{renderContent()}</div>

      {showFooter && (
        <AppFooter
          onExploreClick={handleStartExplore}
          onTransitClick={handleStartTransit}
          onNavigateClick={handleStartNavigation}
          onSosClick={triggerSos}
        />
      )}
    </main>
  );
};

export default App;
