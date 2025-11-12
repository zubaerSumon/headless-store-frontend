"use client";
import React, { createContext, useCallback, useState, useEffect } from "react";
type Props = { children: React.ReactNode };
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: {
    src: string;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: any) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  cartTotal: number;
}
export const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'woocommerce_cart';

const CartProvider = ({ children }: Props) => {
  // Load cart from localStorage on mount
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          return JSON.parse(savedCart);
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [items]);

  const addItem = useCallback((product: any) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch (error) {
        console.error('Error clearing cart from localStorage:', error);
      }
    }
  }, []);

  const cartTotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
