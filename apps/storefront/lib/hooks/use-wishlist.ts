import { useContext } from "react";
import { WishlistContext } from "@/lib/providers/wishlist-provider";

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
