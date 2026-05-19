// app/cart/page.tsx
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  MessageCircle,
  ArrowLeft,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

const cartItems = [
  {
    id: 1,
    name: "Product Name",
    colorway: "Black / White",
    size: "42",
    price: 1299000,
    quantity: 1,
  },
  {
    id: 2,
    name: "Product Name",
    colorway: "Grey",
    size: "40",
    price: 999000,
    quantity: 1,
  },
];

const subtotal = cartItems.reduce(
  (total, item) => total + item.price * item.quantity,
  0,
);
const shipping = 0;
const total = subtotal + shipping;

export default function CartPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <Link href="/" className="hover:text-black">
                Home
              </Link>
              <span>/</span>
              <span className="text-black">Cart</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
              Shopping Cart
            </h1>
          </div>

          <Button
            asChild
            variant="outline"
            className="hidden rounded-none border-black text-xs font-semibold uppercase tracking-wide hover:bg-black hover:text-white sm:inline-flex"
          >
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          <div>
            <div className="hidden border-b border-zinc-200 pb-4 text-xs font-bold uppercase tracking-wide text-zinc-500 md:grid md:grid-cols-[1fr_120px_120px_120px_40px] md:gap-4">
              <span>Product</span>
              <span className="text-center">Price</span>
              <span className="text-center">Quantity</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            <div className="divide-y divide-zinc-200">
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                asChild
                variant="outline"
                className="rounded-none border-black text-xs font-semibold uppercase tracking-wide hover:bg-black hover:text-white sm:hidden"
              >
                <Link href="/products">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>

              <Button
                variant="ghost"
                className="w-fit rounded-none px-0 text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:bg-transparent hover:text-black"
              >
                Clear Cart
              </Button>
            </div>
          </div>

          <OrderSummary />
        </div>
      </section>
    </>
  );
}

function CartItem({
  item,
}: {
  item: {
    name: string;
    colorway: string;
    size: string;
    price: number;
    quantity: number;
  };
}) {
  return (
    <div className="grid gap-4 py-6 md:grid-cols-[1fr_120px_120px_120px_40px] md:items-center md:gap-4">
      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 rounded-md bg-gradient-to-br from-zinc-100 to-zinc-200 md:h-28 md:w-28" />

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold uppercase tracking-wide md:text-base">
            {item.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{item.colorway}</p>
          <p className="mt-1 text-sm text-zinc-500">Size: {item.size}</p>

          <div className="mt-3 flex items-center gap-3 md:hidden">
            <QuantityControl quantity={item.quantity} />
            <button className="text-zinc-500 hover:text-black">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove item</span>
            </button>
          </div>
        </div>
      </div>

      <p className="hidden text-center text-sm font-semibold md:block">
        {formatPrice(item.price)}
      </p>

      <div className="hidden justify-center md:flex">
        <QuantityControl quantity={item.quantity} />
      </div>

      <div className="flex items-center justify-between md:block md:text-right">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500 md:hidden">
          Total
        </span>
        <p className="text-sm font-bold">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>

      <button className="hidden text-zinc-500 hover:text-black md:block">
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remove item</span>
      </button>
    </div>
  );
}

function QuantityControl({ quantity }: { quantity: number }) {
  return (
    <div className="flex h-10 w-32 items-center justify-between border border-zinc-300">
      <button className="flex h-full w-10 items-center justify-center hover:bg-zinc-100">
        <Minus className="h-4 w-4" />
        <span className="sr-only">Decrease quantity</span>
      </button>
      <span className="text-sm font-semibold">{quantity}</span>
      <button className="flex h-full w-10 items-center justify-center hover:bg-zinc-100">
        <Plus className="h-4 w-4" />
        <span className="sr-only">Increase quantity</span>
      </button>
    </div>
  );
}

function OrderSummary() {
  return (
    <Card className="sticky top-36 rounded-none border-zinc-200 shadow-none">
      <CardContent className="p-5 md:p-6">
        <h2 className="text-lg font-black uppercase tracking-tight">
          Order Summary
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="voucher"
              className="text-xs font-bold uppercase tracking-wide text-zinc-500"
            >
              Voucher Code
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                id="voucher"
                placeholder="Enter code"
                className="h-11 rounded-none border-zinc-300 bg-white"
              />
              <Button
                variant="outline"
                className="h-11 rounded-none border-black px-5 text-xs font-semibold uppercase hover:bg-black hover:text-white"
              >
                Apply
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Shipping</span>
              <span className="font-semibold">Calculated at checkout</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wide">
              Total
            </span>
            <span className="text-xl font-black">{formatPrice(total)}</span>
          </div>

          <Button
            asChild
            className="h-12 w-full rounded-none bg-black text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800"
          >
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>

          <Button
            variant="outline"
            className="h-12 w-full rounded-none border-zinc-300 text-xs font-semibold uppercase tracking-wide hover:border-black"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Checkout via WhatsApp
          </Button>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-3 text-sm text-zinc-700">
          <SummaryBenefit
            icon={ShieldCheck}
            title="Secure Checkout"
            description="Your order details are processed safely."
          />
          <SummaryBenefit
            icon={Truck}
            title="Delivery Options"
            description="Choose courier and shipping method during checkout."
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryBenefit({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.7] text-black" />
      <div>
        <p className="font-semibold text-black">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-zinc-600">{description}</p>
      </div>
    </div>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
