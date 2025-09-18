import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import {
  sendPasswordResetEmail,
  emailRateLimiter,
  verificationRateLimiter,
} from './emailService';

const router = Router();

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).max(100),
});

// Request password reset
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = requestResetSchema.parse(req.body);

    // Check rate limiting for email sending
    if (!emailRateLimiter.isAllowed(email)) {
      const remainingMs = emailRateLimiter.getRemainingTime(email);
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return res.status(429).json({
        message: `Too many reset requests. Please wait ${remainingMinutes} minutes before requesting another reset.`,
        retryAfter: remainingMs,
      });
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
    }

    // Check if user has OAuth login only (no password)
    if (!user.password) {
      // Send different email for OAuth users
      await sendPasswordResetEmail(email, '', true); // OAuth flag
      return res.json({
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in user record
    await storage.updateUser(user.id, {
      passwordResetToken: hashedToken,
      passwordResetExpiry: resetExpiry,
    });

    // Send reset email with token
    await sendPasswordResetEmail(email, resetToken);

    res.json({
      message: 'If an account exists with this email, you will receive password reset instructions.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid email format', errors: error.errors });
    }
    console.error('Request password reset error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by reset token
    const users = Array.from(storage.getAllUsers().values());
    const user = users.find(u =>
      u.passwordResetToken === hashedToken &&
      u.passwordResetExpiry &&
      new Date(u.passwordResetExpiry) > new Date()
    );

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token. Please request a new password reset.',
        requiresNewToken: true,
      });
    }

    // Check rate limiting for password reset attempts
    const rateLimitKey = `reset:${user.email}`;
    if (!verificationRateLimiter.isAllowed(rateLimitKey)) {
      const remainingMs = verificationRateLimiter.getRemainingTime(rateLimitKey);
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return res.status(429).json({
        message: `Too many reset attempts. Please wait ${remainingMinutes} minutes before trying again.`,
        retryAfter: remainingMs,
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await storage.updateUser(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
      passwordChangedAt: new Date(),
    });

    // Reset rate limiters for this user
    verificationRateLimiter.reset(rateLimitKey);

    res.json({
      message: 'Password reset successfully! You can now login with your new password.',
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input format', errors: error.errors });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Verify reset token
router.get('/verify-token', async (req, res) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by reset token
    const users = Array.from(storage.getAllUsers().values());
    const user = users.find(u =>
      u.passwordResetToken === hashedToken &&
      u.passwordResetExpiry &&
      new Date(u.passwordResetExpiry) > new Date()
    );

    if (!user) {
      return res.status(400).json({
        valid: false,
        message: 'Invalid or expired reset token',
      });
    }

    res.json({
      valid: true,
      email: user.email,
      expiresAt: user.passwordResetExpiry,
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'Failed to verify reset token' });
  }
});

export default router;