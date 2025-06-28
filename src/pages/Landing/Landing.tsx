import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Star,
  Heart,
  Gift,
  Users,
  Truck,
  Shield,
  Award,
  ChevronRight,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  StarRating,
  ProductCard,
  LoadingSpinner,
} from "../../components/common";
import { Footer } from "../../components/layout";
import { apiService } from "../../services/api";

interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
}

interface Product {
  id: number;
  name: string;
  price: string;
  priceNumber: number;
  originalPrice?: string;
  image: string;
  rating: number;
  category: string;
  maxQuantity: number;
  inStock: boolean;
}

interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  location: string;
}

interface Stat {
  number: string;
  label: string;
}

export const Landing = ({ onLogin, onRegister }: LandingProps): JSX.Element => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const response = await apiService.getProducts({ limit: 3 });
      const transformedProducts = response.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: new Intl.NumberFormat("vi-VN").format(product.price) + "đ",
        priceNumber: product.price,
        originalPrice: product.original_price
          ? new Intl.NumberFormat("vi-VN").format(product.original_price) + "đ"
          : undefined,
        image:
          product.image_url ||
          "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1",
        rating: 4.5, // Default rating
        category: product.category_name || "Sản phẩm",
        maxQuantity: product.stock_quantity || 10,
        inStock: product.stock_quantity > 0,
      }));
      setFeaturedProducts(transformedProducts);
    } catch (error) {
      console.error("Failed to load featured products:", error);
      // Fallback to empty array if API fails
      setFeaturedProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Gift className="h-8 w-8 text-[#49bbbd]" />,
      title: "Quà tặng đa dạng",
      description: "Hàng nghìn sản phẩm từ hoa tươi đến công nghệ cao cấp",
    },
    {
      icon: <Truck className="h-8 w-8 text-[#49bbbd]" />,
      title: "Giao hàng nhanh",
      description: "Giao hàng trong ngày tại TP.HCM và Hà Nội",
    },
    {
      icon: <Shield className="h-8 w-8 text-[#49bbbd]" />,
      title: "Bảo hành chất lượng",
      description: "Cam kết 100% chất lượng hoặc hoàn tiền",
    },
    {
      icon: <Award className="h-8 w-8 text-[#49bbbd]" />,
      title: "Dịch vụ cao cấp",
      description: "Tư vấn miễn phí và gói quà sang trọng",
    },
  ];

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Nguyễn Thị Mai",
      avatar:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1",
      rating: 5,
      comment: "Dịch vụ tuyệt vời! Hoa tươi và đẹp, giao hàng đúng hẹn.",
      location: "TP. Hồ Chí Minh",
    },
    {
      id: 2,
      name: "Trần Văn Nam",
      avatar:
        "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1",
      rating: 5,
      comment: "Tìm được quà ý nghĩa cho người yêu. Rất hài lòng!",
      location: "Hà Nội",
    },
    {
      id: 3,
      name: "Lê Thị Hoa",
      avatar:
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1",
      rating: 5,
      comment: "Chất lượng sản phẩm vượt mong đợi. Sẽ quay lại!",
      location: "Đà Nẵng",
    },
  ];

  const stats: Stat[] = [
    { number: "50K+", label: "Khách hàng hài lòng" },
    { number: "100K+", label: "Món quà đã trao" },
    { number: "4.9/5", label: "Đánh giá trung bình" },
    { number: "24/7", label: "Hỗ trợ khách hàng" },
  ];

  return (
    <div className="min-h-screen bg-[#fffefc]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#49bbbd] font-['Poppins',Helvetica]">
                GiftHarmony
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onLogin}>
                Đăng nhập
              </Button>
              <Button
                onClick={onRegister}
                className="bg-[#49bbbd] hover:bg-[#3a9a9c] text-white"
              >
                Đăng ký
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#49bbbd]/10 to-[#ccb3ac]/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 font-['Poppins',Helvetica] leading-tight">
                  Trao gửi yêu thương
                  <span className="text-[#49bbbd] block">qua từng món quà</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Khám phá hàng nghìn món quà ý nghĩa cho mọi dịp đặc biệt. Từ
                  hoa tươi đến công nghệ, chúng tôi giúp bạn thể hiện tình cảm
                  một cách hoàn hảo.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={onRegister}
                  className="bg-[#49bbbd] hover:bg-[#3a9a9c] text-white h-14 px-8 text-lg"
                >
                  Bắt đầu mua sắm
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onLogin}
                  className="h-14 px-8 text-lg border-[#49bbbd] text-[#49bbbd] hover:bg-[#49bbbd] hover:text-white"
                >
                  Đăng nhập ngay
                </Button>
              </div>

              <div className="flex items-center space-x-8">
                {stats.slice(0, 2).map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-[#49bbbd]">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                    <img
                      src="https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1"
                      alt="Hoa hồng"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                    <img
                      src="https://images.pexels.com/photos/918327/pexels-photo-918327.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1"
                      alt="Chocolate"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                    <img
                      src="https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1"
                      alt="Đồng hồ"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                    <img
                      src="https://images.pexels.com/photos/1190829/pexels-photo-1190829.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1"
                      alt="Nước hoa"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-['Poppins',Helvetica]">
              Tại sao chọn GiftHarmony?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chúng tôi cam kết mang đến trải nghiệm mua sắm quà tặng tuyệt vời
              nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center p-6 hover:shadow-lg transition-shadow"
              >
                <CardContent className="space-y-4">
                  <div className="flex justify-center">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-['Poppins',Helvetica]">
              Sản phẩm nổi bật
            </h2>
            <p className="text-xl text-gray-600">
              Những món quà được yêu thích nhất
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {product.name}
                        </h3>
                        <StarRating rating={product.rating} showValue />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-[#49bbbd]">
                            {product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="text-lg text-gray-400 line-through">
                              {product.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        className="w-full bg-[#49bbbd] hover:bg-[#3a9a9c] text-white"
                        onClick={onLogin}
                      >
                        Đăng nhập để mua
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                Không có sản phẩm nào để hiển thị
              </p>
              <Button
                onClick={onRegister}
                className="bg-[#49bbbd] hover:bg-[#3a9a9c] text-white"
              >
                Đăng ký để khám phá
              </Button>
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              onClick={onLogin}
              className="border-[#49bbbd] text-[#49bbbd] hover:bg-[#49bbbd] hover:text-white"
            >
              Xem tất cả sản phẩm
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-['Poppins',Helvetica]">
              Khách hàng nói gì về chúng tôi
            </h2>
            <p className="text-xl text-gray-600">
              Hàng nghìn khách hàng đã tin tưởng và hài lòng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-6">
                <CardContent className="space-y-4">
                  <StarRating rating={testimonial.rating} />
                  <p className="text-gray-700 italic">
                    "{testimonial.comment}"
                  </p>
                  <div className="flex items-center space-x-3">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.location}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-[#49bbbd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-4xl lg:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#49bbbd] to-[#3a9a9c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white font-['Poppins',Helvetica]">
              Sẵn sàng tìm món quà hoàn hảo?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Tham gia cộng đồng hàng nghìn người đã tìm thấy món quà ý nghĩa
              tại GiftHarmony
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={onRegister}
                className="bg-white text-[#49bbbd] hover:bg-gray-100 h-14 px-8 text-lg font-semibold"
              >
                Đăng ký miễn phí
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onLogin}
                className="h-14 px-8 text-lg border-white text-white hover:bg-white hover:text-[#49bbbd]"
              >
                Đăng nhập ngay
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
