import express from 'express';
import { promisify } from 'util';
import { createConnection } from '../database/init.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateParams, schemas } from '../middleware/validation.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const db = createConnection();
    const all = promisify(db.all.bind(db));
    
    const categories = await all(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    
    db.close();
    
    res.json({
      success: true,
      data: { categories }
    });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get category by ID
router.get('/:id', validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = createConnection();
    const get = promisify(db.get.bind(db));
    
    const category = await get(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.id = ? AND c.is_active = 1
      GROUP BY c.id
    `, [id]);
    
    db.close();
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: { category }
    });
    
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create category (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Create category
    const result = await run(`
      INSERT INTO categories (name, description, icon, color)
      VALUES (?, ?, ?, ?)
    `, [name, description, icon, color]);
    
    // Get created category
    const category = await get('SELECT * FROM categories WHERE id = ?', [result.lastID]);
    
    db.close();
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
    
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update category (Admin only)
router.put('/:id', authenticate, authorize('admin'), validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, is_active } = req.body;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if category exists
    const existingCategory = await get('SELECT id FROM categories WHERE id = ?', [id]);
    
    if (!existingCategory) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Update category
    await run(`
      UPDATE categories 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          icon = COALESCE(?, icon),
          color = COALESCE(?, color),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `, [name, description, icon, color, is_active, id]);
    
    // Get updated category
    const category = await get('SELECT * FROM categories WHERE id = ?', [id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
    
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete category (Admin only)
router.delete('/:id', authenticate, authorize('admin'), validateParams(schemas.idParam), async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = createConnection();
    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));
    
    // Check if category exists
    const category = await get('SELECT id FROM categories WHERE id = ?', [id]);
    
    if (!category) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category has products
    const productCount = await get('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1', [id]);
    
    if (productCount.count > 0) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with active products'
      });
    }
    
    // Soft delete (set is_active to false)
    await run('UPDATE categories SET is_active = 0 WHERE id = ?', [id]);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;