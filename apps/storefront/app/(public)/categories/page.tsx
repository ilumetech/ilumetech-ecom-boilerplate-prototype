import type { Metadata } from "next";
import Link from "next/link";
import { getProductCategories } from "@/lib/api/category";

export const metadata: Metadata = {
  title: "Shop by Category | Shoeting Stars Official Store",
  description: "Browse our collections of premium shoes and sneakers by category. Find sneakers, running shoes, slides, and casual footwear.",
};

export default async function CategoriesPage() {
  const categories = await getProductCategories().catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:py-12">
      {/* Header Section */}
      <div className="mb-10">
        <nav className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <Link href="/" className="hover:text-black transition-colors" id="nav-home">
            Home
          </Link>
          <span>/</span>
          <span className="text-black">Categories</span>
        </nav>
        <h1 className="text-4xl font-black uppercase tracking-tight md:text-5xl lg:text-6xl">
          Shop by Category
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600">
          Explore our collections tailored for every step of your journey. Each collection features 100% original designs crafted from premium materials.
        </p>
      </div>

      {/* Grid Section */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?productCategoryId=${category.id}`}
              className="group block"
              id={`cat-link-${category.id}`}
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
      ) : (
        <div className="text-center py-20 border border-dashed border-zinc-200 rounded-md">
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">
            No categories found.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            We are updating our catalog. Please check back later!
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex h-11 items-center justify-center bg-black px-6 text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800 transition-colors"
            id="fallback-all-products"
          >
            All Products
          </Link>
        </div>
      )}
    </div>
  );
}
