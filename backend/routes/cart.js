const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get user's cart
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1 AND p.is_active = true`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add item to cart
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    // Check if product exists and is active
    const productResult = await pool.query(
      "SELECT stock_quantity FROM products WHERE id = $1 AND is_active = true",
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (productResult.rows[0].stock_quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // Check if item already exists in cart
    const existingItem = await pool.query(
      "SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2",
      [req.user.id, product_id]
    );

    if (existingItem.rows.length > 0) {
      // Update quantity
      const newQuantity = existingItem.rows[0].quantity + quantity;
      if (productResult.rows[0].stock_quantity < newQuantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }

      await pool.query("UPDATE cart SET quantity = $1 WHERE id = $2", [
        newQuantity,
        existingItem.rows[0].id,
      ]);
    } else {
      // Add new item
      await pool.query(
        "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)",
        [req.user.id, product_id, quantity]
      );
    }

    res.json({ message: "Item added to cart successfully" });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update cart item quantity
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    // Check if cart item belongs to user
    const cartItem = await pool.query(
      "SELECT product_id FROM cart WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (cartItem.rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Check stock
    const product = await pool.query(
      "SELECT stock_quantity FROM products WHERE id = $1",
      [cartItem.rows[0].product_id]
    );

    if (product.rows[0].stock_quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    await pool.query("UPDATE cart SET quantity = $1 WHERE id = $2", [
      quantity,
      req.params.id,
    ]);

    res.json({ message: "Cart updated successfully" });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Remove item from cart
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ message: "Item removed from cart successfully" });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Clear cart
router.delete("/", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM cart WHERE user_id = $1", [req.user.id]);

    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
