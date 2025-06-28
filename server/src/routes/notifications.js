import express from 'express';
import { promisify } from 'util';
import { createConnection } from '../database/init.js';
import { authenticate } from '../middleware/auth.js';
import { validateParams, validateQuery, schemas } from '../middleware/validation.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 20, type, is_read } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Build WHERE clause
    let whereConditions = ['user_id = ?'];
    let params = [userId];
    
    if (type) {
      whereConditions.push('type = ?');
      params.push(type);
    }
    
    if (is_read !== undefined) {
      whereConditions.push('is_read = ?');
      params.push(is_read === 'true' ? 1 : 0);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // Get notifications
    const notifications = await all(`
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get total count
    const totalResult = await get(`
      SELECT COUNT(*) as total
      FROM notifications
      ${whereClause}
    `, params);
    
    // Get unread count
    const unreadResult = await get(`
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `, [userId]);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    db.close();
    
    res.json({
      success: true,
      data: {
        notifications,
        unread_count: unreadResult.unread_count,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if notification exists and belongs to user
    const notification = await get(`
      SELECT id FROM notifications 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    
    if (!notification) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Mark as read
    await run(`
      UPDATE notifications 
      SET is_read = 1
      WHERE id = ?
    `, [id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    
    await run(`
      UPDATE notifications 
      SET is_read = 1
      WHERE user_id = ? AND is_read = 0
    `, [userId]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete notification
router.delete('/:id', authenticate, validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if notification exists and belongs to user
    const notification = await get(`
      SELECT id FROM notifications 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    
    if (!notification) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Delete notification
    await run('DELETE FROM notifications WHERE id = ?', [id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create notification (Admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    const { user_id, type, title, message, action_url } = req.body;
    
    if (!user_id || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'user_id, type, title, and message are required'
      });
    }
    
    const validTypes = ['order', 'promotion', 'reminder', 'system'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if user exists
    const user = await get('SELECT id FROM users WHERE id = ?', [user_id]);
    
    if (!user) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create notification
    const result = await run(`
      INSERT INTO notifications (user_id, type, title, message, action_url)
      VALUES (?, ?, ?, ?, ?)
    `, [user_id, type, title, message, action_url]);
    
    // Get created notification
    const notification = await get(`
      SELECT * FROM notifications WHERE id = ?
    `, [result.lastID]);
    
    db.close();
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification }
    });
    
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;