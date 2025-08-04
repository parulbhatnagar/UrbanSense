# UrbanSense

**A voice-first mobile assistant for the visually impaired.**

UrbanSense is a mobile web application designed to help visually impaired users gain a better understanding of their immediate surroundings and navigate their environment. Through a simple, high-contrast interface and powerful voice commands, it provides real-time spatial awareness and navigational assistance.

## Core Features

-   **Voice-First Interface**: After an initial tap, the app enters a continuous listening loop, allowing for a completely hands-free experience.
-   **Explore Mode**: Say "Explore" to have the app capture your surroundings. The Gemini AI analyzes the image and provides a concise description of key objects, their positions, and their approximate distances.
-   **Advanced Navigation**:
    -   **Conversational Start**: Say "Navigate" and the app will ask for your destination. It uses OpenStreetMap to find real-world locations.
    -   **Destination Confirmation**: The app confirms the name and distance of the location found and asks for your confirmation before starting.
    -   **Combined Guidance**: During navigation, the app provides a turn-by-turn instruction. You can tap the screen at any time to get enhanced, on-demand guidance that combines the directional instruction with a real-time visual analysis of your path for obstacles and safety information.
-   **SOS Emergency Call**: Say "SOS" or tap the dedicated button to initiate a phone call to a pre-configured emergency contact.
-   **Customizable Settings**: A dedicated settings screen allows you to enable/disable voice commands and set your emergency SOS contact number.
-   **Accessibility-Focused Design**: The app features a high-contrast, minimalist UI, large tappable areas, and full audio feedback for all actions.
-   **Modular Architecture**: The AI service is decoupled, making it easy to swap AI models. (See `MODEL_SWAP_GUIDE.md`).

## User Flow

1.  **Launch & Activate**: The user opens the app and taps the large "Tap to Speak" button to start the voice command loop.
2.  **Explore**: The user says "Explore." The app captures a photo, displays it in the background, and speaks a description of the scene. It then returns to listening.
3.  **Navigate**:
    -   The user says "Navigate."
    -   The app asks, "Where would you like to go?"
    -   The user replies, e.g., "Nearest pharmacy."
    -   The app finds the location and confirms, "I found 'Community Pharmacy', which is about 200 meters away. Do you want to proceed?"
    -   The user says "Yes."
    -   The app enters navigation mode, provides the first instruction, and waits for the user to tap for the next visual update.
4.  **Trigger SOS**: The user says "SOS." The app confirms it is calling the emergency contact and opens the phone dialer.

## Technical Stack

-   **Frontend**: React (v19) with TypeScript
-   **Styling**: Tailwind CSS
-   **AI Model**: Google Gemini 2.5 Flash
-   **Maps & Location**: OpenStreetMap (Nominatim for search, OSRM for routing), Browser's Geolocation API
-   **Speech-to-Text**: Browser's native Web Speech API (`SpeechRecognition`)
-   **Text-to-Speech**: Browser's native Web Speech API (`SpeechSynthesis`)
-   **Permissions**: The app requests camera, microphone, and geolocation permissions.
-   **API Keys**: Requires a Google Gemini API key (set in `index.html`). No key is needed for mapping services.