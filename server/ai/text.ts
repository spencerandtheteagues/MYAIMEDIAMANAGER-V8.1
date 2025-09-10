import { makeClients } from './clients';
import { MODELS, DEFAULTS } from './config';
import { withRetry } from './retry';
import { normalizeError } from './errors';

export interface GenerateTextOptions {
  prompt: string;
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateTextResult {
  text: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const { genai } = makeClients();
  
  if (!genai) {
    throw normalizeError(new Error('Text generation not configured'));
  }
  
  return withRetry(async () => {
    try {
      const model = genai.generativeModel({ model: MODELS.text });
      
      const prompt = options.system 
        ? `${options.system}\n\n${options.prompt}`
        : options.prompt;
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? DEFAULTS.temperature,
          maxOutputTokens: options.maxOutputTokens ?? DEFAULTS.maxTokens,
        },
      });
      
      const response = result.response;
      const text = response.text();
      
      return {
        text,
        model: MODELS.text,
        usage: response.usageMetadata ? {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          completionTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        } : undefined,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  });
}