const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.productId]
    );

    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const [products] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND is_active = true',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const [existingReviews] = await pool.execute(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existingReviews.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Create review
    await pool.execute(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, product_id, rating, comment]
    );

    res.status(201).json({ message: 'Review created successfully' });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update review
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const [result] = await pool.execute(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ? AND user_id = ?',
      [rating, comment, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete review
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM reviews WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all reviews (Admin only)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT r.*, u.first_name, u.last_name, u.email, p.name as product_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC`
    );

    res.json(reviews);
  } catch (error) {
    console.error('Get admin reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete review (Admin only)
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM reviews WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;