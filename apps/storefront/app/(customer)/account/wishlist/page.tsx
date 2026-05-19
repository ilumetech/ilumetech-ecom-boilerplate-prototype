"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Search,
  ArrowRight,
  Star,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Mock data for wishlist
const initialWishlistItems = [
  {
    id: "WISH-1",
    name: "Premium Noise-Cancelling Headphones",
    price: 249.99,
    originalPrice: 299.99,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    inStock: true,
    rating: 4.8,
    reviews: 124,
    category: "Electronics",
  },
  {
    id: "WISH-2",
    name: "Ergonomic Office Chair with Lumbar Support",
    price: 199.5,
    originalPrice: null,
    image:
      "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500&q=80",
    inStock: false,
    rating: 4.5,
    reviews: 89,
    category: "Furniture",
  },
  {
    id: "WISH-3",
    name: "Mechanical Keyboard - Cherry MX Brown",
    price: 129.0,
    originalPrice: 149.0,
    image:
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80",
    inStock: true,
    rating: 4.9,
    reviews: 312,
    category: "Electronics",
  },
  {
    id: "WISH-4",
    name: "Minimalist Leather Backpack",
    price: 89.99,
    originalPrice: null,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80",
    inStock: true,
    rating: 4.6,
    reviews: 56,
    category: "Accessories",
  },
];

export default function WishlistPage() {
  const [items, setItems] = useState(initialWishlistItems);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price * 15000); // Rough conversion for consistency with homepage Rp
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">
            Wishlist
          </h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            {items.length} {items.length === 1 ? "Item" : "Items"} saved for
            later.
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="search"
            placeholder="SEARCH WISHLIST..."
            className="h-12 rounded-none border-zinc-200 pl-10 text-[10px] font-bold uppercase tracking-widest focus-visible:ring-0 focus-visible:border-black max-w-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {items.length > 0 ? (
        filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col border border-zinc-200 bg-white transition-all duration-300 hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-100 grayscale hover:grayscale-0 transition-all duration-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {!item.inStock && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-black text-white">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute right-4 top-4 h-10 w-10 border border-transparent bg-white/80 flex items-center justify-center transition-all hover:border-black hover:bg-black hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      {item.category}
                    </p>
                    <h3 className="text-sm font-black uppercase tracking-tight line-clamp-1">
                      <Link href={`/products/${item.id.toLowerCase()}`}>
                        {item.name}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm font-black tracking-tight">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <Button
                    className="h-12 w-full rounded-none bg-black text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400"
                    disabled={!item.inStock}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Move to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200">
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">
              No results
            </h3>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-8">
              Try searching for something else.
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="rounded-none border-black text-[10px] font-bold uppercase tracking-widest"
            >
              Clear Search
            </Button>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-200">
          <div className="relative mb-8">
            <div className="h-20 w-20 bg-zinc-100 flex items-center justify-center">
              <Heart className="h-8 w-8 text-zinc-300" />
            </div>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-3">
            Your wishlist is empty
          </h3>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 max-w-xs mb-10 leading-relaxed">
            Create a personalized collection of products you love.
          </p>
          <Button
            asChild
            className="h-14 rounded-none bg-black px-10 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <Link href="/products" className="flex items-center gap-3">
              Discover <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
