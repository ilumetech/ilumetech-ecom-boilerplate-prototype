import Link from "next/link";
import {
  Check,
  Package,
  MapPin,
  Truck,
  CreditCard,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed | BrandName",
  description: "Thank you for your order.",
};

const orderDetails = {
  id: "ORD-8293-1029",
  date: "May 14, 2026",
  email: "customer@example.com",
  status: "Confirmed",
  shippingAddress: {
    name: "John Doe",
    address: "Jl. Sudirman No. 123",
    city: "Jakarta Selatan",
    province: "DKI Jakarta",
    postalCode: "12190",
    phone: "+62 812 3456 7890",
  },
  shippingMethod: "Standard Delivery (2-3 Business Days)",
  paymentMethod: "Visa ending in 4242",
  items: [
    {
      id: 1,
      name: "PREMIUM BRUTALIST SNEAKERS",
      colorway: "Carbon / Volt",
      size: "42",
      price: 1299000,
      quantity: 1,
      image: "/placeholder-product.jpg",
    },
    {
      id: 2,
      name: "ARCHITECTURAL TEE",
      colorway: "Oatmeal",
      size: "L",
      price: 499000,
      quantity: 2,
      image: "/placeholder-product.jpg",
    },
  ],
  subtotal: 2297000,
  shipping: 50000,
  tax: 0,
  total: 2347000,
};

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Success Header - Matching Checkout Flow */}
      <header className="border-b border-zinc-100 bg-white sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link
            href="/"
            className="text-xl font-black uppercase tracking-tighter"
          >
            Brand<span className="text-zinc-500">Name</span>
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-black transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-12 md:px-6 lg:py-20">
        {/* Success Confirmation Hero */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-black text-white mb-6 animate-in zoom-in duration-500">
            <Check className="h-10 w-10 stroke-[3]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
            Your order is confirmed
          </h1>
          <p className="text-zinc-500 text-lg max-w-md mx-auto">
            Thank you for shopping with us. We've sent a confirmation email to{" "}
            <span className="text-black font-bold">{orderDetails.email}</span>{" "}
            with your order details.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              className="h-14 rounded-none bg-black px-10 text-sm font-bold uppercase tracking-widest text-white hover:bg-zinc-800 transition-all"
            >
              <Link href="/track">Track Your Order</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-14 rounded-none border-2 border-zinc-200 px-10 text-sm font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all"
            >
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Order Info Summary */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Information
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm border border-zinc-200 p-6">
                <div>
                  <p className="text-zinc-400 uppercase font-bold text-[10px] tracking-widest mb-1">
                    Order Number
                  </p>
                  <p className="font-bold">{orderDetails.id}</p>
                </div>
                <div>
                  <p className="text-zinc-400 uppercase font-bold text-[10px] tracking-widest mb-1">
                    Order Date
                  </p>
                  <p className="font-bold">{orderDetails.date}</p>
                </div>
                <div>
                  <p className="text-zinc-400 uppercase font-bold text-[10px] tracking-widest mb-1">
                    Payment
                  </p>
                  <p className="font-bold">{orderDetails.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-zinc-400 uppercase font-bold text-[10px] tracking-widest mb-1">
                    Status
                  </p>
                  <span className="inline-block px-2 py-0.5 bg-zinc-100 text-[10px] font-black uppercase tracking-tighter">
                    {orderDetails.status}
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Details
              </h2>
              <div className="border border-zinc-200 p-6 space-y-4 text-sm">
                <div>
                  <p className="font-bold uppercase tracking-wide">
                    {orderDetails.shippingAddress.name}
                  </p>
                  <p className="text-zinc-600">
                    {orderDetails.shippingAddress.address}
                  </p>
                  <p className="text-zinc-600">
                    {orderDetails.shippingAddress.city},{" "}
                    {orderDetails.shippingAddress.province}{" "}
                    {orderDetails.shippingAddress.postalCode}
                  </p>
                  <p className="text-zinc-600 mt-2">
                    {orderDetails.shippingAddress.phone}
                  </p>
                </div>
                <Separator className="bg-zinc-100" />
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase text-[10px] tracking-widest text-zinc-400 mb-1">
                      Shipping Method
                    </p>
                    <p className="text-zinc-600 leading-relaxed">
                      {orderDetails.shippingMethod}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Order Items & Summary */}
          <Card className="rounded-none border-zinc-200 shadow-none overflow-hidden h-fit">
            <CardHeader className="bg-zinc-50 border-b border-zinc-200 py-4">
              <CardTitle className="text-lg font-black uppercase tracking-tight">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto scrollbar-thin">
                {orderDetails.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="relative h-20 w-16 shrink-0 bg-zinc-100 border border-zinc-200 overflow-hidden">
                      {/* Image placeholder or real image would go here */}
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-zinc-300 uppercase rotate-12">
                        Product
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold uppercase tracking-wide truncate group-hover:text-black transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {item.colorway} / {item.size}
                      </p>
                      <p className="text-xs font-semibold mt-1">
                        QTY: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-black tracking-tight">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-zinc-200 bg-zinc-50/30 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Subtotal</span>
                  <span className="font-bold">
                    {formatPrice(orderDetails.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Shipping</span>
                  <span className="font-bold">
                    {formatPrice(orderDetails.shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Tax</span>
                  <span className="font-bold">
                    {formatPrice(orderDetails.tax)}
                  </span>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 flex items-center justify-between bg-white">
                <span className="text-xl font-black uppercase tracking-tighter">
                  Total Paid
                </span>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 font-bold mr-2 uppercase tracking-widest">
                    IDR
                  </span>
                  <span className="text-3xl font-black tracking-tighter">
                    {formatPrice(orderDetails.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Support Info */}
        <div className="mt-20 border-t border-zinc-100 pt-12 text-center">
          <p className="text-sm text-zinc-500 font-medium">
            Need help with your order?{" "}
            <Link
              href="/contact"
              className="text-black font-bold underline underline-offset-4 hover:text-zinc-600 transition-colors"
            >
              Contact our support team
            </Link>{" "}
            or visit our{" "}
            <Link
              href="/faq"
              className="text-black font-bold underline underline-offset-4 hover:text-zinc-600 transition-colors"
            >
              FAQs
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace("Rp", "RP ");
}
