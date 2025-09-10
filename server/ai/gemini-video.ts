import { GoogleGenAI } from "@google/genai";
import * as fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import sharp from 'sharp';

const execAsync = promisify(exec);

// Initialize Gemini client with the provided API key
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.warn("GEMINI_API_KEY not configured for video generation");
}

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export interface GeminiVideoOptions {
  prompt: string;
  duration?: number;
  aspectRatio?: string;
  model?: "veo-3-fast" | "veo-3";
}

export async function generateVideoWithVeo3(opts: GeminiVideoOptions): Promise<Buffer> {
  // Note: Veo 3 models are not yet available through the Gemini API
  // This is a placeholder that will be updated when the models become available
  console.log('Note: Veo 3 models are not yet available through Gemini API.');
  console.log('Creating AI-styled video placeholder...');
  
  // For now, create a high-quality placeholder video
  const videoId = `video-${Date.now()}`;
  const tempImagePath = path.join('attached_assets', 'temp', `temp-${videoId}.png`);
  const videoPath = path.join('attached_assets', 'generated_videos', `${videoId}.mp4`);
  
  // Ensure directories exist
  await fs.mkdir(path.dirname(tempImagePath), { recursive: true });
  await fs.mkdir(path.dirname(videoPath), { recursive: true });
  
  // Parse aspect ratio
  const [widthRatio, heightRatio] = (opts.aspectRatio || "16:9").split(':').map(Number);
  const width = 1920;
  const height = Math.round(width * heightRatio / widthRatio);
  
  // Create a visually appealing placeholder image
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
        </linearGradient>
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <text x="${width/2}" y="${height/2 - 60}" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle" filter="url(#blur)">
        AI Video Generation
      </text>
      <text x="${width/2}" y="${height/2 - 60}" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">
        AI Video Generation
      </text>
      <text x="${width/2}" y="${height/2 + 20}" font-family="Arial, sans-serif" font-size="36" fill="white" text-anchor="middle" opacity="0.9">
        Coming Soon with Veo 3
      </text>
      <text x="${width/2}" y="${height/2 + 80}" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.7">
        ${opts.prompt.substring(0, 80)}${opts.prompt.length > 80 ? '...' : ''}
      </text>
    </svg>
  `;
  
  // Create the image using Sharp
  await sharp(Buffer.from(svgContent))
    .png()
    .toFile(tempImagePath);
  
  // Convert image to video using ffmpeg
  const duration = opts.duration || 8;
  const { stdout, stderr } = await execAsync(
    `ffmpeg -loop 1 -i "${tempImagePath}" -c:v libx264 -t ${duration} -pix_fmt yuv420p -vf "scale=${width}:${height}" "${videoPath}" -y`,
    { timeout: 30000 }
  );
  
  if (stderr && !stderr.includes('frame=')) {
    console.error('FFmpeg stderr:', stderr);
  }
  
  // Read the generated video
  const videoBuffer = await fs.readFile(videoPath);
  
  // Clean up temp files
  await fs.unlink(tempImagePath).catch(() => {});
  await fs.unlink(videoPath).catch(() => {});
  
  console.log('Placeholder video created successfully');
  return videoBuffer;
}

export async function generateVideoWithGemini(prompt: string, duration: number = 8, aspectRatio: string = "16:9"): Promise<Buffer> {
  return generateVideoWithVeo3({
    prompt,
    duration,
    aspectRatio,
    model: "veo-3-fast"
  });
}