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
   * @param params The image to analyze, with base64 string and mimeType.
   * @returns A promise that resolves to the string description of the scene.
   */
  analyzeImage(params: { base64Image: string, mimeType?: string }): Promise<string>;

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
  serviceType: 'WATSON' as 'WATSON' | 'GEMINI',
  providers: {
    // Backwards-compatible Gemini config (left for reference but not used by default)
    gemini: {
      apiKey: "REDACTED_FOR_SECURITY",
      model: 'gemini-2.5-flash',
      systemInstruction: `You are UrbanSense, an assistant for visually impaired users. You speak directly to the user. Your description must be concise, clear, and limited to 2-3 sentences. Do not use markdown or formatting.`,
      explorePrompt: `Describe the scene in this image with spatial context. Focus on key objects, their positions (e.g., 'on your left', 'in front of you', 'to the right'), and their approximate distances in meters (e.g., 'about 5 meters away').`,
      navigationPrompt: `You are a navigation assistant for a visually impaired user. Your PRIMARY task is to provide a clear, direct, and safe instruction based on the turn-by-turn data. The core instruction is: "{instruction}". Use the real-time image ONLY to enhance this instruction with critical safety information, such as obstacles (curbs, poles, people, bikes) or safe paths (a clear footpath on the right). Be concise. Do NOT just describe the scene. Your response MUST be a direct command.`
    },

    // Watson configuration
    watson: {
      // These fields should ideally be used server-side. Keep empty here and set in your server config.
      apiKey: '',
      url: '',
      projectId: '',
      modelId: '',
      // If true, the client will attempt a direct call to the Watson endpoint from the browser (NOT RECOMMENDED)
      useDirect: false,
      // Preferred: a server-side proxy that will forward requests to Watson with credentials.
      // Implement a server endpoint that accepts POST { type: 'analyze'|'navigate', base64Image, instruction? }
      // and returns { text: string }.
      // DEVELOPMENT: point to the local proxy started on port 5001
      proxyUrl: 'http://127.0.0.1:5001/api/watson/infer'
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
    this.ai = new GoogleGenAI({ apiKey: geminiConfig.apiKey });
    this.model = geminiConfig.model;
    this.systemInstruction = geminiConfig.systemInstruction;
    this.explorePrompt = geminiConfig.explorePrompt;
    this.navigationPromptTemplate = geminiConfig.navigationPrompt;
  }

  async analyzeImage({ base64Image, mimeType = 'image/jpeg' }: { base64Image: string, mimeType?: string }): Promise<string> {
    try {
      const imagePart = {
        inlineData: {
          mimeType,
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


// --- 4. Service Implementation (Watson) ---

/**
 * Image analysis service adapted to use IBM Watson (watsonx.ai) via a server-side proxy.
 *
 * NOTE: Calling IBM watsonx.ai directly from browser-side code would expose credentials.
 * This implementation prefers a proxy endpoint (config.providers.watson.proxyUrl) which
 * should be implemented server-side to perform the authenticated call to IBM's APIs.
 *
 * If you do intend to call Watson directly from a secure environment, set useDirect=true
 * and provide apiKey/url/projectId/modelId in config.providers.watson (not recommended for browsers).
 */

class WatsonImageAnalysisService implements ImageAnalysisService {
  private cfg = config.providers.watson;

  constructor() {}

  private async callProxy(payload: any): Promise<any> {
    const proxy = this.cfg.proxyUrl;
    try {
      const res = await fetch(proxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Proxy call failed: ${res.status} ${t}`);
      }
      return await res.json();
    } catch (err) {
      console.error('[Watson] proxy call failed', err);
      throw err;
    }
  }

  // Fallback direct call (only used if useDirect=true). This is a best-effort implementation
  // using a generic Watson REST shape — depending on your watsonx.ai setup this may need to change.
  private async callWatsonDirect(payload: any): Promise<any> {
    if (!this.cfg.apiKey || !this.cfg.url) throw new Error('Watson direct call requires apiKey and url in config');
    const endpoint = `${this.cfg.url.replace(/\/$/, '')}/v1/projects/${this.cfg.projectId}/model_inference?version=2024-07-01`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.cfg.apiKey}` // If IBM requires Bearer; adapt as needed for your deployment
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Watson direct call failed: ${res.status} ${txt}`);
      }
      return await res.json();
    } catch (err) {
      console.error('[Watson] direct call failed', err);
      throw err;
    }
  }

  public async analyzeImage({ base64Image, mimeType = 'image/jpeg' }: { base64Image: string, mimeType?: string }): Promise<string> {
    try {
      // Prefer proxy to avoid exposing credentials in the browser
      if (!this.cfg.useDirect) {
        const resp = await this.callProxy({ type: 'analyze', base64Image, mimeType });
        if (resp && (resp.text || resp.result)) return resp.text || resp.result;
        throw new Error('Invalid proxy response');
      }

      // Direct call (not recommended). Payload shape may need adjustment to match your Watson deployment.
      const directPayload = {
        model: this.cfg.modelId,
        project: this.cfg.projectId,
        inputs: [
          { type: 'image', data: base64Image.split(',')[1], mime: mimeType },
          { type: 'text', text: config.providers.gemini.explorePrompt }
        ]
      };

      const directResp = await this.callWatsonDirect(directPayload);
      // Attempt to extract generated text in a few possible shapes
      if (directResp?.results?.length) return directResp.results[0].generated_text || JSON.stringify(directResp.results[0]);
      if (directResp?.output) return directResp.output;
      throw new Error('Unexpected response from Watson direct inference');
    } catch (err) {
      console.error('[Watson] analyzeImage failed', err);
      throw new Error("I'm sorry, I encountered an error while analyzing the image. Please try again.");
    }
  }

  public async generateNavigationalGuidance(base64Image: string, navigationalInstruction: string): Promise<string> {
    try {
      if (!this.cfg.useDirect) {
        const resp = await this.callProxy({ type: 'navigate', base64Image, instruction: navigationalInstruction });
        if (resp && (resp.text || resp.result)) return resp.text || resp.result;
        return navigationalInstruction; // fallback
      }

      // Direct payload for Watson (shape may vary by deployment)
      const directPayload = {
        model: this.cfg.modelId,
        project: this.cfg.projectId,
        inputs: [
          { type: 'image', data: base64Image.split(',')[1], mime: 'image/jpeg' },
          { type: 'text', text: `Instruction: ${navigationalInstruction}. Use the image to add safety context.` }
        ]
      };

      const directResp = await this.callWatsonDirect(directPayload);
      if (directResp?.results?.length) return directResp.results[0].generated_text || navigationalInstruction;
      if (directResp?.output) return directResp.output;
      return navigationalInstruction;
    } catch (err) {
      console.error('[Watson] generateNavigationalGuidance failed', err);
      return navigationalInstruction; // graceful fallback
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
    case 'WATSON':
      return new WatsonImageAnalysisService();
    case 'GEMINI':
      return new GeminiImageAnalysisService();
    default:
      throw new Error(`Unknown or unsupported service type: ${config.serviceType}`);
  }
};