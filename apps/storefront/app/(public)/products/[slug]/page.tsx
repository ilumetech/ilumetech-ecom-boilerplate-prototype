// app/products/[slug]/page.tsx
import Link from "next/link";
import {
  Heart,
  Minus,
  Plus,
  MessageCircle,
  Truck,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RelatedProductCard } from "@/components/product/related-product-card";

const product = {
  name: "Product Name",
  code: "STPN-001",
  price: "Rp1.299.000",
  colorway: "Colorway",
  description:
    "A clean everyday sneaker designed for comfort, durability, and simple styling. Built for daily movement with a versatile silhouette.",
  sizes: ["38", "39", "40", "41", "42", "43", "44"],
  colors: ["Black", "White", "Grey"],
};

const relatedProducts = Array.from({ length: 4 }, (_, index) => ({
  id: index + 1,
  name: "Product Name",
  colorway: "Colorway",
  price: "Rp1.299.000",
}));

export default function ProductDetailPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-black">
            Products
          </Link>
          <span>/</span>
          <span className="text-black">{product.name}</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16 xl:gap-24">
          <ProductGallery />
          <ProductInfo />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black uppercase tracking-tight md:text-2xl">
            You May Also Like
          </h2>
          <Link
            href="/products"
            className="text-xs font-semibold uppercase tracking-wide underline underline-offset-4"
          >
            View All →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {relatedProducts.map((item) => (
            <RelatedProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </>
  );
}

function ProductGallery() {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="aspect-[4/5] w-full bg-zinc-100 object-cover"
        />
      ))}
    </div>
  );
}

function ProductInfo() {
  return (
    <div className="lg:sticky lg:top-32 lg:self-start lg:pb-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge
            variant="outline"
            className="rounded-none border-black text-[10px] uppercase tracking-wide"
          >
            New Arrival
          </Badge>
          <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm uppercase tracking-wide text-zinc-500">
            {product.colorway}
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-none border-zinc-300"
        >
          <Heart className="h-5 w-5" />
          <span className="sr-only">Add to wishlist</span>
        </Button>
      </div>

      <p className="mt-6 text-2xl font-bold">{product.price}</p>
      <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-700">
        {product.description}
      </p>

      <Separator className="my-7" />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide">
            Select Size
          </h2>
          <Link
            href="/size-guide"
            className="text-xs font-semibold underline underline-offset-4"
          >
            Size Guide
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {product.sizes.map((size) => (
            <button
              key={size}
              className="h-11 rounded-none border border-zinc-300 text-sm font-semibold transition hover:border-black hover:bg-black hover:text-white"
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide">
          Color
        </h2>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((color) => (
            <button
              key={color}
              className="rounded-none border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition hover:border-black hover:bg-black hover:text-white"
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide">
          Quantity
        </h2>
        <div className="flex h-12 w-36 items-center justify-between border border-zinc-300">
          <button className="flex h-full w-12 items-center justify-center hover:bg-zinc-100">
            <Minus className="h-4 w-4" />
            <span className="sr-only">Decrease quantity</span>
          </button>
          <span className="text-sm font-semibold">1</span>
          <button className="flex h-full w-12 items-center justify-center hover:bg-zinc-100">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Increase quantity</span>
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Button className="h-12 rounded-none bg-black text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800">
          Add to Cart
        </Button>
        <Button
          variant="outline"
          className="h-12 rounded-none border-black text-xs font-semibold uppercase tracking-wide hover:bg-black hover:text-white"
        >
          Buy Now
        </Button>
      </div>

      <Button
        variant="outline"
        className="mt-3 h-12 w-full rounded-none border-zinc-300 text-xs font-semibold uppercase tracking-wide hover:border-black"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Order via WhatsApp
      </Button>

      <div className="mt-7 grid gap-3 text-sm text-zinc-700">
        <ProductBenefit
          icon={ShieldCheck}
          title="Official Product"
          description="Sold directly from the official store."
        />
        <ProductBenefit
          icon={Truck}
          title="Delivery Support"
          description="Regular and instant courier options available."
        />
        <ProductBenefit
          icon={RotateCcw}
          title="Size Exchange"
          description="Exchange size based on store policy and stock availability."
        />
      </div>

      <Separator className="my-7" />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="details">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wide">
            Product Details
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-7 text-zinc-700">
            Product code: {product.code}. This product uses a clean placeholder
            layout so sellers can replace images, descriptions, and product
            specifications easily.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shipping">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wide">
            Shipping Information
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-7 text-zinc-700">
            Shipping fees and delivery estimates will be calculated during
            checkout based on the customer address and selected courier.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="returns">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wide">
            Returns & Exchange
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-7 text-zinc-700">
            Size exchange is available according to store policy. Products must
            be unused, complete, and returned with original packaging.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function ProductBenefit({
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
