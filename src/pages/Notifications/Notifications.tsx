import React, { useState } from 'react';
import { ArrowLeft, Bell, Check, Trash2, Settings, Package, Heart, Gift, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/common';
import { useToast } from '../../components/ui/toast';

interface NotificationsProps {
  onBack: () => void;
}

interface Notification {
  id: number;
  type: 'order' | 'promotion' | 'reminder' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  icon: React.ReactNode;
  actionLabel?: string;
  actionUrl?: string;
}

export const Notifications = ({ onBack }: NotificationsProps): JSX.Element => {
  const { addToast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'order',
      title: 'Đơn hàng đã được giao',
      message: 'Đơn hàng #GH123456 - Hoa hồng đỏ cao cấp đã được giao thành công',
      time: '2 giờ trước',
      isRead: false,
      icon: <Package className="h-5 w-5 text-green-600" />,
      actionLabel: 'Xem đơn hàng',
      actionUrl: '/orders/GH123456'
    },
    {
      id: 2,
      type: 'promotion',
      title: 'Ưu đãi Valentine đặc biệt',
      message: 'Giảm 25% cho tất cả sản phẩm hoa tươi. Áp dụng đến 14/02',
      time: '1 ngày trước',
      isRead: false,
      icon: <Gift className="h-5 w-5 text-red-600" />,
      actionLabel: 'Mua ngay',
      actionUrl: '/products?category=flowers'
    },
    {
      id: 3,
      type: 'reminder',
      title: 'Nhắc nhở sự kiện',
      message: 'Sinh nhật mẹ sắp đến (15/02). Đừng quên chuẩn bị quà nhé!',
      time: '2 ngày trước',
      isRead: true,
      icon: <Calendar className="h-5 w-5 text-blue-600" />,
      actionLabel: 'Chọn quà',
      actionUrl: '/products?occasion=birthday'
    },
    {
      id: 4,
      type: 'system',
      title: 'Cập nhật ứng dụng',
      message: 'Phiên bản mới với nhiều tính năng thú vị đã có sẵn',
      time: '3 ngày trước',
      isRead: true,
      icon: <Settings className="h-5 w-5 text-gray-600" />
    },
    {
      id: 5,
      type: 'order',
      title: 'Đơn hàng đang được chuẩn bị',
      message: 'Đơn hàng #GH123455 - Đồng hồ thông minh đang được đóng gói',
      time: '1 tuần trước',
      isRead: true,
      icon: <Package className="h-5 w-5 text-blue-600" />,
      actionLabel: 'Theo dõi',
      actionUrl: '/orders/GH123455'
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread' | 'order' | 'promotion'>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    
    addToast({
      type: 'success',
      title: 'Đã đánh dấu tất cả là đã đọc',
      duration: 3000
    });
  };

  const handleDeleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    addToast({
      type: 'info',
      title: 'Đã xóa thông báo',
      duration: 3000
    });
  };

  const handleDeleteAll = () => {
    setNotifications([]);
    
    addToast({
      type: 'info',
      title: 'Đã xóa tất cả thông báo',
      duration: 3000
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-800';
      case 'promotion':
        return 'bg-red-100 text-red-800';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'order':
        return 'Đơn hàng';
      case 'promotion':
        return 'Khuyến mãi';
      case 'reminder':
        return 'Nhắc nhở';
      case 'system':
        return 'Hệ thống';
      default:
        return 'Khác';
    }
  };

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
            <div className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900 font-['Poppins',Helvetica]">
                Thông báo
              </h1>
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAll}
                  className="flex items-center text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa tất cả
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-24 w-24" />}
            title="Không có thông báo"
            description="Bạn sẽ nhận được thông báo về đơn hàng, khuyến mãi và nhắc nhở sự kiện tại đây"
            actionLabel="Quay lại trang chủ"
            onAction={onBack}
          />
        ) : (
          <>
            {/* Filter Tabs */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'Tất cả', count: notifications.length },
                    { key: 'unread', label: 'Chưa đọc', count: unreadCount },
                    { key: 'order', label: 'Đơn hàng', count: notifications.filter(n => n.type === 'order').length },
                    { key: 'promotion', label: 'Khuyến mãi', count: notifications.filter(n => n.type === 'promotion').length }
                  ].map((tab) => (
                    <Button
                      key={tab.key}
                      variant={filter === tab.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(tab.key as any)}
                      className="flex items-center"
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-1 bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                          {tab.count}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all duration-200 ${
                    !notification.isRead 
                      ? 'border-l-4 border-l-[#49bbbd] bg-blue-50/30' 
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {notification.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(notification.type)}`}>
                              {getTypeName(notification.type)}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-[#49bbbd] rounded-full"></span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            {notification.time}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {notification.actionLabel && (
                              <Button size="sm" variant="outline">
                                {notification.actionLabel}
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-[#49bbbd] hover:text-[#3a9a9c]"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Đánh dấu đã đọc
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredNotifications.length === 0 && (
              <EmptyState
                icon={<Bell className="h-24 w-24" />}
                title="Không có thông báo nào"
                description={`Không có thông báo nào trong danh mục "${filter === 'all' ? 'tất cả' : filter === 'unread' ? 'chưa đọc' : getTypeName(filter)}"`}
                actionLabel="Xem tất cả thông báo"
                onAction={() => setFilter('all')}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};