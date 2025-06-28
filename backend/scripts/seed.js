const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Seed categories
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and gadgets' },
      { name: 'Clothing', description: 'Fashion and apparel' },
      { name: 'Books', description: 'Books and literature' },
      { name: 'Home & Garden', description: 'Home improvement and gardening' },
      { name: 'Sports', description: 'Sports equipment and accessories' }
    ];

    for (const category of categories) {
      await pool.execute(
        'INSERT IGNORE INTO categories (name, description) VALUES (?, ?)',
        [category.name, category.description]
      );
    }

    // Seed admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.execute(
      'INSERT IGNORE INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['admin@example.com', hashedPassword, 'Admin', 'User', 'admin']
    );

    // Seed sample products
    const products = [
      { name: 'Smartphone', description: 'Latest smartphone with advanced features', price: 699.99, category_id: 1, stock_quantity: 50 },
      { name: 'Laptop', description: 'High-performance laptop for work and gaming', price: 1299.99, category_id: 1, stock_quantity: 30 },
      { name: 'T-Shirt', description: 'Comfortable cotton t-shirt', price: 19.99, category_id: 2, stock_quantity: 100 },
      { name: 'Jeans', description: 'Classic denim jeans', price: 49.99, category_id: 2, stock_quantity: 75 },
      { name: 'Programming Book', description: 'Learn programming fundamentals', price: 39.99, category_id: 3, stock_quantity: 25 }
    ];

    for (const product of products) {
      await pool.execute(
        'INSERT IGNORE INTO products (name, description, price, category_id, stock_quantity) VALUES (?, ?, ?, ?, ?)',
        [product.name, product.description, product.price, product.category_id, product.stock_quantity]
      );
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();