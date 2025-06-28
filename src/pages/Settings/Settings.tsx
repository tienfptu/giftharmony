import React, { useState } from 'react';
import { ArrowLeft, User, Bell, Shield, CreditCard, Globe, Moon, Sun, Smartphone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface SettingsProps {
  onBack: () => void;
}

interface NotificationSettings {
  orderUpdates: boolean;
  promotions: boolean;
  eventReminders: boolean;
  newsletter: boolean;
  sms: boolean;
  email: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showPurchaseHistory: boolean;
  allowDataCollection: boolean;
  allowMarketing: boolean;
}

interface AppSettings {
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
}

export const Settings = ({ onBack }: SettingsProps): JSX.Element => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [notifications, setNotifications] = useLocalStorage<NotificationSettings>('notification-settings', {
    orderUpdates: true,
    promotions: true,
    eventReminders: true,
    newsletter: false,
    sms: true,
    email: true
  });

  const [privacy, setPrivacy] = useLocalStorage<PrivacySettings>('privacy-settings', {
    profileVisibility: 'friends',
    showPurchaseHistory: false,
    allowDataCollection: true,
    allowMarketing: false
  });

  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('app-settings', {
    language: 'vi',
    currency: 'VND',
    theme: 'light',
    autoSave: true
  });

  const [activeTab, setActiveTab] = useState('account');

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    addToast({
      type: 'success',
      title: 'Đã cập nhật cài đặt thông báo',
      duration: 2000
    });
  };

  const handlePrivacyChange = (key: keyof PrivacySettings, value: any) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
    addToast({
      type: 'success',
      title: 'Đã cập nhật cài đặt bảo mật',
      duration: 2000
    });
  };

  const handleAppSettingChange = (key: keyof AppSettings, value: any) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
    addToast({
      type: 'success',
      title: 'Đã cập nhật cài đặt ứng dụng',
      duration: 2000
    });
  };

  const tabs = [
    { id: 'account', label: 'Tài khoản', icon: <User className="h-4 w-4" /> },
    { id: 'notifications', label: 'Thông báo', icon: <Bell className="h-4 w-4" /> },
    { id: 'privacy', label: 'Bảo mật', icon: <Shield className="h-4 w-4" /> },
    { id: 'payment', label: 'Thanh toán', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'app', label: 'Ứng dụng', icon: <Smartphone className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-[#fffefc]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 font-['Poppins',Helvetica]">
              Cài đặt
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#49bbbd] text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {tab.icon}
                      <span className="ml-3">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Account Settings */}
            {activeTab === 'account' && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Poppins',Helvetica]">Thông tin tài khoản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={user?.avatar}
                      alt={user?.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                      <p className="text-gray-600">{user?.email}</p>
                      <Button size="sm" variant="outline" className="mt-2">
                        Thay đổi ảnh đại diện
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên
                      </label>
                      <Input defaultValue={user?.name} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input defaultValue={user?.email} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại
                      </label>
                      <Input placeholder="Nhập số điện thoại" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày sinh
                      </label>
                      <Input type="date" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Thay đổi mật khẩu</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input type="password" placeholder="Mật khẩu hiện tại" />
                      <Input type="password" placeholder="Mật khẩu mới" />
                      <Input type="password" placeholder="Xác nhận mật khẩu mới" />
                    </div>
                  </div>

                  <Button className="bg-[#49bbbd] hover:bg-[#3a9a9c] text-white">
                    Lưu thay đổi
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Poppins',Helvetica]">Cài đặt thông báo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Loại thông báo</h4>
                    <div className="space-y-4">
                      {[
                        { key: 'orderUpdates', label: 'Cập nhật đơn hàng', desc: 'Thông báo về trạng thái đơn hàng' },
                        { key: 'promotions', label: 'Khuyến mãi', desc: 'Ưu đãi và chương trình khuyến mãi' },
                        { key: 'eventReminders', label: 'Nhắc nhở sự kiện', desc: 'Nhắc nhở về các sự kiện quan trọng' },
                        { key: 'newsletter', label: 'Bản tin', desc: 'Tin tức và cập nhật từ GiftHarmony' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications[item.key as keyof NotificationSettings] as boolean}
                              onChange={(e) => handleNotificationChange(item.key as keyof NotificationSettings, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#49bbbd]"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Phương thức nhận thông báo</h4>
                    <div className="space-y-4">
                      {[
                        { key: 'email', label: 'Email', desc: 'Nhận thông báo qua email' },
                        { key: 'sms', label: 'SMS', desc: 'Nhận thông báo qua tin nhắn' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications[item.key as keyof NotificationSettings] as boolean}
                              onChange={(e) => handleNotificationChange(item.key as keyof NotificationSettings, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#49bbbd]"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Poppins',Helvetica]">Cài đặt bảo mật</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Quyền riêng tư</h4>
                    <div className="space-y-4">
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <label className="block font-medium text-gray-900 mb-2">
                          Hiển thị hồ sơ
                        </label>
                        <select
                          value={privacy.profileVisibility}
                          onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#49bbbd]"
                        >
                          <option value="public">Công khai</option>
                          <option value="friends">Chỉ bạn bè</option>
                          <option value="private">Riêng tư</option>
                        </select>
                      </div>

                      {[
                        { key: 'showPurchaseHistory', label: 'Hiển thị lịch sử mua hàng', desc: 'Cho phép người khác xem lịch sử mua hàng của bạn' },
                        { key: 'allowDataCollection', label: 'Thu thập dữ liệu', desc: 'Cho phép thu thập dữ liệu để cải thiện dịch vụ' },
                        { key: 'allowMarketing', label: 'Marketing cá nhân hóa', desc: 'Sử dụng dữ liệu để cá nhân hóa quảng cáo' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={privacy[item.key as keyof PrivacySettings] as boolean}
                              onChange={(e) => handlePrivacyChange(item.key as keyof PrivacySettings, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#49bbbd]"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Bảo mật tài khoản</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        Bật xác thực 2 bước
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Quản lý thiết bị đăng nhập
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Tải xuống dữ liệu cá nhân
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                        Xóa tài khoản
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Poppins',Helvetica]">Phương thức thanh toán</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Thẻ đã lưu</h4>
                    <div className="space-y-3">
                      <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                            VISA
                          </div>
                          <div>
                            <p className="font-medium">**** **** **** 1234</p>
                            <p className="text-sm text-gray-600">Hết hạn 12/26</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Xóa
                        </Button>
                      </div>
                      <Button variant="outline" className="w-full">
                        + Thêm thẻ mới
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Ví điện tử</h4>
                    <div className="space-y-3">
                      {[
                        { name: 'MoMo', connected: true },
                        { name: 'ZaloPay', connected: false },
                        { name: 'VNPay', connected: false }
                      ].map((wallet) => (
                        <div key={wallet.name} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <span className="font-medium">{wallet.name}</span>
                          </div>
                          <Button 
                            variant={wallet.connected ? "outline" : "default"}
                            size="sm"
                            className={wallet.connected ? "text-red-600 hover:text-red-700" : "bg-[#49bbbd] hover:bg-[#3a9a9c] text-white"}
                          >
                            {wallet.connected ? 'Ngắt kết nối' : 'Kết nối'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* App Settings */}
            {activeTab === 'app' && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Poppins',Helvetica]">Cài đặt ứng dụng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngôn ngữ
                      </label>
                      <select
                        value={appSettings.language}
                        onChange={(e) => handleAppSettingChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#49bbbd]"
                      >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Đơn vị tiền tệ
                      </label>
                      <select
                        value={appSettings.currency}
                        onChange={(e) => handleAppSettingChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#49bbbd]"
                      >
                        <option value="VND">VND (₫)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Giao diện
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Sáng', icon: <Sun className="h-4 w-4" /> },
                        { value: 'dark', label: 'Tối', icon: <Moon className="h-4 w-4" /> },
                        { value: 'auto', label: 'Tự động', icon: <Globe className="h-4 w-4" /> }
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => handleAppSettingChange('theme', theme.value)}
                          className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                            appSettings.theme === theme.value
                              ? 'border-[#49bbbd] bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {theme.icon}
                          <span className="text-sm">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Tùy chọn khác</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Tự động lưu</p>
                          <p className="text-sm text-gray-600">Tự động lưu thông tin khi nhập</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={appSettings.autoSave}
                            onChange={(e) => handleAppSettingChange('autoSave', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#49bbbd]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Thông tin ứng dụng</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phiên bản:</span>
                        <span className="font-medium">1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cập nhật cuối:</span>
                        <span className="font-medium">03/02/2025</span>
                      </div>
                      <Button variant="outline" className="w-full">
                        Kiểm tra cập nhật
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};