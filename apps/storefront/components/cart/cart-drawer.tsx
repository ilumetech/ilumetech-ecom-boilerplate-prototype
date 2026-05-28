"use client";

import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/hooks/use-cart";

export default function CartDrawer() {
  const {
    items: cartItems,
    updateQuantity,
    removeItem,
    cartCount,
    isLoaded,
  } = useCart();

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  if (!isLoaded) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-black" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Loading your cart...
        </p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <ShoppingBag className="h-12 w-12 text-zinc-300 stroke-[1.2] mb-4" />
        <h2 className="text-lg font-black uppercase tracking-tight">Your cart is empty</h2>
        <p className="mt-2 max-w-[240px] text-xs text-zinc-500 leading-relaxed">
          Looks like you haven&apos;t added any items to your cart yet.
        </p>
        <SheetClose asChild>
          <Button
            asChild
            className="mt-6 rounded-none bg-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-zinc-800"
          >
            <Link href="/products">Start Shopping</Link>
          </Button>
        </SheetClose>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <SheetHeader className="border-b border-zinc-100 py-5">
        <SheetTitle className="text-sm font-black uppercase tracking-widest text-black flex items-center justify-between px-2">
          <span>Shopping Cart</span>
          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
            {cartCount} {cartCount === 1 ? "Item" : "Items"}
          </span>
        </SheetTitle>
      </SheetHeader>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 px-6">
        {cartItems.map((item) => (
          <div key={item.id} className="py-5 flex gap-4">
            <div className="relative h-20 w-16 shrink-0 bg-zinc-50 border border-zinc-100 overflow-hidden">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-zinc-300 uppercase rotate-12">
                  Product
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wide truncate">
                  {item.name}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {item.colorway} / {item.size}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex h-8 items-center border border-zinc-200">
                  <button
                    type="button"
                    disabled={item.quantity <= 1}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex h-full w-8 items-center justify-center hover:bg-zinc-50 text-zinc-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    disabled={item.quantity >= item.stockOnHand}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-full w-8 items-center justify-center hover:bg-zinc-50 text-zinc-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-zinc-400 hover:text-black transition-colors"
                >
                  <Trash2 className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary Footer */}
      <div className="border-t border-zinc-100 bg-zinc-50 p-6 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold uppercase tracking-wider text-zinc-500 text-xs">Subtotal</span>
          <span className="font-black text-black text-base">{formatPrice(subtotal)}</span>
        </div>
        <p className="text-[10px] text-zinc-500 leading-normal">
          Shipping, taxes, and discounts will be calculated at checkout.
        </p>

        <div className="grid gap-2 pt-2">
          <SheetClose asChild>
            <Button
              asChild
              className="h-12 w-full rounded-none bg-black text-xs font-bold uppercase tracking-widest text-white hover:bg-zinc-800"
            >
              <Link href="/checkout">Checkout Now</Link>
            </Button>
          </SheetClose>

          <SheetClose asChild>
            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-none border-zinc-300 text-xs font-bold uppercase tracking-widest hover:border-black"
            >
              <Link href="/cart">View Cart Page</Link>
            </Button>
          </SheetClose>
        </div>
      </div>
    </div>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
