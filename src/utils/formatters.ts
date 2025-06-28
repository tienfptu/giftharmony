export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('vi-VN');
};

export const generateOrderId = (): string => {
  return `GH${Date.now().toString().slice(-6)}`;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Đã giao':
      return 'bg-green-100 text-green-800';
    case 'Đang giao':
      return 'bg-blue-100 text-blue-800';
    case 'Đang xử lý':
      return 'bg-yellow-100 text-yellow-800';
    case 'Đã hủy':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validateEmail = (email: string): boolean => {
  return /\S+@\S+\.\S+/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return /^[0-9]{10,11}$/.test(phone.replace(/\s/g, ''));
};