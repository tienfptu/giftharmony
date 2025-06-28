import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Calendar, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface AnalyticsProps {
  onBack: () => void;
}

export const Analytics = ({ onBack }: AnalyticsProps): JSX.Element => {
  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  const periods = [
    { value: '7days', label: '7 ngày qua' },
    { value: '30days', label: '30 ngày qua' },
    { value: '3months', label: '3 tháng qua' },
    { value: '1year', label: '1 năm qua' }
  ];

  const stats = [
    {
      title: 'Tổng doanh thu',
      value: '125.5M',
      unit: 'VNĐ',
      change: '+12.5%',
      changeType: 'increase',
      icon: <DollarSign className="h-6 w-6" />,
      color: 'text-green-600'
    },
    {
      title: 'Đơn hàng',
      value: '1,234',
      change: '+8.2%',
      changeType: 'increase',
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'text-blue-600'
    },
    {
      title: 'Khách hàng mới',
      value: '89',
      change: '+15.3%',
      changeType: 'increase',
      icon: <Users className="h-6 w-6" />,
      color: 'text-purple-600'
    },
    {
      title: 'Sản phẩm bán ra',
      value: '2,456',
      change: '+5.7%',
      changeType: 'increase',
      icon: <Package className="h-6 w-6" />,
      color: 'text-orange-600'
    }
  ];

  const topProducts = [
    { name: 'Hoa hồng đỏ cao cấp', revenue: '46.8M', orders: 156, growth: '+23%' },
    { name: 'Đồng hồ thông minh', revenue: '266.9M', orders: 89, growth: '+18%' },
    { name: 'Chocolate handmade', revenue: '105.3M', orders: 234, growth: '+12%' },
    { name: 'Nước hoa nữ cao cấp', revenue: '96.0M', orders: 80, growth: '+8%' },
    { name: 'Túi xách da thật', revenue: '78.5M', orders: 67, growth: '+15%' }
  ];

  const topCategories = [
    { name: 'Hoa tươi', revenue: '45.2M', percentage: 36, growth: '+12%' },
    { name: 'Công nghệ', revenue: '38.7M', percentage: 31, growth: '+18%' },
    { name: 'Thời trang', revenue: '22.1M', percentage: 18, growth: '+8%' },
    { name: 'Làm đẹp', revenue: '12.8M', percentage: 10, growth: '+15%' },
    { name: 'Đồ ăn', revenue: '6.2M', percentage: 5, growth: '+5%' }
  ];

  const recentActivity = [
    { time: '10:30', event: 'Đơn hàng mới #GH123456', amount: '299.000đ', type: 'order' },
    { time: '10:15', event: 'Khách hàng mới đăng ký', amount: '', type: 'user' },
    { time: '09:45', event: 'Thanh toán thành công #GH123455', amount: '2.999.000đ', type: 'payment' },
    { time: '09:30', event: 'Sản phẩm được thêm vào wishlist', amount: '', type: 'wishlist' },
    { time: '09:15', event: 'Đánh giá 5 sao cho sản phẩm', amount: '', type: 'review' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      case 'user':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
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
              Báo cáo & Thống kê
            </h1>
            <div className="ml-auto flex items-center space-x-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#49bbbd]"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      {stat.unit && <span className="ml-1 text-sm text-gray-500">{stat.unit}</span>}
                    </div>
                    <div className="flex items-center mt-1">
                      {stat.changeType === 'increase' ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">so với kỳ trước</span>
                    </div>
                  </div>
                  <div className={`${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins',Helvetica]">Biểu đồ doanh thu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-r from-[#49bbbd]/10 to-[#ccb3ac]/10 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-[#49bbbd] mx-auto mb-4" />
                    <p className="text-gray-600">Biểu đồ doanh thu theo thời gian</p>
                    <p className="text-sm text-gray-500 mt-2">Dữ liệu cho {periods.find(p => p.value === selectedPeriod)?.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins',Helvetica]">Sản phẩm bán chạy nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#49bbbd] text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.orders} đơn hàng</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#49bbbd]">{product.revenue} VNĐ</p>
                        <p className="text-sm text-green-600">{product.growth}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins',Helvetica]">Danh mục bán chạy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        <span className="text-sm text-gray-600">{category.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#49bbbd] h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{category.revenue} VNĐ</span>
                        <span className="text-sm text-green-600">{category.growth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins',Helvetica]">Hoạt động gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.event}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">{activity.time}</span>
                          {activity.amount && (
                            <span className="text-sm font-medium text-[#49bbbd]">{activity.amount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins',Helvetica]">Thống kê nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tỷ lệ chuyển đổi</span>
                  <span className="font-medium text-green-600">3.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Giá trị đơn hàng TB</span>
                  <span className="font-medium">1.2M VNĐ</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Khách hàng quay lại</span>
                  <span className="font-medium text-blue-600">68%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Đánh giá trung bình</span>
                  <span className="font-medium text-yellow-600">4.8/5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};