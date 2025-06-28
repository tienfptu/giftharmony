const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Get dashboard statistics
router.get("/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const userCountResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE is_active = true"
    );

    // Get total products
    const productCountResult = await pool.query(
      "SELECT COUNT(*) as total FROM products WHERE is_active = true"
    );

    // Get total orders
    const orderCountResult = await pool.query(
      "SELECT COUNT(*) as total FROM orders"
    );

    // Get total revenue
    const revenueResult = await pool.query(
      "SELECT SUM(total_amount) as total FROM orders WHERE status != $1",
      ["cancelled"]
    );

    // Get recent orders
    const recentOrdersResult = await pool.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at, 
       u.first_name, u.last_name, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    // Get low stock products
    const lowStockResult = await pool.query(
      "SELECT id, name, stock_quantity FROM products WHERE stock_quantity < 10 AND is_active = true"
    );

    // Get monthly sales data
    const monthlySalesResult = await pool.query(
      `SELECT 
       TO_CHAR(created_at, 'YYYY-MM') as month,
       COUNT(*) as orders,
       SUM(total_amount) as revenue
       FROM orders 
       WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
       AND status != 'cancelled'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ORDER BY month DESC`
    );

    res.json({
      stats: {
        totalUsers: parseInt(userCountResult.rows[0].total),
        totalProducts: parseInt(productCountResult.rows[0].total),
        totalOrders: parseInt(orderCountResult.rows[0].total),
        totalRevenue: parseFloat(revenueResult.rows[0].total) || 0,
      },
      recentOrders: recentOrdersResult.rows,
      lowStockProducts: lowStockResult.rows,
      monthlySales: monthlySalesResult.rows,
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get sales analytics
router.get(
  "/analytics/sales",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { period = "month" } = req.query;

      let dateFormat, dateInterval;
      switch (period) {
        case "day":
          dateFormat = "YYYY-MM-DD";
          dateInterval = "30 days";
          break;
        case "week":
          dateFormat = "YYYY-WW";
          dateInterval = "12 weeks";
          break;
        case "year":
          dateFormat = "YYYY";
          dateInterval = "5 years";
          break;
        default:
          dateFormat = "YYYY-MM";
          dateInterval = "12 months";
      }

      const salesResult = await pool.query(
        `SELECT 
       TO_CHAR(created_at, $1) as period,
       COUNT(*) as orders,
       SUM(total_amount) as revenue
       FROM orders 
       WHERE created_at >= CURRENT_DATE - INTERVAL '${dateInterval}'
       AND status != 'cancelled'
       GROUP BY TO_CHAR(created_at, $1)
       ORDER BY period DESC`,
        [dateFormat]
      );

      res.json(salesResult.rows);
    } catch (error) {
      console.error("Get sales analytics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get product analytics
router.get(
  "/analytics/products",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      // Top selling products
      const topProductsResult = await pool.query(
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
      const categoryPerformanceResult = await pool.query(
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
        topProducts: topProductsResult.rows,
        categoryPerformance: categoryPerformanceResult.rows,
      });
    } catch (error) {
      console.error("Get product analytics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
