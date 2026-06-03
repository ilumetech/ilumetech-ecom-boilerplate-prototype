"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import type { StorefrontProduct } from "@/lib/api/product";
import { formatPrice } from "@/lib/utils/format-price";
import { useWishlist } from "@/lib/hooks/use-wishlist";

interface RelatedProductCardProps {
  product: StorefrontProduct;
}

export function RelatedProductCard({ product }: RelatedProductCardProps) {
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
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-md bg-zinc-100 transition group-hover:opacity-80">
        {primaryImage ? (
          <div
            role="img"
            aria-label={primaryImage.alt ?? product.name}
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${primaryImage.url})` }}
          />
        ) : null}
        <button
          onClick={handleWishlistToggle}
          disabled={isToggling}
          className={`absolute right-3 top-3 transition-all hover:scale-110 cursor-pointer ${
            wishlisted ? "text-black" : "text-zinc-500 hover:text-black"
          }`}
        >
          <Heart
            className="h-4 w-4"
            style={wishlisted ? { fill: "currentColor" } : {}}
          />
          <span className="sr-only">Add to wishlist</span>
        </button>
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-semibold">{product.name}</h3>
        <p className="mt-1 text-xs text-zinc-500">{colorway}</p>
        <p className="mt-2 text-sm font-bold">{formatPrice(price)}</p>
      </div>
    </Link>
  );
}
