# Transit Feature Design

## Overview
The Transit feature in UrbanSense provides users with public transport recommendations based on their current city and location. It supports both real and mock modes for demo and development purposes.

---

## Modes of Operation

### 1. Mock Mode
- **Assumed Location:** New Delhi
- **Supported Transport Systems:**
  - **Delhi Metro**
    - Example stations: Rajiv Chowk, Chandni Chowk, Kashmere Gate, Central Secretariat
    - Metro lines and interchange info
  - **Delhi State Bus (DTC)**
    - Example bus numbers: 534, 615, 522A, 740
    - Example bus stops: ISBT Kashmere Gate, Connaught Place, AIIMS, Lajpat Nagar
- **Behavior:**
  - The app ignores the device's real location and assumes the user is in New Delhi.
  - When the user requests transit suggestions, the app randomly selects from Delhi Metro and DTC bus options, providing realistic station/bus stop and route details.
  - Example output:
    - "You can take the Delhi Metro from Rajiv Chowk to Chandni Chowk on the Yellow Line."
    - "Board DTC Bus 534 from ISBT Kashmere Gate to Lajpat Nagar."

### 2. Real Scenario
- **Location Source:** Device geolocation service
- **Behavior:**
  - The app fetches the user's current coordinates using the browser/device location API.
  - It determines the city and available public transport systems for that location.
  - Provides transit suggestions relevant to the user's actual city and nearby stations/stops.
  - Example output:
    - If in New York: "Take the MTA Subway from Times Square to Grand Central on the 7 train."
    - If in Delhi: "Board DTC Bus 615 from Connaught Place to AIIMS."

---

## User Flow
1. User triggers Transit via the footer button or by saying a voice command like "Transit".
2. The app asks (voice + visual): "Where do you want to go?"
3. User responds by naming a place or destination.
4. The app looks up available transport options (Delhi Metro, DTC bus, or local system in real mode) to reach the named destination.
5. The app responds with a spoken and visual recommendation, including:
   - Transport type (metro, bus, etc.)
   - Route/station/bus number
   - Estimated travel time (if available)
6. After providing the recommendation, the app returns to the home (Idle) screen.

### Voice example (exact dialog)
- User: "Transit"
- App: "Where do you want to go?"
- User: "Chandni Chowk"
- App: "You can take the Delhi Metro from Rajiv Chowk to Chandni Chowk on the Yellow Line."

Notes:
- Voice command activation must work both via the top-level voice loop (e.g., when the app is ListeningForCommand) and via tapping the Transit footer button which starts the same audio-driven flow.
- If speech recognition is not available or microphone permissions are denied, the app should fall back to the typed TransitView UI so users can enter a destination manually.

---

## Data Sources
- **Mock Mode:** Hardcoded lists of Delhi Metro stations and DTC bus routes.
- **Real Mode:**
  - Geolocation API for coordinates
  - (Future) Integration with city transit APIs for live data

---

## Accessibility
- All suggestions are provided via text and TTS for visually impaired users.
- Simple, clear instructions and route details.

---

## Future Enhancements
- Real-time arrival and departure info via city transit APIs
- Support for more cities and transport types
- Multi-modal trip planning (e.g., metro + bus)
- Fare estimates and accessibility info for each route
