import express from 'express';
import { promisify } from 'util';
import { createConnection } from '../database/init.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateQuery, schemas } from '../middleware/validation.js';

const router = express.Router();

// Dashboard statistics
router.get('/dashboard/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = createConnection();
    const get = promisify(db.get.bind(db));
    const all = promisify(db.all.bind(db));
    
    // Get basic stats
    const totalUsers = await get('SELECT COUNT(*) as count FROM users WHERE role = "customer"');
    const totalProducts = await get('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
    const totalOrders = await get('SELECT COUNT(*) as count FROM orders');
    const totalRevenue = await get('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = "delivered"');
    
    // Get orders by status
    const ordersByStatus = await all(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `);
    
    // Get recent orders
    const recentOrders = await all(`
      SELECT 
        o.*,
        u.full_name as customer_name,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    
    // Get top products
    const topProducts = await all(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.images,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `);
    
    // Get monthly revenue (last 12 months)
    const monthlyRevenue = await all(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as order_count
      FROM orders 
      WHERE status = 'delivered' 
        AND created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `);
    
    // Get low stock products
    const lowStockProducts = await all(`
      SELECT id, name, stock_quantity, min_stock
      FROM products 
      WHERE is_active = 1 AND stock_quantity <= min_stock
      ORDER BY stock_quantity ASC
      LIMIT 10
    `);
    
    db.close();
    
    res.json({
      success: true,
      data: {
        overview: {
          total_users: totalUsers.count,
          total_products: totalProducts.count,
          total_orders: totalOrders.count,
          total_revenue: totalRevenue.total
        },
        orders_by_status: ordersByStatus,
        recent_orders: recentOrders.map(order => ({
          ...order,
          shipping_address: JSON.parse(order.shipping_address)
        })),
        top_products: topProducts.map(product => ({
          ...product,
          images: product.images ? JSON.parse(product.images) : []
        })),
        monthly_revenue: monthlyRevenue,
        low_stock_products: lowStockProducts
      }
    });
    
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all orders (Admin)
router.get('/orders', authenticate, authorize('admin'), validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Build WHERE clause
    let whereConditions = [];
    let params = [];
    
    if (status) {
      whereConditions.push('o.status = ?');
      params.push(status);
    }
    
    if (search) {
      whereConditions.push('(o.order_number LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get orders
    const orders = await all(`
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get total count
    const totalResult = await get(`
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${whereClause}
    `, params);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    db.close();
    
    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          ...order,
          shipping_address: JSON.parse(order.shipping_address)
        })),
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
    console.error('Get admin orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all users (Admin)
router.get('/users', authenticate, authorize('admin'), validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (page - 1) * limit;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Build WHERE clause
    let whereConditions = [];
    let params = [];
    
    if (search) {
      whereConditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (role) {
      whereConditions.push('u.role = ?');
      params.push(role);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get users with order statistics
    const users = await all(`
      SELECT 
        u.*,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get total count
    const totalResult = await get(`
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `, params);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    db.close();
    
    // Remove passwords from response
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    res.json({
      success: true,
      data: {
        users: safeUsers,
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
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all products (Admin)
router.get('/products', authenticate, authorize('admin'), validateQuery(schemas.productQuery), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query;
    const offset = (page - 1) * limit;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Build WHERE clause
    let whereConditions = [];
    let params = [];
    
    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (category) {
      whereConditions.push('c.name = ?');
      params.push(category);
    }
    
    if (status !== undefined) {
      whereConditions.push('p.is_active = ?');
      params.push(status === 'active' ? 1 : 0);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get products
    const products = await all(`
      SELECT 
        p.*,
        c.name as category_name,
        COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get total count
    const totalResult = await get(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `, params);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    db.close();
    
    res.json({
      success: true,
      data: {
        products: products.map(product => ({
          ...product,
          images: product.images ? JSON.parse(product.images) : [],
          features: product.features ? JSON.parse(product.features) : [],
          specifications: product.specifications ? JSON.parse(product.specifications) : {}
        })),
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
    console.error('Get admin products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Analytics data
router.get('/analytics', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Calculate date range
    let dateFilter = '';
    switch (period) {
      case '7days':
        dateFilter = "AND created_at >= date('now', '-7 days')";
        break;
      case '30days':
        dateFilter = "AND created_at >= date('now', '-30 days')";
        break;
      case '90days':
        dateFilter = "AND created_at >= date('now', '-90 days')";
        break;
      case '1year':
        dateFilter = "AND created_at >= date('now', '-1 year')";
        break;
      default:
        dateFilter = "AND created_at >= date('now', '-30 days')";
    }
    
    // Revenue over time
    const revenueData = await all(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as order_count,
        SUM(total) as revenue
      FROM orders 
      WHERE status = 'delivered' ${dateFilter}
      GROUP BY date(created_at)
      ORDER BY date ASC
    `);
    
    // Top selling products
    const topProducts = await all(`
      SELECT 
        p.name,
        p.price,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered' ${dateFilter}
      GROUP BY p.id
      ORDER BY quantity_sold DESC
      LIMIT 10
    `);
    
    // Category performance
    const categoryData = await all(`
      SELECT 
        c.name as category,
        COUNT(DISTINCT oi.order_id) as order_count,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered' ${dateFilter}
      GROUP BY c.id
      ORDER BY revenue DESC
    `);
    
    // Customer metrics
    const customerMetrics = await get(`
      SELECT 
        COUNT(DISTINCT user_id) as total_customers,
        AVG(total) as avg_order_value,
        COUNT(*) as total_orders
      FROM orders 
      WHERE status = 'delivered' ${dateFilter}
    `);
    
    // New customers
    const newCustomers = await all(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as new_customers
      FROM users 
      WHERE role = 'customer' ${dateFilter}
      GROUP BY date(created_at)
      ORDER BY date ASC
    `);
    
    db.close();
    
    res.json({
      success: true,
      data: {
        revenue_over_time: revenueData,
        top_products: topProducts,
        category_performance: categoryData,
        customer_metrics: customerMetrics,
        new_customers: newCustomers,
        period: period
      }
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;