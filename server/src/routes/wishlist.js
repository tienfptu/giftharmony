import express from 'express';
import { promisify } from 'util';
import { createConnection } from '../database/init.js';
import { authenticate } from '../middleware/auth.js';
import { validateParams, schemas } from '../middleware/validation.js';

const router = express.Router();

// Get user wishlist
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    
    const wishlistItems = await all(`
      SELECT 
        w.*,
        p.name as product_name,
        p.price as product_price,
        p.original_price as product_original_price,
        p.images as product_images,
        p.rating as product_rating,
        p.is_active as product_active,
        cat.name as category_name
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      WHERE w.user_id = ? AND p.is_active = 1
      ORDER BY w.created_at DESC
    `, [userId]);
    
    db.close();
    
    // Format wishlist items
    const formattedItems = wishlistItems.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product: {
        id: item.product_id,
        name: item.product_name,
        price: item.product_price,
        original_price: item.product_original_price,
        images: item.product_images ? JSON.parse(item.product_images) : [],
        rating: item.product_rating,
        category_name: item.category_name
      },
      created_at: item.created_at
    }));
    
    res.json({
      success: true,
      data: {
        items: formattedItems,
        total_items: formattedItems.length
      }
    });
    
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add item to wishlist
router.post('/items/:productId', authenticate, validateParams(schemas.idParam), async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if product exists and is active
    const product = await get(`
      SELECT id FROM products 
      WHERE id = ? AND is_active = 1
    `, [productId]);
    
    if (!product) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if item already exists in wishlist
    const existingItem = await get(`
      SELECT id FROM wishlist 
      WHERE user_id = ? AND product_id = ?
    `, [userId, productId]);
    
    if (existingItem) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }
    
    // Add to wishlist
    await run(`
      INSERT INTO wishlist (user_id, product_id)
      VALUES (?, ?)
    `, [userId, productId]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Item added to wishlist successfully'
    });
    
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Remove item from wishlist
router.delete('/items/:productId', authenticate, validateParams(schemas.idParam), async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if item exists in wishlist
    const wishlistItem = await get(`
      SELECT id FROM wishlist 
      WHERE user_id = ? AND product_id = ?
    `, [userId, productId]);
    
    if (!wishlistItem) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }
    
    // Remove from wishlist
    await run(`
      DELETE FROM wishlist 
      WHERE user_id = ? AND product_id = ?
    `, [userId, productId]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Item removed from wishlist successfully'
    });
    
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Toggle wishlist item
router.post('/toggle/:productId', authenticate, validateParams(schemas.idParam), async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if product exists and is active
    const product = await get(`
      SELECT id FROM products 
      WHERE id = ? AND is_active = 1
    `, [productId]);
    
    if (!product) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if item exists in wishlist
    const existingItem = await get(`
      SELECT id FROM wishlist 
      WHERE user_id = ? AND product_id = ?
    `, [userId, productId]);
    
    let action = '';
    
    if (existingItem) {
      // Remove from wishlist
      await run(`
        DELETE FROM wishlist 
        WHERE user_id = ? AND product_id = ?
      `, [userId, productId]);
      action = 'removed';
    } else {
      // Add to wishlist
      await run(`
        INSERT INTO wishlist (user_id, product_id)
        VALUES (?, ?)
      `, [userId, productId]);
      action = 'added';
    }
    
    db.close();
    
    res.json({
      success: true,
      message: `Item ${action} ${action === 'added' ? 'to' : 'from'} wishlist successfully`,
      data: { action, is_wishlisted: action === 'added' }
    });
    
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Clear wishlist
router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    
    await run('DELETE FROM wishlist WHERE user_id = ?', [userId]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
    
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;