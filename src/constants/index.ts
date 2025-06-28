export const CATEGORIES = [
  { name: 'Hoa tươi', icon: '🌹', color: 'bg-pink-100 hover:bg-pink-200' },
  { name: 'Đồ trang sức', icon: '💎', color: 'bg-purple-100 hover:bg-purple-200' },
  { name: 'Công nghệ', icon: '📱', color: 'bg-blue-100 hover:bg-blue-200' },
  { name: 'Thời trang', icon: '👗', color: 'bg-green-100 hover:bg-green-200' },
  { name: 'Đồ ăn', icon: '🍰', color: 'bg-yellow-100 hover:bg-yellow-200' },
  { name: 'Làm đẹp', icon: '💄', color: 'bg-red-100 hover:bg-red-200' },
  { name: 'Sách', icon: '📚', color: 'bg-indigo-100 hover:bg-indigo-200' },
  { name: 'Khác', icon: '🎁', color: 'bg-gray-100 hover:bg-gray-200' }
];

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me'
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products/:id',
    CREATE: '/products',
    UPDATE: '/products/:id',
    DELETE: '/products/:id'
  },
  CART: {
    LIST: '/cart',
    ADD: '/cart',
    UPDATE: '/cart/:id',
    REMOVE: '/cart/:id',
    CLEAR: '/cart'
  },
  WISHLIST: {
    LIST: '/wishlist',
    ADD: '/wishlist',
    REMOVE: '/wishlist/:id',
    REMOVE_BY_PRODUCT: '/wishlist/product/:productId'
  },
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    ADMIN_LIST: '/orders/admin',
    UPDATE_STATUS: '/orders/:id/status'
  },
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: '/categories/:id',
    CREATE: '/categories',
    UPDATE: '/categories/:id',
    DELETE: '/categories/:id'
  }
};