const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [cartItems] = await pool.execute(
      `SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ? AND p.is_active = true`,
      [req.user.id]
    );

    res.json(cartItems);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add item to cart
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    // Check if product exists and is active
    const [products] = await pool.execute(
      'SELECT stock_quantity FROM products WHERE id = ? AND is_active = true',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (products[0].stock_quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Check if item already exists in cart
    const [existingItems] = await pool.execute(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;
      if (products[0].stock_quantity < newQuantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }

      await pool.execute(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
    } else {
      // Add new item
      await pool.execute(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, quantity]
      );
    }

    res.json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update cart item quantity
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Check if cart item belongs to user
    const [cartItems] = await pool.execute(
      'SELECT product_id FROM cart WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Check stock
    const [products] = await pool.execute(
      'SELECT stock_quantity FROM products WHERE id = ?',
      [cartItems[0].product_id]
    );

    if (products[0].stock_quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    await pool.execute(
      'UPDATE cart SET quantity = ? WHERE id = ?',
      [quantity, req.params.id]
    );

    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove item from cart
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM cart WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;