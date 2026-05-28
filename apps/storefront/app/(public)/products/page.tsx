import Link from "next/link";
import ProductGrid from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { getProducts, getProductColors } from "@/lib/api/product";
import { getProductCategories } from "@/lib/api/category";
import { Filter } from "lucide-react";
import CatalogFilters from "@/components/product/catalog-filters";
import SortDropdown from "@/components/product/sort-dropdown";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ProductsPageProps {
  searchParams: Promise<{
    productCategoryId?: string;
    search?: string;
    sort?: string;
    color?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const sortField = params.sort === "price" ? "sellingPrice" : "createdAt";

  const [response, categories, colors] = await Promise.all([
    getProducts({
      limit: 24,
      productCategoryId: params.productCategoryId,
      search: params.search,
      color: params.color,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      sortField,
      sortOrder: sortField === "createdAt" ? "desc" : "asc",
    }),
    getProductCategories().catch(() => []),
    getProductColors().catch(() => []),
  ]);

  const products = response.data;

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:py-12">
        {/* Header Section */}
        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <nav className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <Link href="/" className="hover:text-black transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-black">All Products</span>
            </nav>
            <h1 className="text-4xl font-black uppercase tracking-tight md:text-5xl lg:text-6xl">
              Catalog
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600">
              Explore our latest collection of premium sneakers, designed for
              comfort and built for style. Every pair is 100% original.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Sheet Trigger for Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 rounded-none border-zinc-200 text-xs font-bold uppercase tracking-widest hover:border-black lg:hidden"
                >
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-white p-6">
                <SheetHeader>
                  <SheetTitle className="text-left font-black uppercase tracking-tight">
                    Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
                  <CatalogFilters categories={categories} colors={colors} />
                </div>
              </SheetContent>
            </Sheet>

            <SortDropdown />
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          {/* Sidebar - Desktop Only */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <CatalogFilters categories={categories} colors={colors} />
            </div>
          </aside>

          {/* Grid Area */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Showing {products.length} Products
              </span>
            </div>
            <ProductGrid products={products} />
          </div>
        </div>
      </div>
    </>
  );
}
