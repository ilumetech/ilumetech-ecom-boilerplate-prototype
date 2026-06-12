// components/header.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  Search,
  User,
  ShoppingBag,
  MessageCircle,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/hooks/use-cart";
import CartDrawer from "@/components/cart/cart-drawer";
import { useAuth, useUser } from "@clerk/nextjs";



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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Header(_props: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount: dynamicCartCount, isLoaded } = useCart();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  // Sync state with URL search parameter
  useEffect(() => {
    const query = searchParams.get("search") || "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchQuery(query);
    if (query) {
      setIsSearchOpen(true);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const query = searchQuery.trim();
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-black text-white">
      <div className="bg-black">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6 lg:h-16">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-zinc-900 hover:text-white">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <BrandLogo variant="dark" />
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
                <Separator className="my-2" />
                {isSignedIn ? (
                  <>
                    <Link 
                      href="/account/profile" 
                      className="flex items-center gap-3 p-3 border border-zinc-200 bg-white transition-all hover:border-black rounded-none w-full"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 font-bold">
                        {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
                      </div>
                      <div className="flex flex-col text-left overflow-hidden">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400">
                          My Account & Profile
                        </span>
                        <span className="font-black text-sm text-black truncate mt-0.5">
                          {user?.fullName || user?.firstName || "Customer"}
                        </span>
                        <span className="text-[10px] font-medium text-zinc-500 truncate mt-0.5 lowercase">
                          {user?.primaryEmailAddress?.emailAddress || ""}
                        </span>
                      </div>
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="text-red-600 font-medium cursor-pointer w-full text-left flex items-center gap-2 border-none bg-transparent p-0 mt-3"
                    >
                      <X className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/sign-in" className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4" />
                    Sign In
                  </Link>
                )}
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
                className="relative py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition-colors duration-300 hover:text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-right after:scale-x-0 after:bg-white after:transition-transform after:duration-300 after:ease-in-out hover:after:origin-left hover:after:scale-x-100"
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
              className="text-white transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-zinc-900 hover:text-white"
            >
              {isSearchOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span className="sr-only">Search</span>
            </Button>

            <div className="hidden md:block">
              {isSignedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-zinc-900 hover:text-white">
                      <User className="h-5 w-5" />
                      <span className="sr-only">Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2 rounded-none border-zinc-200">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/account/profile"
                        className="flex items-center gap-3 p-3 rounded-none hover:bg-zinc-50 transition-colors cursor-pointer outline-none w-full"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 font-bold">
                          {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
                        </div>
                        <div className="flex flex-col text-left overflow-hidden">
                          <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-400">
                            My Account & Profile
                          </span>
                          <span className="font-black text-sm text-black truncate mt-0.5">
                            {user?.fullName || user?.firstName || "Customer"}
                          </span>
                          <span className="text-[10px] font-medium text-zinc-500 truncate mt-0.5 lowercase">
                            {user?.primaryEmailAddress?.emailAddress || ""}
                          </span>
                        </div>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 cursor-pointer text-left w-full"
                      onClick={() => signOut()}
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="icon" asChild className="text-white transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-zinc-900 hover:text-white">
                  <Link href="/sign-in">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Sign In</span>
                  </Link>
                </Button>
              )}
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-zinc-900 hover:text-white">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] text-black font-semibold transition-transform duration-200 group-hover:scale-110">
                    {isLoaded ? dynamicCartCount : 0}
                  </span>
                  <span className="sr-only">Cart</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                <CartDrawer />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {isSearchOpen && (
        <div className="border-b border-zinc-800 bg-black px-4 py-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <form onSubmit={handleSearchSubmit} className="relative mx-auto max-w-7xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, categories, or brands..."
              className="h-12 w-full rounded-md border-zinc-800 bg-zinc-900 pl-11 text-base md:h-14 md:text-lg text-white placeholder:text-zinc-500 focus-visible:ring-zinc-700"
            />
          </form>
        </div>
      )}
    </header>
  );
}

function BrandLogo({ variant = "light" }: { variant?: "light" | "dark" }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/images/shoeting_stars_logo_white_transparent_HD.png"
        alt="Shoeting Stars Logo"
        style={{
          filter: variant === "dark" ? "invert(1)" : "none",
        }}
        className="h-12 md:h-16 w-auto object-contain"
      />
    </div>
  );
}
