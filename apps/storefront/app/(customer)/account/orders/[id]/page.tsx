import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  HelpCircle,
  Package,
  Printer,
  RefreshCw,
  Truck,
  Clock,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCustomerOrder } from "@/lib/api/order-server";
import { OrderItemReviewButton } from "@/components/order/order-item-review-button";
import { RefreshStatusButton } from "@/components/order/refresh-status-button";

interface TimelineItem {
  title: string;
  description: string;
  time: string;
  active: boolean;
  icon: React.ElementType;
}

function getTimeline(order: any): TimelineItem[] {
  const createdDate = new Date(order.createdAt);
  const updatedDate = new Date(order.updatedAt);

  const formatDate = (date: Date) => {
    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (order.status === "CANCELLED") {
    return [
      {
        title: "Order Placed",
        description: "Your order has been received by our system.",
        time: formatDate(createdDate),
        active: true,
        icon: CheckCircle2,
      },
      {
        title: "Order Cancelled",
        description: "Your order has been cancelled by system.",
        time: formatDate(updatedDate),
        active: true,
        icon: Clock,
      },
    ];
  }

  const steps = [
    {
      status: "PENDING",
      title: "Order Placed",
      description: "Your order has been received by our system.",
      icon: CheckCircle2,
    },
    {
      status: "CONFIRMED",
      title: "Payment Confirmed",
      description: "Payment has been confirmed successfully.",
      icon: CheckCircle2,
    },
    {
      status: "PROCESSING",
      title: "Order Packed",
      description: "Your item has been packed and prepared for delivery.",
      icon: Package,
    },
    {
      status: "ON_DELIVERY",
      title: "On Delivery",
      description: "Your package is currently on the way.",
      icon: Truck,
    },
    {
      status: "COMPLETED",
      title: "Delivered",
      description: "Package received by customer.",
      icon: CheckCircle2,
    },
  ];

  const timeline: TimelineItem[] = [];
  const statusOrder = ["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED"];
  const currentStatusIndex = statusOrder.indexOf(order.status);

  steps.forEach((step) => {
    let active = false;
    let time = "Waiting for update";

    if (step.status === "PENDING") {
      active = true;
      time = formatDate(createdDate);
    } else if (step.status === "CONFIRMED") {
      if (currentStatusIndex >= 1) {
        active = true;
        time = formatDate(new Date(createdDate.getTime() + 15 * 60 * 1000));
      }
    } else if (step.status === "PROCESSING") {
      if (currentStatusIndex >= 2) {
        active = true;
        const packedTime = currentStatusIndex === 2 ? updatedDate : new Date(createdDate.getTime() + 4 * 60 * 60 * 1000);
        time = formatDate(packedTime);
      }
    } else if (step.status === "ON_DELIVERY") {
      if (currentStatusIndex >= 3) {
        active = true;
        time = formatDate(new Date(createdDate.getTime() + 24 * 60 * 60 * 1000));
      }
    } else if (step.status === "COMPLETED") {
      if (currentStatusIndex >= 3) {
        active = true;
        time = formatDate(updatedDate);
      }
    }

    timeline.push({
      title: step.title,
      description: step.description,
      time,
      active,
      icon: step.icon,
    });
  });

  return timeline;
}

function getTrackingNumber(order: any): string {
  if (order.status === "PENDING" || order.status === "CANCELLED") {
    return "N/A";
  }
  if (order.status === "CONFIRMED") {
    return "Pending pickup";
  }
  const cleanNum = order.orderNumber.replace(/[^0-9]/g, "");
  return `JNE${cleanNum || "123456789"}`;
}

function getEstimatedArrival(order: any): string {
  if (order.status === "CANCELLED") {
    return "Cancelled";
  }
  if (order.status === "COMPLETED") {
    const updatedDate = new Date(order.updatedAt);
    return `Delivered ${updatedDate.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}`;
  }
  return "2 - 3 days";
}

function OrderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 p-4 border border-zinc-100">
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-xs font-semibold text-black">{value}</p>
    </div>
  );
}

const getStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 flex items-center gap-1.5 rounded-none font-bold text-[10px] uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-zinc-100 text-zinc-800 hover:bg-zinc-100 border-0 flex items-center gap-1.5 rounded-none font-bold text-[10px] uppercase tracking-wider">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Pending
        </Badge>
      );
    case "CONFIRMED":
    case "PROCESSING":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0 flex items-center gap-1.5 rounded-none font-bold text-[10px] uppercase tracking-wider">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0 flex items-center gap-1.5 rounded-none font-bold text-[10px] uppercase tracking-wider">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="secondary" className="rounded-none font-bold text-[10px] uppercase tracking-wider">{status}</Badge>;
  }
};

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params;

  let order;
  try {
    order = await getCustomerOrder(id);
  } catch (error) {
    console.error("Failed to load customer order details:", error);
    notFound();
  }

  const orderDate = new Date(order.createdAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const addressName = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  const addressLines = `${order.shippingAddress.addressLine1}${
    order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""
  }`;
  const fullAddress = `${addressLines}, ${order.shippingAddress.city}, ${order.shippingAddress.province} ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    })
      .format(price)
      .replace("Rp", "RP ");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-black">
      {/* Header section */}
      <div className="flex flex-col gap-4">
        <Link
          href="/account/orders"
          className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              Order #{order.orderNumber}
              <span className="hidden sm:inline-block">
                {getStatusBadge(order.status)}
              </span>
            </h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              Placed on {orderDate}
              <span className="sm:hidden ml-2">
                {getStatusBadge(order.status)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex rounded-none border-black text-[10px] font-bold uppercase tracking-wider">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" className="rounded-none border-black text-[10px] font-bold uppercase tracking-wider">
              <Download className="mr-2 h-4 w-4" />
              Invoice
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-zinc-200 rounded-none shadow-none">
            <CardHeader className="bg-zinc-50 border-b border-zinc-200 pb-4">
              <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
                <Package className="h-5 w-5 text-zinc-500" />
                Items ordered
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-200">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 flex flex-col sm:flex-row gap-6"
                  >
                    <div className="h-24 w-24 rounded-none overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200 relative">
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

                    <div className="flex-1 flex flex-col sm:flex-row justify-between">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm uppercase tracking-tight text-black line-clamp-2">
                          {item.productName}
                        </h4>
                        {item.optionSummary && (
                          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                            {item.optionSummary}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 font-medium">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-xs text-zinc-500 font-semibold">
                          {formatPrice(item.unitPrice)} each
                        </p>
                      </div>

                      <div className="mt-4 sm:mt-0 flex flex-col sm:items-end justify-between">
                        <p className="font-bold text-base">{formatPrice(item.lineTotal)}</p>
                        <div className="flex gap-3 mt-3 sm:mt-0 text-[10px] font-bold uppercase tracking-widest items-center">
                          <Link
                            href={`/products/${item.productId}`}
                            className="text-black underline underline-offset-2 hover:text-zinc-600"
                          >
                            View Product
                          </Link>
                          <OrderItemReviewButton
                            productId={item.productId}
                            productName={item.productName}
                            orderStatus={order.status}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tracking timeline card */}
          <Card className="border-zinc-200 rounded-none shadow-none relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-black"></div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
                <Truck className="h-5 w-5 text-zinc-500" />
                Shipping & Tracking Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <OrderMeta label="Courier" value={order.shippingMethod || "Standard Delivery"} />
                <OrderMeta label="Tracking Number" value={getTrackingNumber(order)} />
                <OrderMeta label="Estimated Arrival" value={getEstimatedArrival(order)} />
                <OrderMeta label="Destination" value={fullAddress} />
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-6">
                  Tracking Timeline
                </h3>

                <div className="space-y-6">
                  {getTimeline(order).map((item, index, arr) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.title} className="relative flex gap-4">
                        {index !== arr.length - 1 && (
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
                            <h4 className={`text-xs font-bold uppercase tracking-wide ${item.active ? 'text-black' : 'text-zinc-400'}`}>
                              {item.title}
                            </h4>
                            <p className="text-[10px] font-bold text-zinc-500">{item.time}</p>
                          </div>
                          <p className={`mt-1.5 text-xs leading-5 ${item.active ? 'text-zinc-700' : 'text-zinc-400'}`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full rounded-none border-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white"
                >
                  <Link href="https://wa.me/6281234567890">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Ask Support via WhatsApp
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary & Info */}
        <div className="space-y-6">
          <Card className="border-zinc-200 rounded-none shadow-none">
            <CardHeader className="bg-zinc-50 border-b border-zinc-200 pb-4">
              <CardTitle className="text-sm font-bold uppercase">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Subtotal</span>
                  <span className="font-bold">{formatPrice(order.subtotalAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="font-medium">Discount ({order.promoCode})</span>
                    <span className="font-bold">-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Shipping</span>
                  <span className="font-bold">{formatPrice(order.shippingAmount)}</span>
                </div>
                <div className="border-t border-zinc-200 pt-4 mt-4 flex justify-between font-bold text-base text-black">
                  <span>Total</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 rounded-none shadow-none">
            <CardHeader className="bg-zinc-50 border-b border-zinc-200 pb-4">
              <CardTitle className="text-sm font-bold uppercase">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h4 className="text-[10px] font-bold mb-2 text-zinc-400 uppercase tracking-widest">
                  Shipping Address
                </h4>
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-600 space-y-1">
                  <p className="font-black text-black">{addressName}</p>
                  <p>{addressLines}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-6">
                <h4 className="text-[10px] font-bold mb-2 text-zinc-400 uppercase tracking-widest">
                  Payment Method
                </h4>
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-600 flex items-center gap-2">
                  <div className="h-6 w-10 bg-zinc-100 rounded-none border border-zinc-200 flex items-center justify-center text-[8px] font-black text-black">
                    MIDTRANS
                  </div>
                  <p>Midtrans Sandbox</p>
                </div>
                {order.status === "PENDING" && (
                  <div className="mt-4 space-y-2">
                    {order.snapUrl && (
                      <Button
                        asChild
                        className="w-full h-11 rounded-none bg-emerald-600 text-xs font-bold uppercase tracking-widest text-white hover:bg-emerald-700"
                      >
                        <Link href={order.snapUrl}>
                          Complete Payment
                        </Link>
                      </Button>
                    )}
                    <RefreshStatusButton orderId={order.id} variant="sidebar" className="w-full" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-zinc-50/50 border-t border-zinc-200 p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-black hover:bg-transparent"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Need help with this order?
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
