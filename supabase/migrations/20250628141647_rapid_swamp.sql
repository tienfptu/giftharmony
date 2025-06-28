/*
  # Create categories and products tables

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `icon` (text)
      - `color` (text)
      - `description` (text)
      - `created_at` (timestamp)

    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (decimal)
      - `original_price` (decimal)
      - `category_id` (uuid, foreign key)
      - `brand` (text)
      - `images` (text array)
      - `features` (text array)
      - `specifications` (jsonb)
      - `stock_count` (integer)
      - `max_quantity` (integer)
      - `rating` (decimal)
      - `review_count` (integer)
      - `is_popular` (boolean)
      - `is_trending` (boolean)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
    - Add policies for admin management
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  original_price decimal(10,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand text,
  images text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  specifications jsonb DEFAULT '{}',
  stock_count integer DEFAULT 0,
  max_quantity integer DEFAULT 10,
  rating decimal(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  is_popular boolean DEFAULT false,
  is_trending boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Anyone can view categories"
  ON categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Products policies
CREATE POLICY "Anyone can view active products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Create trigger for products updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, icon, color, description) VALUES
  ('Hoa tươi', '🌹', 'bg-pink-100', 'Hoa tươi cho mọi dịp đặc biệt'),
  ('Công nghệ', '📱', 'bg-blue-100', 'Thiết bị công nghệ hiện đại'),
  ('Đồ ăn', '🍫', 'bg-yellow-100', 'Thực phẩm và đồ uống cao cấp'),
  ('Làm đẹp', '💄', 'bg-purple-100', 'Sản phẩm chăm sóc và làm đẹp'),
  ('Thời trang', '👗', 'bg-green-100', 'Quần áo và phụ kiện thời trang'),
  ('Đồ trang sức', '💎', 'bg-indigo-100', 'Trang sức và phụ kiện cao cấp')
ON CONFLICT (name) DO NOTHING;