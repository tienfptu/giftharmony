const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get cart items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        ci.id,
        ci.quantity,
        p.id as product_id,
        p.name,
        p.price,
        p.original_price,
        p.image_url,
        p.stock_quantity,
        c.name as category_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ci.user_id = $1 AND p.is_active = true
      ORDER BY ci.created_at DESC
    `;

    const result = await db.query(query, [req.user.id]);

    const items = result.rows.map(item => ({
      ...item,
      price_formatted: new Intl.NumberFormat('vi-VN').format(item.price) + 'đ',
      original_price_formatted: item.original_price 
        ? new Intl.NumberFormat('vi-VN').format(item.original_price) + 'đ' 
        : null,
      subtotal: item.price * item.quantity,
      subtotal_formatted: new Intl.NumberFormat('vi-VN').format(item.price * item.quantity) + 'đ',
      in_stock: item.stock_quantity >= item.quantity
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({
      success: true,
      data: {
        items,
        summary: {
          total_items: items.length,
          total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          total_amount: total,
          total_formatted: new Intl.NumberFormat('vi-VN').format(total) + 'đ'
        }
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add item to cart
router.post('/items', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID or quantity'
      });
    }

    // Check if product exists and is active
    const productResult = await db.query(
      'SELECT id, name, stock_quantity FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];

    // Check existing cart item
    const existingItemResult = await db.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, product_id]
    );

    if (existingItemResult.rows.length > 0) {
      // Update existing item
      const existingItem = existingItemResult.rows[0];
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }

      await db.query(
        'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newQuantity, existingItem.id]
      );
    } else {
      // Create new cart item
      if (quantity > product.stock_quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }

      await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [req.user.id, product_id, quantity]
      );
    }

    res.json({
      success: true,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update cart item quantity
router.put('/items/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Check if cart item exists and belongs to user
    const cartItemResult = await db.query(
      `SELECT ci.id, ci.product_id, p.stock_quantity 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1 AND ci.user_id = $2`,
      [id, req.user.id]
    );

    if (cartItemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    const cartItem = cartItemResult.rows[0];

    if (quantity > cartItem.stock_quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    await db.query(
      'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantity, id]
    );

    res.json({
      success: true,
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove item from cart
router.delete('/items/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Clear cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;