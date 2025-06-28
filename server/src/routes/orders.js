import express from 'express';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { createConnection } from '../database/init.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, validateParams, validateQuery, schemas } from '../middleware/validation.js';

const router = express.Router();

// Generate order number
const generateOrderNumber = () => {
  return `GH${Date.now().toString().slice(-6)}`;
};

// Create order
router.post('/', authenticate, validate(schemas.createOrder), async (req, res) => {
  try {
    const { items, payment_method, shipping_address, notes, promotion_code } = req.body;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    const all = promisify(db.all.bind(db));
    
    // Begin transaction
    await run('BEGIN TRANSACTION');
    
    try {
      // Validate products and calculate totals
      let subtotal = 0;
      const orderItems = [];
      
      for (const item of items) {
        const product = await get(`
          SELECT id, name, price, stock_quantity 
          FROM products 
          WHERE id = ? AND is_active = 1
        `, [item.product_id]);
        
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }
        
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
      }
      
      // Apply promotion if provided
      let discount = 0;
      if (promotion_code) {
        const promotion = await get(`
          SELECT * FROM promotions 
          WHERE code = ? AND is_active = 1 
          AND start_date <= CURRENT_TIMESTAMP 
          AND end_date >= CURRENT_TIMESTAMP
          AND (usage_limit IS NULL OR usage_count < usage_limit)
        `, [promotion_code]);
        
        if (promotion && subtotal >= promotion.min_order_amount) {
          if (promotion.type === 'percentage') {
            discount = Math.min(
              subtotal * (promotion.value / 100),
              promotion.max_discount_amount || subtotal
            );
          } else if (promotion.type === 'fixed_amount') {
            discount = Math.min(promotion.value, subtotal);
          }
          
          // Update promotion usage
          await run(`
            UPDATE promotions 
            SET usage_count = usage_count + 1 
            WHERE id = ?
          `, [promotion.id]);
        }
      }
      
      // Calculate shipping fee (simplified)
      const shipping_fee = subtotal >= 500000 ? 0 : 30000; // Free shipping for orders over 500k
      const total = subtotal - discount + shipping_fee;
      
      // Create order
      const orderNumber = generateOrderNumber();
      const orderResult = await run(`
        INSERT INTO orders (
          order_number, user_id, status, payment_method, payment_status,
          subtotal, discount, shipping_fee, total, shipping_address, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderNumber, userId, 'pending', payment_method, 'pending',
        subtotal, discount, shipping_fee, total,
        JSON.stringify(shipping_address), notes
      ]);
      
      const orderId = orderResult.lastID;
      
      // Create order items and update stock
      for (const item of orderItems) {
        await run(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.price]);
        
        // Update product stock
        await run(`
          UPDATE products 
          SET stock_quantity = stock_quantity - ? 
          WHERE id = ?
        `, [item.quantity, item.product_id]);
      }
      
      // Clear user's cart
      await run('DELETE FROM cart WHERE user_id = ?', [userId]);
      
      // Create notification
      await run(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, ?, ?, ?)
      `, [
        userId, 'order',
        'Đơn hàng đã được tạo',
        `Đơn hàng ${orderNumber} đã được tạo thành công. Chúng tôi sẽ xử lý đơn hàng của bạn sớm nhất.`
      ]);
      
      // Commit transaction
      await run('COMMIT');
      
      // Get created order with items
      const order = await get(`
        SELECT * FROM orders WHERE id = ?
      `, [orderId]);
      
      const orderItemsWithProducts = await all(`
        SELECT 
          oi.*,
          p.name as product_name,
          p.images as product_images
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [orderId]);
      
      db.close();
      
      // Format response
      const formattedOrder = {
        ...order,
        shipping_address: JSON.parse(order.shipping_address),
        items: orderItemsWithProducts.map(item => ({
          ...item,
          product_images: item.product_images ? JSON.parse(item.product_images) : []
        }))
      };
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order: formattedOrder }
      });
      
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Create order error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
});

// Get user orders
router.get('/', authenticate, validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Build WHERE clause
    let whereClause = 'WHERE o.user_id = ?';
    let params = [userId];
    
    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }
    
    // Get orders
    const orders = await all(`
      SELECT 
        o.*,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get total count
    const totalResult = await get(`
      SELECT COUNT(*) as total
      FROM orders o
      ${whereClause}
    `, params);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    // Format orders
    const formattedOrders = orders.map(order => ({
      ...order,
      shipping_address: JSON.parse(order.shipping_address)
    }));
    
    db.close();
    
    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get order by ID
router.get('/:id', authenticate, validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const db = createConnection();
    const get = promisify(db.get.bind(db));
    const all = promisify(db.all.bind(db));
    
    // Get order
    const order = await get(`
      SELECT * FROM orders 
      WHERE id = ? AND (user_id = ? OR ? = 'admin')
    `, [id, userId, req.user.role]);
    
    if (!order) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Get order items with product details
    const orderItems = await all(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.images as product_images,
        p.sku as product_sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);
    
    db.close();
    
    // Format response
    const formattedOrder = {
      ...order,
      shipping_address: JSON.parse(order.shipping_address),
      items: orderItems.map(item => ({
        ...item,
        product_images: item.product_images ? JSON.parse(item.product_images) : []
      }))
    };
    
    res.json({
      success: true,
      data: { order: formattedOrder }
    });
    
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update order status (Admin only)
router.put('/:id/status', authenticate, authorize('admin'), validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if order exists
    const order = await get('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (!order) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update order
    const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const updateValues = [status];
    
    if (tracking_number) {
      updateFields.push('tracking_number = ?');
      updateValues.push(tracking_number);
    }
    
    if (status === 'delivered') {
      updateFields.push('delivered_at = CURRENT_TIMESTAMP');
    }
    
    updateValues.push(id);
    
    await run(`
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
    
    // Create notification for user
    let notificationMessage = '';
    switch (status) {
      case 'confirmed':
        notificationMessage = `Đơn hàng ${order.order_number} đã được xác nhận và đang được chuẩn bị.`;
        break;
      case 'shipping':
        notificationMessage = `Đơn hàng ${order.order_number} đang được giao đến bạn.`;
        break;
      case 'delivered':
        notificationMessage = `Đơn hàng ${order.order_number} đã được giao thành công.`;
        break;
      case 'cancelled':
        notificationMessage = `Đơn hàng ${order.order_number} đã bị hủy.`;
        break;
    }
    
    if (notificationMessage) {
      await run(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, ?, ?, ?)
      `, [order.user_id, 'order', 'Cập nhật đơn hàng', notificationMessage]);
    }
    
    // Get updated order
    const updatedOrder = await get('SELECT * FROM orders WHERE id = ?', [id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { 
        order: {
          ...updatedOrder,
          shipping_address: JSON.parse(updatedOrder.shipping_address)
        }
      }
    });
    
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Cancel order
router.put('/:id/cancel', authenticate, validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    const all = promisify(db.all.bind(db));
    
    // Get order
    const order = await get(`
      SELECT * FROM orders 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    
    if (!order) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }
    
    // Begin transaction
    await run('BEGIN TRANSACTION');
    
    try {
      // Update order status
      await run(`
        UPDATE orders 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);
      
      // Restore product stock
      const orderItems = await all(`
        SELECT product_id, quantity FROM order_items WHERE order_id = ?
      `, [id]);
      
      for (const item of orderItems) {
        await run(`
          UPDATE products 
          SET stock_quantity = stock_quantity + ? 
          WHERE id = ?
        `, [item.quantity, item.product_id]);
      }
      
      // Create notification
      await run(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, ?, ?, ?)
      `, [
        userId, 'order',
        'Đơn hàng đã hủy',
        `Đơn hàng ${order.order_number} đã được hủy thành công.`
      ]);
      
      await run('COMMIT');
      
      db.close();
      
      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });
      
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;