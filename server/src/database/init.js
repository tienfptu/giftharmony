import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_URL || join(__dirname, '../../database/giftharmony.db');

// Ensure database directory exists
async function ensureDbDirectory() {
  const dbDir = dirname(DB_PATH);
  try {
    await fs.access(dbDir);
  } catch {
    await fs.mkdir(dbDir, { recursive: true });
  }
}

// Create database connection
export function createConnection() {
  return new sqlite3.Database(DB_PATH);
}

// Initialize database with tables
export async function initializeDatabase() {
  await ensureDbDirectory();
  
  const db = createConnection();
  const run = promisify(db.run.bind(db));
  
  try {
    // Enable foreign keys
    await run('PRAGMA foreign_keys = ON');
    
    // Users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        avatar TEXT,
        role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
        points INTEGER DEFAULT 0,
        level TEXT DEFAULT 'New Member',
        is_active BOOLEAN DEFAULT 1,
        email_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    await run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        category_id INTEGER,
        brand TEXT,
        sku TEXT UNIQUE,
        stock_quantity INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 5,
        max_stock INTEGER DEFAULT 100,
        images TEXT, -- JSON array of image URLs
        features TEXT, -- JSON array of features
        specifications TEXT, -- JSON object of specifications
        is_active BOOLEAN DEFAULT 1,
        is_featured BOOLEAN DEFAULT 0,
        is_popular BOOLEAN DEFAULT 0,
        is_trending BOOLEAN DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

    // Orders table
    await run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled')),
        payment_method TEXT NOT NULL,
        payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        subtotal DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0,
        shipping_fee DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        shipping_address TEXT NOT NULL, -- JSON object
        notes TEXT,
        tracking_number TEXT,
        delivered_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Order items table
    await run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // Cart table
    await run(`
      CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        UNIQUE(user_id, product_id)
      )
    `);

    // Wishlist table
    await run(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        UNIQUE(user_id, product_id)
      )
    `);

    // Reviews table
    await run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        order_id INTEGER,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title TEXT,
        comment TEXT,
        is_verified BOOLEAN DEFAULT 0,
        is_approved BOOLEAN DEFAULT 1,
        helpful_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (order_id) REFERENCES orders (id),
        UNIQUE(user_id, product_id, order_id)
      )
    `);

    // Promotions table
    await run(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
        value DECIMAL(10,2) NOT NULL,
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        max_discount_amount DECIMAL(10,2),
        usage_limit INTEGER,
        usage_count INTEGER DEFAULT 0,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications table
    await run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('order', 'promotion', 'reminder', 'system')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        action_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // User addresses table
    await run(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        district TEXT NOT NULL,
        ward TEXT NOT NULL,
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await run('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)');
    await run('CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    await run('CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)');

    console.log('✅ Database tables created successfully');
    
    // Seed initial data
    await seedInitialData(db);
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Seed initial data
async function seedInitialData(db) {
  const run = promisify(db.run.bind(db));
  const get = promisify(db.get.bind(db));
  
  try {
    // Check if admin user exists
    const adminExists = await get('SELECT id FROM users WHERE email = ?', [process.env.ADMIN_EMAIL || 'admin@giftharmony.com']);
    
    if (!adminExists) {
      // Create admin user
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
      
      await run(`
        INSERT INTO users (email, password, full_name, role, level, points)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        process.env.ADMIN_EMAIL || 'admin@giftharmony.com',
        hashedPassword,
        'Administrator',
        'admin',
        'Admin',
        0
      ]);
      
      console.log('✅ Admin user created');
    }

    // Check if categories exist
    const categoryExists = await get('SELECT id FROM categories LIMIT 1');
    
    if (!categoryExists) {
      const categories = [
        { name: 'Hoa tươi', description: 'Hoa tươi cho mọi dịp', icon: '🌹', color: 'bg-pink-100' },
        { name: 'Công nghệ', description: 'Thiết bị công nghệ hiện đại', icon: '📱', color: 'bg-blue-100' },
        { name: 'Đồ ăn', description: 'Thực phẩm và đồ uống', icon: '🍫', color: 'bg-yellow-100' },
        { name: 'Làm đẹp', description: 'Sản phẩm chăm sóc sắc đẹp', icon: '💄', color: 'bg-purple-100' },
        { name: 'Thời trang', description: 'Quần áo và phụ kiện', icon: '👗', color: 'bg-green-100' },
        { name: 'Đồ trang sức', description: 'Trang sức và phụ kiện', icon: '💎', color: 'bg-indigo-100' }
      ];

      for (const category of categories) {
        await run(`
          INSERT INTO categories (name, description, icon, color)
          VALUES (?, ?, ?, ?)
        `, [category.name, category.description, category.icon, category.color]);
      }
      
      console.log('✅ Categories seeded');
    }

    // Check if products exist
    const productExists = await get('SELECT id FROM products LIMIT 1');
    
    if (!productExists) {
      const products = [
        {
          name: 'Hoa hồng đỏ cao cấp',
          description: 'Bó hoa hồng đỏ cao cấp được tuyển chọn từ những bông hoa tươi nhất',
          price: 299000,
          original_price: 399000,
          category_id: 1,
          brand: 'FlowerShop Premium',
          sku: 'FL001',
          stock_quantity: 15,
          images: JSON.stringify([
            'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'
          ]),
          features: JSON.stringify([
            'Hoa tươi 100% được nhập khẩu từ Đà Lạt',
            'Bao bì sang trọng với giấy gói cao cấp',
            'Kèm thiệp chúc mừng miễn phí'
          ]),
          is_featured: 1,
          is_popular: 1,
          rating: 4.8
        },
        {
          name: 'Đồng hồ thông minh',
          description: 'Đồng hồ thông minh với nhiều tính năng hiện đại',
          price: 2999000,
          category_id: 2,
          brand: 'TechWatch',
          sku: 'TC001',
          stock_quantity: 5,
          images: JSON.stringify([
            'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'
          ]),
          is_trending: 1,
          rating: 4.6
        },
        {
          name: 'Chocolate handmade',
          description: 'Chocolate handmade cao cấp với hương vị đậm đà',
          price: 450000,
          category_id: 3,
          brand: 'Sweet Dreams',
          sku: 'FD001',
          stock_quantity: 10,
          images: JSON.stringify([
            'https://images.pexels.com/photos/918327/pexels-photo-918327.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'
          ]),
          is_popular: 1,
          rating: 4.9
        }
      ];

      for (const product of products) {
        await run(`
          INSERT INTO products (
            name, description, price, original_price, category_id, brand, sku,
            stock_quantity, images, features, is_featured, is_popular, is_trending, rating
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          product.name, product.description, product.price, product.original_price,
          product.category_id, product.brand, product.sku, product.stock_quantity,
          product.images, product.features, product.is_featured || 0,
          product.is_popular || 0, product.is_trending || 0, product.rating
        ]);
      }
      
      console.log('✅ Products seeded');
    }

    console.log('✅ Initial data seeded successfully');
    
  } catch (error) {
    console.error('❌ Error seeding initial data:', error);
    throw error;
  }
}