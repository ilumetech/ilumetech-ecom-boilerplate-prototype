import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  Clock,
  Package,
  MapPin,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";
import { getCustomerOrder } from "@/lib/api/order-server";
import { RefreshStatusButton } from "@/components/order/refresh-status-button";

export const metadata: Metadata = {
  title: "Payment Pending | Shoeting Stars",
  description: "Awaiting payment confirmation.",
};

interface PendingPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function PendingPage({ searchParams }: PendingPageProps) {
  const { orderId } = await searchParams;

  if (!orderId) {
    redirect("/");
  }

  let order;
  try {
    order = await getCustomerOrder(orderId);
  } catch (error) {
    console.error("Failed to fetch order details on PendingPage:", error);
    redirect("/");
  }

  if (order.status === "CONFIRMED") {
    redirect(`/success?orderId=${order.id}`);
  }

  if (order.status === "CANCELLED") {
    redirect(`/error?orderId=${order.id}`);
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const addressName = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  const addressLines = `${order.shippingAddress.addressLine1}${
    order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""
  }`;

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-zinc-100 bg-white sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="text-left">
            <div className="text-lg font-bold uppercase tracking-[0.25em] md:text-xl">
              Shoeting Stars
            </div>
            <div className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.3em] text-zinc-500">
              Official Store
            </div>
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
        {/* Pending Confirmation Hero */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-500 text-white mb-6 animate-pulse">
            <Clock className="h-10 w-10 stroke-[2.5]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
            Awaiting Payment
          </h1>
          <p className="text-zinc-500 text-lg max-w-md mx-auto">
            Your order #{order.orderNumber} has been created. Please complete your payment to confirm your order.
          </p>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            {order.snapUrl && (
              <Button
                asChild
                className="h-14 rounded-none bg-emerald-600 px-10 text-sm font-bold uppercase tracking-widest text-white hover:bg-emerald-700 transition-all w-full sm:w-auto"
              >
                <Link href={order.snapUrl}>Complete Payment</Link>
              </Button>
            )}
            <RefreshStatusButton orderId={order.id} />
            <Button
              asChild
              variant="outline"
              className="h-14 rounded-none border-2 border-zinc-200 px-10 text-sm font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all w-full sm:w-auto"
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
                  <p className="font-bold">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-zinc-400 uppercase font-bold text-[10px] tracking-widest mb-1">
                    Order Date
                  </p>
                  <p className="font-bold">{orderDate}</p>
                </div>
                <div>
                  <p className="text-zinc-400 uppercase font-bold text-[10px] tracking-widest mb-1">
                    Payment Method
                  </p>
                  <p className="font-bold">Midtrans Sandbox</p>
                </div>
                <div>
                  <p className="text-zinc-400 uppercase font-bold text-[10px] tracking-widest mb-1">
                    Status
                  </p>
                  <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-tighter">
                    {order.status}
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
                    {addressName}
                  </p>
                  <p className="text-zinc-600">
                    {addressLines}
                  </p>
                  <p className="text-zinc-600">
                    {order.shippingAddress.city},{" "}
                    {order.shippingAddress.province}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  {order.customerPhone && (
                    <p className="text-zinc-600 mt-2">
                      {order.customerPhone}
                    </p>
                  )}
                </div>
                <Separator className="bg-zinc-100" />
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase text-[10px] tracking-widest text-zinc-400 mb-1">
                      Shipping Method
                    </p>
                    <p className="text-zinc-600 leading-relaxed">
                      {order.shippingMethod || "Standard Delivery"}
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
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="relative h-20 w-16 shrink-0 bg-zinc-100 border border-zinc-200 overflow-hidden">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-zinc-300 uppercase rotate-12">
                          Product
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold uppercase tracking-wide truncate group-hover:text-black transition-colors">
                        {item.productName}
                      </h3>
                      {item.optionSummary && (
                        <p className="text-xs text-zinc-500">
                          {item.optionSummary}
                        </p>
                      )}
                      <p className="text-xs font-semibold mt-1">
                        QTY: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-black tracking-tight">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-zinc-200 bg-zinc-50/30 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Subtotal</span>
                  <span className="font-bold">
                    {formatPrice(order.subtotalAmount)}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="font-medium">Discount ({order.promoCode})</span>
                    <span className="font-bold">
                      -{formatPrice(order.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Shipping</span>
                  <span className="font-bold">
                    {formatPrice(order.shippingAmount)}
                  </span>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 flex items-center justify-between bg-white">
                <span className="text-xl font-black uppercase tracking-tighter">
                  Total Amount
                </span>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 font-bold mr-2 uppercase tracking-widest">
                    IDR
                  </span>
                  <span className="text-3xl font-black tracking-tighter">
                    {formatPrice(order.totalAmount)}
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
