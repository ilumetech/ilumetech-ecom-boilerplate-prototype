// app/track/page.tsx
import Link from "next/link";
import {
  Package,
  Search,
  MessageCircle,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

const sampleOrder = {
  orderNumber: "ORD-2024-0001",
  status: "On Delivery",
  courier: "JNE Regular",
  trackingNumber: "JNE1234567890",
  estimatedArrival: "2 - 3 days",
  customerName: "Customer Name",
  address: "Jakarta Selatan, Indonesia",
};

const timeline = [
  {
    title: "Order Placed",
    description: "Your order has been received by our system.",
    time: "Today, 10:15",
    active: true,
    icon: CheckCircle2,
  },
  {
    title: "Payment Confirmed",
    description: "Payment has been confirmed successfully.",
    time: "Today, 10:28",
    active: true,
    icon: CheckCircle2,
  },
  {
    title: "Order Packed",
    description: "Your item has been packed and prepared for delivery.",
    time: "Today, 14:10",
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
];

export default function TrackOrderPage() {
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
                <form className="grid gap-4">
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
                        placeholder="Example: ORD-2024-0001"
                        className="h-12 rounded-none border-zinc-300 bg-white pl-10"
                      />
                    </div>
                  </div>

                  <Button className="h-12 rounded-none bg-black text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800">
                    Track Order
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

          <OrderStatusCard />
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

function OrderStatusCard() {
  return (
    <Card className="rounded-none border-zinc-200 shadow-none">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Sample Result
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">
              {sampleOrder.orderNumber}
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Customer: {sampleOrder.customerName}
            </p>
          </div>

          <div className="w-fit rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
            {sampleOrder.status}
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-4 sm:grid-cols-2">
          <OrderMeta label="Courier" value={sampleOrder.courier} />
          <OrderMeta
            label="Tracking Number"
            value={sampleOrder.trackingNumber}
          />
          <OrderMeta
            label="Estimated Arrival"
            value={sampleOrder.estimatedArrival}
          />
          <OrderMeta label="Destination" value={sampleOrder.address} />
        </div>

        <Separator className="my-6" />

        <div>
          <h3 className="text-sm font-black uppercase tracking-wide">
            Tracking Timeline
          </h3>

          <div className="mt-6 space-y-6">
            {timeline.map((item, index) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="relative flex gap-4">
                  {index !== timeline.length - 1 && (
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
