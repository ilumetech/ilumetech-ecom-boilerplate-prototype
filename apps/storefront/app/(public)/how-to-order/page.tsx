import Link from "next/link";
import {
  Search,
  ShoppingBag,
  UserCheck,
  CreditCard,
  Package,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const steps = [
  {
    title: "Browse & Choose",
    description:
      "Explore our curated collections. Select your favorite items and pick the right size or variant from the product page.",
    icon: Search,
  },
  {
    title: "Add to Cart",
    description:
      'Click "Add to Cart" and review your selection. You can continue shopping to find more items or proceed directly to checkout.',
    icon: ShoppingBag,
  },
  {
    title: "Shipping Details",
    description:
      "Provide your delivery address and contact information accurately. Choose your preferred shipping method from the available options.",
    icon: UserCheck,
  },
  {
    title: "Secure Payment",
    description:
      "Complete your purchase using our secure payment gateway. We support various payment methods for your convenience.",
    icon: CreditCard,
  },
  {
    title: "Order Tracking",
    description:
      'Once confirmed, you will receive an order ID. You can track your shipment status in the "Track Order" page until it reaches you.',
    icon: Package,
  },
];

export default function HowToOrderPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:py-10">
        <div className="mb-8 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>/</span>
          <span className="text-black">How To Order</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Shopping Guide
            </p>
            <h1 className="max-w-xl text-5xl font-black uppercase leading-none tracking-tight md:text-6xl lg:text-7xl">
              Easy steps to get yours.
            </h1>
          </div>

          <div className="max-w-xl lg:justify-self-end">
            <p className="text-base leading-8 text-zinc-700">
              We&apos;ve simplified the shopping process so you can get your
              favorite products faster. Follow this quick guide to complete your
              first order at our official store.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="relative">
          {/* Vertical line for desktop */}
          <div className="absolute left-[2rem] top-0 hidden h-full w-[1px] bg-zinc-200 md:block" />

          <div className="space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative flex flex-col gap-6 md:flex-row md:gap-12"
                >
                  <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center border border-zinc-200 bg-white">
                    <Icon className="h-8 w-8 stroke-[1.5]" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center bg-black text-[10px] font-bold text-white">
                      0{index + 1}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center">
                    <h3 className="text-xl font-black uppercase tracking-tight md:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 md:text-base">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="bg-black p-8 text-white md:p-14">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
                Ready to start shopping?
              </h2>
              <p className="mt-4 text-zinc-400">
                Explore our latest arrivals and experience a seamless shopping
                journey today.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
              <Button
                asChild
                className="h-14 rounded-none bg-white px-10 text-xs font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
              >
                <Link href="/products">
                  Shop All Products
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="grid overflow-hidden rounded-md border border-zinc-200 lg:grid-cols-2">
          <div className="min-h-72 bg-gradient-to-br from-zinc-100 to-zinc-200" />

          <div className="flex flex-col justify-center p-7 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Need Assistance?
            </p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
              Still have questions?
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-zinc-700">
              Our customer support team is available to help you with any part
              of the ordering process, from choosing the right size to tracking
              your delivery.
            </p>

            <Separator className="my-6" />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-none bg-black px-8 text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800"
              >
                <Link href="https://wa.me/6281234567890">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact WhatsApp
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-none border-black px-8 text-xs font-semibold uppercase tracking-wide hover:bg-black hover:text-white"
              >
                <Link href="/faq">Read FAQ</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
