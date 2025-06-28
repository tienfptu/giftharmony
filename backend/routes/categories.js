const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: { categories: result.rows }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single category
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await db.query(
      'SELECT * FROM categories WHERE slug = $1 AND is_active = true',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: { category: result.rows[0] }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create category (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, icon, color, sort_order } = req.body;

    // Check if slug already exists
    const existingCategory = await db.query(
      'SELECT id FROM categories WHERE slug = $1',
      [slug]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    const result = await db.query(
      `INSERT INTO categories (name, slug, description, icon, color, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, slug, description, icon, color, sort_order || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category: result.rows[0] }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update category (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, color, sort_order, is_active } = req.body;

    const result = await db.query(
      `UPDATE categories SET 
        name = $1, slug = $2, description = $3, icon = $4, 
        color = $5, sort_order = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [name, slug, description, icon, color, sort_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category: result.rows[0] }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete category (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCount = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND is_active = true',
      [id]
    );

    if (parseInt(productCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with active products'
      });
    }

    const result = await db.query(
      'UPDATE categories SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;