import { makeClients } from "./clients";
import { MODELS, DEFAULTS } from "./config";
import { withRetry } from "./retry";
import { normalizeError } from "./errors";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { generateVideoWithVeo3 } from './gemini-video';

const execAsync = promisify(exec);

export interface VideoGenerationOptions {
  prompt: string;
  durationSeconds?: number;
  fast?: boolean;
  aspectRatio?: string;
  model?: 'gemini' | 'auto';
}

/** Generate a video using Veo 3 and return the file path */
export async function generateVideo(opts: VideoGenerationOptions) {
  try {
    return await withRetry(async () => {
      const videoId = randomUUID();
      const localPath = path.join('attached_assets', 'generated_videos', `video-${videoId}.mp4`);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      
      let videoBuffer: Buffer;
      let modelUsed = "veo-3";
      let generationMethod = "veo";
      
      // Use Gemini Veo 3 for video generation
      const preferredModel = opts.model || 'auto';
      
      if (preferredModel === 'gemini' || (preferredModel === 'auto' && process.env.GEMINI_API_KEY)) {
        try {
          console.log('Generating video with Veo 3...');
          videoBuffer = await generateVideoWithVeo3({
            prompt: opts.prompt,
            duration: opts.durationSeconds || 8,
            aspectRatio: opts.aspectRatio || "16:9",
            model: opts.fast ? "veo-3-fast" : "veo-3"
          });
          modelUsed = opts.fast ? "veo-3-fast" : "veo-3";
          generationMethod = "veo-3";
        } catch (error: any) {
          console.error('Veo 3 generation error:', error.message);
          throw new Error(`Video generation failed: ${error.message}`);
        }
      } else {
        throw new Error("Video generation requires Gemini API key");
      }
      
      // Write the video file
      await fs.writeFile(localPath, videoBuffer);
      
      // Create metadata
      const meta = {
        model: modelUsed,
        aspectRatio: opts.aspectRatio || "16:9",
        prompt: opts.prompt,
        duration: opts.durationSeconds || 8,
        generationMethod,
        createdAt: new Date().toISOString()
      };
      
      // Write metadata file
      await fs.writeFile(
        localPath.replace('.mp4', '.json'),
        JSON.stringify(meta, null, 2)
      );
      
      // Return structured response
      return {
        url: `/${localPath}`,
        localPath,
        prompt: opts.prompt,
        aspectRatio: opts.aspectRatio || "16:9",
        model: modelUsed,
        generationMethod,
        duration: opts.durationSeconds || 8
      };
    });
  } catch (e: any) {
    const ne = normalizeError(e);
    throw Object.assign(new Error(ne.message), { status: ne.code });
  }
}

/** Start a Veo job and return an operation ID (for backward compatibility) */
export async function startVideo(opts: { prompt: string; durationSeconds?: number; fast?: boolean }) {
  try {
    // Generate video synchronously for now
    const result = await generateVideo({
      prompt: opts.prompt,
      durationSeconds: opts.durationSeconds,
      fast: opts.fast
    });
    
    return {
      operationId: `op-${randomUUID()}`,
      status: "completed",
      videoUrl: result.url,
      estimatedCompletionTime: new Date().toISOString()
    };
  } catch (e: any) {
    const ne = normalizeError(e);
    throw Object.assign(new Error(ne.message), { status: ne.code });
  }
}

/** Poll by op ID (for backward compatibility) */
export async function pollVideo(opts: { operationId: string }) {
  // For backward compatibility, always return completed
  return {
    operationId: opts.operationId,
    status: "completed" as const,
    videoUrl: `/attached_assets/generated_videos/placeholder.mp4`,
    error: undefined,
    progress: 1
  };
}