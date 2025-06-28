const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get wishlist items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        w.id,
        w.created_at,
        p.id as product_id,
        p.name,
        p.price,
        p.original_price,
        p.image_url,
        p.rating,
        p.stock_quantity,
        c.name as category_name
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE w.user_id = $1 AND p.is_active = true
      ORDER BY w.created_at DESC
    `;

    const result = await db.query(query, [req.user.id]);

    const items = result.rows.map(item => ({
      ...item,
      price_formatted: new Intl.NumberFormat('vi-VN').format(item.price) + 'đ',
      original_price_formatted: item.original_price 
        ? new Intl.NumberFormat('vi-VN').format(item.original_price) + 'đ' 
        : null,
      in_stock: item.stock_quantity > 0
    }));

    res.json({
      success: true,
      data: {
        items,
        total_items: items.length
      }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add item to wishlist
router.post('/items', authenticateToken, async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists
    const productResult = await db.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if already in wishlist
    const existingResult = await db.query(
      'SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user.id, product_id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    // Add to wishlist
    await db.query(
      'INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2)',
      [req.user.id, product_id]
    );

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist successfully'
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove item from wishlist
router.delete('/items/:product_id', authenticateToken, async (req, res) => {
  try {
    const { product_id } = req.params;

    const result = await db.query(
      'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [req.user.id, product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    res.json({
      success: true,
      message: 'Product removed from wishlist successfully'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle wishlist item
router.post('/toggle', authenticateToken, async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists
    const productResult = await db.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if already in wishlist
    const existingResult = await db.query(
      'SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user.id, product_id]
    );

    if (existingResult.rows.length > 0) {
      // Remove from wishlist
      await db.query(
        'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
        [req.user.id, product_id]
      );

      res.json({
        success: true,
        message: 'Product removed from wishlist',
        data: { is_wishlisted: false }
      });
    } else {
      // Add to wishlist
      await db.query(
        'INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2)',
        [req.user.id, product_id]
      );

      res.json({
        success: true,
        message: 'Product added to wishlist',
        data: { is_wishlisted: true }
      });
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Clear wishlist
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM wishlists WHERE user_id = $1', [req.user.id]);

    res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;