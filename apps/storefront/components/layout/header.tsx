// components/header.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  Search,
  User,
  ShoppingBag,
  MessageCircle,
  Package,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/hooks/use-cart";


const navItems = [
  { label: "Home", href: "/" },
  { label: "Men", href: "/products?category=men" },
  { label: "Women", href: "/products?category=women" },
  { label: "Sneakers", href: "/products?category=sneakers" },
  { label: "Sale", href: "/products?category=sale" },
  { label: "About Us", href: "/about" },
];

type HeaderProps = {
  cartCount?: number;
};

export function Header(_props: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cartCount: dynamicCartCount, isLoaded } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <div className="bg-black text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-[11px] uppercase tracking-wide md:px-6">
          <p>Welcome to Storefront Official Store</p>

          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="https://wa.me/6281234567890"
              className="flex items-center gap-2 hover:opacity-70"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Order via WhatsApp
            </Link>
            <Link
              href="/track"
              className="flex items-center gap-2 hover:opacity-70"
            >
              <Package className="h-3.5 w-3.5" />
              Track Order
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-zinc-200">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-6 lg:h-24">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <BrandLogo />
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-8 grid gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-2 py-3 text-sm font-medium uppercase tracking-wide hover:bg-zinc-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <Separator className="my-6" />

              <div className="grid gap-3 text-sm">
                <Link
                  href="https://wa.me/6281234567890"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Order via WhatsApp
                </Link>
                <Link href="/track" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Track Order
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
          >
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-10 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-semibold uppercase tracking-wide text-black underline-offset-[10px] hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span className="sr-only">Search</span>
            </Button>

            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile" className="cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="cursor-pointer">
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/addresses" className="cursor-pointer">
                      My Addresses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/wishlist" className="cursor-pointer">
                      My Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/account/notifications"
                      className="cursor-pointer"
                    >
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white">
                  {isLoaded ? dynamicCartCount : 0}
                </span>
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {isSearchOpen && (
        <div className="border-b border-zinc-200 bg-white px-4 py-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="relative mx-auto max-w-7xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <Input
              autoFocus
              placeholder="Search products, categories, or brands..."
              className="h-12 w-full rounded-md border-zinc-200 bg-zinc-50 pl-11 text-base md:h-14 md:text-lg"
            />
          </div>
        </div>
      )}
    </header>
  );
}

function BrandLogo() {
  return (
    <div className="text-center lg:text-left">
      <div className="text-xl font-bold uppercase tracking-[0.35em] md:text-2xl">
        Storefront
      </div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.45em] text-zinc-500">
        Official Store
      </div>
    </div>
  );
}
