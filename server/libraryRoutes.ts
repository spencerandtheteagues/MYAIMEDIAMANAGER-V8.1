import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from './auth';
import type { IStorage } from './storage';

const getLibrarySchema = z.object({
  kind: z.enum(['image', 'video', 'text']).optional(),
  campaign: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  platform: z.string().optional(),
});

export function createLibraryRoutes(storage: IStorage) {
  const router = Router();

  // GET /api/library - Get library items with filters
  router.get('/api/library', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const filters = getLibrarySchema.parse(req.query);
      
      // Get all content library items for the user
      const items = await storage.getContentLibraryByUserId(userId);
      
      // Apply filters
      let filteredItems = items;
      
      if (filters.kind) {
        // For text filter, return empty array (text is not saved to library)
        if (filters.kind === 'text') {
          return res.json([]);
        }
        filteredItems = filteredItems.filter(item => item.type === filters.kind);
      }
      
      if (filters.platform) {
        filteredItems = filteredItems.filter(item => item.platform === filters.platform);
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredItems = filteredItems.filter(item => {
          if (!item.createdAt) return false;
          return new Date(item.createdAt) >= startDate;
        });
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredItems = filteredItems.filter(item => {
          if (!item.createdAt) return false;
          return new Date(item.createdAt) <= endDate;
        });
      }
      
      // Sort by creation date, newest first
      filteredItems.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      
      res.json(filteredItems);
    } catch (error) {
      console.error('Get library error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to fetch library' });
    }
  });

  // DELETE /api/library/:id - Delete a library item
  router.delete('/api/library/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      
      // Get the item to verify ownership
      const items = await storage.getContentLibraryByUserId(userId);
      const item = items.find(i => i.id === id);
      
      if (!item) {
        return res.status(404).json({ error: 'Library item not found' });
      }
      
      // Only allow deletion of own items
      const user = await storage.getUser(userId);
      if (item.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      // Delete the item
      await storage.deleteContentLibraryItem(id);
      
      res.json({ success: true, message: 'Library item deleted' });
    } catch (error) {
      console.error('Delete library item error:', error);
      res.status(500).json({ error: 'Failed to delete library item' });
    }
  });

  // GET /api/library/:id - Get a single library item
  router.get('/api/library/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      
      // Get the item
      const items = await storage.getContentLibraryByUserId(userId);
      const item = items.find(i => i.id === id);
      
      if (!item) {
        return res.status(404).json({ error: 'Library item not found' });
      }
      
      // Check access permissions
      const user = await storage.getUser(userId);
      if (item.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      res.json(item);
    } catch (error) {
      console.error('Get library item error:', error);
      res.status(500).json({ error: 'Failed to fetch library item' });
    }
  });

  return router;
}