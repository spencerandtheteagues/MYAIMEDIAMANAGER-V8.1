import { GoogleGenAI } from "@google/genai";
import * as fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Initialize Gemini client with the provided API key
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is required for Veo 3 video generation");
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// Correct Veo 3 model IDs from Google's documentation
const VEO_MODELS = {
  fast: "veo-3.0-fast-generate-001",
  standard: "veo-3.0-generate-001"
};

export interface GeminiVideoOptions {
  prompt: string;
  duration?: number;
  aspectRatio?: string;
  model?: "veo-3-fast" | "veo-3";
}

export async function generateVideoWithVeo3(opts: GeminiVideoOptions): Promise<Buffer> {
  try {
    console.log('Starting Veo 3 video generation...');
    
    // Select the correct model ID
    const modelId = opts.model === "veo-3-fast" ? VEO_MODELS.fast : VEO_MODELS.standard;
    console.log(`Using model: ${modelId}`);
    
    // Start video generation with correct model ID
    let op = await ai.models.generateVideos({
      model: modelId,
      prompt: opts.prompt,
      config: {
        aspectRatio: opts.aspectRatio || "16:9",
        resolution: "720p"
      }
    });
    
    console.log('Video generation started, polling for completion...');
    
    // Poll until the operation is done (max 3 minutes)
    const maxAttempts = 18; // 18 * 10 seconds = 3 minutes
    let attempts = 0;
    
    while (!op.done && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      op = await ai.operations.getVideosOperation({ operation: op });
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts}, done: ${op.done}`);
    }
    
    if (!op.done) {
      throw new Error("Video generation timed out after 3 minutes");
    }
    
    if (!op.response?.generatedVideos?.length) {
      throw new Error("Veo 3 returned no video");
    }
    
    // Get the generated video file
    const videoFile = op.response.generatedVideos[0].video;
    if (!videoFile) {
      throw new Error("No video file in response");
    }
    console.log('Video generated successfully, downloading...');
    
    // Download the video file using the files API
    let videoBuffer: Buffer;
    
    try {
      console.log('Downloading video file:', videoFile);
      
      // The GenAI SDK download method doesn't actually download the file content
      // Instead, we need to use the file's URI with proper authentication
      if ((videoFile as any).uri || (videoFile as any).url) {
        let fileUri = (videoFile as any).uri || (videoFile as any).url;
        console.log('Original video URI:', fileUri);
        
        // The URI already has the download endpoint, we need to add the API key as a query parameter
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        const separator = fileUri.includes('?') ? '&' : '?';
        fileUri = `${fileUri}${separator}key=${apiKey}`;
        
        console.log('Fetching video from URI with API key...');
        const response = await fetch(fileUri);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Download error response:', errorText);
          throw new Error(`Failed to fetch video: ${response.statusText} (${response.status})`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        videoBuffer = Buffer.from(arrayBuffer);
        console.log(`Downloaded video successfully, size: ${videoBuffer.length} bytes`);
      } else {
        // If no URI is available, throw an error
        throw new Error("Video file has no URI for download. File details: " + JSON.stringify(videoFile));
      }
      
      console.log('Veo 3 video generation completed successfully');
      return videoBuffer;
    } catch (downloadError: any) {
      console.error('Failed to download video:', downloadError);
      throw downloadError;
    }
    
  } catch (error: any) {
    console.error('Veo 3 generation error:', error);
    
    // If it's a model not found error and we were trying fast, fallback to standard
    if (opts.model === "veo-3-fast" && error.message?.includes('not found')) {
      console.log('Falling back to standard Veo 3 model...');
      return generateVideoWithVeo3({
        ...opts,
        model: "veo-3"
      });
    }
    
    throw error;
  }
}

export async function generateVideoWithGemini(prompt: string, duration: number = 8, aspectRatio: string = "16:9"): Promise<Buffer> {
  return generateVideoWithVeo3({
    prompt,
    duration,
    aspectRatio,
    model: "veo-3-fast" // Default to fast model
  });
}