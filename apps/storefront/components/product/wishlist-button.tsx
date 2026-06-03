"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/lib/hooks/use-wishlist";

interface WishlistButtonProps {
  productId: string;
}

export function WishlistButton({ productId }: WishlistButtonProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const wishlisted = isWishlisted(productId);

  const handleToggle = async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setIsLoading(true);
    try {
      const isAdded = await toggleWishlist(productId);
      setToastMessage(
        isAdded
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
            wishlisted ? "fill-black stroke-black text-black" : "text-zinc-600"
          }`}
          style={wishlisted ? { fill: "currentColor" } : {}}
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
