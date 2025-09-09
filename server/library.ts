import { IStorage } from './storage';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

export interface SaveToLibraryParams {
  userId: string;
  kind: 'image' | 'video' | 'text';
  bytes?: Buffer | string;
  mime: string;
  prompt?: string;
  meta?: any;
}

// Persist file to local storage or cloud storage
async function persistFile(bytes: Buffer | string, mime: string): Promise<{ assetUrl: string; size: number; hash: string }> {
  // Create a unique filename based on content hash
  const buffer = typeof bytes === 'string' ? Buffer.from(bytes, 'base64') : bytes;
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  
  // Determine file extension based on mime type
  const ext = mime.split('/')[1] || 'bin';
  const filename = `${hash}.${ext}`;
  
  // Ensure the uploads directory exists
  const uploadsDir = join(process.cwd(), 'attached_assets', 'generated_content');
  await mkdir(uploadsDir, { recursive: true });
  
  // Write file to disk
  const filepath = join(uploadsDir, filename);
  await writeFile(filepath, buffer);
  
  return {
    assetUrl: `/attached_assets/generated_content/${filename}`,
    size: buffer.length,
    hash
  };
}

export async function saveToLibrary(
  storage: IStorage,
  params: SaveToLibraryParams
): Promise<any> {
  const { userId, kind, bytes, mime, prompt, meta } = params;
  
  // Do NOT save text content to library - return immediately
  if (kind === 'text') {
    return null;
  }
  
  // Only save images and videos
  if (!bytes || (kind !== 'image' && kind !== 'video')) {
    throw new Error('Invalid content type for library. Only images and videos are saved.');
  }
  
  // Persist the file and get the URL
  const { assetUrl, size, hash } = await persistFile(bytes, mime);
  
  // Save to database
  const libraryItem = await storage.createContentLibraryItem({
    userId,
    type: kind,
    url: assetUrl,
    caption: prompt || '',
    metadata: {
      ...meta,
      size,
      hash,
      mime,
      source: 'ai_generate',
      generatedAt: new Date().toISOString()
    },
    tags: meta?.tags || [],
    businessName: meta?.businessName,
    productName: meta?.productName,
    platform: meta?.platform,
  });
  
  return libraryItem;
}