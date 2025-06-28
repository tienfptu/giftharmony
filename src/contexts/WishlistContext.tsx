import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
<<<<<<< HEAD
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
=======
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  image_url: string;
  stock_quantity: number;
}

interface WishlistContextType {
  wishlistItems: number[];
  isLoading: boolean;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  getWishlistCount: () => number;
  loadWishlist: () => Promise<void>;
>>>>>>> cuoidino/main
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
<<<<<<< HEAD
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
=======
  const [wishlistItems, setWishlistItems] = useState<number[]>([]);
  const [wishlistData, setWishlistData] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    } else {
      setWishlistItems([]);
      setWishlistData([]);
    }
  }, [isAuthenticated]);

  const loadWishlist = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const data = await apiService.getWishlist();
      setWishlistData(data);
      setWishlistItems(data.map((item: WishlistItem) => item.product_id));
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      setWishlistItems([]);
      setWishlistData([]);
>>>>>>> cuoidino/main
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
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
=======
  const addToWishlist = async (productId: number) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to wishlist');
    }

    try {
      await apiService.addToWishlist(productId);
      setWishlistItems(prev => {
        if (!prev.includes(productId)) {
          return [...prev, productId];
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      throw error;
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (!isAuthenticated) return;

    try {
      await apiService.removeFromWishlistByProduct(productId);
      setWishlistItems(prev => prev.filter(id => id !== productId));
      setWishlistData(prev => prev.filter(item => item.product_id !== productId));
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
>>>>>>> cuoidino/main
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

<<<<<<< HEAD
  const toggleWishlist = async (productId: string) => {
=======
  const toggleWishlist = async (productId: number) => {
>>>>>>> cuoidino/main
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
<<<<<<< HEAD
    refreshWishlist
=======
    loadWishlist
>>>>>>> cuoidino/main
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};