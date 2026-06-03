"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StorefrontProduct } from "@/lib/api/product";
import { formatPrice } from "@/lib/utils/format-price";
import { useWishlist } from "@/lib/hooks/use-wishlist";

interface ProductCardProps {
  product: StorefrontProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isToggling, setIsToggling] = useState(false);

  const wishlisted = isWishlisted(product.id);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isToggling) return;

    setIsToggling(true);
    try {
      await toggleWishlist(product.id);
    } catch (err) {
      console.error("Failed to toggle wishlist", err);
    } finally {
      setIsToggling(false);
    }
  };

  const primaryImage = product.images?.[0];
  const primaryVariant = product.variants?.find((variant) => variant.isActive);
  const price = primaryVariant?.finalPrice ?? product.sellingPrice;
  const colorway =
    primaryVariant?.optionValues
      .filter((optionValue) => {
        const lowerName = optionValue.optionName.toLowerCase();
        return lowerName.includes("color") || lowerName.includes("colour") || lowerName.includes("warna");
      })
      .map((optionValue) => optionValue.value)
      .join(" / ") || product.productCategory.name;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-100">
        {primaryImage ? (
          <div
            role="img"
            aria-label={primaryImage.alt ?? product.name}
            className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${primaryImage.url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-200/50 to-zinc-100" />
        )}

        {/* Wishlist Button */}
        <div className="absolute right-3 top-3 z-10 transition-transform duration-300 group-hover:-translate-y-1">
          <button
            onClick={handleWishlistToggle}
            disabled={isToggling}
            className={`flex h-9 w-9 items-center justify-center border border-transparent bg-transparent transition-all hover:border-black hover:bg-black hover:text-white cursor-pointer ${
              wishlisted ? "text-black" : "text-zinc-400"
            }`}
          >
            <Heart 
              className="h-4 w-4" 
              style={wishlisted ? { fill: "currentColor" } : {}}
            />
            <span className="sr-only">Add to wishlist</span>
          </button>
        </div>
      </div>

      <div className="relative z-10 flex flex-col bg-white p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900 transition-colors group-hover:text-black">
            {product.name}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {colorway}
          </p>
          <p className="mt-2 text-sm font-black tracking-tight text-zinc-900">
            {formatPrice(price)}
          </p>
        </div>

        {/* Mobile Add to Cart */}
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="mt-4 h-10 w-full rounded-none border-2 border-black bg-white text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white sm:hidden"
        >
          Add to Cart
        </Button>

        {/* Desktop Decorative Element */}
        <div className="mt-5 hidden h-[2px] w-8 bg-black transition-all duration-500 group-hover:w-full sm:block" />
      </div>
    </Link>
  );
}
