const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await db.query(`
      INSERT INTO users (name, email, password, role, points, level) 
      VALUES ('Admin User', 'admin@giftharmony.vn', $1, 'admin', 0, 'Administrator')
      ON CONFLICT (email) DO NOTHING
    `, [adminPassword]);

    // Create sample customer
    const customerPassword = await bcrypt.hash('customer123', 12);
    await db.query(`
      INSERT INTO users (name, email, password, role, points, level, phone, address) 
      VALUES (
        'Nguyễn Văn A', 
        'customer@example.com', 
        $1, 
        'customer', 
        1250, 
        'Gold Member',
        '0901234567',
        '123 Nguyễn Văn Linh, Q7, TP.HCM'
      )
      ON CONFLICT (email) DO NOTHING
    `, [customerPassword]);

    // Create categories
    const categories = [
      { name: 'Hoa tươi', slug: 'hoa-tuoi', description: 'Hoa tươi cao cấp cho mọi dịp', icon: '🌹', color: 'bg-pink-100' },
      { name: 'Công nghệ', slug: 'cong-nghe', description: 'Thiết bị công nghệ hiện đại', icon: '📱', color: 'bg-blue-100' },
      { name: 'Đồ ăn', slug: 'do-an', description: 'Thực phẩm và đồ ăn cao cấp', icon: '🍫', color: 'bg-yellow-100' },
      { name: 'Làm đẹp', slug: 'lam-dep', description: 'Sản phẩm làm đẹp và chăm sóc', icon: '💄', color: 'bg-purple-100' },
      { name: 'Thời trang', slug: 'thoi-trang', description: 'Quần áo và phụ kiện thời trang', icon: '👗', color: 'bg-green-100' },
      { name: 'Đồ trang sức', slug: 'do-trang-suc', description: 'Trang sức và phụ kiện cao cấp', icon: '💎', color: 'bg-indigo-100' }
    ];

    for (const category of categories) {
      await db.query(`
        INSERT INTO categories (name, slug, description, icon, color, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) DO NOTHING
      `, [category.name, category.slug, category.description, category.icon, category.color, categories.indexOf(category)]);
    }

    // Get category IDs
    const categoryResult = await db.query('SELECT id, slug FROM categories');
    const categoryMap = {};
    categoryResult.rows.forEach(cat => {
      categoryMap[cat.slug] = cat.id;
    });

    // Create sample products
    const products = [
      {
        name: 'Hoa hồng đỏ cao cấp',
        description: 'Bó hoa hồng đỏ cao cấp được tuyển chọn từ những bông hoa tươi nhất, thể hiện tình yêu chân thành và sâu sắc.',
        price: 299000,
        original_price: 399000,
        category_id: categoryMap['hoa-tuoi'],
        image_url: 'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
        images: JSON.stringify([
          'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
          'https://images.pexels.com/photos/1022923/pexels-photo-1022923.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'
        ]),
        stock_quantity: 15,
        is_featured: true,
        is_popular: true,
        rating: 4.8,
        review_count: 156,
        sales_count: 234,
        specifications: JSON.stringify({
          'Số lượng hoa': '12 bông',
          'Màu sắc': 'Đỏ tươi',
          'Kích thước': '40-50cm',
          'Xuất xứ': 'Đà Lạt, Việt Nam'
        }),
        features: JSON.stringify([
          'Hoa tươi 100% từ Đà Lạt',
          'Bao bì sang trọng',
          'Kèm thiệp chúc mừng',
          'Giao hàng trong ngày'
        ])
      },
      {
        name: 'Đồng hồ thông minh Apple Watch',
        description: 'Đồng hồ thông minh cao cấp với nhiều tính năng hiện đại, theo dõi sức khỏe và kết nối thông minh.',
        price: 2999000,
        category_id: categoryMap['cong-nghe'],
        image_url: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
        images: JSON.stringify([
          'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'
        ]),
        stock_quantity: 5,
        is_trending: true,
        rating: 4.6,
        review_count: 89,
        sales_count: 156
      },
      {
        name: 'Chocolate handmade cao cấp',
        description: 'Chocolate handmade được làm từ cacao nguyên chất, hương vị đậm đà và thơm ngon.',
        price: 450000,
        category_id: categoryMap['do-an'],
        image_url: 'https://images.pexels.com/photos/918327/pexels-photo-918327.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
        images: JSON.stringify([
          'https://images.pexels.com/photos/918327/pexels-photo-918327.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'
        ]),
        stock_quantity: 10,
        is_popular: true,
        rating: 4.9,
        review_count: 234,
        sales_count: 345
      },
      {
        name: 'Nước hoa nữ cao cấp Chanel',
        description: 'Nước hoa nữ cao cấp với hương thơm quyến rũ và lâu phai, thể hiện sự sang trọng và đẳng cấp.',
        price: 1200000,
        category_id: categoryMap['lam-dep'],
        image_url: 'https://images.pexels.com/photos/1190829/pexels-photo-1190829.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
        images: JSON.stringify([
          'https://images.pexels.com/photos/1190829/pexels-photo-1190829.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'
        ]),
        stock_quantity: 8,
        rating: 4.7,
        review_count: 67,
        sales_count: 89
      }
    ];

    for (const product of products) {
      await db.query(`
        INSERT INTO products (
          name, description, price, original_price, category_id, 
          image_url, images, stock_quantity, is_featured, is_popular,
          rating, review_count, sales_count, specifications, features
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT DO NOTHING
      `, [
        product.name, product.description, product.price, product.original_price,
        product.category_id, product.image_url, product.images, product.stock_quantity,
        product.is_featured || false, product.is_popular || false,
        product.rating, product.review_count, product.sales_count,
        product.specifications, product.features
      ]);
    }

    // Create sample promotions
    const promotions = [
      {
        code: 'VALENTINE20',
        name: 'Valentine Sale 2025',
        description: 'Giảm 20% cho tất cả sản phẩm nhân dịp Valentine',
        type: 'percentage',
        value: 20,
        min_order_amount: 500000,
        max_discount_amount: 200000,
        usage_limit: 1000,
        start_date: '2025-02-10',
        end_date: '2025-02-20'
      },
      {
        code: 'FREESHIP',
        name: 'Miễn phí vận chuyển',
        description: 'Miễn phí vận chuyển cho đơn hàng từ 300k',
        type: 'free_shipping',
        value: 0,
        min_order_amount: 300000,
        usage_limit: 5000,
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      }
    ];

    for (const promo of promotions) {
      await db.query(`
        INSERT INTO promotions (
          code, name, description, type, value, min_order_amount,
          max_discount_amount, usage_limit, start_date, end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (code) DO NOTHING
      `, [
        promo.code, promo.name, promo.description, promo.type, promo.value,
        promo.min_order_amount, promo.max_discount_amount, promo.usage_limit,
        promo.start_date, promo.end_date
      ]);
    }

    console.log('✅ Database seeded successfully!');
    console.log('📧 Admin login: admin@giftharmony.vn / admin123');
    console.log('👤 Customer login: customer@example.com / customer123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = seedDatabase;