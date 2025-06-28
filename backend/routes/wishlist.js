const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [wishlistItems] = await pool.execute(
      `SELECT w.*, p.name, p.price, p.image_url, p.stock_quantity
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ? AND p.is_active = true
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    res.json(wishlistItems);
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
    const [products] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND is_active = true',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if item already exists in wishlist
    const [existingItems] = await pool.execute(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existingItems.length > 0) {
      return res.status(400).json({ message: 'Item already in wishlist' });
    }

    // Add to wishlist
    await pool.execute(
      'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
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
    const [result] = await pool.execute(
      'DELETE FROM wishlist WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
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
    const [result] = await pool.execute(
      'DELETE FROM wishlist WHERE product_id = ? AND user_id = ?',
      [req.params.productId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    res.json({ message: 'Item removed from wishlist successfully' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;