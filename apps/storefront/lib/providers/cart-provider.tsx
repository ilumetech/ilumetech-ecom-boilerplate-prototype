"use client";

import React, { createContext, useEffect, useState } from "react";

export interface CartItem {
  id: string; // Combination of productId, colorway, and size
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  colorway: string;
  size: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  stockOnHand: number;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  isLoaded: boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ilumetech-cart");
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<CartItem>[];
        const migrated = parsed.map((item) => ({
          ...item,
          stockOnHand: typeof item.stockOnHand === "number" ? item.stockOnHand : 9999,
        })) as CartItem[];
        setTimeout(() => {
          setItems(migrated);
          setIsLoaded(true);
        }, 0);
        return;
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
    setTimeout(() => {
      setIsLoaded(true);
    }, 0);
  }, []);

  // Save to localStorage when items change, only after loading is completed
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("ilumetech-cart", JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items, isLoaded]);

  const addItem = (newItem: Omit<CartItem, "id">) => {
    setItems((current) => {
      // Find if item with same productId, colorway, and size already exists in the cart
      const existingIndex = current.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.colorway === newItem.colorway &&
          item.size === newItem.size,
      );

      if (existingIndex > -1) {
        const updated = [...current];
        const existing = updated[existingIndex];
        const newQuantity = Math.min(
          existing.quantity + newItem.quantity,
          newItem.stockOnHand,
        );
        updated[existingIndex] = {
          ...existing,
          stockOnHand: newItem.stockOnHand, // update stock in case it changed
          quantity: newQuantity,
        };
        return updated;
      }

      // Create a unique ID for this variation
      const id = `${newItem.productId}-${encodeURIComponent(newItem.colorway)}-${encodeURIComponent(newItem.size)}`;
      const quantity = Math.min(newItem.quantity, newItem.stockOnHand);
      return [...current, { ...newItem, id, quantity }];
    });
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.min(quantity, item.stockOnHand) }
          : item,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartCount,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
