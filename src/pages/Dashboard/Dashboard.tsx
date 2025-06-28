import React, { useState, useEffect } from "react";
import {
  Gift,
  Star,
  TrendingUp,
  Calendar,
  MapPin,
  User,
  Package,
  Heart,
  Settings,
  Search,
  Grid,
  Bell,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Header } from "../../components/layout";
import { ProductCard } from "../../components/common";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { useToast } from "../../components/ui/toast";
import { apiService } from "../../services/api";
import { CATEGORIES } from "../../constants";
import { Product } from "../../types";

interface DashboardProps {
  onViewProduct?: (productId: number) => void;
  onViewCart?: () => void;
  onViewWishlist?: () => void;
  onViewNotifications?: () => void;
  onLogout?: () => void;
  onViewProfile?: () => void;
  onViewSearch?: (query?: string) => void;
  onViewCategories?: (category?: string) => void;
  onViewEvents?: () => void;
  onViewSettings?: () => void;
  onViewOrderHistory?: () => void;
}

export const Dashboard = ({
  onViewProduct,
  onViewCart,
  onViewWishlist,
  onViewNotifications,
  onLogout,
  onViewProfile,
  onViewSearch,
  onViewCategories,
  onViewEvents,
  onViewSettings,
  onViewOrderHistory,
}: DashboardProps): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { getTotalItems, addToCart } = useCart();
  const { user, logout, requireAuth } = useAuth();
  const { toggleWishlist, isInWishlist, getWishlistCount } = useWishlist();
  const { addToast } = useToast();

  useEffect(() => {
    loadFeaturedProducts();
    loadUpcomingEvents();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const response = await apiService.getProducts({ limit: 4 });
      const transformedProducts = response.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: new Intl.NumberFormat("vi-VN").format(product.price) + "đ",
        priceNumber: product.price,
        image:
          product.image_url ||
          "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1",
        rating: 4.5, // Default rating since not in API
        category: product.category_name || "Sản phẩm",
        maxQuantity: product.stock_quantity || 10,
        inStock: product.stock_quantity > 0,
      }));
      setFeaturedProducts(transformedProducts);
    } catch (error) {
      console.error("Failed to load featured products:", error);
      // Fallback to empty array
      setFeaturedProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUpcomingEvents = () => {
    // Load from localStorage or use default events
    const savedEvents = localStorage.getItem("user-events");
    if (savedEvents) {
      const events = JSON.parse(savedEvents);
      const upcoming = events
        .filter((event: any) => event.daysLeft > 0)
        .slice(0, 3);
      setUpcomingEvents(upcoming);
    } else {
      // Default events
      setUpcomingEvents([
        {
          id: 1,
          title: "Sinh nhật mẹ",
          date: "15/02/2025",
          type: "Sinh nhật",
          daysLeft: 12,
        },
        {
          id: 2,
          title: "Valentine",
          date: "14/02/2025",
          type: "Lễ tình nhân",
          daysLeft: 11,
        },
      ]);
    }
  };

  const handleProductClick = (productId: number) => {
    if (onViewProduct) {
      onViewProduct(productId);
    }
  };

  const handleCartClick = () => {
    if (onViewCart) {
      onViewCart();
    }
  };

  const handleWishlistClick = () => {
    if (onViewWishlist) {
      onViewWishlist();
    }
  };

  const handleNotificationsClick = () => {
    if (onViewNotifications) {
      onViewNotifications();
    }
  };

  const handleSearchSubmit = () => {
    if (onViewSearch) {
      onViewSearch(searchQuery);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    if (onViewCategories) {
      onViewCategories(categoryName);
    }
  };

  const handleQuickAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();

    requireAuth(() => {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.priceNumber,
        image: product.image,
        category: product.category,
        inStock: product.inStock || true,
        maxQuantity: product.maxQuantity,
      });

      addToast({
        type: "success",
        title: "Đã thêm vào giỏ hàng",
        description: `${product.name} đã được thêm vào giỏ hàng`,
        duration: 3000,
      });
    });
  };

  const handleToggleFavorite = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    requireAuth(() => {
      const wasInWishlist = isInWishlist(productId);
      toggleWishlist(productId);
      const product = featuredProducts.find((p) => p.id === productId);

      if (wasInWishlist) {
        addToast({
          type: "info",
          title: "Đã xóa khỏi yêu thích",
          description: `${product?.name} đã được xóa khỏi danh sách yêu thích`,
          duration: 3000,
        });
      } else {
        addToast({
          type: "success",
          title: "Đã thêm vào yêu thích",
          description: `${product?.name} đã được thêm vào danh sách yêu thích`,
          duration: 3000,
        });
      }
    });
  };

  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    }
  };

  const handleProfileClick = () => {
    if (onViewProfile) {
      onViewProfile();
    }
  };

  const stats = [
    {
      label: "Điểm tích lũy",
      value: user?.points?.toLocaleString() || "0",
      icon: <Star className="h-8 w-8 opacity-80" />,
      color: "from-[#49bbbd] to-[#3a9a9c]",
    },
    {
      label: "Hạng thành viên",
      value: user?.level || "New Member",
      icon: <Gift className="h-8 w-8 opacity-80" />,
      color: "from-[#ccb3ac] to-[#bba39c]",
    },
    {
      label: "Quà đã tặng",
      value: "24",
      icon: <Heart className="h-8 w-8" />,
      color: "bg-white",
      textColor: "text-red-500",
    },
    {
      label: "Sự kiện sắp tới",
      value: upcomingEvents.length.toString(),
      icon: <Calendar className="h-8 w-8" />,
      color: "bg-white",
      textColor: "text-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fffefc]">
      <Header
        user={user}
        cartItemCount={getTotalItems()}
        wishlistCount={getWishlistCount()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCartClick={handleCartClick}
        onWishlistClick={handleWishlistClick}
        onNotificationsClick={handleNotificationsClick}
        onProfileClick={handleProfileClick}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 font-['Poppins',Helvetica]">
            Chào mừng trở lại, {user?.name?.split(" ").pop()}! 👋
          </h2>
          <p className="text-gray-600">
            Hôm nay bạn muốn tìm món quà gì đặc biệt?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className={`${
                stat.color ? `bg-gradient-to-r ${stat.color}` : stat.color
              } ${stat.color?.includes("from-") ? "text-white" : ""}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm ${
                        stat.color?.includes("from-")
                          ? "opacity-90"
                          : "text-gray-600"
                      }`}
                    >
                      {stat.label}
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        stat.color?.includes("from-") ? "" : "text-gray-900"
                      }`}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <div className={stat.textColor || ""}>{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins',Helvetica]">
                  Danh mục quà tặng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {CATEGORIES.map((category, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={() => handleCategoryClick(category.name)}
                      className={`h-20 flex flex-col items-center justify-center space-y-2 ${category.color} hover:scale-105 transition-transform`}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="text-xs font-medium">
                        {category.name}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Featured Gifts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-['Poppins',Helvetica]">
                  Quà tặng nổi bật
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewCategories?.()}
                >
                  Xem tất cả
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : featuredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {featuredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onProductClick={handleProductClick}
                        onAddToCart={handleQuickAddToCart}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={isInWishlist(product.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Không có sản phẩm nào để hiển thị
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins',Helvetica] flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Sự kiện sắp tới
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  <>
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-500">{event.date}</p>
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {event.type}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#49bbbd]">
                            {event.daysLeft} ngày
                          </p>
                          <p className="text-xs text-gray-500">còn lại</p>
                        </div>
                      </div>
                    ))}
                    <Button
                      className="w-full bg-[#ccb3ac] hover:bg-[#bba39c] text-black"
                      onClick={onViewEvents}
                    >
                      Quản lý sự kiện
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">Chưa có sự kiện nào</p>
                    <Button
                      className="bg-[#ccb3ac] hover:bg-[#bba39c] text-black"
                      onClick={onViewEvents}
                    >
                      Thêm sự kiện
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins',Helvetica]">
                  Thao tác nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onViewSearch?.()}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Tìm kiếm quà tặng
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onViewCategories?.()}
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Xem danh mục
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onViewOrderHistory}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Lịch sử đơn hàng
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleProfileClick}
                >
                  <User className="h-4 w-4 mr-2" />
                  Cập nhật hồ sơ
                </Button>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins',Helvetica]">
                  Gợi ý cho bạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                    <h4 className="font-medium text-gray-900 mb-1">
                      Valentine sắp đến!
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Khám phá bộ sưu tập quà tặng lãng mạn
                    </p>
                    <Button
                      size="sm"
                      className="bg-pink-500 hover:bg-pink-600 text-white"
                      onClick={() => onViewCategories?.("Hoa tươi")}
                    >
                      Xem ngay
                    </Button>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-1">
                      Ưu đãi đặc biệt
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Giảm 20% cho đơn hàng đầu tiên
                    </p>
                    <Button
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => onViewCategories?.()}
                    >
                      Sử dụng ngay
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
