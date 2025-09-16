import { Router } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import {
  generateVerificationCode,
  hashVerificationCode,
  verifyCode,
  sendVerificationEmail,
  sendWelcomeEmail,
  emailRateLimiter,
  verificationRateLimiter,
} from './emailService';
import { signJwt } from './auth/jwt';

const router = Router();

// Validation schemas
const sendVerificationSchema = z.object({
  email: z.string().email(),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/),
});

// Send verification code endpoint
router.post('/send-verification', async (req, res) => {
  try {
    const { email } = sendVerificationSchema.parse(req.body);
    
    // Check rate limiting for email sending
    if (!emailRateLimiter.isAllowed(email)) {
      const remainingMs = emailRateLimiter.getRemainingTime(email);
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return res.status(429).json({
        message: `Too many verification emails. Please wait ${remainingMinutes} minutes before requesting another code.`,
        retryAfter: remainingMs,
      });
    }
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Generate new verification code
    const code = generateVerificationCode();
    const hashedCode = await hashVerificationCode(code);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    // Update user with new verification code
    await storage.updateUser(user.id, {
      emailVerificationCode: hashedCode,
      emailVerificationExpiry: expiry,
      emailVerificationAttempts: 0,
    });
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, code);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
    
    res.json({
      message: 'Verification code sent to your email',
      expiresAt: expiry.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid email format', errors: error.errors });
    }
    console.error('Send verification error:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// Verify email with code endpoint
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = verifyEmailSchema.parse(req.body);
    
    // Check rate limiting for verification attempts
    const rateLimitKey = `verify:${email}`;
    if (!verificationRateLimiter.isAllowed(rateLimitKey)) {
      const remainingMs = verificationRateLimiter.getRemainingTime(rateLimitKey);
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return res.status(429).json({
        message: `Too many verification attempts. Please wait ${remainingMinutes} minutes before trying again.`,
        retryAfter: remainingMs,
      });
    }
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Check if verification code exists
    if (!user.emailVerificationCode || !user.emailVerificationExpiry) {
      return res.status(400).json({ 
        message: 'No verification code found. Please request a new code.',
        requiresNewCode: true,
      });
    }
    
    // Check if code has expired
    if (new Date() > user.emailVerificationExpiry) {
      return res.status(400).json({ 
        message: 'Verification code has expired. Please request a new code.',
        requiresNewCode: true,
      });
    }
    
    // Check attempt limit
    const attempts = (user.emailVerificationAttempts || 0) + 1;
    if (attempts > 5) {
      // Clear the code to force a new one
      await storage.updateUser(user.id, {
        emailVerificationCode: null,
        emailVerificationExpiry: null,
        emailVerificationAttempts: 0,
      });
      return res.status(400).json({ 
        message: 'Too many incorrect attempts. Please request a new code.',
        requiresNewCode: true,
      });
    }
    
    // Verify the code
    const isValid = await verifyCode(code, user.emailVerificationCode);
    
    if (!isValid) {
      // Increment attempt counter
      await storage.updateUser(user.id, {
        emailVerificationAttempts: attempts,
      });
      
      const remainingAttempts = 5 - attempts;
      return res.status(400).json({ 
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        remainingAttempts,
      });
    }
    
    // Code is valid! Mark email as verified
    await storage.updateUser(user.id, {
      emailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpiry: null,
      emailVerificationAttempts: 0,
    });
    
    // Reset rate limiters for this user
    emailRateLimiter.reset(email);
    verificationRateLimiter.reset(rateLimitKey);
    
    // Send welcome email
    await sendWelcomeEmail(email);

    // Create JWT token for automatic login after verification
    const token = signJwt({
      sub: String(user.id),
      email: user.email,
      name: user.fullName,
      picture: user.googleAvatar,
      roles: [user.role],
    });

    res.cookie('mam_jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Fetch updated user data to include needsTrialSelection status
    const updatedUser = await storage.getUser(user.id);

    res.json({
      message: 'Email verified successfully! Welcome to MyAI MediaMgr.',
      verified: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        needsTrialSelection: updatedUser.needsTrialSelection,
        role: updatedUser.role,
        isAdmin: updatedUser.isAdmin,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input format', errors: error.errors });
    }
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Failed to verify email' });
  }
});

// Check verification status endpoint
router.get('/verification-status', async (req, res) => {
  try {
    const email = req.query.email as string;
    
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }
    
    const hasActiveCode = !!(
      user.emailVerificationCode && 
      user.emailVerificationExpiry && 
      new Date() < user.emailVerificationExpiry
    );
    
    res.json({
      emailVerified: user.emailVerified,
      hasActiveCode,
      expiresAt: hasActiveCode ? user.emailVerificationExpiry : null,
    });
  } catch (error) {
    console.error('Check verification status error:', error);
    res.status(500).json({ message: 'Failed to check verification status' });
  }
});

export default router;