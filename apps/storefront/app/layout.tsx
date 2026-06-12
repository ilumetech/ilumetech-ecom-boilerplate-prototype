import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/lib/providers/query-provider";
import { CartProvider } from "@/lib/providers/cart-provider";
import { WishlistProvider } from "@/lib/providers/wishlist-provider";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shoeting Stars",
  description: "Online store",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans">
          <QueryProvider>
            <CartProvider>
              <WishlistProvider>{children}</WishlistProvider>
            </CartProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
