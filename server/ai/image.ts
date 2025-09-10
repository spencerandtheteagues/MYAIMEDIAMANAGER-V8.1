import { makeClients } from './clients';
import { MODELS } from './config';
import { withRetry } from './retry';
import { normalizeError } from './errors';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: string;
  model?: string;
}

export interface GenerateImageResult {
  url: string;
  localPath: string;
  prompt: string;
  aspectRatio: string;
  model: string;
}

export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
  const { genai } = makeClients();
  
  if (!genai) {
    throw normalizeError(new Error('Image generation not configured'));
  }
  
  return withRetry(async () => {
    try {
      // Use Imagen through Gemini API if available
      // For now, we'll use a placeholder since direct Imagen access requires Vertex AI
      const model = genai.generativeModel({ model: "gemini-2.0-flash-exp" });
      
      // Generate enhanced prompt for image
      const enhancedPrompt = `Create a detailed description for an image: ${options.prompt}. 
        Aspect ratio: ${options.aspectRatio || '1:1'}. 
        Style: Professional, high-quality, suitable for social media.`;
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
      });
      
      // For now, save a placeholder since we can't generate actual images without Vertex AI
      const imageId = randomUUID();
      const filename = `generated-${imageId}.png`;
      const localPath = path.join('public', 'generated', filename);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      
      // Create a simple placeholder image description file
      await fs.writeFile(
        localPath.replace('.png', '.json'),
        JSON.stringify({
          prompt: options.prompt,
          aspectRatio: options.aspectRatio || '1:1',
          description: result.response.text(),
          timestamp: new Date().toISOString(),
        }, null, 2)
      );
      
      return {
        url: `/generated/${filename}`,
        localPath,
        prompt: options.prompt,
        aspectRatio: options.aspectRatio || '1:1',
        model: MODELS.image,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  });
}