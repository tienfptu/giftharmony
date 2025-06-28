const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { validateRequest, schemas } = require("../middleware/validation");

const router = express.Router();

// Get all products
router.get("/", async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = true
    `;
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND p.category_id = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${
        paramCount + 1
      })`;
      params.push(`%${search}%`, `%${search}%`);
      paramCount++;
    }

    paramCount++;
    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${
      paramCount + 1
    }`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery =
      "SELECT COUNT(*) as total FROM products WHERE is_active = true";
    const countParams = [];
    let countParamCount = 0;

    if (category) {
      countParamCount++;
      countQuery += ` AND category_id = $${countParamCount}`;
      countParams.push(category);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR description ILIKE $${
        countParamCount + 1
      })`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1 AND p.is_active = true`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create product (Admin only)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  validateRequest(schemas.product),
  async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        category_id,
        stock_quantity,
        image_url,
      } = req.body;

      const result = await pool.query(
        "INSERT INTO products (name, description, price, category_id, stock_quantity, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [name, description, price, category_id, stock_quantity, image_url]
      );

      res.status(201).json({
        message: "Product created successfully",
        product: result.rows[0],
      });
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update product (Admin only)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  validateRequest(schemas.product),
  async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        category_id,
        stock_quantity,
        image_url,
      } = req.body;

      const result = await pool.query(
        "UPDATE products SET name = $1, description = $2, price = $3, category_id = $4, stock_quantity = $5, image_url = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *",
        [
          name,
          description,
          price,
          category_id,
          stock_quantity,
          image_url,
          req.params.id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({
        message: "Product updated successfully",
        product: result.rows[0],
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete product (Admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE products SET is_active = false WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
