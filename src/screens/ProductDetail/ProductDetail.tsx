import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Star, ShoppingCart, Share2, Truck, Shield, RotateCcw, MessageCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { LoadingSpinner } from '../../components/common';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import { apiService } from '../../services/api';

interface ProductDetailProps {
  productId: number;
  onBack: () => void;
  onViewCart: () => void;
}

interface Review {
  id: number;
  userName: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

interface RelatedProduct {
  id: number;
  name: string;
  price: string;
  image: string;
  rating: number;
}

export const ProductDetail = ({ productId, onBack, onViewCart }: ProductDetailProps): JSX.Element => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { addToCart, getTotalItems } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { requireAuth } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadProduct();
    loadRelatedProducts();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const response = await apiService.getProduct(productId);
      const productData = {
        id: response.id,
        name: response.name,
        price: new Intl.NumberFormat('vi-VN').format(response.price) + 'đ',
        priceNumber: response.price,
        rating: 4.8, // Default rating
        reviewCount: 156, // Default review count
        category: response.category_name || 'Sản phẩm',
        brand: 'Premium Brand',
        inStock: response.stock_quantity > 0,
        stockCount: response.stock_quantity,
        images: [
          response.image_url || 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
          'https://images.pexels.com/photos/1022923/pexels-photo-1022923.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
          'https://images.pexels.com/photos/1131458/pexels-photo-1131458.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1',
          'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1'
        ],
        description: response.description || 'Sản phẩm chất lượng cao với thiết kế tinh tế và tính năng vượt trội.',
        features: [
          'Chất lượng cao cấp',
          'Thiết kế tinh tế',
          'Bảo hành chính hãng',
          'Giao hàng nhanh chóng',
          'Hỗ trợ 24/7'
        ],
        specifications: {
          'Thương hiệu': 'Premium Brand',
          'Xuất xứ': 'Việt Nam',
          'Bảo hành': '12 tháng',
          'Trọng lượng': '500g'
        }
      };
      setProduct(productData);
    } catch (error) {
      console.error('Failed to load product:', error);
      addToast({
        type: 'error',
        title: 'Lỗi tải sản phẩm',
        description: 'Không thể tải thông tin sản phẩm',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelatedProducts = async () => {
    try {
      const response = await apiService.getProducts({ limit: 3 });
      const transformedProducts = response.products
        .filter((p: any) => p.id !== productId)
        .slice(0, 3)
        .map((product: any) => ({
          id: product.id,
          name: product.name,
          price: new Intl.NumberFormat('vi-VN').format(product.price) + 'đ',
          image: product.image_url || 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1',
          rating: 4.5
        }));
      setRelatedProducts(transformedProducts);
    } catch (error) {
      console.error('Failed to load related products:', error);
    }
  };

  const reviews: Review[] = [
    {
      id: 1,
      userName: 'Nguyễn Thị Mai',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      rating: 5,
      comment: 'Sản phẩm rất tốt, chất lượng như mong đợi!',
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
    }
  ];

  const handleQuantityChange = (change: number) => {
    if (!product) return;
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stockCount) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    requireAuth(() => {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.priceNumber,
        image: product.images[0],
        category: product.category,
        inStock: product.inStock,
        maxQuantity: product.stockCount
      }, quantity);

      addToast({
        type: 'success',
        title: 'Đã thêm vào giỏ hàng',
        description: `${quantity} ${product.name} đã được thêm vào giỏ hàng`,
        duration: 3000
      });
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    onViewCart();
  };

  const handleToggleFavorite = () => {
    if (!product) return;
    
    requireAuth(() => {
      toggleWishlist(product.id);
      const wasInWishlist = isInWishlist(product.id);
      
      addToast({
        type: wasInWishlist ? 'info' : 'success',
        title: wasInWishlist ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích',
        description: `${product.name} đã được ${wasInWishlist ? 'xóa khỏi' : 'thêm vào'} danh sách yêu thích`,
        duration: 3000
      });
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : i < rating
            ? 'fill-yellow-200 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffefc] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fffefc] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy sản phẩm</h2>
          <Button onClick={onBack}>Quay lại</Button>
        </div>
      </div>
    );
  }

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
              Chi tiết sản phẩm
            </h1>
            <div className="ml-auto flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
              >
                <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onViewCart}
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-[#49bbbd] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-[#49bbbd]' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500">{product.category}</span>
                <span className="text-sm text-gray-300">•</span>
                <span className="text-sm text-gray-500">{product.brand}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4 font-['Poppins',Helvetica]">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {renderStars(product.rating)}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviewCount} đánh giá)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-[#49bbbd]">{product.price}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                {product.inStock ? `Còn ${product.stockCount} sản phẩm` : 'Hết hàng'}
              </span>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Số lượng:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="h-10 w-10"
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stockCount}
                    className="h-10 w-10"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 bg-[#49bbbd] hover:bg-[#3a9a9c] text-white h-12"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Thêm vào giỏ hàng
                </Button>
                <Button 
                  onClick={handleBuyNow}
                  disabled={!product.inStock}
                  className="flex-1 bg-[#ccb3ac] hover:bg-[#bba39c] text-black h-12"
                >
                  Mua ngay
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-200">
              <div className="flex flex-col items-center text-center">
                <Truck className="h-8 w-8 text-[#49bbbd] mb-2" />
                <span className="text-sm font-medium">Giao hàng nhanh</span>
                <span className="text-xs text-gray-500">Trong ngày</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Shield className="h-8 w-8 text-[#49bbbd] mb-2" />
                <span className="text-sm font-medium">Bảo hành chất lượng</span>
                <span className="text-xs text-gray-500">12 tháng</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <RotateCcw className="h-8 w-8 text-[#49bbbd] mb-2" />
                <span className="text-sm font-medium">Đổi trả dễ dàng</span>
                <span className="text-xs text-gray-500">7 ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card className="mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'description', label: 'Mô tả' },
                { id: 'specifications', label: 'Thông số' },
                { id: 'reviews', label: 'Đánh giá' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-[#49bbbd] text-[#49bbbd]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <CardContent className="p-6">
            {selectedTab === 'description' && (
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Đặc điểm nổi bật:</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-[#49bbbd] mr-2">•</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {selectedTab === 'specifications' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Thông số kỹ thuật:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">{key}:</span>
                      <span className="text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Đánh giá từ khách hàng ({product.reviewCount})
                  </h3>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Viết đánh giá
                  </Button>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.avatar}
                          alt={review.userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{review.userName}</span>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <div className="flex items-center mb-2">
                            {renderStars(review.rating)}
                          </div>
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                          <button className="text-sm text-gray-500 hover:text-gray-700">
                            Hữu ích ({review.helpful})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 font-['Poppins',Helvetica]">
                Sản phẩm liên quan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="group cursor-pointer">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                      <img
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="font-medium text-gray-900 group-hover:text-[#49bbbd] transition-colors mb-1">
                      {relatedProduct.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#49bbbd]">{relatedProduct.price}</span>
                      <div className="flex items-center">
                        {renderStars(relatedProduct.rating)}
                        <span className="text-sm text-gray-600 ml-1">{relatedProduct.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};