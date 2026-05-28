"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ProductCategory } from "@ilumetech/types";

interface CatalogFiltersProps {
  categories: ProductCategory[];
  colors: string[];
}

export default function CatalogFilters({
  categories,
  colors,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategoryId = searchParams.get("productCategoryId") || "";
  const currentColor = searchParams.get("color") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Reset page when filters change
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  const handleCategoryChange = (categoryId: string) => {
    if (currentCategoryId === categoryId) {
      updateFilters({ productCategoryId: null });
    } else {
      updateFilters({ productCategoryId: categoryId });
    }
  };

  const handleColorChange = (color: string) => {
    if (currentColor.toLowerCase() === color.toLowerCase()) {
      updateFilters({ color: null });
    } else {
      updateFilters({ color });
    }
  };

  const handlePriceChange = (priceRange: string) => {
    let min: string | null = null;
    let max: string | null = null;

    if (priceRange === "under-1m") {
      max = "1000000";
    } else if (priceRange === "1m-2m") {
      min = "1000000";
      max = "2000000";
    } else if (priceRange === "over-2m") {
      min = "2000000";
    }

    const isActive =
      (priceRange === "under-1m" &&
        currentMaxPrice === "1000000" &&
        !currentMinPrice) ||
      (priceRange === "1m-2m" &&
        currentMinPrice === "1000000" &&
        currentMaxPrice === "2000000") ||
      (priceRange === "over-2m" && currentMinPrice === "2000000" && !currentMaxPrice);

    if (isActive) {
      updateFilters({ minPrice: null, maxPrice: null });
    } else {
      updateFilters({ minPrice: min, maxPrice: max });
    }
  };

  const isPriceRangeActive = (range: string) => {
    if (range === "under-1m") {
      return currentMaxPrice === "1000000" && !currentMinPrice;
    }
    if (range === "1m-2m") {
      return currentMinPrice === "1000000" && currentMaxPrice === "2000000";
    }
    if (range === "over-2m") {
      return currentMinPrice === "2000000" && !currentMaxPrice;
    }
    return false;
  };

  return (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-900">
          Categories
        </h3>
        <ul className="space-y-3">
          {categories.map((category) => (
            <li key={category.id}>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`cat-${category.id}`}
                  checked={currentCategoryId === category.id}
                  onCheckedChange={() => handleCategoryChange(category.id)}
                  className="rounded-none border-zinc-300 data-[state=checked]:bg-black data-[state=checked]:text-white"
                />
                <Label
                  htmlFor={`cat-${category.id}`}
                  className="text-xs font-bold uppercase tracking-wide text-zinc-500 cursor-pointer hover:text-black transition-colors"
                >
                  {category.name}
                </Label>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-900">
          Price Range
        </h3>
        <ul className="space-y-3">
          {[
            { label: "Under Rp1.000.000", value: "under-1m" },
            { label: "Rp1.000.000 - Rp2.000.000", value: "1m-2m" },
            { label: "Over Rp2.000.000", value: "over-2m" },
          ].map((range) => (
            <li key={range.value}>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`price-${range.value}`}
                  checked={isPriceRangeActive(range.value)}
                  onCheckedChange={() => handlePriceChange(range.value)}
                  className="rounded-none border-zinc-300 data-[state=checked]:bg-black data-[state=checked]:text-white"
                />
                <Label
                  htmlFor={`price-${range.value}`}
                  className="text-xs font-bold uppercase tracking-wide text-zinc-500 cursor-pointer hover:text-black transition-colors"
                >
                  {range.label}
                </Label>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Color */}
      <div>
        <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-900">
          Color
        </h3>
        <ul className="space-y-3">
          {colors.map((color) => (
            <li key={color}>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`color-${color}`}
                  checked={currentColor.toLowerCase() === color.toLowerCase()}
                  onCheckedChange={() => handleColorChange(color)}
                  className="rounded-none border-zinc-300 data-[state=checked]:bg-black data-[state=checked]:text-white"
                />
                <Label
                  htmlFor={`color-${color}`}
                  className="text-xs font-bold uppercase tracking-wide text-zinc-500 cursor-pointer hover:text-black transition-colors"
                >
                  {color}
                </Label>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
