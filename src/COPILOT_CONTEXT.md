# UrbanSense Copilot Context

## Project Overview
- **App Name:** UrbanSense
- **Stack:** Vite + React + TypeScript + Tailwind CSS
- **Main App File:** `src/App.tsx`
- **Component Directory:** `src/components/`
- **App Logic Directory:** `src/appLogic/`
- **Services Directory:** `src/services/`
- **Test Data:** `public/testData/` (with city-specific subfolders)

## Key Features
- Modularized UI and logic into components and hooks.
- Permissions (location, mic, camera) requested and stored at app start.
- Explore, Navigation, Transit, and SOS flows, each atomic and state-driven.
- Mock data mode for demo/POC, using random images from `public/testData/`.
- Settings, error, and permissions screens.
- Footer always shows Explore, Navigate, Transit, and SOS.
- Accessibility and maintainability prioritized.

## State Management
- Main state in `App.tsx` using `useState` and `useRef`.
- `ViewState` enum controls which view/component is rendered.
- `MainContentRouter` routes state to the correct view.
- `isUiLocked` disables user input during atomic flows (e.g., Explore audio).

## Explore Flow
- In real mode: uses camera, sends image to AI, speaks result, returns to Idle.
- In mock mode: picks random city/image, simulates AI, speaks result, returns to Idle.
- UI is locked during the entire flow.

## Navigation/Transit
- Navigation uses geolocation and AI for guidance.
- Transit suggests public transport options based on city (Delhi/New York).

## Error Handling
- All errors route to `ErrorView` and are spoken to the user.

## File Structure (partial)
- `src/App.tsx` — main app logic and state
- `src/components/` — all UI components
- `src/appLogic/` — hooks and helpers
- `src/services/` — API/AI logic
- `public/testData/` — mock/demo images

## Usage
- Use this context as a system/meta prompt for Copilot or any AI assistant working on this codebase.
- This file is for context only and should not be imported in the app runtime.

## Coding Standards
- Code should be modularized: use components, hooks, and helpers to keep logic and UI separated and reusable.
- Follow good coding practices: clear naming, single responsibility, DRY (Don't Repeat Yourself), and maintainable structure.
- All new features and refactors should preserve or improve accessibility, maintainability, and testability.
