const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validation');

const router = express.Router();

// Get user orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereCondition = 'WHERE o.user_id = $1';
    let queryParams = [req.user.id];
    let paramIndex = 2;

    if (status) {
      whereCondition += ` AND o.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    const query = `
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'product_image', p.image_url,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      ${whereCondition}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      ${whereCondition}
    `;

    const [ordersResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, queryParams.slice(0, -2))
    ]);

    const orders = ordersResult.rows.map(order => ({
      ...order,
      total_formatted: new Intl.NumberFormat('vi-VN').format(order.total) + 'đ',
      subtotal_formatted: new Intl.NumberFormat('vi-VN').format(order.subtotal) + 'đ',
      shipping_fee_formatted: new Intl.NumberFormat('vi-VN').format(order.shipping_fee) + 'đ'
    }));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'product_image', p.image_url,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id
    `;

    const result = await db.query(query, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = {
      ...result.rows[0],
      total_formatted: new Intl.NumberFormat('vi-VN').format(result.rows[0].total) + 'đ',
      subtotal_formatted: new Intl.NumberFormat('vi-VN').format(result.rows[0].subtotal) + 'đ',
      shipping_fee_formatted: new Intl.NumberFormat('vi-VN').format(result.rows[0].shipping_fee) + 'đ'
    };

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create order
router.post('/', authenticateToken, validateOrder, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      items,
      shipping_address,
      phone,
      payment_method,
      shipping_fee = 30000,
      notes,
      discount_amount = 0,
      promo_code
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Calculate subtotal and validate items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const productResult = await client.query(
        'SELECT id, name, price, stock_quantity FROM products WHERE id = $1 AND is_active = true',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }

      const product = productResult.rows[0];

      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price
      });

      // Update stock
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, product.id]
      );
    }

    const total = subtotal + shipping_fee - discount_amount;

    // Generate order number
    const orderNumber = `GH${Date.now().toString().slice(-6)}`;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        order_number, user_id, subtotal, shipping_fee, discount_amount, 
        total, shipping_address, phone, payment_method, notes, promo_code, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *`,
      [
        orderNumber, req.user.id, subtotal, shipping_fee, discount_amount,
        total, shipping_address, phone, payment_method, notes, promo_code
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.product_id, item.quantity, item.price]
      );
    }

    // Clear user's cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: {
          ...order,
          total_formatted: new Intl.NumberFormat('vi-VN').format(order.total) + 'đ'
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  } finally {
    client.release();
  }
});

// Update order status (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const queryParams = [status];
    let paramIndex = 2;

    if (tracking_number) {
      updateFields.push(`tracking_number = $${paramIndex}`);
      queryParams.push(tracking_number);
      paramIndex++;
    }

    if (status === 'delivered') {
      updateFields.push(`delivered_at = CURRENT_TIMESTAMP`);
    }

    queryParams.push(id);

    const result = await db.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      queryParams
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: result.rows[0] }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel order
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get order
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderResult.rows[0];

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      });
    }

    // Restore stock
    const orderItemsResult = await client.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [id]
    );

    for (const item of orderItemsResult.rows) {
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Update order status
    await client.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

module.exports = router;