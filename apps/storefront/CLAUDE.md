# apps/storefront — Next.js Public Ecommerce Site

# Inherits all rules from root CLAUDE.md.

# Rules here are specific to the public-facing storefront app.

## Purpose

The storefront is the public-facing ecommerce site.
It serves customers browsing products, managing their cart, checking out, and viewing orders.
It is NOT an admin tool — keep it fast, beautiful, and SEO-optimized.

## Stack

- Next.js App Router (no Pages Router — never use pages/)
- TypeScript only
- Shadcn/ui for all UI components
- Tailwind CSS for all styling
- TanStack Query (React Query) for client-side data fetching (cart, user-specific data)
- Clerk for customer auth — use @clerk/nextjs hooks and middleware
- Next.js Metadata API for SEO — no third-party SEO libraries

## Folder Structure

apps/storefront/
app/
(public)/ Public routes — no auth required
page.tsx Homepage
products/ Product listing and detail pages
page.tsx Product catalog
[slug]/page.tsx Product detail (SSR for SEO)
cart/ Cart page
checkout/ Checkout flow
(customer)/ Protected routes — requires customer auth
account/ Customer account (orders, profile, addresses)
layout.tsx Root layout (font, theme, global styles)
components/
ui/ Shadcn/ui component wrappers and extensions
layout/ Header, Footer, Navigation
product/ Product card, product grid, product detail
cart/ Cart drawer, cart item, cart summary
checkout/ Checkout form steps
lib/
api/ Typed API service functions (one file per domain)
hooks/ Custom React hooks
utils/ Helper functions
types/ Storefront-only types (import shared types from packages/types)

## Rendering Strategy

- Product catalog pages → Server Components (SSR/SSG for SEO)
- Product detail pages → Server Components with generateStaticParams for SSG
- Cart, wishlist, account pages → Client Components (user-specific, no SEO value)
- Never use TanStack Query in Server Components — fetch directly in the component
- Use TanStack Query only for client-side user-specific data (cart, account)

## Component Rules

- Default to Server Components — only add "use client" when necessary
- "use client" is required for: useState, useEffect, event handlers, TanStack Query hooks, all Shadcn interactive components
- Keep components small — if a component exceeds ~150 lines, split it
- No inline styles — use Tailwind utility classes only
- No hardcoded colors — use Tailwind semantic color tokens defined in tailwind.config.ts

## Shadcn Usage Rules

- Use Shadcn for all interactive UI: buttons, inputs, dialogs, dropdowns, sheets, toasts
- Never build custom components for things Shadcn already covers
- Extend Shadcn components via className — never modify the base component file
- Use Shadcn Sheet for cart drawer
- Use Shadcn Dialog for quick view modals
- Use Shadcn Toast (Sonner) for all feedback messages

## SEO Rules (non-negotiable for ecommerce)

- Every page must export a generateMetadata function or static metadata object
- Product detail pages must include: title, description, openGraph image, canonical URL
- Product detail pages must include JSON-LD structured data (Product schema)
- Homepage and catalog pages must include JSON-LD structured data (WebSite/ItemList schema)
- app/sitemap.ts must exist and include all product slugs and static pages
- app/robots.ts must exist
- Never block indexing on public pages — only block /account and /checkout

## Metadata Pattern

// Static metadata
export const metadata: Metadata = {
title: 'Store Name',
description: 'Store description',
}

// Dynamic metadata (product pages)
export async function generateMetadata({ params }): Promise<Metadata> {
const product = await getProduct(params.slug)
return {
title: product.name,
description: product.description,
openGraph: { images: [product.image] },
}
}

## JSON-LD Pattern (Product Pages)

// Add as a script tag in the page component — no library needed
const jsonLd = {
'@context': 'https://schema.org',
'@type': 'Product',
name: product.name,
description: product.description,
image: product.image,
offers: {
'@type': 'Offer',
price: product.sellingPrice,
priceCurrency: 'IDR',
availability: product.stock > 0
? 'https://schema.org/InStock'
: 'https://schema.org/OutOfStock',
},
}

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>

## Data Fetching Rules
- All API calls go through lib/api/ service functions — never raw fetch in components
- Server Components fetch directly via lib/api/ service functions (no TanStack Query)
- Client Components use TanStack Query for all data fetching
- Query keys must be consistent: ['module', 'list', filters] or ['module', 'detail', id]
- Always handle loading and error states
- Mutations must invalidate relevant queries on success

## Auth Rules
- proxy.ts handles route protection — never create middleware.ts
- Exported function must be named proxy, not middleware
- proxy.ts runs on Node.js runtime only — do not configure edge runtime
- Use useAuth() and useUser() from @clerk/nextjs for auth state in client components
- Never store auth tokens manually — Clerk handles this
- Protect /account/* routes only — all product and catalog pages are public
- Customer model in Postgres is synced from Clerk via webhook — never create customers manually

## Cart Rules
- Cart state lives in client-side state (TanStack Query + optimistic updates)
- Cart is persisted in the database — not localStorage
- Guest cart is allowed — associate with customer on login
- Cart drawer uses Shadcn Sheet component

## Performance Rules
- Use next/image for all images — never raw <img> tags
- Use next/font for all fonts — never load fonts via CSS @import
- Lazy load below-the-fold components with next/dynamic
- Product images must have explicit width and height to prevent layout shift
- Never block the main thread with heavy client-side JS on catalog pages

## UX Constraints
- Never show raw error messages to customers — always show friendly Indonesian messages
- Loading states must be present on all async actions (add to cart, checkout, etc.)
- Mobile-first — design for mobile, enhance for desktop
- All prices displayed in IDR format (Rp 100.000)
- Empty states must be meaningful — never show a blank page

## Label Mapping
- lib/labels/[entity].ts is the single source of truth for all Indonesian display labels
- Never hardcode Indonesian labels inline in components

## What Claude should always ask before doing
- Adding a new pnpm dependency
- Creating a new top-level folder in apps/storefront/
- Changing the SEO or metadata structure
- Adding a new auth flow or changing middleware
- Changing the cart or checkout flow
- Adding any analytics or tracking scripts
