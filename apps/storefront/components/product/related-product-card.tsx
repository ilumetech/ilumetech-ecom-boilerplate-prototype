'use client'

import Link from 'next/link'

interface RelatedProductCardProps {
  product: {
    name: string
    colorway: string
    price: string
  }
}

export function RelatedProductCard({ product }: RelatedProductCardProps) {
  return (
    <Link href="/products/product-name" className="group block">
      <div className="relative aspect-square rounded-md bg-gradient-to-br from-zinc-100 to-zinc-200 transition group-hover:opacity-80">
        <button 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className="absolute right-3 top-3 text-lg leading-none text-zinc-500 hover:text-black"
        >
          ♡
          <span className="sr-only">Add to wishlist</span>
        </button>
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-semibold">{product.name}</h3>
        <p className="mt-1 text-xs text-zinc-500">{product.colorway}</p>
        <p className="mt-2 text-sm font-bold">{product.price}</p>
      </div>
    </Link>
  )
}
