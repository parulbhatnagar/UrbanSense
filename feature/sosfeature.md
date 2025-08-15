# SOS (Emergency Call) Feature

## Summary
Provide a quick, reliable SOS flow that places an emergency call to a saved contact (example: "Dad"). The flow must be accessible via UI (footer button) and voice commands, give clear visual and audio feedback, and support a demo mode that simulates an outgoing call to the emergency contact for testing and demos.

## Goals
- Allow users to quickly trigger an SOS call with a single action (button or voice).
- Confirm intent before placing a real call (spoken confirmation + brief opportunity to cancel).
- Provide a safe demo mode that simulates the call flow without making a real phone call.
- Ensure clear accessibility (screen reader announcements, large controls, high-contrast visuals).

## User Stories
- As a user, I can press an SOS button to start an emergency call to my saved contact.
- As a user, I can trigger SOS by voice ("help", "emergency", "call my emergency contact").
- As a user, I hear a spoken confirmation and can cancel in the short window before the call is placed.
- As a tester, I can enable demo mode to preview the full call flow without dialing.

## UX / Screens
1. SOS Footer Button (always visible when not in Calling screen)
   - Large, high-contrast icon and label.
   - Pressing opens a confirmation TTS prompt: "Do you want to call your emergency contact, Dad? Say yes to confirm or no to cancel." 
   - Screen shows contact name and number and two large buttons: Confirm (call) and Cancel.

2. Confirmation Screen (modal or full-screen)
   - Visual: Contact card with avatar/initials, contact name (e.g., "Dad"), contact number, and a prominent red "Call" button and a gray "Cancel" button.
   - Audio: TTS prompt asking for confirmation. If voice commands are enabled, the app will listen for "yes"/"no".

3. Calling Screen (demo & real)
   - Visual: `CallingScreen` component (already present). Shows calling animation, contact name "Dad", and a cancel/hang-up control.
   - Audio: Short TTS: "Calling Dad" on start, "Call connected" when simulated connection (demo mode), and optionally status updates.
   - In real mode the app will attempt to invoke the platform's call mechanism (or present the number to the user); in demo mode the flow is fully simulated in-app.

4. End/Failure states
   - If the call fails or the user cancels, TTS should inform: "Call cancelled" or "Call failed" and return to Idle.

## Voice / TTS Flow
- Trigger (button or voice) → speak: "Do you want to call your emergency contact, Dad? Say yes to confirm or no to cancel." → Start safe recognition for a short window (3–5s).
- If user says "yes" (or taps Confirm): speak "Calling Dad" → show CallingScreen → in demo mode, after 1–2s speak "Call connected" and show connected state, then allow the user to end call.
- If user says "no" (or taps Cancel): speak "Cancelled" → return to Idle.
- Use the app's existing TTS queue + recognition manager to avoid races and ensure the confirmation listener starts after TTS completes.

## Demo Mode Behavior
- When `mockDataMode` is enabled (or a dedicated `demoMode`), the SOS flow simulates the call:
  - No real telephony action is taken.
  - The Calling screen shows an animated connection sequence and then a connected state.
  - TTS announces connection and provides an option to "End Call" which returns to Idle.
- Demo contact for the document: name: "Dad", number: "+91 98765 43210" (used only for demonstration; do not store real emergency numbers in repository).

## Accessibility
- All statuses announced via ARIA live regions and TTS.
- Buttons large and reachable; color contrast checked against WCAG AA.
- Voice confirmation available for users who rely on speech.

## Data & Privacy
- The app stores the emergency contact locally (localStorage) and uses it only for call initiation; contacts are not uploaded to any server.
- Demo data should never be treated as real. Indicate clearly on the UI when the app is in Demo Mode.

## Implementation Notes
- Reuse `CallingScreen` component for visual display.
- Reuse `useSosHandler` (exists) to centralize call logic; ensure it supports a `demo` flag and a `contact` parameter.
- Use the existing TTS (`speak`) and recognition wrapper to manage confirmation flow and avoid race conditions.
- Provide unit / integration test cases for: confirmation prompt, user says "yes" path (demo and real), user says "no" path, and cancel during call.

## Acceptance Criteria
- Pressing SOS and confirming results in the Calling screen showing contact "Dad" and TTS announces the call.
- In demo mode the app simulates connection and announces "Call connected"; ending the call returns app to Idle.
- If confirmation is canceled (voice or tap), the app cancels and returns to Idle.
- No real network requests or phone calls occur in demo mode.

## Demo Screen Mock (for designers/devs)
- Screen title: "Calling Dad"
- Subtext: "+91 98765 43210"
- Primary action: Red circular hang-up / end call button
- Secondary action: Silent / Mute microphone toggle (optional)
- Visual hint: "DEMO MODE" banner when mock mode is enabled

---

Place this file at `feature/sosfeature.md`. For a quick local demo, enable `mockDataMode` in Settings (or via localStorage) and trigger the SOS button in the footer; you should see the Calling screen and hear simulated TTS messages for the demo contact (Dad).
