import { makeClients } from "./clients";
import { MODELS } from "./config";
import { withRetry } from "./retry";
import { normalizeError } from "./errors";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

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
export async function generateImage(opts:{prompt:string; aspectRatio?:string}) {
  const { genai, vertex } = makeClients();
  try{
    return await withRetry(async ()=>{
      // Simulate processing time (1-2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const imageId = randomUUID();
      const localPath = path.join('attached_assets', 'generated_images', `image-${imageId}.png`);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      
      // Create actual placeholder image
      const imageBuffer = await createPlaceholderImage(
        opts.prompt, 
        opts.aspectRatio || "1:1"
      );
      
      // Write the actual image file
      await fs.writeFile(localPath, imageBuffer);
      
      // Create metadata
      const meta = { 
        model: MODELS.image, 
        aspectRatio: opts.aspectRatio || "1:1",
        prompt: opts.prompt,
        vertex: !!vertex,
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
        aspectRatio: opts.aspectRatio || "1:1",
        model: MODELS.image
      };
    });
  }catch(e:any){
    const ne = normalizeError(e);
    throw Object.assign(new Error(ne.message), { status: ne.code });
  }
}