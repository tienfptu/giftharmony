import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartService, type CartItemWithProduct } from '../services/cart';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  category: string;
  inStock: boolean;
  maxQuantity: number;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const convertCartItem = (item: CartItemWithProduct): CartItem => ({
    id: item.product.id,
    name: item.product.name,
    price: item.product.price,
    originalPrice: item.product.original_price || undefined,
    image: item.product.images[0] || '',
    quantity: item.quantity,
    category: item.product.category?.name || '',
    inStock: item.product.stock_count > 0,
    maxQuantity: item.product.max_quantity
  });

  const refreshCart = async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const cartItems = await cartService.getCartItems(user.id);
      setItems(cartItems.map(convertCartItem));
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setItems([]);
    }
  }, [isAuthenticated, user]);

  const addToCart = async (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await cartService.addToCart(user.id, product.id, quantity);
      await refreshCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await cartService.removeFromCart(user.id, productId);
      await refreshCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await cartService.updateCartItem(user.id, productId, quantity);
      await refreshCart();
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!user) throw new Error('User not authenticated');

    try {
      await cartService.clearCart(user.id);
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const value: CartContextType = {
    items,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    refreshCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};