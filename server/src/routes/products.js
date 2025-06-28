import express from 'express';
import { promisify } from 'util';
import { createConnection } from '../database/init.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { validate, validateParams, validateQuery, schemas } from '../middleware/validation.js';

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', validateQuery(schemas.productQuery), optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      min_price,
      max_price,
      sort = 'created_at',
      order = 'desc',
      featured,
      popular,
      trending
    } = req.query;

    const offset = (page - 1) * limit;
    
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Build WHERE clause
    let whereConditions = ['p.is_active = 1'];
    let params = [];
    
    if (category) {
      whereConditions.push('c.name = ?');
      params.push(category);
    }
    
    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (min_price) {
      whereConditions.push('p.price >= ?');
      params.push(min_price);
    }
    
    if (max_price) {
      whereConditions.push('p.price <= ?');
      params.push(max_price);
    }
    
    if (featured === 'true') {
      whereConditions.push('p.is_featured = 1');
    }
    
    if (popular === 'true') {
      whereConditions.push('p.is_popular = 1');
    }
    
    if (trending === 'true') {
      whereConditions.push('p.is_trending = 1');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Build ORDER BY clause
    const validSortFields = ['name', 'price', 'rating', 'created_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    
    // Get products
    const products = await all(`
      SELECT 
        p.*,
        c.name as category_name,
        c.icon as category_icon,
        CASE WHEN w.product_id IS NOT NULL THEN 1 ELSE 0 END as is_wishlisted
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN wishlist w ON p.id = w.product_id AND w.user_id = ?
      ${whereClause}
      ORDER BY p.${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `, [req.user?.id || null, ...params, parseInt(limit), offset]);
    
    // Get total count
    const totalResult = await get(`
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `, params);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    // Parse JSON fields
    const formattedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      features: product.features ? JSON.parse(product.features) : [],
      specifications: product.specifications ? JSON.parse(product.specifications) : {},
      is_wishlisted: Boolean(product.is_wishlisted)
    }));
    
    db.close();
    
    res.json({
      success: true,
      data: {
        products: formattedProducts,
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
      message: 'Server error'
    });
  }
});

// Get product by ID
router.get('/:id', validateParams(schemas.idParam), optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = createConnection();
    const get = promisify(db.get.bind(db));
    const all = promisify(db.all.bind(db));
    
    // Get product with category info
    const product = await get(`
      SELECT 
        p.*,
        c.name as category_name,
        c.icon as category_icon,
        CASE WHEN w.product_id IS NOT NULL THEN 1 ELSE 0 END as is_wishlisted
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN wishlist w ON p.id = w.product_id AND w.user_id = ?
      WHERE p.id = ? AND p.is_active = 1
    `, [req.user?.id || null, id]);
    
    if (!product) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Get product reviews
    const reviews = await all(`
      SELECT 
        r.*,
        u.full_name as user_name,
        u.avatar as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [id]);
    
    // Get related products (same category, excluding current product)
    const relatedProducts = await all(`
      SELECT 
        p.id, p.name, p.price, p.original_price, p.rating, p.images
      FROM products p
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      ORDER BY p.rating DESC, p.created_at DESC
      LIMIT 4
    `, [product.category_id, id]);
    
    db.close();
    
    // Format product data
    const formattedProduct = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      features: product.features ? JSON.parse(product.features) : [],
      specifications: product.specifications ? JSON.parse(product.specifications) : {},
      is_wishlisted: Boolean(product.is_wishlisted),
      reviews: reviews.map(review => ({
        ...review,
        helpful_count: review.helpful_count || 0
      })),
      related_products: relatedProducts.map(rp => ({
        ...rp,
        images: rp.images ? JSON.parse(rp.images) : []
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
      message: 'Server error'
    });
  }
});

// Create product (Admin only)
router.post('/', authenticate, authorize('admin'), validate(schemas.createProduct), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      original_price,
      category_id,
      brand,
      sku,
      stock_quantity,
      min_stock = 5,
      max_stock = 100,
      images = [],
      features = [],
      specifications = {},
      is_featured = false,
      is_popular = false,
      is_trending = false
    } = req.body;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Generate SKU if not provided
    const finalSku = sku || `PRD${Date.now()}`;
    
    // Create product
    const result = await run(`
      INSERT INTO products (
        name, description, price, original_price, category_id, brand, sku,
        stock_quantity, min_stock, max_stock, images, features, specifications,
        is_featured, is_popular, is_trending
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, description, price, original_price, category_id, brand, finalSku,
      stock_quantity, min_stock, max_stock,
      JSON.stringify(images), JSON.stringify(features), JSON.stringify(specifications),
      is_featured ? 1 : 0, is_popular ? 1 : 0, is_trending ? 1 : 0
    ]);
    
    // Get created product
    const product = await get(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [result.lastID]);
    
    db.close();
    
    // Format response
    const formattedProduct = {
      ...product,
      images: JSON.parse(product.images),
      features: JSON.parse(product.features),
      specifications: JSON.parse(product.specifications)
    };
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: formattedProduct }
    });
    
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        message: 'Product SKU already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update product (Admin only)
router.put('/:id', authenticate, authorize('admin'), validateParams(schemas.idParam), validate(schemas.updateProduct), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if product exists
    const existingProduct = await get('SELECT id FROM products WHERE id = ?', [id]);
    
    if (!existingProduct) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Build update query
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'images' || key === 'features') {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(updateData[key]));
        } else if (key === 'specifications') {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(updateData[key]));
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      }
    });
    
    if (updateFields.length === 0) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    // Update product
    await run(`
      UPDATE products 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
    
    // Get updated product
    const product = await get(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);
    
    db.close();
    
    // Format response
    const formattedProduct = {
      ...product,
      images: JSON.parse(product.images || '[]'),
      features: JSON.parse(product.features || '[]'),
      specifications: JSON.parse(product.specifications || '{}')
    };
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: formattedProduct }
    });
    
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticate, authorize('admin'), validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if product exists
    const product = await get('SELECT id FROM products WHERE id = ?', [id]);
    
    if (!product) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Soft delete (set is_active to false)
    await run('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get featured products
router.get('/featured/list', optionalAuth, async (req, res) => {
  try {
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    
    const products = await all(`
      SELECT 
        p.*,
        c.name as category_name,
        CASE WHEN w.product_id IS NOT NULL THEN 1 ELSE 0 END as is_wishlisted
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN wishlist w ON p.id = w.product_id AND w.user_id = ?
      WHERE p.is_active = 1 AND p.is_featured = 1
      ORDER BY p.created_at DESC
      LIMIT 8
    `, [req.user?.id || null]);
    
    db.close();
    
    const formattedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      features: product.features ? JSON.parse(product.features) : [],
      specifications: product.specifications ? JSON.parse(product.specifications) : {},
      is_wishlisted: Boolean(product.is_wishlisted)
    }));
    
    res.json({
      success: true,
      data: { products: formattedProducts }
    });
    
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;