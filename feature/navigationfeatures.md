# Navigation Feature Design

## Overview
The Navigation feature provides step‑by‑step routing and contextual guidance to help users travel safely and independently. It supports both quick on‑demand routing (point‑to‑point) and active turn‑by‑turn guidance with voice prompts and visual feedback.

This document describes user flows, voice interactions, required data sources, UI states, accessibility considerations, error handling, and suggested telemetry for monitoring.

---

## Modes of Operation

### Mock Mode
- Uses precomputed routes and deterministic responses for testing and demos.
- Allows QA and demo teams to validate UI and voice flows without hitting external routing APIs.
- Example: "Walk 200 meters, then turn left to enter the market lane."

### Real Mode
- Uses device geolocation APIs and external routing services (e.g., Google Maps Directions API, Mapbox, OSRM) to compute routes and turn‑by‑turn steps.
- Supports different travel modes (walking, public transit directions integration is handled by Transit feature).

---

## Key View States (map to app ViewState enum)
- PromptingForDestination — TTS prompt asking the user where they want to go.
- ListeningForDestination — Microphone active, waiting for destination name.
- FetchingDirections — Retrieving route from current coordinates to destination.
- AwaitingNavigationConfirmation — App describes route summary and asks user to confirm.
- NavigationActive — Active turn‑by‑turn guidance is in progress.
- NavigationPaused / Cancelled — (Optional) paused or cancelled guidance.

---

## User Flows

### 1) Quick Route Request (voice or tap)
1. User says "Navigate" or taps the Navigate button.
2. App: "Where would you like to go?" (TTS) and transitions to ListeningForDestination.
3. User names a destination (e.g., "Central Library").
4. App fetches the user's current coordinates via Geolocation API and requests directions from the routing provider (FetchingDirections).
5. App: "I found Central Library, 850 meters away. Do you want to start navigation?" (AwaitingNavigationConfirmation).
6. User confirms by saying "Yes" or tapping confirm.
7. App begins NavigationActive and provides an introductory instruction, then speaks each step as the user approaches it.
8. On arrival, app announces arrival and returns to Idle.

### 2) Active Guidance (in‑trip)
- The app continuously monitors position and announces upcoming steps and distances.
- Supports requests like "Repeat instruction", "Where am I?", "How far to destination?", and "Cancel navigation".

---

## Voice Commands (examples)
- "Navigate" — start the routing flow.
- "Navigate to <place>" — shortcut to start fetching directions immediately.
- "Yes" / "Start" — confirm a suggested route.
- "No" / "Cancel" — cancel the route suggestion or active guidance.
- "Repeat" — repeat the last instruction.
- "Where am I?" — provide nearby landmark / street name.

---

## UI & Information Design
- Route summary should be short and explicit: destination name, distance, estimated time.
- During NavigationActive show: current instruction, distance to next turn, estimated remaining distance and ETA.
- Provide large, high‑contrast controls for cancel and request update.
- Visual transcript area for recent voice interactions (supports deaf users and debugging).

---

## Data Sources & Integrations
- Geolocation API (device) — high frequency position updates for active guidance.
- Routing API — directions provider for walking routes and alternatives.
- Optional: Map matching service to snap GPS to roads / paths.
- Optional: Transit APIs for multimodal routing (integration with Transit feature in future).

---

## Error Handling & Fallbacks
- If geolocation unavailable: speak "Unable to determine your location. Please enable location services." and fall back to typed input.
- If routing API fails: speak "Unable to find a route right now. Try again later." and return to Idle.
- If microphone permission denied: fall back to typed destination input UI.
- Handle intermittent GPS by re‑computing route or providing instructions to move to an open area.

---

## Accessibility
- Full TTS narration for all route prompts and navigation steps.
- Speech first design: every important action available via voice.
- Haptic/confirmation feedback for step transitions and arrival.
- Large, simple UI controls for confirm/cancel and requesting updates.
- Low‑bandwidth mode: reduce frequency of position updates and shorten TTS messages.

---

## Telemetry & Success Metrics
- Route request success rate (route found vs. requested).
- Navigation start rate (confirmed and began navigation).
- User cancellations and failure reasons (GPS, network, permissions).
- Average time to first route spoken and time to confirmation.

---

## Privacy & Security
- Minimize location retention; do not persist precise tracks unless user opts in.
- Encrypt all requests to routing providers.
- Offer a privacy mode that rounds or obfuscates reported location.

---

## Testing Notes
- Validate voice flows in noisy and quiet environments.
- Test GPS behavior indoors vs outdoors and low‑signal contexts.
- Integration tests for routing provider responses and fallback handling.

---

## Future Enhancements
- Offline routing using embedded graph data for common cities.
- Multimodal routing (walk + transit) with integrated transit schedules.
- Lane guidance and crosswalk awareness for complex intersections.
- Shared route handoff to caregivers or emergency contacts.

---

## Demo Flow — Delhi: Nearest Medical Shop
This demo flow assumes the app is in Mock Mode (or the device is physically located in central Delhi) and demonstrates the end-to-end voice interaction for finding the nearest medical shop.

1. Context: App is Idle and voice commands are enabled. Mock mode assumes current location ~ Connaught Place / Rajiv Chowk area.
2. User: "Navigate" or simply "Find medical shop" (top-level voice loop).
3. App (TTS + UI): "Where would you like to go?" — transitions to `PromptingForDestination` then `ListeningForDestination` (or directly to `ListeningForCommand` in a single-shot flow).
4. User: "Nearest medical shop" or "medical shop near me".
5. App: Recognizes destination -> sets `destination = 'medical shop'` and enters `FetchingDirections`.
6. App (mock): Uses pre-defined local POI data for Delhi and returns the nearest medical shop (e.g., "City Pharmacy — 120 meters away, near Gate 3, Connaught Place").
7. App (TTS + UI) in `AwaitingNavigationConfirmation`: "I found City Pharmacy, about 120 meters away. Do you want to start navigation?"
8. User: "Yes".
9. App: `NavigationActive` begins. Initial instruction spoken: "Walk straight for 100 meters, then turn left. City Pharmacy will be on your right." The UI shows current instruction, remaining distance and an option to cancel.
10. Arrival: App announces "You have arrived at City Pharmacy" and returns to Idle.

Notes for demo testing
- Mock mode returns deterministic nearby POI names and distances for repeatable demos.
- TTS and recognition logs will show [TTS] and [SR] prefixes in the console for debugging.
- If microphone permission is denied in the browser, testers should use the typed destination input and observe identical wording in suggestions.

---

End of document.
