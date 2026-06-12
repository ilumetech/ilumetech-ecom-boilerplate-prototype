// app/about/page.tsx
import Link from "next/link";
import {
  Award,
  HeartHandshake,
  ShieldCheck,
  Truck,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const values = [
  {
    title: "Original Products",
    description:
      "Every product is selected and sold through our official store channel.",
    icon: ShieldCheck,
  },
  {
    title: "High Quality",
    description:
      "We focus on products that are easy to use, easy to style, and made for daily life.",
    icon: Award,
  },
  {
    title: "Customer First",
    description:
      "Need help with sizing, order status, or exchange? Our team is ready to assist you.",
    icon: HeartHandshake,
  },
  {
    title: "Reliable Delivery",
    description:
      "We support clear order updates and delivery options for customers across Indonesia.",
    icon: Truck,
  },
];

const stats = [
  { value: "100%", label: "Official Store" },
  { value: "24h", label: "Order Processing" },
  { value: "ID", label: "Shipping Area" },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:py-10">
        <div className="mb-8 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>/</span>
          <span className="text-black">About Us</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              About Our Store
            </p>
            <h1 className="max-w-xl text-5xl font-black uppercase leading-none tracking-tight md:text-6xl lg:text-7xl">
              Built for your daily steps.
            </h1>
          </div>

          <div className="max-w-xl lg:justify-self-end">
            <p className="text-base leading-8 text-zinc-700">
              Shoeting Stars is an official brand store built for people who want
              simple, versatile, and high-quality products for everyday life. We
              keep the shopping experience clean, direct, and easy — from
              product discovery to checkout and after-sales support.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-none bg-black px-8 text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800"
              >
                <Link href="/products">Shop Products</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 rounded-none border-black px-8 text-xs font-semibold uppercase tracking-wide hover:bg-black hover:text-white"
              >
                <Link href="https://wa.me/6281234567890">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat With Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:py-12">
        <div className="aspect-[16/7] rounded-md bg-gradient-to-br from-zinc-100 to-zinc-200" />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Our Story
            </p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
              A cleaner way to shop directly from the brand.
            </h2>
          </div>

          <div className="space-y-5 text-sm leading-7 text-zinc-700 md:text-base md:leading-8">
            <p>
              We created this store as a direct official experience for
              customers who already know what they want: clear products, clear
              specifications, simple checkout, and reliable support.
            </p>
            <p>
              Instead of making the shopping journey complicated, we focus on
              the essentials — product quality, accurate information, smooth
              ordering, and helpful customer care when you need it.
            </p>
            <p>
              Whether you are buying your first pair or coming back for another
              one, our goal is to make every step feel easy.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-zinc-200 px-4 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-6">
          {stats.map((stat) => (
            <div key={stat.label} className="py-8 text-center md:py-10">
              <p className="text-4xl font-black uppercase tracking-tight md:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              What We Stand For
            </p>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-tight md:text-4xl">
              Our Values
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => {
            const Icon = value.icon;

            return (
              <div
                key={value.title}
                className="rounded-md border border-zinc-200 p-6"
              >
                <Icon className="h-9 w-9 stroke-[1.5]" />
                <h3 className="mt-6 text-sm font-bold uppercase tracking-wide">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="grid overflow-hidden rounded-md border border-zinc-200 lg:grid-cols-2">
          <div className="min-h-72 bg-gradient-to-br from-zinc-100 to-zinc-200" />

          <div className="flex flex-col justify-center p-7 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Need Help?
            </p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
              We’re here before and after checkout.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-zinc-700">
              Ask us about size recommendations, product availability, shipping
              status, or exchange policy through WhatsApp.
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
