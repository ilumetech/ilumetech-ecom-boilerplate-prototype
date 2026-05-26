"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Package,
  Search,
  MessageCircle,
  Truck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface TimelineItem {
  title: string;
  description: string;
  time: string;
  active: boolean;
  icon: React.ElementType;
}

interface OrderDetail {
  orderNumber: string;
  status: string;
  courier: string;
  trackingNumber: string;
  estimatedArrival: string;
  customerName: string;
  address: string;
  timeline: TimelineItem[];
}

const MOCK_ORDERS: OrderDetail[] = [
  {
    orderNumber: "ORD-2024-0001",
    status: "On Delivery",
    courier: "JNE Regular",
    trackingNumber: "JNE1234567890",
    estimatedArrival: "2 - 3 days",
    customerName: "Jane Doe",
    address: "Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta",
    timeline: [
      {
        title: "Order Placed",
        description: "Your order has been received by our system.",
        time: "May 25, 10:15",
        active: true,
        icon: CheckCircle2,
      },
      {
        title: "Payment Confirmed",
        description: "Payment has been confirmed successfully.",
        time: "May 25, 10:28",
        active: true,
        icon: CheckCircle2,
      },
      {
        title: "Order Packed",
        description: "Your item has been packed and prepared for delivery.",
        time: "May 25, 14:10",
        active: true,
        icon: Package,
      },
      {
        title: "On Delivery",
        description: "Your package is currently on the way.",
        time: "Estimated 2 - 3 days",
        active: true,
        icon: Truck,
      },
      {
        title: "Delivered",
        description: "Package received by customer.",
        time: "Waiting for update",
        active: false,
        icon: CheckCircle2,
      },
    ],
  },
  {
    orderNumber: "ORD-2024-0002",
    status: "Delivered",
    courier: "J&T Express",
    trackingNumber: "JT9876543210",
    estimatedArrival: "Delivered May 24, 2026",
    customerName: "Alex Smith",
    address: "Jl. Diponegoro No. 45, Bandung, Jawa Barat",
    timeline: [
      {
        title: "Order Placed",
        description: "Your order has been received by our system.",
        time: "May 22, 09:00",
        active: true,
        icon: CheckCircle2,
      },
      {
        title: "Payment Confirmed",
        description: "Payment has been confirmed successfully.",
        time: "May 22, 09:15",
        active: true,
        icon: CheckCircle2,
      },
      {
        title: "Order Packed",
        description: "Your item has been packed and prepared for delivery.",
        time: "May 22, 11:30",
        active: true,
        icon: Package,
      },
      {
        title: "On Delivery",
        description: "Your package is currently on the way.",
        time: "May 23, 08:00",
        active: true,
        icon: Truck,
      },
      {
        title: "Delivered",
        description: "Package received by customer.",
        time: "May 24, 15:45",
        active: true,
        icon: CheckCircle2,
      },
    ],
  },
  {
    orderNumber: "ORD-2024-0003",
    status: "Processing",
    courier: "Sicepat Reg",
    trackingNumber: "N/A (Pending)",
    estimatedArrival: "5 - 7 days",
    customerName: "Budi Santoso",
    address: "Jl. Merdeka No. 12, Surabaya, Jawa Timur",
    timeline: [
      {
        title: "Order Placed",
        description: "Your order has been received by our system.",
        time: "May 26, 08:30",
        active: true,
        icon: CheckCircle2,
      },
      {
        title: "Payment Confirmed",
        description: "Payment has been confirmed successfully.",
        time: "May 26, 08:50",
        active: true,
        icon: CheckCircle2,
      },
      {
        title: "Order Packed",
        description: "Your item has been packed and prepared for delivery.",
        time: "Waiting for update",
        active: false,
        icon: Package,
      },
      {
        title: "On Delivery",
        description: "Your package is currently on the way.",
        time: "Waiting for update",
        active: false,
        icon: Truck,
      },
      {
        title: "Delivered",
        description: "Package received by customer.",
        time: "Waiting for update",
        active: false,
        icon: CheckCircle2,
      },
    ],
  },
  {
    orderNumber: "ORD-2024-0004",
    status: "Cancelled",
    courier: "N/A",
    trackingNumber: "N/A",
    estimatedArrival: "Cancelled",
    customerName: "Siti Rahma",
    address: "Jl. Gajah Mada No. 8, Tangerang, Banten",
    timeline: [
      {
        title: "Order Placed",
        description: "Your order has been received by our system.",
        time: "May 24, 11:00",
        active: true,
        icon: CheckCircle2,
      },
      {
        title: "Payment Failed",
        description: "Payment transaction was failed or timed out.",
        time: "May 24, 12:00",
        active: true,
        icon: Clock,
      },
      {
        title: "Order Cancelled",
        description: "Your order has been cancelled by system.",
        time: "May 24, 12:05",
        active: true,
        icon: Package,
      },
    ],
  },
];

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderDetail | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchedQuery(query.trim());
    setActiveOrder(null);

    setTimeout(() => {
      const foundOrder = MOCK_ORDERS.find(
        (o) => o.orderNumber.toLowerCase() === query.trim().toLowerCase()
      );
      if (foundOrder) {
        setActiveOrder(foundOrder);
      }
      setIsLoading(false);
      setHasSearched(true);
    }, 600);
  };

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:py-10">
        <div className="mb-8 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>/</span>
          <span className="text-black">Track Order</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-14">
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Order Tracking
            </p>
            <h1 className="max-w-xl text-5xl font-black uppercase leading-none tracking-tight md:text-6xl lg:text-7xl">
              Track your order.
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-zinc-700">
              Enter your order number or WhatsApp number to check your latest
              order status.
            </p>

            <Card className="mt-8 rounded-none border-zinc-200 shadow-none">
              <CardContent className="p-5 md:p-6">
                <form onSubmit={handleSearch} className="grid gap-4">
                  <div>
                    <label
                      htmlFor="order"
                      className="text-xs font-bold uppercase tracking-wide text-zinc-500"
                    >
                      Order Number / WhatsApp Number
                    </label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <Input
                        id="order"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Example: ORD-2024-0001"
                        className="h-12 rounded-none border-zinc-300 bg-white pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-12 rounded-none bg-black text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800"
                    disabled={isLoading}
                  >
                    {isLoading ? "Searching..." : "Track Order"}
                  </Button>
                </form>

                <Separator className="my-6" />

                <div className="rounded-md bg-zinc-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Need help?
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    If your order status is not updated yet, contact our
                    customer care through WhatsApp.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-4 h-11 rounded-none border-black text-xs font-semibold uppercase tracking-wide hover:bg-black hover:text-white"
                  >
                    <Link href="https://wa.me/6281234567890">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contact WhatsApp
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            {isLoading ? (
              <SkeletonLoaderCard />
            ) : activeOrder ? (
              <OrderStatusCard order={activeOrder} />
            ) : hasSearched ? (
              <NotFoundCard searchedQuery={searchedQuery} />
            ) : (
              <InitialStateCard />
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard
            icon={Package}
            title="Order Number"
            description="You can find your order number on the order success page or confirmation message."
          />
          <InfoCard
            icon={Clock}
            title="Status Update"
            description="Order status may take time to update after payment or courier pickup."
          />
          <InfoCard
            icon={MessageCircle}
            title="Manual Support"
            description="For low-cost stores, tracking can also be confirmed manually through WhatsApp."
          />
        </div>
      </section>
    </>
  );
}

function InitialStateCard() {
  return (
    <Card className="rounded-none border-zinc-200 border-dashed shadow-none p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
      <Package className="h-16 w-16 text-zinc-300 stroke-[1.2] mb-6 animate-pulse" />
      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Ready to track</h2>
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-xs leading-6">
        Enter your order ID on the left to see the shipping status and timeline.
      </p>
    </Card>
  );
}

function SkeletonLoaderCard() {
  return (
    <Card className="rounded-none border-zinc-200 shadow-none animate-pulse">
      <div className="p-5 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-4 w-28 bg-zinc-200" />
            <div className="h-6 w-48 bg-zinc-200" />
          </div>
          <div className="h-8 w-24 bg-zinc-200 rounded-full" />
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-16 bg-zinc-100 rounded" />
          <div className="h-16 bg-zinc-100 rounded" />
          <div className="h-16 bg-zinc-100 rounded" />
          <div className="h-16 bg-zinc-100 rounded" />
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="h-5 w-36 bg-zinc-200" />
          <div className="space-y-6 pt-4">
            <div className="flex gap-4">
              <div className="h-10 w-10 bg-zinc-200 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-zinc-200" />
                <div className="h-3 w-64 bg-zinc-100" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 bg-zinc-200 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-zinc-200" />
                <div className="h-3 w-64 bg-zinc-100" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function NotFoundCard({ searchedQuery }: { searchedQuery: string }) {
  return (
    <Card className="rounded-none border-red-200 bg-red-50/20 border-dashed shadow-none p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
      <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
        <Package className="h-8 w-8 stroke-[1.5]" />
      </div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-2 text-red-950">Order Not Found</h2>
      <p className="text-zinc-600 text-sm max-w-sm leading-6 mb-8">
        We couldn&apos;t find any order with code <span className="font-bold text-black">{searchedQuery}</span>. 
        Please verify the order ID or reach out to support.
      </p>
      <Button
        asChild
        className="rounded-none bg-black text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800 px-8 py-6"
      >
        <Link href="https://wa.me/6281234567890">
          <MessageCircle className="mr-2 h-4 w-4" />
          Ask Support via WhatsApp
        </Link>
      </Button>
    </Card>
  );
}

function OrderStatusCard({ order }: { order: OrderDetail }) {
  return (
    <Card className="rounded-none border-zinc-200 shadow-none">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Tracking Details
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">
              {order.orderNumber}
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Customer: {order.customerName}
            </p>
          </div>

          <div className="w-fit rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
            {order.status}
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-4 sm:grid-cols-2">
          <OrderMeta label="Courier" value={order.courier} />
          <OrderMeta
            label="Tracking Number"
            value={order.trackingNumber}
          />
          <OrderMeta
            label="Estimated Arrival"
            value={order.estimatedArrival}
          />
          <OrderMeta label="Destination" value={order.address} />
        </div>

        <Separator className="my-6" />

        <div>
          <h3 className="text-sm font-black uppercase tracking-wide">
            Tracking Timeline
          </h3>

          <div className="mt-6 space-y-6">
            {order.timeline.map((item, index) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="relative flex gap-4">
                  {index !== order.timeline.length - 1 && (
                    <div className="absolute left-5 top-10 h-full w-px bg-zinc-200" />
                  )}

                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      item.active
                        ? "border-black bg-black text-white"
                        : "border-zinc-200 bg-white text-zinc-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 pb-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <h4 className="text-sm font-bold uppercase tracking-wide">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-500">{item.time}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          className="mt-8 h-12 w-full rounded-none border-black text-xs font-semibold uppercase tracking-wide hover:bg-black hover:text-white"
        >
          <Link href="https://wa.me/6281234567890">
            <MessageCircle className="mr-2 h-4 w-4" />
            Ask Customer Care
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function OrderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-black">{value}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-zinc-200 p-6">
      <Icon className="h-9 w-9 stroke-[1.5]" />
      <h3 className="mt-6 text-sm font-bold uppercase tracking-wide">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}


