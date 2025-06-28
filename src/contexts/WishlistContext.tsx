import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiService } from "../services/api";
import { useAuth } from "./AuthContext";

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
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider = ({ children }: WishlistProviderProps) => {
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
      console.error("Failed to load wishlist:", error);
      setWishlistItems([]);
      setWishlistData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToWishlist = async (productId: number) => {
    if (!isAuthenticated) {
      throw new Error("Please login to add items to wishlist");
    }

    try {
      await apiService.addToWishlist(productId);
      setWishlistItems((prev) => {
        if (!prev.includes(productId)) {
          return [...prev, productId];
        }
        return prev;
      });
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
      throw error;
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (!isAuthenticated) return;

    try {
      await apiService.removeFromWishlistByProduct(productId);
      setWishlistItems((prev) => prev.filter((id) => id !== productId));
      setWishlistData((prev) =>
        prev.filter((item) => item.product_id !== productId)
      );
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      throw error;
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlistItems.includes(productId);
  };

  const toggleWishlist = async (productId: number) => {
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
    loadWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
