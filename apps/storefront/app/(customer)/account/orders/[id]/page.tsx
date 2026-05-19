import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  HelpCircle,
  Package,
  Printer,
  RefreshCw,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// This would typically come from a database based on the ID
const orderData = {
  id: "ORD-98765",
  date: "May 14, 2026 at 10:42 AM",
  status: "Processing",
  paymentMethod: "Visa ending in 4242",
  shippingMethod: "Standard Shipping (3-5 business days)",
  trackingNumber: "TRK1234567890",
  address: {
    name: "Jane Doe",
    street: "123 Commerce St",
    city: "San Francisco",
    state: "CA",
    zip: "94105",
    country: "United States",
  },
  items: [
    {
      id: "prod-1",
      name: "Premium Wireless Headphones",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80",
      price: "$99.00",
      quantity: 1,
      total: "$99.00",
      status: "Preparing for shipment",
    },
    {
      id: "prod-2",
      name: "USB-C Charging Cable",
      image:
        "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=100&q=80",
      price: "$15.00",
      quantity: 2,
      total: "$30.00",
      status: "Preparing for shipment",
    },
  ],
  summary: {
    subtotal: "$129.00",
    shipping: "$0.00",
    tax: "$10.96",
    total: "$139.96",
  },
};

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-0 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-0 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Processing
        </Badge>
      );
    case "shipped":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-0 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5" /> Shipped
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  // Use params.id to fetch real data in a real app
  const orderId = params.id || orderData.id;

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col gap-4">
        <Link
          href="/account/orders"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Order #{orderId}
              <span className="hidden sm:inline-block">
                {getStatusBadge(orderData.status)}
              </span>
            </h2>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Placed on {orderData.date}
              <span className="sm:hidden ml-2">
                {getStatusBadge(orderData.status)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Invoice
            </Button>
            <Button variant="default" size="sm">
              Buy Again
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                Items ordered
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {orderData.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 flex flex-col sm:flex-row gap-6"
                  >
                    <div className="h-24 w-24 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col sm:flex-row justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-base hover:text-primary transition-colors cursor-pointer line-clamp-2">
                          {item.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.price} each
                        </p>

                        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          <Truck className="h-3 w-3" />
                          {item.status}
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-0 flex flex-col sm:items-end justify-between">
                        <p className="font-medium text-lg">{item.total}</p>
                        <div className="flex gap-3 mt-3 sm:mt-0 text-sm">
                          <Link
                            href={`/products/${item.id}`}
                            className="text-primary hover:underline"
                          >
                            View Product
                          </Link>
                          <span className="text-muted-foreground">|</span>
                          <button className="text-primary hover:underline">
                            Write Review
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tracking info if available */}
          <Card className="border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-muted-foreground" />
                Shipping Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div>
                  <p className="text-sm font-medium mb-1">Tracking Number</p>
                  <p className="text-lg tracking-wide font-mono text-primary">
                    {orderData.trackingNumber}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Via {orderData.shippingMethod}
                  </p>
                </div>
                <Button variant="outline">Track Package</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary & Info */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{orderData.summary.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{orderData.summary.shipping}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{orderData.summary.tax}</span>
                </div>
                <div className="border-t border-border/50 pt-4 mt-4 flex justify-between font-medium text-base">
                  <span>Total</span>
                  <span>{orderData.summary.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                  Shipping Address
                </h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{orderData.address.name}</p>
                  <p>{orderData.address.street}</p>
                  <p>
                    {orderData.address.city}, {orderData.address.state}{" "}
                    {orderData.address.zip}
                  </p>
                  <p>{orderData.address.country}</p>
                </div>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h4 className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                  Payment Method
                </h4>
                <div className="text-sm flex items-center gap-2">
                  <div className="h-6 w-10 bg-muted rounded border border-border/50 flex items-center justify-center text-[10px] font-bold">
                    VISA
                  </div>
                  <p>{orderData.paymentMethod}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t border-border/50 p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
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
