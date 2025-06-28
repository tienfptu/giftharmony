import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-[#49bbbd] font-['Poppins',Helvetica]">
              GiftHarmony
            </h3>
            <p className="text-gray-400">
              Nền tảng quà tặng hàng đầu Việt Nam, mang đến những món quà ý nghĩa cho mọi dịp đặc biệt.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Sản phẩm</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Hoa tươi</li>
              <li>Đồ trang sức</li>
              <li>Công nghệ</li>
              <li>Thời trang</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Liên hệ</li>
              <li>FAQ</li>
              <li>Chính sách đổi trả</li>
              <li>Hướng dẫn mua hàng</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Công ty</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Về chúng tôi</li>
              <li>Tuyển dụng</li>
              <li>Tin tức</li>
              <li>Đối tác</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 GiftHarmony. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};