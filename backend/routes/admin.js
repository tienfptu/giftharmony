const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const [userCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM users WHERE is_active = true'
    );

    // Get total products
    const [productCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM products WHERE is_active = true'
    );

    // Get total orders
    const [orderCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM orders'
    );

    // Get total revenue
    const [revenueResult] = await pool.execute(
      'SELECT SUM(total_amount) as total FROM orders WHERE status != "cancelled"'
    );

    // Get recent orders
    const [recentOrders] = await pool.execute(
      `SELECT o.id, o.total_amount, o.status, o.created_at, 
       u.first_name, u.last_name, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    // Get low stock products
    const [lowStockProducts] = await pool.execute(
      'SELECT id, name, stock_quantity FROM products WHERE stock_quantity < 10 AND is_active = true'
    );

    // Get monthly sales data
    const [monthlySales] = await pool.execute(
      `SELECT 
       DATE_FORMAT(created_at, '%Y-%m') as month,
       COUNT(*) as orders,
       SUM(total_amount) as revenue
       FROM orders 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       AND status != 'cancelled'
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC`
    );

    res.json({
      stats: {
        totalUsers: userCount[0].total,
        totalProducts: productCount[0].total,
        totalOrders: orderCount[0].total,
        totalRevenue: revenueResult[0].total || 0
      },
      recentOrders,
      lowStockProducts,
      monthlySales
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get sales analytics
router.get('/analytics/sales', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFormat, dateInterval;
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        dateInterval = '30 DAY';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        dateInterval = '12 WEEK';
        break;
      case 'year':
        dateFormat = '%Y';
        dateInterval = '5 YEAR';
        break;
      default:
        dateFormat = '%Y-%m';
        dateInterval = '12 MONTH';
    }

    const [salesData] = await pool.execute(
      `SELECT 
       DATE_FORMAT(created_at, ?) as period,
       COUNT(*) as orders,
       SUM(total_amount) as revenue
       FROM orders 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval})
       AND status != 'cancelled'
       GROUP BY DATE_FORMAT(created_at, ?)
       ORDER BY period DESC`,
      [dateFormat, dateFormat]
    );

    res.json(salesData);
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get product analytics
router.get('/analytics/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Top selling products
    const [topProducts] = await pool.execute(
      `SELECT p.id, p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as revenue
       FROM products p
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled'
       GROUP BY p.id, p.name
       ORDER BY total_sold DESC
       LIMIT 10`
    );

    // Category performance
    const [categoryPerformance] = await pool.execute(
      `SELECT c.name, COUNT(oi.id) as orders, SUM(oi.quantity) as items_sold, SUM(oi.quantity * oi.price) as revenue
       FROM categories c
       JOIN products p ON c.id = p.category_id
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled'
       GROUP BY c.id, c.name
       ORDER BY revenue DESC`
    );

    res.json({
      topProducts,
      categoryPerformance
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;