/**
 * @file This file contains shared TypeScript types and global declarations for the application.
 */

/**
 * Represents the different view states of the application.
 * This enum is used to control which UI component is rendered at any given time.
 */
export enum ViewState {
  /** The default state, waiting for user input before the voice loop is active. */
  Idle = 'IDLE',
  /** The app is actively listening for a top-level command like "Explore" or "Navigate". */
  ListeningForCommand = 'LISTENING_FOR_COMMAND',
  /** The app is actively using the camera to capture an image. */
  Capturing = 'CAPTURING',
  /** The app is waiting for a response from the AI service. */
  Loading = 'LOADING',
  /** The AI has returned a result and it is being displayed/spoken. */
  Result = 'RESULT',
  /** An error has occurred and is being displayed to the user. */
  Error = 'ERROR',
  /** The user is viewing the settings screen. */
  Settings = 'SETTINGS',
  /** The app is speaking the prompt for a navigation destination. */
  PromptingForDestination = 'PROMPTING_FOR_DESTINATION',
  /** The app is speaking the prompt for a transit destination (e.g., asking which stop/station). */
  PromptingForTransitDestination = 'PROMPTING_FOR_TRANSIT_DESTINATION',
  /** The app is actively listening for the user to speak a destination. */
  ListeningForDestination = 'LISTENING_FOR_DESTINATION',
  /** The app is actively listening for the user to speak a transit-specific destination. */
  ListeningForTransitDestination = 'LISTENING_FOR_TRANSIT_DESTINATION',
  /** The app is fetching the user's location and calculating a route. */
  FetchingDirections = 'FETCHING_DIRECTIONS',
  /** The app is processing the spoken transit destination and preparing suggestions. */
  ProcessingTransitSuggestion = 'PROCESSING_TRANSIT_SUGGESTION',
  /** The app is waiting for the user to confirm the fetched route. */
  AwaitingNavigationConfirmation = 'AWAITING_NAVIGATION_CONFIRMATION',
  /** The app is actively providing turn-by-turn navigation guidance. */
  NavigationActive = 'NAVIGATION_ACTIVE',
}

/** Represents a geographical coordinate. */
export type Coordinates = {
  latitude: number;
  longitude: number;
};

/** Represents a single step in a navigation route. */
export type DirectionStep = {
  /** The instruction to be spoken to the user. */
  instruction: string;
  /** The geographical coordinate for this step. */
  location: Coordinates;
};

/** Represents the full details of a calculated route. */
export type RouteDetails = {
  /** The display name of the destination. */
  destinationName: string;
  /** The total estimated distance to the destination in meters. */
  totalDistance: number;
  /** The array of turn-by-turn steps for the route. */
  steps: DirectionStep[];
};


/**
 * This block extends the global scope to include types for browser APIs
 * that may not be standard in all TypeScript DOM library versions,
 * such as the Web Speech API.
 * This prevents TypeScript errors when using these APIs.
 */
declare global {
  // Add vendor-prefixed and non-standard properties to the Window interface
  interface Window {
    webkitSpeechRecognition: { new(): SpeechRecognition };
    SpeechRecognition: { new(): SpeechRecognition };
    webkitAudioContext: typeof AudioContext;
  }

  // Types for build environment variables (removed process declaration to avoid conflicts)

  // Types for the Web Speech API
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    grammars: any; // SpeechGrammarList is complex, 'any' is sufficient for this app
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeachend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    abort(): void;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }
  
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }
}