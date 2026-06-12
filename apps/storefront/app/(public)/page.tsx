// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Award, Box, Headphones, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { getProducts } from "@/lib/api/product";
import { getProductCategories } from "@/lib/api/category";

const trustItems = [
  {
    title: "100% Original",
    description: "Guarantee original products",
    icon: Award,
  },
  {
    title: "Quality Materials",
    description: "Built to last",
    icon: Box,
  },
  {
    title: "Fast & Safe Delivery",
    description: "Across Indonesia",
    icon: Truck,
  },
  {
    title: "Easy Customer Care",
    description: "Chat with us anytime",
    icon: Headphones,
  },
];

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getProducts({
      limit: 4,
      sortField: "createdAt",
      sortOrder: "desc",
    }),
    getProductCategories().catch(() => []),
  ]);

  const displayedCategories = categories.slice(0, 4);

  return (
    <>
      <section className="relative w-full h-[600px] md:h-[650px] lg:h-[700px] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero.png"
            alt="Hero Background"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Elegant Dark Vignette/Overlay for Text Readability without covering the starry details */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent md:from-black/75 md:via-black/35" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 md:px-6 text-white">
          <div className="max-w-xl">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
              Premium Sneakers
            </p>

            <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl lg:text-7xl text-white">
              Shoeting<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                Stars.
              </span>
            </h1>

            <p className="mt-6 max-w-sm text-base leading-7 text-zinc-300">
              Discover curated collections of elite sneakers designed for ultimate comfort and iconic street style.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-none bg-white px-9 text-xs font-semibold uppercase tracking-wide text-black transition-all duration-300 hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              >
                <Link href="/products">Shop Now</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 rounded-none border-white bg-transparent px-9 text-xs font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              >
                <Link href="/products?category=new-arrival">New Arrival</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 py-4 md:grid-cols-4 md:px-6">
          {trustItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={`flex gap-4 py-4 md:px-6 ${index !== trustItems.length - 1
                    ? "md:border-r md:border-zinc-200"
                    : ""
                  }`}
              >
                <Icon className="h-8 w-8 shrink-0 stroke-[1.5]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <SectionHeader title="Shop by Category" href="/categories" />

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {displayedCategories.map((category) => (
            <Link
              key={category.id}
              href={`/products?productCategoryId=${category.id}`}
              className="group block"
            >
              <div className="aspect-square rounded-md bg-gradient-to-br from-zinc-100 to-zinc-200 transition group-hover:opacity-80 flex items-center justify-center border border-zinc-200 shadow-sm">
                <span className="text-4xl font-black text-zinc-300 uppercase tracking-widest select-none">
                  {category.name.substring(0, 2)}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-800">
                  {category.name}
                </h3>
                <span className="text-sm transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <SectionHeader title="Best Seller" href="/products" />

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
          {products.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl px-4 py-10 md:grid-cols-2 md:px-6 lg:py-14">
        <div className="min-h-56 rounded-t-md bg-gradient-to-br from-zinc-100 to-zinc-200 md:rounded-l-md md:rounded-tr-none" />

        <div className="flex min-h-56 flex-col justify-center rounded-b-md bg-zinc-50 p-7 md:rounded-r-md md:rounded-bl-none lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Member Update
          </p>
          <h2 className="mt-4 max-w-md text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
            Join our community.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-zinc-700">
            Get product updates, exclusive drops, and customer support directly
            through WhatsApp.
          </p>
          <Button className="mt-6 w-fit rounded-none bg-black px-7 text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800">
            Join via WhatsApp
          </Button>
        </div>
      </section>
    </>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-black uppercase tracking-tight md:text-2xl">
        {title}
      </h2>
      <Link
        href={href}
        className="text-xs font-semibold uppercase tracking-wide underline underline-offset-4"
      >
        View All →
      </Link>
    </div>
  );
}
