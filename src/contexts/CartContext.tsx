import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiService } from "../services/api";
import { useAuth } from "./AuthContext";

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
  product_id?: number;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (
    product: Omit<CartItem, "quantity">,
    quantity?: number
  ) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  loadCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
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

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setItems([]);
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const cartData = await apiService.getCart();

      // Transform backend cart data to frontend format
      const transformedItems: CartItem[] = cartData.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.name,
        price: parseFloat(item.price),
        image:
          item.image_url ||
          "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1",
        quantity: item.quantity,
        category: "Product", // Default category
        inStock: item.stock_quantity > 0,
        maxQuantity: item.stock_quantity,
      }));

      setItems(transformedItems);
    } catch (error) {
      console.error("Failed to load cart:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (
    product: Omit<CartItem, "quantity">,
    quantity = 1
  ) => {
    if (!isAuthenticated) {
      throw new Error("Please login to add items to cart");
    }

    try {
      await apiService.addToCart(product.id, quantity);
      await loadCart(); // Reload cart to get updated data
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error;
    }
  };

  const removeFromCart = async (id: number) => {
    if (!isAuthenticated) return;

    try {
      await apiService.removeFromCart(id);
      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      throw error;
    }
  };

  const updateQuantity = async (id: number, quantity: number) => {
    if (!isAuthenticated) return;

    if (quantity <= 0) {
      await removeFromCart(id);
      return;
    }

    try {
      await apiService.updateCartItem(id, quantity);
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === id
            ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
            : item
        )
      );
    } catch (error) {
      console.error("Failed to update cart:", error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      await apiService.clearCart();
      setItems([]);
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
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
    loadCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
