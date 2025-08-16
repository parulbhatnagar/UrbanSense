Deliverable: Written Problem and Solution Statement

Problem (short):
Visual impairment and limited situational awareness make independent navigation in urban spaces difficult for millions worldwide. Existing mobile tools provide routing but rarely convey real-time, scene-level spatial context (obstacles, crowding, path clearance) that a person with low or no vision needs to move safely and confidently.

Target users:
People with visual impairments, elderly users with declining vision, and anyone needing enhanced spatial awareness in unfamiliar or crowded environments.

Solution (summary):
urbanSense is an AI-powered, voice-first progressive web app that converts a smartphone camera into a real-time visual assistant. Users give voice commands—"Explore" to analyze surroundings, "Navigate" for turn-by-turn guidance, "Transit" for public-transport suggestions, and "SOS" for emergencies. The app returns concise, actionable audio descriptions of the scene: what’s directly ahead, people and obstacles, environment type (sidewalk, street, building), and spatial relationships with approximate distances. For navigation, the system confirms or corrects route instructions by visually validating the path and calling out hazards.

Key features:
- Hands-free, voice-driven interaction and queued text-to-speech to avoid audio overlap.
- Real-time visual analysis with 3–4 sentence, actionable descriptions tailored to safe mobility.
- Navigation confirmation: camera-based validation of directions and next-step instructions.
- Transit integration for local public-transport guidance (demo: Delhi Metro).
- SOS and emergency contact workflow accessible from any app state.
- Progressive Web App (installable, offline-capable) for broad device coverage.

Why it’s unique and impactful:
Unlike standard navigation apps, urbanSense focuses on moment-to-moment spatial awareness rather than only routing. It combines multimodal AI (vision + speech + location) to empower independence and safety. The voice-first design ensures accessibility; mock/demo modes enable reliable testing and reproducible demonstrations without requiring cloud credentials.

Global relevance (developing and under-resourced regions):
urbanSense is particularly relevant for under-resourced communities and developing nations where access to specialized assistive devices is limited but smartphone adoption is rapidly increasing. Many people with visual impairments in these regions rely on low-cost mobile phones and intermittent internet connectivity — urbanSense's Progressive Web App model, lightweight frontend, and offline-capable features make it practical for these contexts. The app minimizes dependency on continuous high-bandwidth connections by using short image captures and concise prompts, supports local language TTS/STT where available, and can operate in a mock or reduced-cloud mode for reliable demonstrations and basic functionality without paid cloud credentials. This approach enables low-cost, scalable distribution through app install prompts or community-driven deployment, providing immediate, practical help for independence and safer mobility in environments where traditional assistive technology is scarce or unaffordable.

Technical snapshot:
Frontend: React 18 + TypeScript + Vite, Tailwind CSS. Backend: Netlify Functions for production (serverless Watson proxy) and local Flask proxy for development. AI: IBM watsonx.ai (meta-llama/llama-3-2-90b-vision-instruct) used via secure server-side calls. Mock mode provides realistic canned responses for testing.

Word count: ~330 words

**Your urbanSense project has all the elements to win this competition.**
