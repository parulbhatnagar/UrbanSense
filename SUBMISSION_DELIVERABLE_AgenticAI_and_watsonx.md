Deliverable: Written statement on agentic AI and IBM watsonx usage in the project

Agentic AI Overview:
urbanSense implements a modular, agentic AI architecture where specialized agents collaborate to provide robust visual assistance. Agents are lightweight modules responsible for focused tasks and communicate through a shared context layer.

Agents and Responsibilities:
- Vision Agent: Processes camera images using IBM watsonx.ai's vision-instruct model. Produces spatial descriptions, identifies obstacles, people, and environmental types, and estimates relative distances.
- Navigation Agent: Plans routes and provides turn-by-turn instructions. Cross-checks route steps against Vision Agent outputs to confirm safety.
- Voice Agent: Handles speech recognition and speech synthesis. Queues TTS outputs to avoid overlap and manages confirmation prompts.
- Safety Agent: Continuously evaluates for potential hazards and crowding; triggers warnings or SOS when necessary.
- Emergency Agent: Manages SOS workflows and emergency contact notifications.

Agent Collaboration Flow:
1. User issues a voice command (Explore, Navigate, Transit, SOS).
2. Voice Agent transcribes and routes the intent to the appropriate agent(s).
3. Vision Agent analyzes a captured camera frame via IBM watsonx.ai and returns structured text descriptions.
4. Navigation Agent uses map/routing APIs and consults Vision Agent outputs to confirm or revise the next action.
5. Safety Agent evaluates the scene for hazards; if critical, Emergency Agent is invoked.
6. Voice Agent synthesizes and plays the final guidance.

IBM watsonx.ai Usage:
- Model: meta-llama/llama-3-2-90b-vision-instruct (vision + instruction-following capabilities).
- Deployment: Production via Netlify Functions (`netlify/functions/watson-infer.ts`) with environment variables for credentials. Development via `server/watson_proxy.py` (full SDK integration) or `server/simple_watson_proxy.py` (mock mode).
- Prompts: Carefully engineered to request spatial relationships, obstacles, and short actionable guidance (3–4 sentences). Two main templates: Analyze (Explore) and Navigate (with `{instruction}` substitution).
- Security: All requests proxied server-side to keep API keys out of the browser. Netlify Functions authenticate with IBM watsonx.ai using environment variables.

Required capabilities and datasets:
- Visual inference from diverse urban scenes (pretrained in Llama 3.2 vision model).
- Integration with geolocation and transit data (Delhi Metro demo data included).
- TTS and STT handled locally in the browser via Web Speech API for low-latency voice interactions.

Expansion possibilities:
- Add specialized agents (Weather, Traffic, Cultural Context).
- Integrate additional sensor data (LiDAR, depth estimation) for better obstacle detection.
- Use fine-tuning or retrieval-augmented generation (RAG) for local transit timetables and richer contextual responses.

This architecture demonstrates clear agentic AI usage with IBM watsonx.ai as the primary reasoning engine for vision-based assistance in urbanSense.
