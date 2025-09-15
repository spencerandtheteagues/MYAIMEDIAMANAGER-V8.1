import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from './auth';
import type { IStorage } from './storage';

const submitPostSchema = z.object({
  id: z.string(),
});

const approvePostSchema = z.object({
  id: z.string(),
});

const rejectPostSchema = z.object({
  id: z.string(),
  reason: z.string().min(1, "Rejection reason is required"),
});

const schedulePostSchema = z.object({
  id: z.string(),
  scheduled_at: z.string().datetime(),
});

export function createApprovalRoutes(storage: IStorage) {
  const router = Router();

  // Submit post for approval (draft → pending_approval)
  router.post('/api/posts/submit', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = submitPostSchema.parse(req.body);
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get the post and verify ownership
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Get user to check if admin
      const user = await storage.getUser(userId);
      if (post.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (post.status !== 'draft') {
        return res.status(422).json({ 
          error: 'Invalid state transition', 
          message: `Cannot submit post with status '${post.status}'. Post must be in 'draft' status.` 
        });
      }

      // Update status to pending_approval
      await storage.updatePost(id, { status: 'pending_approval' });

      const updatedPost = await storage.getPost(id);
      res.json(updatedPost);
    } catch (error) {
      console.error('Submit post error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to submit post' });
    }
  });

  // Approve post (pending_approval → approved)
  router.post('/api/posts/approve', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = approvePostSchema.parse(req.body);
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get the post
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Only admins or post owners can approve
      const user = await storage.getUser(userId);
      if (post.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (post.status !== 'pending_approval') {
        return res.status(422).json({ 
          error: 'Invalid state transition', 
          message: `Cannot approve post with status '${post.status}'. Post must be in 'pending_approval' status.` 
        });
      }

      // Update status to approved and set approvedBy
      await storage.updatePost(id, { 
        status: 'approved',
        approvedBy: userId 
      });

      const updatedPost = await storage.getPost(id);
      res.json(updatedPost);
    } catch (error) {
      console.error('Approve post error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to approve post' });
    }
  });

  // Reject post (pending_approval → rejected)
  router.post('/api/posts/reject', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id, reason } = rejectPostSchema.parse(req.body);
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get the post
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Only admins or post owners can reject
      const user = await storage.getUser(userId);
      if (post.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (post.status !== 'pending_approval') {
        return res.status(422).json({ 
          error: 'Invalid state transition', 
          message: `Cannot reject post with status '${post.status}'. Post must be in 'pending_approval' status.` 
        });
      }

      // Update status to rejected with reason
      await storage.updatePost(id, { 
        status: 'rejected',
        rejectionReason: reason
      });

      const updatedPost = await storage.getPost(id);
      res.json(updatedPost);
    } catch (error) {
      console.error('Reject post error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to reject post' });
    }
  });

  // Schedule post (approved → scheduled)
  router.post('/api/posts/schedule', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id, scheduled_at } = schedulePostSchema.parse(req.body);
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get the post
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Only admins or post owners can schedule
      const user = await storage.getUser(userId);
      if (post.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (post.status !== 'approved') {
        return res.status(422).json({ 
          error: 'Invalid state transition', 
          message: `Cannot schedule post with status '${post.status}'. Post must be in 'approved' status.` 
        });
      }

      // Validate scheduled time is in the future
      const scheduledDate = new Date(scheduled_at);
      if (scheduledDate <= new Date()) {
        return res.status(422).json({ 
          error: 'Invalid schedule time', 
          message: 'Scheduled time must be in the future' 
        });
      }

      // Update status to scheduled with scheduled time
      await storage.updatePost(id, { 
        status: 'scheduled',
        scheduledFor: scheduledDate
      });

      const updatedPost = await storage.getPost(id);
      res.json(updatedPost);
    } catch (error) {
      console.error('Schedule post error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to schedule post' });
    }
  });

  return router;
}