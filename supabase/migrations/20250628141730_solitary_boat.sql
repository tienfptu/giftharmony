/*
  # Create promotions and events tables

  1. New Tables
    - `promotions`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `name` (text)
      - `description` (text)
      - `type` (text)
      - `value` (decimal)
      - `min_order` (decimal)
      - `max_discount` (decimal)
      - `usage_limit` (integer)
      - `usage_count` (integer)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `user_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `title` (text)
      - `event_date` (date)
      - `event_type` (text)
      - `description` (text)
      - `reminder_days` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `promotion_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `promotion_id` (uuid, foreign key)
      - `order_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
  value decimal(10,2) NOT NULL,
  min_order decimal(10,2) DEFAULT 0,
  max_discount decimal(10,2),
  usage_limit integer DEFAULT 1000,
  usage_count integer DEFAULT 0,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create user_events table
CREATE TABLE IF NOT EXISTS user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_date date NOT NULL,
  event_type text NOT NULL,
  description text,
  reminder_days integer DEFAULT 7,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create promotion_usage table
CREATE TABLE IF NOT EXISTS promotion_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_id uuid REFERENCES promotions(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, promotion_id, order_id)
);

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;

-- Promotions policies
CREATE POLICY "Anyone can view active promotions"
  ON promotions
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND start_date <= now() AND end_date >= now());

-- User events policies
CREATE POLICY "Users can manage own events"
  ON user_events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Promotion usage policies
CREATE POLICY "Users can view own promotion usage"
  ON promotion_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own promotion usage"
  ON promotion_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for user_events updated_at
CREATE TRIGGER update_user_events_updated_at
  BEFORE UPDATE ON user_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample promotions
INSERT INTO promotions (code, name, description, type, value, min_order, max_discount, start_date, end_date) VALUES
  ('VALENTINE20', 'Valentine Sale 2025', 'Giảm 20% cho tất cả sản phẩm nhân dịp Valentine', 'percentage', 20, 500000, 200000, '2025-02-10', '2025-02-20'),
  ('FREESHIP', 'Miễn phí vận chuyển', 'Miễn phí vận chuyển cho đơn hàng từ 300k', 'free_shipping', 0, 300000, NULL, '2025-01-01', '2025-12-31'),
  ('NEWUSER15', 'Khách hàng mới', 'Giảm 15% cho khách hàng đăng ký mới', 'percentage', 15, 200000, 150000, '2025-01-01', '2025-03-31'),
  ('SPRING25', 'Chào xuân 2025', 'Giảm 25% cho đơn hàng từ 1 triệu', 'percentage', 25, 1000000, 500000, '2025-02-01', '2025-02-28'),
  ('SAVE50K', 'Giảm 50k', 'Giảm 50k cho đơn hàng từ 800k', 'fixed_amount', 50000, 800000, NULL, '2025-01-15', '2025-03-15')
ON CONFLICT (code) DO NOTHING;