"use client";

import React, { createContext, useEffect, useState, useContext } from "react";
import { useAuth } from "@clerk/nextjs";
import { toggleWishlist, getWishlist } from "@/lib/api/wishlist";
import type { StorefrontProduct } from "@/lib/api/product";

interface WishlistContextType {
  items: StorefrontProduct[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isLoading: boolean;
  isLoaded: boolean;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken, isLoaded: isAuthLoaded } = useAuth();
  const [items, setItems] = useState<StorefrontProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (token) {
        const wishlist = await getWishlist(token);
        setItems(wishlist);
      }
    } catch (err) {
      console.error("Failed to load wishlist", err);
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (isAuthLoaded) {
      if (isSignedIn) {
        fetchWishlist();
      } else {
        setItems([]);
        setIsLoaded(true);
      }
    }
  }, [isAuthLoaded, isSignedIn]);

  const isWishlisted = (productId: string) => {
    return items.some((item) => item.id === productId);
  };

  const handleToggleWishlist = async (productId: string): Promise<boolean> => {
    if (!isSignedIn) {
      throw new Error("User must be signed in to toggle wishlist");
    }
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");
      const wishlisted = await toggleWishlist(productId, token);
      
      if (wishlisted) {
        // Re-fetch wishlist to get full product metadata (name, slug, images, category, price)
        const updated = await getWishlist(token);
        setItems(updated);
      } else {
        // Filter out locally immediately for responsive delete
        setItems((current) => current.filter((item) => item.id !== productId));
      }
      return wishlisted;
    } catch (err) {
      console.error("Failed to toggle wishlist item", err);
      throw err;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        isWishlisted,
        toggleWishlist: handleToggleWishlist,
        isLoading,
        isLoaded,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
