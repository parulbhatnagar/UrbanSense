import { GoogleGenAI } from "@google/genai";

/**
 * @file This file contains the AI service layer for the UrbanSense application.
 * It is designed to be model-agnostic by using a factory pattern.
 * To swap the AI model provider, this is the only file you need to modify.
 * See README.md for detailed instructions.
 */

// --- 1. Service Interface ---

/**
 * Defines the contract for any image analysis service.
 * Any AI service implementation must conform to this interface.
 */
export interface ImageAnalysisService {
  /**
   * Analyzes a Base64 encoded image and returns a textual description.
   * @param base64Image The image to analyze, encoded as a Base64 string.
   * @returns A promise that resolves to the string description of the scene.
   */
  analyzeImage(base64Image: string): Promise<string>;

  /**
   * Generates a combined navigational guidance instruction.
   * @param base64Image The real-time image of the user's surroundings.
   * @param navigationalInstruction The current turn-by-turn instruction (e.g., "In 50 meters, turn left.").
   * @returns A promise that resolves to a single, combined, context-aware instruction.
   */
  generateNavigationalGuidance(base64Image: string, navigationalInstruction: string): Promise<string>;
}


// --- 2. Configuration ---

/**
 * Configuration for the AI service layer.
 * Change the serviceType to switch between different AI providers.
 */
const config = {
  /** The active AI service to use. Currently supports 'GEMINI'. */
  serviceType: 'GEMINI' as 'GEMINI', // Type assertion for clarity
  providers: {
    gemini: {
      apiKey: process.env.API_KEY,
      model: 'gemini-2.5-flash',
      systemInstruction: `You are UrbanSense, an assistant for visually impaired users. You speak directly to the user. Your description must be concise, clear, and limited to 2-3 sentences. Do not use markdown or formatting.`,
      explorePrompt: `Describe the scene in this image with spatial context. Focus on key objects, their positions (e.g., 'on your left', 'in front of you', 'to the right'), and their approximate distances in meters (e.g., 'about 5 meters away').`,
      navigationPrompt: `You are a navigation assistant for a visually impaired user. Your PRIMARY task is to provide a clear, direct, and safe instruction based on the turn-by-turn data. The core instruction is: "{instruction}". Use the real-time image ONLY to enhance this instruction with critical safety information, such as obstacles (curbs, poles, people, bikes) or safe paths (a clear footpath on the right). Be concise. Do NOT just describe the scene. Your response MUST be a direct command.`
    }
  }
};


// --- 3. Service Implementation (Google Gemini) ---

/**
 * An implementation of ImageAnalysisService using the Google Gemini API.
 */
class GeminiImageAnalysisService implements ImageAnalysisService {
  private ai: GoogleGenAI;
  private model: string;
  private systemInstruction: string;
  private explorePrompt: string;
  private navigationPromptTemplate: string;

  constructor() {
    const geminiConfig = config.providers.gemini;
    if (!geminiConfig.apiKey) {
      throw new Error("API_KEY environment variable not set. Please set it in your deployment settings.");
    }
    this.ai = new GoogleGenAI({ apiKey: geminiConfig.apiKey });
    this.model = geminiConfig.model;
    this.systemInstruction = geminiConfig.systemInstruction;
    this.explorePrompt = geminiConfig.explorePrompt;
    this.navigationPromptTemplate = geminiConfig.navigationPrompt;
  }

  async analyzeImage(base64Image: string): Promise<string> {
    try {
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image.split(',')[1],
        },
      };

      const textPart = { text: this.explorePrompt };

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction: this.systemInstruction },
      });

      const description = response.text;
      if (!description) {
        throw new Error("Failed to generate a description. The response was empty.");
      }
      return description;

    } catch (error) {
      console.error("Error analyzing image with Gemini:", error);
      if (error instanceof Error) {
        throw new Error(`I'm sorry, I encountered an error while analyzing the image. Please try again.`);
      }
      throw new Error("I'm sorry, an unknown error occurred while analyzing the image.");
    }
  }

  async generateNavigationalGuidance(base64Image: string, navigationalInstruction: string): Promise<string> {
    try {
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image.split(',')[1],
        },
      };

      const prompt = this.navigationPromptTemplate.replace("{instruction}", navigationalInstruction);
      const textPart = { text: prompt };

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction: this.systemInstruction },
      });

      const guidance = response.text;
      if (!guidance) {
        throw new Error("Failed to generate navigational guidance.");
      }
      return guidance;
    } catch (error) {
      console.error("Error generating navigation guidance with Gemini:", error);
      // Fallback to the original instruction if AI fails
      return navigationalInstruction;
    }
  }
}


// --- 4. Service Factory ---

/**
 * Creates and returns an instance of the configured image analysis service.
 * This is the single entry point for the rest of the application to get an AI service.
 * @returns An object that conforms to the ImageAnalysisService interface.
 */
export const createImageAnalysisService = (): ImageAnalysisService => {
  switch (config.serviceType) {
    case 'GEMINI':
      return new GeminiImageAnalysisService();
    default:
      throw new Error(`Unknown or unsupported service type: ${config.serviceType}`);
  }
};