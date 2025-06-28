const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as completed_orders,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'delivered') as total_revenue,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_orders,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_revenue,
        (SELECT COUNT(*) FROM reviews WHERE is_approved = false) as pending_reviews
    `;

    const result = await db.query(statsQuery);
    const stats = result.rows[0];

    // Get recent orders
    const recentOrdersQuery = `
      SELECT 
        o.id, o.order_number, o.total, o.status, o.created_at,
        u.name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `;

    const recentOrdersResult = await db.query(recentOrdersQuery);

    // Get top products
    const topProductsQuery = `
      SELECT 
        p.id, p.name, p.price, p.image_url,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.price, p.image_url
      ORDER BY total_sold DESC
      LIMIT 5
    `;

    const topProductsResult = await db.query(topProductsQuery);

    res.json({
      success: true,
      data: {
        stats: {
          ...stats,
          total_revenue_formatted: new Intl.NumberFormat('vi-VN').format(stats.total_revenue) + 'đ',
          today_revenue_formatted: new Intl.NumberFormat('vi-VN').format(stats.today_revenue) + 'đ'
        },
        recent_orders: recentOrdersResult.rows.map(order => ({
          ...order,
          total_formatted: new Intl.NumberFormat('vi-VN').format(order.total) + 'đ'
        })),
        top_products: topProductsResult.rows.map(product => ({
          ...product,
          price_formatted: new Intl.NumberFormat('vi-VN').format(product.price) + 'đ',
          total_revenue_formatted: new Intl.NumberFormat('vi-VN').format(product.total_revenue) + 'đ'
        }))
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all orders (Admin)
router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`o.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(o.order_number ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${whereClause}
    `;

    const [ordersResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, queryParams.slice(0, -2))
    ]);

    const orders = ordersResult.rows.map(order => ({
      ...order,
      total_formatted: new Intl.NumberFormat('vi-VN').format(order.total) + 'đ'
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
    console.error('Get admin orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users (Admin)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['role = $1'];
    let queryParams = ['customer'];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`is_active = $${paramIndex}`);
      queryParams.push(status === 'active');
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const query = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.points, u.level, 
        u.is_active, u.created_at, u.last_login,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;

    const [usersResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, queryParams.slice(0, -2))
    ]);

    const users = usersResult.rows.map(user => ({
      ...user,
      total_spent_formatted: new Intl.NumberFormat('vi-VN').format(user.total_spent) + 'đ'
    }));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle user status
router.patch('/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const result = await db.query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = $3 RETURNING *',
      [is_active, id, 'customer']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: { user: result.rows[0] }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Analytics data
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let dateCondition = '';
    switch (period) {
      case '7days':
        dateCondition = "WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case '30days':
        dateCondition = "WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case '90days':
        dateCondition = "WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'";
        break;
      case '1year':
        dateCondition = "WHERE created_at >= CURRENT_DATE - INTERVAL '1 year'";
        break;
      default:
        dateCondition = "WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    // Revenue by day
    const revenueQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      ${dateCondition} AND status = 'delivered'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Top categories
    const categoriesQuery = `
      SELECT 
        c.name,
        COUNT(oi.id) as items_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered' AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT 10
    `;

    const [revenueResult, categoriesResult] = await Promise.all([
      db.query(revenueQuery),
      db.query(categoriesQuery)
    ]);

    res.json({
      success: true,
      data: {
        revenue_chart: revenueResult.rows.map(row => ({
          ...row,
          revenue_formatted: new Intl.NumberFormat('vi-VN').format(row.revenue) + 'đ'
        })),
        top_categories: categoriesResult.rows.map(row => ({
          ...row,
          revenue_formatted: new Intl.NumberFormat('vi-VN').format(row.revenue) + 'đ'
        }))
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;