"use client";

import Link from "next/link";
import type { StorefrontProduct } from "@/lib/api/product";
import { formatPrice } from "@/lib/utils/format-price";

interface RelatedProductCardProps {
  product: StorefrontProduct;
}

export function RelatedProductCard({ product }: RelatedProductCardProps) {
  const primaryImage = product.images?.[0];
  const primaryVariant = product.variants?.find((variant) => variant.isActive);
  const price = primaryVariant?.finalPrice ?? product.sellingPrice;
  const colorway =
    primaryVariant?.optionValues
      .filter((optionValue) => optionValue.optionName.toLowerCase() === "color")
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute right-3 top-3 text-lg leading-none text-zinc-500 hover:text-black"
        >
          ♡<span className="sr-only">Add to wishlist</span>
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
