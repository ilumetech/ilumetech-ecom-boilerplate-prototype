"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "newest";

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }
    // Reset page when sorting changes
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  const getSortLabel = () => {
    switch (currentSort) {
      case "price":
        return "Price: Low to High";
      case "newest":
      default:
        return "Newest";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 rounded-none border-zinc-200 text-xs font-bold uppercase tracking-widest hover:border-black"
        >
          Sort By: {getSortLabel()}
          <ChevronDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-none border-zinc-200 bg-white"
      >
        <DropdownMenuItem
          onClick={() => handleSortChange("newest")}
          className="text-xs font-bold uppercase tracking-wide cursor-pointer hover:bg-zinc-100"
        >
          Newest
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSortChange("price")}
          className="text-xs font-bold uppercase tracking-wide cursor-pointer hover:bg-zinc-100"
        >
          Price: Low to High
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
