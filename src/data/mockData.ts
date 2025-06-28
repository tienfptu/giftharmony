import { Product, Review, Event, User } from '../types';

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Hoa hồng đỏ cao cấp',
    price: '299.000đ',
    priceNumber: 299000,
    originalPrice: '399.000đ',
    image: 'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1',
    rating: 4.8,
    category: 'Hoa tươi',
    isPopular: true,
    maxQuantity: 15,
    brand: 'FlowerShop Premium',
    inStock: true,
    stockCount: 15,
    images: [
      'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
      'https://images.pexels.com/photos/1022923/pexels-photo-1022923.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
      'https://images.pexels.com/photos/1131458/pexels-photo-1131458.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
      'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'
    ],
    description: 'Bó hoa hồng đỏ cao cấp được tuyển chọn từ những bông hoa tươi nhất, thể hiện tình yêu chân thành và sâu sắc. Mỗi bông hoa đều được chăm sóc kỹ lưỡng để đảm bảo độ tươi lâu và vẻ đẹp hoàn hảo.',
    features: [
      'Hoa tươi 100% được nhập khẩu từ Đà Lạt',
      'Bao bì sang trọng với giấy gói cao cấp',
      'Kèm thiệp chúc mừng miễn phí',
      'Giao hàng trong ngày tại TP.HCM',
      'Bảo hành tươi trong 3 ngày'
    ],
    specifications: {
      'Số lượng hoa': '12 bông',
      'Màu sắc': 'Đỏ tươi',
      'Kích thước': '40-50cm',
      'Xuất xứ': 'Đà Lạt, Việt Nam',
      'Thời gian bảo quản': '5-7 ngày'
    },
    reviewCount: 156,
    discount: 25
  },
  {
    id: 2,
    name: 'Đồng hồ thông minh',
    price: '2.999.000đ',
    priceNumber: 2999000,
    image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1',
    rating: 4.6,
    category: 'Công nghệ',
    isTrending: true,
    maxQuantity: 5
  },
  {
    id: 3,
    name: 'Chocolate handmade',
    price: '450.000đ',
    priceNumber: 450000,
    image: 'https://images.pexels.com/photos/918327/pexels-photo-918327.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1',
    rating: 4.9,
    category: 'Đồ ăn',
    isPopular: true,
    maxQuantity: 10
  },
  {
    id: 4,
    name: 'Nước hoa nữ cao cấp',
    price: '1.200.000đ',
    priceNumber: 1200000,
    image: 'https://images.pexels.com/photos/1190829/pexels-photo-1190829.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1',
    rating: 4.7,
    category: 'Làm đẹp',
    maxQuantity: 8
  }
];

export const UPCOMING_EVENTS: Event[] = [
  {
    id: 1,
    title: 'Sinh nhật mẹ',
    date: '15/02/2025',
    type: 'Sinh nhật',
    daysLeft: 12
  },
  {
    id: 2,
    title: 'Valentine',
    date: '14/02/2025',
    type: 'Lễ tình nhân',
    daysLeft: 11
  },
  {
    id: 3,
    title: 'Kỷ niệm ngày cưới',
    date: '20/03/2025',
    type: 'Kỷ niệm',
    daysLeft: 45
  }
];

export const SAMPLE_REVIEWS: Review[] = [
  {
    id: 1,
    userName: 'Nguyễn Thị Mai',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    rating: 5,
    comment: 'Hoa rất tươi và đẹp, giao hàng nhanh. Người yêu rất thích!',
    date: '2 ngày trước',
    helpful: 12
  },
  {
    id: 2,
    userName: 'Trần Văn Nam',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    rating: 4,
    comment: 'Chất lượng tốt, đóng gói cẩn thận. Sẽ mua lại lần sau.',
    date: '1 tuần trước',
    helpful: 8
  },
  {
    id: 3,
    userName: 'Lê Thị Hoa',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    rating: 5,
    comment: 'Tuyệt vời! Hoa tươi lâu hơn mong đợi. Dịch vụ chăm sóc khách hàng rất tốt.',
    date: '2 tuần trước',
    helpful: 15
  }
];

export const SAMPLE_USER: User = {
  id: 1,
  name: 'Nguyễn Văn A',
  email: 'user@example.com',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
  points: 1250,
  level: 'Gold Member'
};

export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Nguyễn Thị Mai',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    rating: 5,
    comment: 'Dịch vụ tuyệt vời! Hoa tươi và đẹp, giao hàng đúng hẹn.',
    location: 'TP. Hồ Chí Minh'
  },
  {
    id: 2,
    name: 'Trần Văn Nam',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    rating: 5,
    comment: 'Tìm được quà ý nghĩa cho người yêu. Rất hài lòng!',
    location: 'Hà Nội'
  },
  {
    id: 3,
    name: 'Lê Thị Hoa',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    rating: 5,
    comment: 'Chất lượng sản phẩm vượt mong đợi. Sẽ quay lại!',
    location: 'Đà Nẵng'
  }
];

export const STATS = [
  { number: '50K+', label: 'Khách hàng hài lòng' },
  { number: '100K+', label: 'Món quà đã trao' },
  { number: '4.9/5', label: 'Đánh giá trung bình' },
  { number: '24/7', label: 'Hỗ trợ khách hàng' }
];