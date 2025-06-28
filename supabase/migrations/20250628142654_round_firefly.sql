/*
  # Insert sample products data

  1. Sample Products
    - Adds sample products across all categories
    - Includes realistic Vietnamese pricing
    - Sets up proper product relationships
    - Configures stock and availability

  2. Data Structure
    - Products with images, features, and specifications
    - Proper category relationships
    - Stock management setup
    - Popular and trending flags
*/

-- Insert sample products
DO $$
DECLARE
  cat_hoa_tuoi uuid;
  cat_cong_nghe uuid;
  cat_do_an uuid;
  cat_lam_dep uuid;
  cat_thoi_trang uuid;
  cat_trang_suc uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_hoa_tuoi FROM categories WHERE name = 'Hoa tươi';
  SELECT id INTO cat_cong_nghe FROM categories WHERE name = 'Công nghệ';
  SELECT id INTO cat_do_an FROM categories WHERE name = 'Đồ ăn';
  SELECT id INTO cat_lam_dep FROM categories WHERE name = 'Làm đẹp';
  SELECT id INTO cat_thoi_trang FROM categories WHERE name = 'Thời trang';
  SELECT id INTO cat_trang_suc FROM categories WHERE name = 'Đồ trang sức';

  -- Insert Hoa tươi products
  INSERT INTO products (name, description, price, original_price, category_id, brand, images, features, specifications, stock_count, max_quantity, is_popular, is_trending) VALUES
    (
      'Hoa hồng đỏ cao cấp',
      'Bó hoa hồng đỏ cao cấp được tuyển chọn từ những bông hoa tươi nhất, thể hiện tình yêu chân thành và sâu sắc.',
      299000,
      399000,
      cat_hoa_tuoi,
      'FlowerShop Premium',
      ARRAY['https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['Hoa tươi 100% từ Đà Lạt', 'Bao bì sang trọng', 'Kèm thiệp chúc mừng', 'Giao hàng trong ngày'],
      '{"so_luong": "12 bông", "mau_sac": "Đỏ tươi", "kich_thuoc": "40-50cm", "xuat_xu": "Đà Lạt"}',
      15,
      10,
      true,
      false
    ),
    (
      'Hoa tulip vàng',
      'Bó hoa tulip vàng tươi sáng, mang lại niềm vui và hy vọng cho người nhận.',
      250000,
      320000,
      cat_hoa_tuoi,
      'FlowerShop Premium',
      ARRAY['https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['Hoa nhập khẩu từ Hà Lan', 'Bao bì cao cấp', 'Tươi lâu 7-10 ngày'],
      '{"so_luong": "10 bông", "mau_sac": "Vàng", "kich_thuoc": "35-40cm", "xuat_xu": "Hà Lan"}',
      20,
      15,
      false,
      true
    );

  -- Insert Công nghệ products
  INSERT INTO products (name, description, price, original_price, category_id, brand, images, features, specifications, stock_count, max_quantity, is_trending) VALUES
    (
      'Đồng hồ thông minh Apple Watch',
      'Đồng hồ thông minh với nhiều tính năng hiện đại, theo dõi sức khỏe và kết nối thông minh.',
      8999000,
      10999000,
      cat_cong_nghe,
      'Apple',
      ARRAY['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['Theo dõi sức khỏe 24/7', 'Kháng nước IP68', 'Pin 18 giờ', 'GPS tích hợp'],
      '{"man_hinh": "1.9 inch", "pin": "18 giờ", "bo_nho": "32GB", "ket_noi": "WiFi, Bluetooth, GPS"}',
      5,
      3,
      true
    ),
    (
      'Tai nghe AirPods Pro',
      'Tai nghe không dây cao cấp với công nghệ chống ồn chủ động.',
      5999000,
      6999000,
      cat_cong_nghe,
      'Apple',
      ARRAY['https://images.pexels.com/photos/8534088/pexels-photo-8534088.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['Chống ồn chủ động', 'Âm thanh Spatial Audio', 'Pin 30 giờ', 'Sạc không dây'],
      '{"pin": "6 giờ + 24 giờ với hộp", "ket_noi": "Bluetooth 5.3", "chong_nuoc": "IPX4"}',
      8,
      5,
      false
    );

  -- Insert Đồ ăn products
  INSERT INTO products (name, description, price, original_price, category_id, brand, images, features, specifications, stock_count, max_quantity, is_popular) VALUES
    (
      'Chocolate handmade cao cấp',
      'Chocolate handmade được làm từ cacao nguyên chất, hương vị đậm đà và tinh tế.',
      450000,
      550000,
      cat_do_an,
      'Sweet Dreams',
      ARRAY['https://images.pexels.com/photos/918327/pexels-photo-918327.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['Cacao nguyên chất 70%', 'Handmade thủ công', 'Không chất bảo quản', 'Hộp quà sang trọng'],
      '{"trong_luong": "200g", "thanh_phan": "Cacao 70%, đường, sữa", "han_su_dung": "6 tháng"}',
      25,
      20,
      true
    ),
    (
      'Bánh macaron Pháp',
      'Set bánh macaron Pháp với nhiều hương vị độc đáo, thích hợp làm quà tặng.',
      380000,
      450000,
      cat_do_an,
      'French Bakery',
      ARRAY['https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['12 chiếc nhiều vị', 'Công thức Pháp truyền thống', 'Hộp quà cao cấp'],
      '{"so_luong": "12 chiếc", "huong_vi": "Vani, chocolate, dâu, chanh", "han_su_dung": "3 ngày"}',
      15,
      10,
      false
    );

  -- Insert Làm đẹp products
  INSERT INTO products (name, description, price, original_price, category_id, brand, images, features, specifications, stock_count, max_quantity) VALUES
    (
      'Nước hoa nữ Chanel No.5',
      'Nước hoa nữ cao cấp với hương thơm quyến rũ và sang trọng.',
      3200000,
      3800000,
      cat_lam_dep,
      'Chanel',
      ARRAY['https://images.pexels.com/photos/1190829/pexels-photo-1190829.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['Hương thơm lâu phai', 'Chai thủy tinh cao cấp', 'Hương hoa cổ điển'],
      '{"dung_tich": "50ml", "nong_do": "Eau de Parfum", "huong_chinh": "Hoa hồng, ylang-ylang"}',
      12,
      5
    ),
    (
      'Set mỹ phẩm SK-II',
      'Bộ sản phẩm chăm sóc da cao cấp từ thương hiệu SK-II nổi tiếng.',
      2800000,
      3500000,
      cat_lam_dep,
      'SK-II',
      ARRAY['https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['Pitera™ độc quyền', 'Chống lão hóa', 'Dưỡng ẩm sâu', 'Làm sáng da'],
      '{"bao_gom": "Toner 230ml, Serum 30ml, Kem dưỡng 80g", "loai_da": "Mọi loại da"}',
      8,
      3
    );

  -- Insert Thời trang products
  INSERT INTO products (name, description, price, original_price, category_id, brand, images, features, specifications, stock_count, max_quantity, is_popular) VALUES
    (
      'Túi xách da thật Louis Vuitton',
      'Túi xách da thật cao cấp với thiết kế sang trọng và tinh tế.',
      25000000,
      28000000,
      cat_thoi_trang,
      'Louis Vuitton',
      ARRAY['https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['Da thật 100%', 'Thiết kế iconic', 'Khóa kim loại cao cấp', 'Bảo hành chính hãng'],
      '{"chat_lieu": "Da bò thật", "kich_thuoc": "30x25x15cm", "mau_sac": "Nâu", "xuat_xu": "Pháp"}',
      3,
      1,
      true
    ),
    (
      'Áo sơ mi nam Hugo Boss',
      'Áo sơ mi nam cao cấp với chất liệu cotton premium và thiết kế hiện đại.',
      1800000,
      2200000,
      cat_thoi_trang,
      'Hugo Boss',
      ARRAY['https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['Cotton 100%', 'Thiết kế slim fit', 'Chống nhăn', 'Dễ dàng bảo quản'],
      '{"chat_lieu": "Cotton 100%", "size": "S, M, L, XL", "mau_sac": "Trắng, Xanh", "xuat_xu": "Đức"}',
      20,
      10,
      false
    );

  -- Insert Đồ trang sức products (adjusted prices to fit numeric(10,2) constraint)
  INSERT INTO products (name, description, price, original_price, category_id, brand, images, features, specifications, stock_count, max_quantity, is_trending) VALUES
    (
      'Nhẫn kim cương Tiffany & Co',
      'Nhẫn kim cương cao cấp với thiết kế tinh tế và đá quý chất lượng.',
      45000000,
      50000000,
      cat_trang_suc,
      'Tiffany & Co',
      ARRAY['https://images.pexels.com/photos/1454171/pexels-photo-1454171.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['Kim cương thiên nhiên', 'Vàng 18K', 'Thiết kế độc quyền', 'Chứng nhận GIA'],
      '{"chat_lieu": "Vàng 18K", "da_quy": "Kim cương 1 carat", "size": "6-10", "bao_hanh": "Trọn đời"}',
      2,
      1,
      true
    ),
    (
      'Đồng hồ Rolex Submariner',
      'Đồng hồ Rolex Submariner - biểu tượng của sự sang trọng và chính xác.',
      85000000,
      95000000,
      cat_trang_suc,
      'Rolex',
      ARRAY['https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'],
      ARRAY['Chống nước 300m', 'Automatic movement', 'Thép không gỉ 904L', 'Bảo hành quốc tế'],
      '{"chat_lieu": "Thép không gỉ 904L", "chong_nuoc": "300m", "bo_may": "Automatic", "bao_hanh": "5 năm"}',
      1,
      1,
      false
    );

END $$;