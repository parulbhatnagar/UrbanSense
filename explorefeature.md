# Explore Feature: User Interaction Flow

This document describes the user interaction for the "Explore" feature in both mock and non-mock (real) modes in the UrbanSense app.

---

## 1. Overview

The Explore feature allows users to analyze their surroundings using the device camera. The app provides an audio and visual description of the captured scene. The flow differs slightly depending on whether the app is in mock mode (for testing/demo) or non-mock mode (real camera capture).

---

## 2. Explore Flow (Non-Mock Mode)

**Entry Point:**
- User can start Explore in two ways:
  1. Tapping the "Explore" button on the main screen.
  2. Tapping anywhere on the main window and saying the keyword "Explore" (voice command).

**Steps:**
1. The app transitions to the camera capture view (`ViewState.Capturing`).
2. The app automatically captures a photo (the user simply points the camera in the desired direction; no manual capture is needed).
3. The app shows a loading screen (`ViewState.Loading`) while analyzing the image.
4. Once analysis is complete:
    - The app transitions to the result view (`ViewState.Result`).
    - The captured image is displayed as the background.
    - The description is shown on screen.
    - The description is spoken aloud using text-to-speech (TTS).
5. After the audio finishes, the app returns to the same place where the Explore feature was started, marking the end of the flow.

**Notes:**
- The user cannot trigger another Explore until the audio finishes.
- If an error occurs, the app transitions to the error view and provides feedback.

---

## 3. Explore Flow (Mock Mode)

**Entry Point:**
- User taps the "Explore" button on the main screen (with mock mode enabled in settings).

**Steps:**
1. The app randomly selects a mock image from the test data set.
2. The app shows a loading screen (`ViewState.Loading`) while analyzing the mock image.
3. Once analysis is complete:
    - The app transitions to the result view (`ViewState.Result`).
    - The mock image is displayed as the background.
    - The description is shown on screen.
    - The description is spoken aloud using text-to-speech (TTS).
4. After the audio finishes, the app returns to the idle/listening state (`ViewState.Idle`).

**Notes:**
- The user experience is identical to real mode, except the image and description are from a predefined set.
- Used for testing/demo without requiring a real camera or live AI service.

---

## 4. Error Handling
- If image analysis fails, the app transitions to the error view and provides an error message (spoken and on screen).
- The user can reset to try again.

---

## 5. Accessibility
- All transitions are announced via TTS.
- The app is keyboard and screen reader accessible.

---


---

## 7. Conversation Mode Example

When using Explore via voice command, the app displays a conversation-like transcript on the window:

```
User: Explore
App: [Description of surroundings is shown here and spoken aloud]
```

The app will show the user's command and the app's spoken response as text, improving clarity and accessibility.

---

## 6. Developer Notes
- The Explore flow is atomic: the app does not allow new actions until the current analysis and audio are complete.
- State transitions are managed to prevent double audio or skipped results.
- Mock mode can be toggled in the Settings screen.
