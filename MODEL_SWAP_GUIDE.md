# Guide to Swapping the AI Model

This document explains how to replace the default Google Gemini model with a different image analysis model. The application has been designed with a modular service layer to make this process as straightforward as possible.

## Core Concept: The AI Service Layer

All AI-related logic is encapsulated within `services/aiService.ts`. This file uses a **Factory Pattern** to create and provide an image analysis service to the rest of the application. The main `App.tsx` component is completely unaware of which specific AI model is being used; it only interacts with a generic service interface.

This means you only need to modify `services/aiService.ts` to switch models.

## The `ImageAnalysisService` Interface

Any new AI service you create must conform to this TypeScript interface, which includes two methods:

```typescript
interface ImageAnalysisService {
  /**
   * Analyzes a Base64 encoded image and returns a textual description.
   * Used for the "Explore" feature.
   */
  analyzeImage(base64Image: string): Promise<string>;

  /**
   * Generates a combined navigational guidance instruction.
   * Takes a real-time image and a turn-by-turn instruction, and returns a single,
   * context-aware command that merges both for enhanced safety.
   */
  generateNavigationalGuidance(base64Image: string, navigationalInstruction: string): Promise<string>;
}
```

---

## Steps to Swap Models

### 1. Locate the Service File

All changes will be made in the following file:
`services/aiService.ts`

### 2. Create Your New Service Implementation

Inside `aiService.ts`, create a new class or object that implements the `ImageAnalysisService` interface. This is where you will place the API call logic for your new model provider (e.g., OpenAI, Anthropic, or a self-hosted model).

**Example: Adding an OpenAI (GPT-4o) Service**

Here is a hypothetical example of what an OpenAI implementation might look like. You would add this code inside `aiService.ts`.

```typescript
// --- (Example) OpenAI Image Analysis Service ---
// Note: You would need to add the OpenAI client library to index.html's importmap.

// const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// class OpenAIImageAnalysisService implements ImageAnalysisService {
//   async analyzeImage(base64Image: string): Promise<string> {
//     // ... (implementation for explore prompt)
//   }
//
//   async generateNavigationalGuidance(base64Image: string, navigationalInstruction: string): Promise<string> {
//     try {
//       const response = await openAI.chat.completions.create({
//         model: "gpt-4o",
//         messages: [
//           {
//             role: "system",
//             content: "You are UrbanSense, a navigation assistant for a visually impaired user. Your PRIMARY task is to provide a clear, direct, and safe instruction based on the turn-by-turn data. The core instruction is: " + navigationalInstruction + ". Use the real-time image ONLY to enhance this instruction with critical safety information, such as obstacles (curbs, poles, people, bikes) or safe paths (a clear footpath on the right). Be concise. Do NOT just describe the scene. Your response MUST be a direct command."
//           },
//           {
//             role: "user",
//             content: [{ type: "image_url", image_url: { url: base64Image } }],
//           },
//         ],
//       });
//       const guidance = response.choices[0]?.message?.content;
//       if (!guidance) {
//         return navigationalInstruction; // Fallback
//       }
//       return guidance;
//     } catch (error) {
//       console.error("Error generating guidance with OpenAI:", error);
//       return navigationalInstruction; // Fallback on error
//     }
//   }
// }
```

### 3. Update the Configuration and Factory

Next, update the `config` object and the `createImageAnalysisService` factory function to recognize your new service.

```typescript
// 1. Add your new service type to the config's type definition
interface ServiceConfig {
  serviceType: 'GEMINI' | 'OPEN_AI'; // Add 'OPEN_AI'
  // ... other config properties
}

// 2. Update the config object to allow switching
const config = {
  serviceType: 'GEMINI', // <-- CHANGE THIS VALUE TO 'OPEN_AI' TO SWITCH
  providers: {
    // ...
  }
};

// 3. Update the factory function to create an instance of your new service
export const createImageAnalysisService = (): ImageAnalysisService => {
  switch (config.serviceType) {
    case 'GEMINI':
      return new GeminiImageAnalysisService();
    // Add the case for your new service
    case 'OPEN_AI':
      // return new OpenAIImageAnalysisService(); // Uncomment your new service
    default:
      throw new Error(`Unknown service type: ${config.serviceType}`);
  }
};
```

By following these steps, you can easily switch the underlying AI model without making any changes to the UI or core application logic.