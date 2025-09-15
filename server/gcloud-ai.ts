import { VertexAI } from '@google-cloud/vertexai';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

ffmpeg.setFfmpegPath(ffmpegPath.path);

// Check if Google Cloud configuration is available
const isGoogleCloudConfigured = !!(process.env.GCLOUD_PROJECT_ID && process.env.GCLOUD_PROJECT_ID !== '');

// Initialize Vertex AI only if configured
let vertexAI: VertexAI | null = null;
let storage: Storage | null = null;
let bucket: any = null;
let geminiFlashModel: any = null;
let geminiProModel: any = null;

if (isGoogleCloudConfigured) {
  try {
    vertexAI = new VertexAI({
      project: process.env.GCLOUD_PROJECT_ID!,
      location: process.env.GCLOUD_LOCATION || 'us-central1',
    });

    // Initialize Cloud Storage
    storage = new Storage({
      projectId: process.env.GCLOUD_PROJECT_ID,
      keyFilename: process.env.GCLOUD_KEY_FILE,
    });

    const bucketName = process.env.GCLOUD_STORAGE_BUCKET || 'myaimediamgr-content';
    bucket = storage.bucket(bucketName);

    // Initialize Gemini models
    geminiFlashModel = vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.9,
        topP: 0.95,
      },
    });

    geminiProModel = vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    console.log('Google Cloud AI services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google Cloud AI services:', error);
    console.log('Running in development mode without Google Cloud AI');
  }
} else {
  console.log('Google Cloud configuration not found. Running in development mode.');
  console.log('To enable AI features, set GCLOUD_PROJECT_ID in environment variables.');
}

// Content generation interfaces
export interface ContentGenerationRequest {
  businessName: string;
  productName?: string;
  targetAudience: string;
  brandTone: string;
  keyMessages: string[];
  callToAction: string;
  platform: string;
  isAdvertisement?: boolean;
  additionalContext?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  visualStyle: string;
  colorScheme?: string;
  aspectRatio?: string;
  businessContext?: string;
}

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number;
  visualStyle: string;
  includeText?: string;
  businessContext?: string;
}

export interface CampaignPost {
  content: string;
  imagePrompt: string;
  imageUrl?: string;
  videoUrl?: string;
  scheduledFor: Date;
  dayNumber: number;
  postNumber: number;
}

/**
 * Generate text content using Gemini 2.5 Flash
 */
export async function generateTextContent(request: ContentGenerationRequest): Promise<string> {
  // Check if Google Cloud is configured
  if (!isGoogleCloudConfigured || !geminiFlashModel) {
    // Return mock content for development mode
    const platformLimits: Record<string, number> = {
      'twitter': 280,
      'instagram': 2200,
      'facebook': 5000,
      'linkedin': 3000,
      'tiktok': 2200,
    };
    
    const mockContent = `🎯 ${request.isAdvertisement !== false ? '[AD]' : ''} ${request.businessName} ${request.productName ? `- ${request.productName}` : ''}

${request.keyMessages[0] || 'Discover amazing products and services!'}

✨ ${request.brandTone} content for ${request.targetAudience}

${request.callToAction}

#${request.businessName.replace(/\s+/g, '')} #${request.platform}`;
    
    const limit = platformLimits[request.platform.toLowerCase()] || 2200;
    return mockContent.substring(0, limit);
  }

  const systemPrompt = `You are an expert social media content creator specializing in ${request.platform} content.
  Create engaging ${request.isAdvertisement !== false ? 'advertisement' : 'organic'} content for ${request.businessName}.
  
  Target Audience: ${request.targetAudience}
  Brand Tone: ${request.brandTone}
  Key Messages: ${request.keyMessages.join(', ')}
  Call to Action: ${request.callToAction}
  ${request.productName ? `Product: ${request.productName}` : ''}
  ${request.additionalContext ? `Additional Context: ${request.additionalContext}` : ''}
  
  Platform-specific requirements:
  - Instagram: Maximum 2,200 characters, use relevant hashtags, engaging and visual language
  - Facebook: Conversational tone, can be longer form, include engagement prompts
  - Twitter/X: Maximum 280 characters, punchy and concise, 1-2 hashtags max
  - LinkedIn: Professional tone, value-driven content, industry insights
  - TikTok: Trendy, casual, youth-oriented language, trending hashtags
  
  Generate a single post that is optimized for ${request.platform}.
  ${request.isAdvertisement !== false ? 'Structure it as a compelling advertisement that drives action.' : ''}`;

  try {
    const result = await geminiFlashModel.generateContent(systemPrompt);
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || 'Failed to generate content';
  } catch (error) {
    console.error('Error generating text content:', error);
    throw new Error('Failed to generate text content');
  }
}

/**
 * Generate image using Imagen 4
 */
export async function generateImage(request: ImageGenerationRequest): Promise<string> {
  // Check if Google Cloud is configured
  if (!isGoogleCloudConfigured || !vertexAI) {
    // Return placeholder image URL for development mode
    const placeholderDescription = `[Development Mode] Image: ${request.prompt} | Style: ${request.visualStyle}`;
    return `https://via.placeholder.com/1080x1080/9333ea/ffffff?text=${encodeURIComponent(placeholderDescription.substring(0, 50))}`;
  }

  const enhancedPrompt = `${request.prompt}
  Visual Style: ${request.visualStyle}
  ${request.colorScheme ? `Color Scheme: ${request.colorScheme}` : ''}
  ${request.businessContext ? `Business Context: ${request.businessContext}` : ''}
  Professional quality, high resolution, suitable for social media advertising`;

  try {
    // Using Vertex AI's Imagen API
    const imagenModel = vertexAI.preview.getGenerativeModel({
      model: 'imagen-4.0',
    });

    const result = await imagenModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.8,
        topP: 0.95,
        candidateCount: 1,
      },
    });

    // Process and upload image to Cloud Storage
    const response = await result.response;
    const imageData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!imageData) {
      throw new Error('No image data received from Imagen');
    }

    const imageBuffer = Buffer.from(imageData, 'base64');
    const fileName = `images/${uuidv4()}.png`;
    
    // Optimize image for web
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(1080, 1080, { fit: 'cover' })
      .png({ quality: 90 })
      .toBuffer();

    // Upload to Cloud Storage
    const file = bucket.file(fileName);
    await file.save(optimizedBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });

    await file.makePublic();
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
  } catch (error) {
    console.error('Error generating image:', error);
    // Fallback to a placeholder image generation prompt via Gemini
    return await generatePlaceholderImage(request);
  }
}

/**
 * Generate placeholder image description when Imagen is unavailable
 */
async function generatePlaceholderImage(request: ImageGenerationRequest): Promise<string> {
  // Check if Google Cloud is configured
  if (!isGoogleCloudConfigured || !geminiFlashModel) {
    // Return simple placeholder for development mode
    return `https://via.placeholder.com/1080x1080/9333ea/ffffff?text=${encodeURIComponent(request.prompt.substring(0, 50))}`;
  }

  const prompt = `Create a detailed image description for: ${request.prompt}
  Style: ${request.visualStyle}
  This will be used as a placeholder for social media content.`;

  const result = await geminiFlashModel.generateContent(prompt);
  const response = result.response;
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || 'Placeholder image';
  
  // Return a placeholder URL with the description
  return `placeholder://image?description=${encodeURIComponent(text.substring(0, 100))}`;
}

/**
 * Generate video using Veo 3 Fast
 */
export async function generateVideo(request: VideoGenerationRequest): Promise<string> {
  // Check if Google Cloud is configured
  if (!isGoogleCloudConfigured || !vertexAI) {
    // Return placeholder video URL for development mode
    return `https://placeholder.video/development-mode?prompt=${encodeURIComponent(request.prompt.substring(0, 50))}&style=${request.visualStyle}`;
  }

  const enhancedPrompt = `${request.prompt}
  Visual Style: ${request.visualStyle}
  Duration: ${request.duration || 15} seconds
  ${request.includeText ? `Text Overlay: ${request.includeText}` : ''}
  ${request.businessContext ? `Business Context: ${request.businessContext}` : ''}
  Optimized for social media, vertical format preferred`;

  try {
    // Using Vertex AI's Veo API
    const veoModel = vertexAI.preview.getGenerativeModel({
      model: 'veo-3-fast',
    });

    const result = await veoModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.8,
      },
    });

    const response = await result.response;
    const videoData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!videoData) {
      throw new Error('No video data received from Veo');
    }

    const videoBuffer = Buffer.from(videoData, 'base64');
    const fileName = `videos/${uuidv4()}.mp4`;
    
    // Save temporarily for processing
    const tempPath = `/tmp/${uuidv4()}.mp4`;
    await fsPromises.writeFile(tempPath, videoBuffer);
    
    // Optimize video for social media
    const outputPath = `/tmp/${uuidv4()}_optimized.mp4`;
    await new Promise((resolve, reject) => {
      ffmpeg(tempPath)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 22',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart',
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const optimizedBuffer = await fsPromises.readFile(outputPath);
    
    // Upload to Cloud Storage
    const file = bucket.file(fileName);
    await file.save(optimizedBuffer, {
      metadata: {
        contentType: 'video/mp4',
      },
    });

    await file.makePublic();
    
    // Clean up temp files
    await fsPromises.unlink(tempPath);
    await fsPromises.unlink(outputPath);
    
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
  } catch (error) {
    console.error('Error generating video:', error);
    // Return a placeholder video URL
    return `placeholder://video?description=${encodeURIComponent(request.prompt.substring(0, 100))}`;
  }
}

/**
 * Generate a complete campaign with 14 posts (2 per day for 7 days)
 */
export async function generateCampaign(
  request: ContentGenerationRequest & ImageGenerationRequest,
  startDate: Date
): Promise<CampaignPost[]> {
  const posts: CampaignPost[] = [];
  const totalPosts = 14;
  const postsPerDay = 2;
  
  // Generate diverse content themes for the campaign
  let themes: string[] = [];
  
  if (!isGoogleCloudConfigured || !geminiProModel) {
    // Generate mock themes for development mode
    themes = [
      'Launch Announcement', 'Product Features', 'Customer Benefits', 'Limited Time Offer',
      'Behind the Scenes', 'Customer Testimonials', 'How It Works', 'Special Promotion',
      'Why Choose Us', 'Success Stories', 'Expert Tips', 'Community Spotlight',
      'Flash Sale', 'Final Call to Action'
    ];
  } else {
    const campaignThemesPrompt = `Create 14 unique content themes for a 7-day ${request.platform} campaign for ${request.businessName}.
    Each theme should be different but aligned with these parameters:
    - Product: ${request.productName || 'General business'}
    - Target Audience: ${request.targetAudience}
    - Campaign Goals: ${request.keyMessages.join(', ')}
    - Brand Tone: ${request.brandTone}
    
    Provide 14 distinct themes, one per line, that create a cohesive campaign narrative.`;
    
    const themesResult = await geminiProModel.generateContent(campaignThemesPrompt);
    const themesResponse = themesResult.response;
    const themesText = themesResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
    themes = themesText.split('\n').filter((t: string) => t.trim()).slice(0, 14);
  }
  
  // Generate posts for each day
  for (let day = 0; day < 7; day++) {
    for (let postInDay = 0; postInDay < postsPerDay; postInDay++) {
      const postIndex = day * postsPerDay + postInDay;
      const theme = themes[postIndex] || `Day ${day + 1} - Post ${postInDay + 1}`;
      
      // Calculate scheduled time (9 AM and 6 PM)
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + day);
      scheduledDate.setHours(postInDay === 0 ? 9 : 18, 0, 0, 0);
      
      // Generate content for this post
      const contentRequest = {
        ...request,
        additionalContext: `Theme for this post: ${theme}. This is post ${postIndex + 1} of 14 in the campaign.`,
      };
      
      const [textContent, imagePrompt] = await Promise.all([
        generateTextContent(contentRequest),
        generateImagePrompt({
          ...request,
          theme,
          postNumber: postIndex + 1,
          platform: request.platform,
        }),
      ]);
      
      posts.push({
        content: textContent,
        imagePrompt,
        scheduledFor: scheduledDate,
        dayNumber: day + 1,
        postNumber: postIndex + 1,
      });
    }
  }
  
  return posts;
}

/**
 * Generate an image prompt for a campaign post
 */
async function generateImagePrompt(
  request: ImageGenerationRequest & { theme: string; postNumber: number; platform?: string }
): Promise<string> {
  // Check if Google Cloud is configured
  if (!isGoogleCloudConfigured || !geminiFlashModel) {
    // Return mock image prompt for development mode
    return `Professional ${request.visualStyle} image for ${request.theme} - Post ${request.postNumber}. ${request.colorScheme || 'Vibrant colors'}. High-quality social media advertisement.`;
  }

  const prompt = `Create a detailed image generation prompt for social media post ${request.postNumber}.
  Theme: ${request.theme}
  Visual Style: ${request.visualStyle}
  ${request.colorScheme ? `Color Scheme: ${request.colorScheme}` : ''}
  ${request.businessContext ? `Business: ${request.businessContext}` : ''}
  
  The prompt should be specific, visually descriptive, and suitable for creating an engaging social media image.
  Focus on composition, lighting, and elements that will grab attention on ${request.platform || 'social media'}.`;
  
  const result = await geminiFlashModel.generateContent(prompt);
  const response = result.response;
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || 'Generate a professional, eye-catching image for social media advertising';
}

/**
 * Generate images for all posts in a campaign
 */
export async function generateCampaignImages(posts: CampaignPost[]): Promise<void> {
  const batchSize = 3; // Process 3 images at a time to avoid rate limits
  
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const imagePromises = batch.map(post => 
      generateImage({
        prompt: post.imagePrompt,
        visualStyle: 'modern, professional, eye-catching',
        aspectRatio: '1:1',
      })
    );
    
    const imageUrls = await Promise.all(imagePromises);
    
    // Update posts with image URLs
    batch.forEach((post, index) => {
      post.imageUrl = imageUrls[index];
    });
    
    // Add a small delay between batches to respect rate limits
    if (i + batchSize < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Initialize Google Cloud Storage bucket
 */
export async function initializeStorage(): Promise<void> {
  // Check if Google Cloud is configured
  if (!isGoogleCloudConfigured || !bucket || !storage) {
    console.log('Google Cloud Storage not configured - skipping initialization');
    return;
  }

  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      const bucketName = process.env.GCLOUD_STORAGE_BUCKET || 'myaimediamgr-content';
      await storage.createBucket(bucketName, {
        location: process.env.GCLOUD_LOCATION || 'us-central1',
        storageClass: 'STANDARD',
      });
      console.log(`Created bucket ${bucketName}`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}