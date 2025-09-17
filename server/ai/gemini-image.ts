import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Initialize Gemini client with the provided API key
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is required for Gemini image generation");
}

const ai = new GoogleGenerativeAI(geminiApiKey);

export interface GeminiImageOptions {
  prompt: string;
  aspectRatio?: string;
  model?: "imagen-4" | "imagen-3";
}

export async function generateImageWithGemini(opts: GeminiImageOptions): Promise<Buffer> {
  try {
    console.log('Generating image with Gemini...');

    // Note: Standard Gemini models don't generate images directly.
    // This is a placeholder that will return an error and trigger fallback to DALL-E
    throw new Error("Gemini text models don't support image generation. Use Imagen 4 via Vertex AI or fallback to DALL-E 3.");

  } catch (error: any) {
    console.error('Gemini image generation error:', error);
    throw new Error(`Gemini image generation failed: ${error.message}`);
  }
}

export async function generateImageWithImagen4(prompt: string, aspectRatio: string = "16:9"): Promise<Buffer> {
  try {
    console.log('Attempting to generate image with Imagen 4...');

    // Note: Imagen 4 requires Vertex AI setup with proper authentication
    // For now, this will trigger fallback to DALL-E 3 in the multi-model image generator
    throw new Error("Imagen 4 requires Vertex AI configuration. Falling back to DALL-E 3.");

  } catch (error: any) {
    console.log('Imagen 4 generation failed, will fallback to DALL-E 3...');
    throw error; // Re-throw to trigger DALL-E fallback in the calling code
  }
}