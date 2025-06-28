const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');

const router = express.Router();

// Get all products with filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      min_price,
      max_price,
      sort_by = 'created_at',
      sort_order = 'DESC',
      featured,
      popular
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['p.is_active = true'];
    let queryParams = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (category) {
      whereConditions.push(`c.slug = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (min_price) {
      whereConditions.push(`p.price >= $${paramIndex}`);
      queryParams.push(parseFloat(min_price));
      paramIndex++;
    }

    if (max_price) {
      whereConditions.push(`p.price <= $${paramIndex}`);
      queryParams.push(parseFloat(max_price));
      paramIndex++;
    }

    if (featured === 'true') {
      whereConditions.push('p.is_featured = true');
    }

    if (popular === 'true') {
      whereConditions.push('p.is_popular = true');
    }

    // Validate sort_by
    const allowedSortFields = ['created_at', 'price', 'name', 'rating', 'sales_count'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Main query
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.original_price,
        p.image_url,
        p.images,
        p.stock_quantity,
        p.is_featured,
        p.is_popular,
        p.rating,
        p.review_count,
        p.sales_count,
        p.created_at,
        c.name as category_name,
        c.slug as category_slug,
        CASE WHEN w.product_id IS NOT NULL THEN true ELSE false END as is_wishlisted
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN wishlists w ON p.id = w.product_id AND w.user_id = $${paramIndex}
      ${whereClause}
      ORDER BY p.${sortField} ${sortDirection}
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `;

    queryParams.push(req.user?.id || null, limit, offset);

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;

    const [productsResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const products = productsResult.rows.map(product => ({
      ...product,
      images: product.images || [product.image_url],
      price_formatted: new Intl.NumberFormat('vi-VN').format(product.price) + 'đ',
      original_price_formatted: product.original_price 
        ? new Intl.NumberFormat('vi-VN').format(product.original_price) + 'đ' 
        : null,
      discount_percentage: product.original_price 
        ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
        : null
    }));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        products,
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
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single product
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        CASE WHEN w.product_id IS NOT NULL THEN true ELSE false END as is_wishlisted
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN wishlists w ON p.id = w.product_id AND w.user_id = $1
      WHERE p.id = $2 AND p.is_active = true
    `;

    const result = await db.query(query, [req.user?.id || null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = result.rows[0];

    // Get related products
    const relatedQuery = `
      SELECT id, name, price, image_url, rating, review_count
      FROM products 
      WHERE category_id = $1 AND id != $2 AND is_active = true
      ORDER BY rating DESC, sales_count DESC
      LIMIT 4
    `;

    const relatedResult = await db.query(relatedQuery, [product.category_id, id]);

    // Format product data
    const formattedProduct = {
      ...product,
      images: product.images || [product.image_url],
      price_formatted: new Intl.NumberFormat('vi-VN').format(product.price) + 'đ',
      original_price_formatted: product.original_price 
        ? new Intl.NumberFormat('vi-VN').format(product.original_price) + 'đ' 
        : null,
      discount_percentage: product.original_price 
        ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
        : null,
      related_products: relatedResult.rows.map(p => ({
        ...p,
        price_formatted: new Intl.NumberFormat('vi-VN').format(p.price) + 'đ'
      }))
    };

    res.json({
      success: true,
      data: { product: formattedProduct }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create product (Admin only)
router.post('/', authenticateToken, requireAdmin, validateProduct, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      original_price,
      category_id,
      image_url,
      images,
      stock_quantity,
      is_featured = false,
      is_popular = false,
      specifications,
      features
    } = req.body;

    const result = await db.query(
      `INSERT INTO products (
        name, description, price, original_price, category_id, 
        image_url, images, stock_quantity, is_featured, is_popular,
        specifications, features
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        name, description, price, original_price, category_id,
        image_url, JSON.stringify(images), stock_quantity, is_featured, is_popular,
        JSON.stringify(specifications), JSON.stringify(features)
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: result.rows[0] }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update product (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateProduct, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      original_price,
      category_id,
      image_url,
      images,
      stock_quantity,
      is_featured,
      is_popular,
      specifications,
      features,
      is_active
    } = req.body;

    const result = await db.query(
      `UPDATE products SET 
        name = $1, description = $2, price = $3, original_price = $4,
        category_id = $5, image_url = $6, images = $7, stock_quantity = $8,
        is_featured = $9, is_popular = $10, specifications = $11, features = $12,
        is_active = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *`,
      [
        name, description, price, original_price, category_id,
        image_url, JSON.stringify(images), stock_quantity, is_featured, is_popular,
        JSON.stringify(specifications), JSON.stringify(features), is_active, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: result.rows[0] }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;