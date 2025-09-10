import { makeClients } from "./clients";
import { MODELS } from "./config";
import { withRetry } from "./retry";
import { normalizeError } from "./errors";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { exec } from "child_process";
import { promisify } from "util";

// Helper to parse aspect ratio
function parseAspectRatio(ratio: string): { width: number; height: number } {
  const aspectRatios: Record<string, { width: number; height: number }> = {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1920, height: 1080 },
    "9:16": { width: 1080, height: 1920 },
    "4:3": { width: 1440, height: 1080 },
    "3:2": { width: 1620, height: 1080 },
    "21:9": { width: 2560, height: 1080 }
  };
  return aspectRatios[ratio] || aspectRatios["16:9"];
}

// Create a gradient placeholder image with text
async function createPlaceholderImage(prompt: string, aspectRatio: string): Promise<Buffer> {
  const { width, height } = parseAspectRatio(aspectRatio);
  
  // Create a gradient background with random colors
  const colors = [
    ['#667eea', '#764ba2'],  // Purple gradient
    ['#f093fb', '#f5576c'],  // Pink gradient
    ['#4facfe', '#00f2fe'],  // Blue gradient
    ['#43e97b', '#38f9d7'],  // Green gradient
    ['#fa709a', '#fee140'],  // Sunset gradient
    ['#30cfd0', '#330867'],  // Ocean gradient
    ['#a8edea', '#fed6e3'],  // Soft gradient
    ['#ff9a9e', '#fecfef'],  // Rose gradient
  ];
  
  const [color1, color2] = colors[Math.floor(Math.random() * colors.length)];
  
  // Create SVG with gradient and text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#gradient)" />
      <text x="50%" y="45%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.05}" fill="white" opacity="0.9">
        AI Generated Image
      </text>
      <text x="50%" y="55%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.025}" fill="white" opacity="0.7">
        ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}
      </text>
    </svg>
  `;
  
  // Convert SVG to buffer
  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
  
  return buffer;
}

// Returns { url, localPath, prompt, aspectRatio, model }
export async function generateImage(opts:{prompt:string; aspectRatio?:string; businessContext?: any}) {
  const { genai, vertex } = makeClients();
  const execAsync = promisify(exec);
  
  try{
    return await withRetry(async ()=>{
      const imageId = randomUUID();
      const localPath = path.join('attached_assets', 'generated_images', `image-${imageId}.png`);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      
      // Check if we have API key for real generation
      const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.VERTEX_API_KEY;
      let imageBuffer: Buffer;
      let generationMethod = "placeholder";
      
      if (apiKey) {
        try {
          // Prepare input for Python script
          const inputData = {
            prompt: opts.prompt,
            aspectRatio: opts.aspectRatio || "16:9",
            businessContext: opts.businessContext || {}
          };
          
          // Call Python script for real AI generation
          const scriptPath = path.join(process.cwd(), 'server', 'ai', 'generate_image.py');
          const { stdout, stderr } = await execAsync(
            `python3 "${scriptPath}" '${JSON.stringify(inputData)}'`,
            {
              env: {
                ...process.env,
                GOOGLE_CLOUD_API_KEY: apiKey
              },
              timeout: 60000 // 60 second timeout for image generation
            }
          );
          
          if (stderr && !stderr.includes('warning')) {
            console.error('Python script stderr:', stderr);
          }
          
          const result = JSON.parse(stdout);
          
          if (result.success && result.image_data) {
            // Convert base64 to buffer
            imageBuffer = Buffer.from(result.image_data, 'base64');
            generationMethod = "gemini-2.5-flash";
          } else {
            // Fallback to placeholder if generation failed
            console.error('AI generation failed:', result.error);
            imageBuffer = await createPlaceholderImage(
              opts.prompt, 
              opts.aspectRatio || "16:9"
            );
          }
        } catch (error) {
          console.error('Error calling Python script:', error);
          // Fallback to placeholder
          imageBuffer = await createPlaceholderImage(
            opts.prompt, 
            opts.aspectRatio || "16:9"
          );
        }
      } else {
        // No API key, use placeholder
        imageBuffer = await createPlaceholderImage(
          opts.prompt, 
          opts.aspectRatio || "16:9"
        );
      }
      
      // Write the image file
      await fs.writeFile(localPath, imageBuffer);
      
      // Create metadata
      const meta = { 
        model: generationMethod === "gemini-2.5-flash" ? "gemini-2.5-flash-image-preview" : MODELS.image,
        aspectRatio: opts.aspectRatio || "16:9",
        prompt: opts.prompt,
        vertex: !!vertex || generationMethod === "gemini-2.5-flash",
        generationMethod,
        createdAt: new Date().toISOString()
      };
      
      // Write metadata file
      await fs.writeFile(
        localPath.replace('.png', '.json'),
        JSON.stringify(meta, null, 2)
      );
      
      // Return structured response
      return { 
        url: `/${localPath}`,
        localPath,
        prompt: opts.prompt,
        aspectRatio: opts.aspectRatio || "16:9",
        model: meta.model,
        generationMethod
      };
    });
  }catch(e:any){
    const ne = normalizeError(e);
    throw Object.assign(new Error(ne.message), { status: ne.code });
  }
}