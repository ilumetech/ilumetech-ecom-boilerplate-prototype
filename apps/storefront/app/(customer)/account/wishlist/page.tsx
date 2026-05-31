"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Search,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWishlist, toggleWishlist } from "@/lib/api/wishlist";
import type { StorefrontProduct } from "@/lib/api/product";

export default function WishlistPage() {
  const { isSignedIn, getToken, isLoaded: isAuthLoaded } = useAuth();
  const [items, setItems] = useState<StorefrontProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchWishlist = async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const wishlist = await getWishlist(token);
      setItems(wishlist);
    } catch (err) {
      console.error("Failed to load wishlist", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoaded) {
      if (isSignedIn) {
        fetchWishlist();
      } else {
        setIsLoading(false);
      }
    }
  }, [isAuthLoaded, isSignedIn]);

  const removeItem = async (id: string) => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      await toggleWishlist(id, token);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to remove item", err);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productCategory.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("Rp", "RP ");
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
        Loading your wishlist...
      </div>
    );
  }

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
            className="h-12 rounded-none border-zinc-200 pl-10 text-[10px] font-bold uppercase tracking-widest focus-visible:ring-0 focus-visible:border-black max-w-md text-black"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {items.length > 0 ? (
        filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredItems.map((item) => {
              const image = item.images?.[0]?.url || "/placeholder-product.jpg";
              const inStock = item.isActive;

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col border border-zinc-200 bg-white transition-all duration-300 hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-100 grayscale hover:grayscale-0 transition-all duration-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {!inStock && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-black text-white">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute right-4 top-4 h-10 w-10 border border-transparent bg-white/80 flex items-center justify-center transition-all hover:border-black hover:bg-black hover:text-white cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {item.productCategory.name}
                      </p>
                      <h3 className="text-sm font-black uppercase tracking-tight line-clamp-1">
                        <Link href={`/products/${item.slug}`}>
                          {item.name}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm font-black tracking-tight text-black">
                        {formatPrice(item.sellingPrice)}
                      </p>
                    </div>

                    <Button
                      asChild
                      className="h-12 w-full rounded-none bg-black text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400"
                      disabled={!inStock}
                    >
                      <Link href={`/products/${item.slug}`} className="flex items-center justify-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        View Product
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
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
