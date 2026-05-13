// app/page.tsx
import Link from 'next/link'
import { Award, Box, Headphones, Truck, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/product/product-card'

const trustItems = [
  {
    title: '100% Original',
    description: 'Guarantee original products',
    icon: Award,
  },
  {
    title: 'Quality Materials',
    description: 'Built to last',
    icon: Box,
  },
  {
    title: 'Fast & Safe Delivery',
    description: 'Across Indonesia',
    icon: Truck,
  },
  {
    title: 'Easy Customer Care',
    description: 'Chat with us anytime',
    icon: Headphones,
  },
]

const categories = [
  { name: 'Sneakers', href: '/products?category=sneakers' },
  { name: 'Running', href: '/products?category=running' },
  { name: 'Slides', href: '/products?category=slides' },
  { name: 'Casual', href: '/products?category=casual' },
]

const products = Array.from({ length: 4 }, (_, index) => ({
  id: index + 1,
  name: 'Product Name',
  colorway: 'Colorway',
  price: 'Rp1.299.000',
}))

export default function HomePage() {
  return (
    <>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
        <div>
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Official Store
          </p>

          <h1 className="max-w-xl text-5xl font-black uppercase leading-none tracking-tight md:text-6xl lg:text-7xl">
            Built for every step.
          </h1>

          <p className="mt-6 max-w-sm text-base leading-7 text-zinc-700">
            Comfort, style, and quality sneakers for your everyday moves.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-none bg-black px-9 text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800"
            >
              <Link href="/products">Shop Now</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 rounded-none border-black px-9 text-xs font-semibold uppercase tracking-wide hover:bg-black hover:text-white"
            >
              <Link href="/products?category=new-arrival">New Arrival</Link>
            </Button>
          </div>
        </div>

        <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-zinc-100 to-zinc-200" />
      </section>

      <section className="border-y border-zinc-200">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 py-4 md:grid-cols-4 md:px-6">
          {trustItems.map((item, index) => {
            const Icon = item.icon

            return (
              <div
                key={item.title}
                className={`flex gap-4 py-4 md:px-6 ${
                  index !== trustItems.length - 1 ? 'md:border-r md:border-zinc-200' : ''
                }`}
              >
                <Icon className="h-8 w-8 shrink-0 stroke-[1.5]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-zinc-600">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <SectionHeader title="Shop by Category" href="/products" />

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {categories.map((category) => (
            <Link key={category.name} href={category.href} className="group block">
              <div className="aspect-square rounded-md bg-gradient-to-br from-zinc-100 to-zinc-200 transition group-hover:opacity-80" />
              <div className="mt-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wide">{category.name}</h3>
                <span className="text-sm transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <SectionHeader title="Best Seller" href="/products" />

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl px-4 py-10 md:grid-cols-2 md:px-6 lg:py-14">
        <div className="min-h-56 rounded-t-md bg-gradient-to-br from-zinc-100 to-zinc-200 md:rounded-l-md md:rounded-tr-none" />

        <div className="flex min-h-56 flex-col justify-center rounded-b-md bg-zinc-50 p-7 md:rounded-r-md md:rounded-bl-none lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Member Update</p>
          <h2 className="mt-4 max-w-md text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
            Join our community.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-zinc-700">
            Get product updates, exclusive drops, and customer support directly through WhatsApp.
          </p>
          <Button className="mt-6 w-fit rounded-none bg-black px-7 text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800">
            Join via WhatsApp
          </Button>
        </div>
      </section>

    </>
  )
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-black uppercase tracking-tight md:text-2xl">{title}</h2>
      <Link href={href} className="text-xs font-semibold uppercase tracking-wide underline underline-offset-4">
        View All →
      </Link>
    </div>
  )
}

