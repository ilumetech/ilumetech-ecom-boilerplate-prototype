"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleWishlist, getWishlist } from "@/lib/api/wishlist";

interface WishlistButtonProps {
  productId: string;
}

export function WishlistButton({ productId }: WishlistButtonProps) {
  const { isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function checkWishlistStatus() {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        if (!token) return;
        const wishlist = await getWishlist(token);
        if (active) {
          const isItemInWishlist = wishlist.some((item) => item.id === productId);
          setIsWishlisted(isItemInWishlist);
        }
      } catch (err) {
        console.error("Failed to fetch wishlist status", err);
      }
    }
    checkWishlistStatus();
    return () => {
      active = false;
    };
  }, [productId, isSignedIn, getToken]);

  const handleToggle = async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");
      const wishlisted = await toggleWishlist(productId, token);
      setIsWishlisted(wishlisted);
      setToastMessage(
        wishlisted
          ? "Added to your wishlist"
          : "Removed from your wishlist"
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to update wishlist");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggle}
        disabled={isLoading}
        className="shrink-0 rounded-none border-zinc-300 hover:border-black hover:bg-black hover:text-white transition-all duration-300"
      >
        <Heart
          className={`h-5 w-5 ${
            isWishlisted ? "fill-black stroke-black text-black" : "text-zinc-600"
          }`}
          style={isWishlisted ? { fill: "currentColor" } : {}}
        />
        <span className="sr-only">Add to wishlist</span>
      </Button>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-6 py-4 rounded-none shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] border border-white text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <Heart className="h-4 w-4 fill-white" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}
