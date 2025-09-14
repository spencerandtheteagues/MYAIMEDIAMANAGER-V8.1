import { Router, Request, Response } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Chat request schema
const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  conversationHistory: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string()
  })).optional().default([])
});

// Social media focused system prompt
const SOCIAL_MEDIA_SYSTEM_PROMPT = `You are an expert social media content strategist and creative assistant specializing in helping businesses create engaging, viral-worthy content across all major platforms.

Your expertise includes:
- Creating compelling posts for Instagram, Facebook, X/Twitter, TikTok, and LinkedIn
- Identifying trending topics and relevant hashtags for maximum reach
- Developing content calendars and posting strategies
- Crafting engaging captions with strong hooks and calls-to-action
- Understanding platform-specific best practices and algorithms
- Suggesting creative angles, storytelling techniques, and content formats
- Optimizing content for engagement, shares, and conversions

When helping users:
1. Always consider their target audience and business goals
2. Provide specific, actionable ideas they can implement immediately
3. Suggest relevant hashtags and optimal posting times
4. Offer variations for different platforms when applicable
5. Include engagement strategies like questions, polls, or challenges
6. Consider visual elements and how they complement the text
7. Keep content authentic, valuable, and aligned with brand voice

Be creative, enthusiastic, and supportive. Help users overcome creative blocks and discover fresh perspectives for their social media content.`;

// OpenAI chat endpoint with streaming
router.post('/openai', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = chatRequestSchema.parse(req.body);
    
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ 
        error: 'OpenAI service not configured',
        message: 'OpenAI API key is not set. Please configure OPENAI_API_KEY in your environment variables.'
      });
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });
    
    // Prepare messages with system prompt
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SOCIAL_MEDIA_SYSTEM_PROMPT },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];
    
    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    
    try {
      // Create streaming chat completion
      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        stream: true,
        temperature: 0.8, // Slightly higher for creativity
        max_tokens: 2000,
      });
      
      // Stream the response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          // Send SSE formatted data
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      
      // Send done signal
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      
    } catch (streamError: any) {
      console.error('OpenAI streaming error:', streamError);
      
      // If headers haven't been sent, send error as JSON
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: 'Failed to generate response',
          message: streamError.message || 'An error occurred while streaming the response'
        });
      }
      
      // If already streaming, send error in SSE format
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
    
  } catch (error: any) {
    console.error('OpenAI chat error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Please provide a valid message and conversation history'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to process chat request'
    });
  }
});

// Gemini chat endpoint with streaming
router.post('/gemini', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = chatRequestSchema.parse(req.body);
    
    // Check for API key (prefer GOOGLE_API_KEY, fallback to GEMINI_API_KEY)
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ 
        error: 'Gemini service not configured',
        message: 'Gemini API key is not set. Please configure GOOGLE_API_KEY or GEMINI_API_KEY in your environment variables.'
      });
    }
    
    // Initialize Gemini client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.8, // Slightly higher for creativity
        maxOutputTokens: 2000,
      }
    });
    
    // Prepare chat history for Gemini format
    const geminiHistory = [
      {
        role: 'user' as const,
        parts: [{ text: 'You are a social media expert. ' + SOCIAL_MEDIA_SYSTEM_PROMPT }]
      },
      {
        role: 'model' as const,
        parts: [{ text: 'I understand. I\'m ready to help you create amazing social media content! I\'ll focus on crafting engaging posts, suggesting trending topics and hashtags, developing content strategies, and helping you maximize your social media presence across all platforms. What would you like to work on today?' }]
      }
    ];
    
    // Add conversation history
    for (const msg of conversationHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        geminiHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Start chat session
    const chat = model.startChat({
      history: geminiHistory,
    });
    
    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    
    try {
      // Send message and get streaming response
      const result = await chat.sendMessageStream(message);
      
      // Stream the response
      for await (const chunk of result.stream) {
        const content = chunk.text();
        if (content) {
          // Send SSE formatted data
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      
      // Send done signal
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      
    } catch (streamError: any) {
      console.error('Gemini streaming error:', streamError);
      
      // If headers haven't been sent, send error as JSON
      if (!res.headersSent) {
        // Handle specific Gemini errors
        if (streamError.message?.includes('API key not valid')) {
          return res.status(401).json({ 
            error: 'Invalid API key',
            message: 'The Gemini API key is invalid. Please check your configuration.'
          });
        }
        
        if (streamError.message?.includes('quota')) {
          return res.status(429).json({ 
            error: 'Quota exceeded',
            message: 'API quota has been exceeded. Please try again later.'
          });
        }
        
        return res.status(500).json({ 
          error: 'Failed to generate response',
          message: streamError.message || 'An error occurred while streaming the response'
        });
      }
      
      // If already streaming, send error in SSE format
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
    
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Please provide a valid message and conversation history'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to process chat request'
    });
  }
});

// Health check endpoint for chat services
router.get('/health', async (req: Request, res: Response) => {
  const openAIConfigured = !!process.env.OPENAI_API_KEY;
  const geminiConfigured = !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
  
  res.json({
    status: 'healthy',
    services: {
      openai: {
        configured: openAIConfigured,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
      },
      gemini: {
        configured: geminiConfigured,
        model: 'gemini-2.0-flash-exp'
      }
    },
    features: {
      streaming: true,
      socialMediaFocus: true,
      maxTokens: 2000
    }
  });
});

export default router;