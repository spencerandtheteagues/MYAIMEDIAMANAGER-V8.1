import { storage } from "./storage";
import { randomUUID } from "crypto";

export async function saveToLibrary(options: {
  userId: string;
  type: "image" | "video" | "text"; 
  dataBase64?: string;
  url?: string;
  meta?: any;
}) {
  const { userId, type: kind, url, dataBase64, meta } = options;
  
  // Save to content library
  const libraryItem = {
    userId,
    type: kind === 'text' ? 'image' : kind, // Store text as image type for compatibility
    url: url || (kind === 'text' ? '' : `/generated/${randomUUID()}.${kind === 'video' ? 'mp4' : 'png'}`),
    caption: meta?.caption || meta?.content || meta?.prompt || '',
    metadata: {
      ...meta,
      contentType: kind // Store actual type in metadata
    },
    tags: meta?.hashtags || [],
    businessName: meta?.businessName,
    productName: meta?.productName,
    platform: meta?.platform
  };
  
  return storage.createContentLibraryItem(libraryItem);
}