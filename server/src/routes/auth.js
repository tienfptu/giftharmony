import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { createConnection } from '../database/init.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register
router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if user already exists
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUser) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const result = await run(`
      INSERT INTO users (email, password, full_name, phone)
      VALUES (?, ?, ?, ?)
    `, [email, hashedPassword, full_name, phone || null]);
    
    const userId = result.lastID;
    
    // Get created user
    const user = await get(`
      SELECT id, email, full_name, phone, role, points, level, created_at
      FROM users WHERE id = ?
    `, [userId]);
    
    db.close();
    
    // Generate token
    const token = generateToken(userId);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const db = createConnection();
    const get = promisify(db.get.bind(db));
    
    // Get user with password
    const user = await get(`
      SELECT id, email, password, full_name, phone, role, points, level, is_active
      FROM users WHERE email = ?
    `, [email]);
    
    db.close();
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Remove password from response
    delete user.password;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const db = createConnection();
    const get = promisify(db.get.bind(db));
    
    const user = await get(`
      SELECT id, email, full_name, phone, avatar, role, points, level, created_at
      FROM users WHERE id = ?
    `, [req.user.id]);
    
    db.close();
    
    res.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { full_name, phone, avatar } = req.body;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Update user
    await run(`
      UPDATE users 
      SET full_name = COALESCE(?, full_name),
          phone = COALESCE(?, phone),
          avatar = COALESCE(?, avatar),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [full_name, phone, avatar, req.user.id]);
    
    // Get updated user
    const user = await get(`
      SELECT id, email, full_name, phone, avatar, role, points, level
      FROM users WHERE id = ?
    `, [req.user.id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Get current password
    const user = await get('SELECT password FROM users WHERE id = ?', [req.user.id]);
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
    
    if (!isCurrentPasswordValid) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(new_password, 12);
    
    // Update password
    await run(`
      UPDATE users 
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [hashedNewPassword, req.user.id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;