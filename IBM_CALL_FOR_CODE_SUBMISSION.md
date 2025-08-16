# IBM Call for Code Submission: urbanSense

## Problem and Solution Statement (500 words)

**Problem Statement:**
Visual impairment and navigation challenges affect over 285 million people worldwide, creating barriers to independent mobility and spatial awareness. Traditional assistive technologies often lack real-time contextual understanding and fail to provide comprehensive environmental awareness that combines spatial navigation with immediate hazard detection. Existing solutions are either expensive hardware devices or simplistic mobile apps that don't leverage advanced AI for nuanced environmental understanding.

**Target Users:**
urbanSense serves visually impaired individuals, elderly users with declining vision, and anyone requiring enhanced spatial awareness in unfamiliar environments. The app is designed for independent travelers, urban commuters, and individuals navigating complex environments like busy streets, transit systems, or crowded public spaces.

**Solution Overview:**
DigitalEye is an AI-powered progressive web application that transforms smartphone cameras into intelligent navigation assistants. Users interact entirely through voice commands, saying "Explore" to analyze surroundings, "Navigate" for turn-by-turn directions, "Transit" for public transportation guidance, or "SOS" for emergency assistance. The app provides real-time spatial awareness through advanced computer vision, converting visual scenes into detailed audio descriptions that include obstacle identification, people detection, and safe path assessment.

**Creative and Unique Features:**
1. **Voice-First Design**: Complete hands-free operation eliminates the need for screen interaction
2. **Contextual AI Responses**: Enhanced prompts provide 3-4 sentence descriptions with actionable spatial details
3. **Multi-Modal Intelligence**: Combines navigation routing with real-time visual obstacle detection
4. **Emergency Integration**: Voice-activated SOS system accessible from any app state
5. **Progressive Web App**: Installable, offline-capable, and works across all devices without app store dependency

**Technical Innovation:**
The solution employs a sophisticated agentic AI architecture where specialized agents handle different aspects of user assistance:

- **Vision Agent**: Analyzes camera feeds using IBM watsonx.ai's Llama 3.2 90B Vision model with custom prompts for spatial awareness
- **Navigation Agent**: Processes route planning and provides contextual directions based on visual confirmation
- **Voice Agent**: Manages speech recognition, command interpretation, and text-to-speech queuing
- **Safety Agent**: Continuously monitors for obstacles and hazards while providing reassuring guidance
- **Emergency Agent**: Handles SOS scenarios with immediate contact capabilities

**Impact and Accessibility:**
urbanSense addresses accessibility challenges through inclusive design principles, providing independence for users who previously relied on human assistance or expensive specialized devices. The app's demo mode showcases navigation in Delhi, India, demonstrating cultural sensitivity and local relevance. The solution scales globally while adapting to local transit systems and environmental contexts.

**Technical Excellence:**
Built with React 18, TypeScript, and Tailwind CSS frontend, the app integrates IBM watsonx.ai through both Netlify serverless functions for production and local Python proxy servers for development. The architecture ensures secure API credential management while providing realistic mock responses for testing. Enhanced AI prompts focus on spatial relationships, obstacle detection, and confidence-building guidance, creating a supportive user experience that goes beyond simple image description to provide actionable environmental intelligence.

The solution represents a breakthrough in accessible technology, combining cutting-edge AI with practical usability to create genuine independence and safety for users navigating the visual world.

---

## Agentic AI and IBM watsonx Usage Statement

**Agentic AI Architecture:**

DigitalEye implements a multi-agent system where specialized AI agents collaborate to provide comprehensive visual assistance:

**1. Vision Analysis Agent**
- **Primary Function**: Real-time scene understanding and spatial awareness
- **IBM watsonx Integration**: Utilizes meta-llama/llama-3-2-90b-vision-instruct model through watsonx.ai API
- **Enhanced Prompts**: Custom-designed prompts optimized for accessibility:
  - Analyze Mode: "You are a visual assistant for someone who needs detailed spatial awareness. Describe this scene focusing on: 1) What's directly ahead and around, 2) Any people, vehicles, or obstacles, 3) The type of environment, 4) Important spatial relationships and distances"
  - Navigate Mode: "You are a navigation assistant helping someone follow this direction: '{instruction}'. Provide: 1) What you can see ahead that relates to navigation, 2) Any obstacles or hazards, 3) Path clearance confirmation, 4) Specific next action"

**2. Navigation Intelligence Agent**
- **Primary Function**: Route planning and turn-by-turn guidance with visual confirmation
- **Collaboration**: Works with Vision Agent to verify navigation instructions against real-world visual data
- **Context Awareness**: Processes user destinations and provides Delhi Metro integration for public transit
- **Safety Integration**: Continuously validates route safety through visual obstacle detection

**3. Voice Command Agent**
- **Primary Function**: Natural language processing for hands-free interaction
- **Capabilities**: Interprets voice commands ("Explore", "Navigate", "Transit", "SOS") and manages speech synthesis queuing
- **User Experience**: Provides confirmatory audio feedback and manages conversation flow
- **Accessibility Focus**: Ensures complete hands-free operation for users with visual impairments

**4. Safety and Emergency Agent**
- **Primary Function**: Continuous safety monitoring and emergency response
- **Proactive Monitoring**: Analyzes visual scenes for potential hazards, crowds, or obstacles
- **Emergency Activation**: Voice-triggered SOS system with configurable emergency contacts
- **Context Preservation**: Maintains location and situation awareness during emergency scenarios

**Agent Collaboration Workflow:**

1. **User Input**: Voice command triggers appropriate agent activation
2. **Context Sharing**: Agents share environmental data, location information, and user preferences
3. **Parallel Processing**: Vision Agent analyzes camera feed while Navigation Agent processes route data
4. **Integration Layer**: Results combine into unified, actionable guidance
5. **Audio Output**: Voice Agent delivers synthesized responses with proper queuing and interruption handling

**IBM watsonx.ai Technical Implementation:**

**Production Architecture:**
- **Netlify Functions**: Serverless watson-infer.ts function handles API authentication and request routing
- **Security**: API keys stored as environment variables, never exposed to client-side code
- **Model Selection**: meta-llama/llama-3-2-90b-vision-instruct chosen for superior vision-language understanding

**Development Architecture:**
- **Python Proxy Servers**: watson_proxy.py with full IBM watsonx-ai SDK integration
- **Mock Testing**: simple_watson_proxy.py provides realistic responses for development without credentials
- **Environment Flexibility**: Configurable endpoints allow seamless development-to-production deployment

**Required Integrations and Datasets:**

**Core Integrations:**
- **IBM watsonx.ai API**: Primary AI inference for image analysis and navigation assistance
- **Web Speech API**: Browser-native speech recognition and synthesis
- **Camera API**: Real-time image capture for environmental analysis
- **Geolocation API**: Position tracking for navigation context

**Datasets and Capabilities:**
- **Visual Understanding**: Pre-trained on diverse urban and environmental imagery through Llama 3.2 90B Vision
- **Spatial Reasoning**: Enhanced through custom prompt engineering for accessibility use cases
- **Delhi Metro Data**: Integrated transit information for local public transportation guidance
- **Emergency Contact System**: Configurable personal safety network integration

**Scalability and Adaptation:**
The agentic architecture allows for easy expansion with additional specialized agents (Weather Agent for environmental conditions, Traffic Agent for real-time road information, Cultural Agent for location-specific guidance) while maintaining the core collaboration framework through IBM watsonx.ai's powerful foundation models.

This multi-agent approach ensures that DigitalEye provides not just image descriptions, but intelligent, contextual assistance that adapts to user needs, environmental conditions, and safety requirements through sophisticated AI collaboration powered by IBM watsonx.ai.
