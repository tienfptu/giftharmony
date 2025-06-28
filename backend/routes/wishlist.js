const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, p.name, p.price, p.image_url, p.stock_quantity
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = $1 AND p.is_active = true
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add item to wishlist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id } = req.body;

    // Check if product exists and is active
    const productResult = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if item already exists in wishlist
    const existingResult = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [req.user.id, product_id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'Item already in wishlist' });
    }

    // Add to wishlist
    await pool.query(
      'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)',
      [req.user.id, product_id]
    );

    res.json({ message: 'Item added to wishlist successfully' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove item from wishlist
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM wishlist WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    res.json({ message: 'Item removed from wishlist successfully' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove item from wishlist by product ID
router.delete('/product/:productId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM wishlist WHERE product_id = $1 AND user_id = $2 RETURNING *',
      [req.params.productId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    res.json({ message: 'Item removed from wishlist successfully' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;