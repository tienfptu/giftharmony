import express from 'express';
import { promisify } from 'util';
import { createConnection } from '../database/init.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { validate, validateParams, validateQuery, schemas } from '../middleware/validation.js';

const router = express.Router();

// Get reviews for a product
router.get('/product/:productId', validateParams(schemas.idParam), validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if product exists
    const product = await get('SELECT id FROM products WHERE id = ? AND is_active = 1', [productId]);
    
    if (!product) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Build ORDER BY clause
    const validSortFields = ['created_at', 'rating', 'helpful_count'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    
    // Get reviews
    const reviews = await all(`
      SELECT 
        r.*,
        u.full_name as user_name,
        u.avatar as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_approved = 1
      ORDER BY r.${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `, [productId, parseInt(limit), offset]);
    
    // Get total count and rating summary
    const totalResult = await get(`
      SELECT COUNT(*) as total
      FROM reviews r
      WHERE r.product_id = ? AND r.is_approved = 1
    `, [productId]);
    
    const ratingSummary = await all(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM reviews 
      WHERE product_id = ? AND is_approved = 1
      GROUP BY rating
      ORDER BY rating DESC
    `, [productId]);
    
    const avgRating = await get(`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_reviews
      FROM reviews 
      WHERE product_id = ? AND is_approved = 1
    `, [productId]);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    db.close();
    
    res.json({
      success: true,
      data: {
        reviews,
        summary: {
          average_rating: avgRating.avg_rating || 0,
          total_reviews: avgRating.total_reviews || 0,
          rating_breakdown: ratingSummary
        },
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
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create review
router.post('/', authenticate, validate(schemas.createReview), async (req, res) => {
  try {
    const { product_id, order_id, rating, title, comment } = req.body;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if product exists
    const product = await get('SELECT id FROM products WHERE id = ? AND is_active = 1', [product_id]);
    
    if (!product) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if user has purchased this product (if order_id provided)
    let isVerified = false;
    if (order_id) {
      const orderItem = await get(`
        SELECT oi.id 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.id = ? AND o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
      `, [order_id, userId, product_id]);
      
      if (orderItem) {
        isVerified = true;
      }
    }
    
    // Check if user already reviewed this product for this order
    const existingReview = await get(`
      SELECT id FROM reviews 
      WHERE user_id = ? AND product_id = ? AND (order_id = ? OR order_id IS NULL)
    `, [userId, product_id, order_id]);
    
    if (existingReview) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }
    
    // Create review
    const result = await run(`
      INSERT INTO reviews (user_id, product_id, order_id, rating, title, comment, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, product_id, order_id, rating, title, comment, isVerified ? 1 : 0]);
    
    // Update product rating
    const ratingStats = await get(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM reviews 
      WHERE product_id = ? AND is_approved = 1
    `, [product_id]);
    
    await run(`
      UPDATE products 
      SET rating = ?, review_count = ?
      WHERE id = ?
    `, [ratingStats.avg_rating, ratingStats.review_count, product_id]);
    
    // Get created review
    const review = await get(`
      SELECT 
        r.*,
        u.full_name as user_name,
        u.avatar as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [result.lastID]);
    
    db.close();
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
    
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user's reviews
router.get('/my-reviews', authenticate, validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Get user's reviews
    const reviews = await all(`
      SELECT 
        r.*,
        p.name as product_name,
        p.images as product_images
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), offset]);
    
    // Get total count
    const totalResult = await get(`
      SELECT COUNT(*) as total
      FROM reviews 
      WHERE user_id = ?
    `, [userId]);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    db.close();
    
    // Format reviews
    const formattedReviews = reviews.map(review => ({
      ...review,
      product_images: review.product_images ? JSON.parse(review.product_images) : []
    }));
    
    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
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
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update review
router.put('/:id', authenticate, validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if review exists and belongs to user
    const review = await get(`
      SELECT * FROM reviews 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    
    if (!review) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Update review
    await run(`
      UPDATE reviews 
      SET rating = COALESCE(?, rating),
          title = COALESCE(?, title),
          comment = COALESCE(?, comment),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [rating, title, comment, id]);
    
    // Update product rating if rating changed
    if (rating && rating !== review.rating) {
      const ratingStats = await get(`
        SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
        FROM reviews 
        WHERE product_id = ? AND is_approved = 1
      `, [review.product_id]);
      
      await run(`
        UPDATE products 
        SET rating = ?, review_count = ?
        WHERE id = ?
      `, [ratingStats.avg_rating, ratingStats.review_count, review.product_id]);
    }
    
    // Get updated review
    const updatedReview = await get(`
      SELECT 
        r.*,
        u.full_name as user_name,
        u.avatar as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: updatedReview }
    });
    
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete review
router.delete('/:id', authenticate, validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if review exists and belongs to user (or user is admin)
    const review = await get(`
      SELECT * FROM reviews 
      WHERE id = ? AND (user_id = ? OR ? = 'admin')
    `, [id, userId, req.user.role]);
    
    if (!review) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Delete review
    await run('DELETE FROM reviews WHERE id = ?', [id]);
    
    // Update product rating
    const ratingStats = await get(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM reviews 
      WHERE product_id = ? AND is_approved = 1
    `, [review.product_id]);
    
    await run(`
      UPDATE products 
      SET rating = ?, review_count = ?
      WHERE id = ?
    `, [ratingStats.avg_rating || 0, ratingStats.review_count || 0, review.product_id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mark review as helpful
router.post('/:id/helpful', authenticate, validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if review exists
    const review = await get('SELECT id FROM reviews WHERE id = ? AND is_approved = 1', [id]);
    
    if (!review) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Increment helpful count
    await run(`
      UPDATE reviews 
      SET helpful_count = helpful_count + 1
      WHERE id = ?
    `, [id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Review marked as helpful'
    });
    
  } catch (error) {
    console.error('Mark review helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Admin: Get all reviews
router.get('/admin/all', authenticate, authorize('admin'), validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, product_id } = req.query;
    const offset = (page - 1) * limit;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Build WHERE clause
    let whereConditions = [];
    let params = [];
    
    if (status !== undefined) {
      whereConditions.push('r.is_approved = ?');
      params.push(status === 'approved' ? 1 : 0);
    }
    
    if (product_id) {
      whereConditions.push('r.product_id = ?');
      params.push(product_id);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get reviews
    const reviews = await all(`
      SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get total count
    const totalResult = await get(`
      SELECT COUNT(*) as total
      FROM reviews r
      ${whereClause}
    `, params);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    db.close();
    
    res.json({
      success: true,
      data: {
        reviews,
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
    console.error('Get admin reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Admin: Approve/reject review
router.put('/admin/:id/status', authenticate, authorize('admin'), validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;
    
    if (typeof is_approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_approved must be a boolean'
      });
    }
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if review exists
    const review = await get('SELECT * FROM reviews WHERE id = ?', [id]);
    
    if (!review) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Update review status
    await run(`
      UPDATE reviews 
      SET is_approved = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [is_approved ? 1 : 0, id]);
    
    // Update product rating
    const ratingStats = await get(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM reviews 
      WHERE product_id = ? AND is_approved = 1
    `, [review.product_id]);
    
    await run(`
      UPDATE products 
      SET rating = ?, review_count = ?
      WHERE id = ?
    `, [ratingStats.avg_rating || 0, ratingStats.review_count || 0, review.product_id]);
    
    db.close();
    
    res.json({
      success: true,
      message: `Review ${is_approved ? 'approved' : 'rejected'} successfully`
    });
    
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;