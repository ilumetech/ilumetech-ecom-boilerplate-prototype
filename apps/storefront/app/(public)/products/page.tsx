import ProductGrid from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/api/product";
import { Filter, ChevronDown } from "lucide-react";

interface ProductsPageProps {
  searchParams: Promise<{
    productCategoryId?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const sortField = params.sort === "price" ? "sellingPrice" : "createdAt";
  const response = await getProducts({
    limit: 24,
    productCategoryId: params.productCategoryId,
    search: params.search,
    sortField,
    sortOrder: sortField === "createdAt" ? "desc" : "asc",
  });
  const products = response.data;
  const categories = [
    ...new Set(products.map((product) => product.productCategory.name)),
  ];
  const colors = [
    ...new Set(
      products.flatMap(
        (product) =>
          product.options
            ?.find((option) => option.name.toLowerCase() === "color")
            ?.values.map((value) => value.value) ?? [],
      ),
    ),
  ];

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:py-12">
        {/* Header Section */}
        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <nav className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <a href="/" className="hover:text-black transition-colors">
                Home
              </a>
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
            <Button
              variant="outline"
              className="h-10 rounded-none border-zinc-200 text-xs font-bold uppercase tracking-widest hover:border-black"
            >
              <Filter className="mr-2 h-3.5 w-3.5" />
              Filters
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-none border-zinc-200 text-xs font-bold uppercase tracking-widest hover:border-black"
            >
              Sort By
              <ChevronDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          {/* Sidebar - Desktop Only */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-8">
              <FilterGroup
                title="Categories"
                items={categories.length > 0 ? categories : ["All Products"]}
              />
              <FilterGroup
                title="Price"
                items={[
                  "Under Rp1.000.000",
                  "Rp1.000.000 - Rp2.000.000",
                  "Over Rp2.000.000",
                ]}
              />
              <FilterGroup
                title="Color"
                items={colors.length > 0 ? colors : ["All Colors"]}
              />
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

function FilterGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-900">
        {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item}>
            <label className="flex items-center gap-3 group cursor-pointer">
              <div className="h-4 w-4 border border-zinc-300 transition-colors group-hover:border-black" />
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-500 transition-colors group-hover:text-black">
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
