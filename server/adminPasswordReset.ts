import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { requireAdmin } from './auth';

const router = Router();

// Secure endpoint to set admin passwords (requires existing admin access)
router.post('/set-admin-password', requireAdmin, async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        message: 'Email and new password are required'
      });
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Verify user is admin
    if (!user.isAdmin && user.role !== 'admin') {
      return res.status(403).json({
        message: 'User is not an admin'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await storage.updateUser(user.id, {
      password: hashedPassword,
      updatedAt: new Date()
    });

    res.json({
      message: 'Admin password updated successfully',
      email: user.email
    });

  } catch (error) {
    console.error('Error setting admin password:', error);
    res.status(500).json({
      message: 'Failed to set admin password'
    });
  }
});

// Emergency admin creation endpoint (only works if no admins exist)
router.post('/emergency-admin', async (req, res) => {
  try {
    // Check if any admins exist
    const allUsers = Array.from(storage.getAllUsers().values());
    const adminExists = allUsers.some(user => user.isAdmin || user.role === 'admin');

    if (adminExists) {
      return res.status(403).json({
        message: 'Admin users already exist. Use admin panel to manage passwords.'
      });
    }

    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        message: 'Email, password, firstName, and lastName are required'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create emergency admin
    const emergencyAdmin = await storage.createUser({
      email,
      username: email.split('@')[0],
      password: hashedPassword,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      role: 'admin',
      isAdmin: true,
      tier: 'enterprise',
      credits: 999999999,
      emailVerified: true,
      needsTrialSelection: false,
      accountStatus: 'active',
      subscriptionStatus: 'active'
    });

    res.json({
      message: 'Emergency admin created successfully',
      adminId: emergencyAdmin.id,
      email: emergencyAdmin.email
    });

  } catch (error) {
    console.error('Error creating emergency admin:', error);
    res.status(500).json({
      message: 'Failed to create emergency admin'
    });
  }
});

export default router;