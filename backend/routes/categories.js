const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { validateRequest, schemas } = require("../middleware/validation");

const router = express.Router();

// Get all categories
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories WHERE is_active = true ORDER BY name"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get category by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories WHERE id = $1 AND is_active = true",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create category (Admin only)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  validateRequest(schemas.category),
  async (req, res) => {
    try {
      const { name, description, image_url } = req.body;

      const result = await pool.query(
        "INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3) RETURNING *",
        [name, description, image_url]
      );

      res.status(201).json({
        message: "Category created successfully",
        category: result.rows[0],
      });
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update category (Admin only)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  validateRequest(schemas.category),
  async (req, res) => {
    try {
      const { name, description, image_url } = req.body;

      const result = await pool.query(
        "UPDATE categories SET name = $1, description = $2, image_url = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *",
        [name, description, image_url, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json({ message: "Category updated successfully" });
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete category (Admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE categories SET is_active = false WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;