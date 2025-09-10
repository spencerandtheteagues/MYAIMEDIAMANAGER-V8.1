import { storage } from "./storage";
import { randomUUID } from "crypto";

export async function saveToLibrary(options: {
  userId: string;
  type: "image" | "video"; 
  dataBase64?: string;
  url?: string;
  meta?: any;
}) {
  const { userId, type: kind, url, dataBase64, meta } = options;
  
  // Save to content library
  const libraryItem = {
    userId,
    type: kind,
    url: url || `/generated/${randomUUID()}.${kind === 'video' ? 'mp4' : 'png'}`,
    caption: meta?.prompt || '',
    metadata: meta || {},
    tags: [],
    businessName: undefined,
    productName: undefined,
    platform: meta?.platform
  };
  
  return storage.createContentLibraryItem(libraryItem);
}