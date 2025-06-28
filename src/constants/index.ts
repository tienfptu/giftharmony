export const ROUTES = {
  LANDING: 'landing',
  LOGIN: 'login',
  REGISTER: 'register',
  DASHBOARD: 'dashboard',
  PRODUCT_DETAIL: 'product-detail',
  CART: 'cart',
  CHECKOUT: 'checkout',
  ORDER_SUCCESS: 'order-success',
  PROFILE: 'profile'
} as const;

export const COLORS = {
  PRIMARY: '#49bbbd',
  PRIMARY_HOVER: '#3a9a9c',
  SECONDARY: '#ccb3ac',
  SECONDARY_HOVER: '#bba39c',
  BACKGROUND: '#fffefc'
} as const;

export const PROMO_CODES = [
  { code: 'VALENTINE20', discount: 20, minOrder: 500000 },
  { code: 'NEWUSER15', discount: 15, minOrder: 200000 },
  { code: 'FREESHIP', discount: 0, freeShipping: true, minOrder: 300000 }
];

export const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Giao hàng tiêu chuẩn', time: '2-3 ngày', price: 30000 },
  { id: 'express', name: 'Giao hàng nhanh', time: 'Trong ngày', price: 50000 },
  { id: 'premium', name: 'Giao hàng cao cấp', time: '2-4 giờ', price: 100000 }
];

export const CATEGORIES = [
  { name: 'Hoa tươi', icon: '🌹', color: 'bg-pink-100' },
  { name: 'Đồ trang sức', icon: '💎', color: 'bg-purple-100' },
  { name: 'Công nghệ', icon: '📱', color: 'bg-blue-100' },
  { name: 'Thời trang', icon: '👗', color: 'bg-green-100' },
  { name: 'Đồ ăn', icon: '🍰', color: 'bg-yellow-100' },
  { name: 'Sách', icon: '📚', color: 'bg-indigo-100' },
  { name: 'Làm đẹp', icon: '💄', color: 'bg-red-100' },
  { name: 'Khác', icon: '🎁', color: 'bg-gray-100' }
];