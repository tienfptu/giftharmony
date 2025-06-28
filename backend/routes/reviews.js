const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateReview } = require('../middleware/validation');

const router = express.Router();

// Get reviews for a product
router.get('/product/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const allowedSortFields = ['created_at', 'rating', 'helpful_count'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const query = `
      SELECT 
        r.*,
        u.name as user_name,
        u.avatar as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1 AND r.is_approved = true
      ORDER BY r.${sortField} ${sortDirection}
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      WHERE r.product_id = $1 AND r.is_approved = true
    `;

    const [reviewsResult, countResult] = await Promise.all([
      db.query(query, [product_id, limit, offset]),
      db.query(countQuery, [product_id])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        reviews: reviewsResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create review
router.post('/', authenticateToken, validateReview, async (req, res) => {
  try {
    const { product_id, rating, comment, title } = req.body;

    // Check if product exists
    const productResult = await db.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user has already reviewed this product
    const existingReview = await db.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2',
      [req.user.id, product_id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Check if user has purchased this product
    const purchaseCheck = await db.query(
      `SELECT 1 FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'
       LIMIT 1`,
      [req.user.id, product_id]
    );

    const isVerifiedPurchase = purchaseCheck.rows.length > 0;

    // Create review
    const result = await db.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment, title, is_verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, product_id, rating, comment, title, isVerifiedPurchase]
    );

    // Update product rating
    await updateProductRating(product_id);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review: result.rows[0] }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update review
router.put('/:id', authenticateToken, validateReview, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, title } = req.body;

    const result = await db.query(
      `UPDATE reviews SET 
        rating = $1, comment = $2, title = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [rating, comment, title, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    // Update product rating
    await updateProductRating(result.rows[0].product_id);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: result.rows[0] }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete review
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING product_id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    // Update product rating
    await updateProductRating(result.rows[0].product_id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark review as helpful
router.post('/:id/helpful', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has already marked this review as helpful
    const existingHelpful = await db.query(
      'SELECT id FROM review_helpful WHERE user_id = $1 AND review_id = $2',
      [req.user.id, id]
    );

    if (existingHelpful.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked this review as helpful'
      });
    }

    // Add helpful mark
    await db.query(
      'INSERT INTO review_helpful (user_id, review_id) VALUES ($1, $2)',
      [req.user.id, id]
    );

    // Update helpful count
    await db.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Review marked as helpful'
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin: Get all reviews
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let whereCondition = '';
    let queryParams = [];
    let paramIndex = 1;

    if (status !== 'all') {
      if (status === 'pending') {
        whereCondition = 'WHERE r.is_approved = false';
      } else if (status === 'approved') {
        whereCondition = 'WHERE r.is_approved = true';
      }
    }

    const query = `
      SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email,
        p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ${whereCondition}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      ${whereCondition}
    `;

    const [reviewsResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        reviews: reviewsResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin: Approve/Reject review
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    const result = await db.query(
      'UPDATE reviews SET is_approved = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_approved, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update product rating if approved
    if (is_approved) {
      await updateProductRating(result.rows[0].product_id);
    }

    res.json({
      success: true,
      message: `Review ${is_approved ? 'approved' : 'rejected'} successfully`,
      data: { review: result.rows[0] }
    });
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const result = await db.query(
      `SELECT 
        AVG(rating)::numeric(3,2) as avg_rating,
        COUNT(*) as review_count
       FROM reviews 
       WHERE product_id = $1 AND is_approved = true`,
      [productId]
    );

    const { avg_rating, review_count } = result.rows[0];

    await db.query(
      'UPDATE products SET rating = $1, review_count = $2 WHERE id = $3',
      [avg_rating || 0, review_count || 0, productId]
    );
  } catch (error) {
    console.error('Update product rating error:', error);
  }
}

module.exports = router;