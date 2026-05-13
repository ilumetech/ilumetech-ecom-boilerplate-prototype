'use client'

import { ProductCard } from './product-card'

interface Product {
  id: number
  name: string
  colorway: string
  price: string
}

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center bg-zinc-50 p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
          <svg
            className="h-8 w-8 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">
          No items found
        </h3>
        <p className="mt-2 max-w-[280px] text-sm leading-6 text-zinc-500">
          We couldn't find any products matching your current selection. Try clearing your filters.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
      {products.map((product, index) => (
        <div 
          key={product.id} 
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}
