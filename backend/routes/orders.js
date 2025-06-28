const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get user orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, 
       GROUP_CONCAT(
         JSON_OBJECT(
           'product_id', oi.product_id,
           'product_name', p.name,
           'quantity', oi.quantity,
           'price', oi.price
         )
       ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create order
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { items, shipping_address } = req.body;
    let total_amount = 0;

    // Calculate total and validate stock
    for (const item of items) {
      const [products] = await connection.execute(
        'SELECT price, stock_quantity FROM products WHERE id = ? AND is_active = true',
        [item.product_id]
      );

      if (products.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = products[0];
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }

      total_amount += product.price * item.quantity;
    }

    // Create order
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, total_amount, shipping_address) VALUES (?, ?, ?)',
      [req.user.id, total_amount, shipping_address]
    );

    const orderId = orderResult.insertId;

    // Create order items and update stock
    for (const item of items) {
      const [products] = await connection.execute(
        'SELECT price FROM products WHERE id = ?',
        [item.product_id]
      );

      await connection.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, products[0].price]
      );

      await connection.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear user's cart
    await connection.execute(
      'DELETE FROM cart WHERE user_id = ?',
      [req.user.id]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Order created successfully',
      order_id: orderId,
      total_amount
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// Get all orders (Admin only)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, u.email, u.first_name, u.last_name,
       GROUP_CONCAT(
         JSON_OBJECT(
           'product_id', oi.product_id,
           'product_name', p.name,
           'quantity', oi.quantity,
           'price', oi.price
         )
       ) as items
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );

    res.json(orders);
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [result] = await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;