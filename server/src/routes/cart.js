import express from 'express';
import { promisify } from 'util';
import { createConnection } from '../database/init.js';
import { authenticate } from '../middleware/auth.js';
import { validate, validateParams, schemas } from '../middleware/validation.js';

const router = express.Router();

// Get user cart
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    
    const cartItems = await all(`
      SELECT 
        c.*,
        p.name as product_name,
        p.price as product_price,
        p.original_price as product_original_price,
        p.images as product_images,
        p.stock_quantity,
        p.is_active as product_active,
        cat.name as category_name
      FROM cart c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [userId]);
    
    db.close();
    
    // Format cart items
    const formattedItems = cartItems.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      product: {
        id: item.product_id,
        name: item.product_name,
        price: item.product_price,
        original_price: item.product_original_price,
        images: item.product_images ? JSON.parse(item.product_images) : [],
        stock_quantity: item.stock_quantity,
        is_active: Boolean(item.product_active),
        category_name: item.category_name
      },
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
    
    // Calculate totals
    const subtotal = formattedItems.reduce((sum, item) => {
      if (item.product.is_active) {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);
    
    const totalItems = formattedItems.reduce((sum, item) => {
      if (item.product.is_active) {
        return sum + item.quantity;
      }
      return sum;
    }, 0);
    
    res.json({
      success: true,
      data: {
        items: formattedItems,
        summary: {
          total_items: totalItems,
          subtotal: subtotal,
          active_items: formattedItems.filter(item => item.product.is_active).length,
          inactive_items: formattedItems.filter(item => !item.product.is_active).length
        }
      }
    });
    
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add item to cart
router.post('/items', authenticate, validate(schemas.addToCart), async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if product exists and is active
    const product = await get(`
      SELECT id, name, price, stock_quantity, is_active 
      FROM products 
      WHERE id = ?
    `, [product_id]);
    
    if (!product) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (!product.is_active) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }
    
    if (quantity > product.stock_quantity) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }
    
    // Check if item already exists in cart
    const existingItem = await get(`
      SELECT id, quantity FROM cart 
      WHERE user_id = ? AND product_id = ?
    `, [userId, product_id]);
    
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stock_quantity) {
        db.close();
        return res.status(400).json({
          success: false,
          message: 'Total quantity exceeds available stock'
        });
      }
      
      await run(`
        UPDATE cart 
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newQuantity, existingItem.id]);
      
    } else {
      // Add new item
      await run(`
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES (?, ?, ?)
      `, [userId, product_id, quantity]);
    }
    
    db.close();
    
    res.json({
      success: true,
      message: 'Item added to cart successfully'
    });
    
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update cart item quantity
router.put('/items/:id', authenticate, validateParams(schemas.idParam), validate(schemas.updateCartItem), async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Get cart item with product info
    const cartItem = await get(`
      SELECT c.*, p.stock_quantity, p.is_active
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.id = ? AND c.user_id = ?
    `, [id, userId]);
    
    if (!cartItem) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }
    
    if (!cartItem.is_active) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }
    
    if (quantity > cartItem.stock_quantity) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }
    
    // Update quantity
    await run(`
      UPDATE cart 
      SET quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [quantity, id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Cart item updated successfully'
    });
    
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Remove item from cart
router.delete('/items/:id', authenticate, validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if cart item exists
    const cartItem = await get(`
      SELECT id FROM cart WHERE id = ? AND user_id = ?
    `, [id, userId]);
    
    if (!cartItem) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }
    
    // Remove item
    await run('DELETE FROM cart WHERE id = ?', [id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
    
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Clear cart
router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    
    await run('DELETE FROM cart WHERE user_id = ?', [userId]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
    
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;