"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    colorway: string;
    price: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/product-${product.id}`}
      className="group relative flex flex-col border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-100">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-200/50 to-zinc-100 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Placeholder styling to represent product image */}
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-105">
          <div className="h-32 w-48 -rotate-12 rounded-full bg-gradient-to-tr from-zinc-300 to-zinc-200 opacity-40 blur-2xl transition-all duration-500 group-hover:rotate-0 group-hover:scale-110 group-hover:opacity-70" />
        </div>

        {/* Wishlist Button */}
        <div className="absolute right-3 top-3 z-10 transition-transform duration-300 group-hover:-translate-y-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="flex h-9 w-9 items-center justify-center border border-transparent bg-transparent text-zinc-400 transition-all hover:border-black hover:bg-black hover:text-white"
          >
            <Heart className="h-4 w-4" />
            <span className="sr-only">Add to wishlist</span>
          </button>
        </div>

        {/* Desktop Quick Add */}
        <div className="absolute bottom-0 left-0 w-full translate-y-full p-4 transition-transform duration-300 ease-in-out group-hover:translate-y-0 hidden sm:block">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="h-10 w-full rounded-none bg-black text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-800"
          >
            Quick Add
          </Button>
        </div>
      </div>

      <div className="relative z-10 flex flex-col bg-white p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900 transition-colors group-hover:text-black">
            {product.name}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {product.colorway}
          </p>
          <p className="mt-2 text-sm font-black tracking-tight text-zinc-900">
            {product.price}
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
