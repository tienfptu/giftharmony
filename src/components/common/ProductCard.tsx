import React from 'react';
import { Heart, ShoppingCart, Star, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Product } from '../../types';
import { StarRating } from './StarRating';

interface ProductCardProps {
  product: Product;
  onProductClick: (productId: number) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onToggleFavorite?: (productId: number, e: React.MouseEvent) => void;
  isFavorite?: boolean;
}

export const ProductCard = ({ 
  product, 
  onProductClick, 
  onAddToCart, 
  onToggleFavorite,
  isFavorite = false 
}: ProductCardProps) => {
  return (
    <div 
      className="group cursor-pointer"
      onClick={() => onProductClick(product.id)}
    >
      <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2">
          {product.isPopular && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Phổ biến
            </span>
          )}
          {product.isTrending && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Xu hướng
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex space-x-1">
          {onToggleFavorite && (
            <Button
              size="icon"
              variant="ghost"
              className="bg-white/80 hover:bg-white h-8 w-8"
              onClick={(e) => onToggleFavorite(product.id, e)}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="bg-white/80 hover:bg-white h-8 w-8"
            onClick={(e) => onAddToCart(product, e)}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-medium text-gray-900 group-hover:text-[#49bbbd] transition-colors truncate">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500">{product.category}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#49bbbd]">{product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {product.originalPrice}
              </span>
            )}
          </div>
          <StarRating rating={product.rating} size="sm" showValue />
        </div>
      </div>
    </div>
  );
};