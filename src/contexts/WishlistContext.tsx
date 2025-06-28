import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { wishlistService } from '../services/wishlist';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistItems: string[];
  isLoading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  getWishlistCount: () => number;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider = ({ children }: WishlistProviderProps) => {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const refreshWishlist = async () => {
    if (!user) {
      setWishlistItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const items = await wishlistService.getWishlist(user.id);
      setWishlistItems(items.map(item => item.product_id));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [isAuthenticated, user]);

  const addToWishlist = async (productId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await wishlistService.addToWishlist(user.id, productId);
      setWishlistItems(prev => [...prev, productId]);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await wishlistService.removeFromWishlist(user.id, productId);
      setWishlistItems(prev => prev.filter(id => id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.includes(productId);
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  const value: WishlistContextType = {
    wishlistItems,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    getWishlistCount,
    refreshWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};