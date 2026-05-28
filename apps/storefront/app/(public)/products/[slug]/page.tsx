import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Heart,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RelatedProductCard } from "@/components/product/related-product-card";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import {
  getProductBySlug,
  getProducts,
  type StorefrontProduct,
} from "@/lib/api/product";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const primaryImage = product.images?.[0];

  return {
    title: product.name,
    description: product.description ?? `${product.name} product detail`,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description: product.description ?? `${product.name} product detail`,
      images: primaryImage ? [primaryImage.url] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);

  if (!product) notFound();

  const relatedResponse = await getProducts({
    limit: 5,
    productCategoryId: product.productCategoryId,
  });
  const relatedProducts = relatedResponse.data
    .filter((item) => item.id !== product.id)
    .slice(0, 4);
  const jsonLd = buildProductJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-black">
            Products
          </Link>
          <span>/</span>
          <span className="text-black">{product.name}</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16 xl:gap-24">
          <ProductGallery product={product} />
          <ProductInfo product={product} />
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black uppercase tracking-tight md:text-2xl">
              You May Also Like
            </h2>
            <Link
              href="/products"
              className="text-xs font-semibold uppercase tracking-wide underline underline-offset-4"
            >
              View All
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {relatedProducts.map((item) => (
              <RelatedProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function ProductGallery({ product }: { product: StorefrontProduct }) {
  const images = product.images?.slice(0, 4) ?? [];

  if (images.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 md:gap-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="aspect-[4/5] w-full bg-zinc-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-5">
      {images.map((image) => (
        <div
          key={image.id}
          className="aspect-[4/5] w-full overflow-hidden bg-zinc-100"
        >
          <div
            role="img"
            aria-label={image.alt ?? product.name}
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${image.url})` }}
          />
        </div>
      ))}
    </div>
  );
}

function ProductInfo({ product }: { product: StorefrontProduct }) {
  const primaryVariant = product.variants?.find((variant) => variant.isActive);
  const colorway =
    primaryVariant?.optionValues
      .filter((optionValue) => {
        const lowerName = optionValue.optionName.toLowerCase();
        return lowerName.includes("color") || lowerName.includes("colour") || lowerName.includes("warna");
      })
      .map((optionValue) => optionValue.value)
      .join(" / ") || product.productCategory.name;

  return (
    <div className="lg:sticky lg:top-32 lg:self-start lg:pb-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge
            variant="outline"
            className="rounded-none border-black text-[10px] uppercase tracking-wide"
          >
            {product.badge ?? product.productCategory.name}
          </Badge>
          <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm uppercase tracking-wide text-zinc-500">
            {colorway}
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-none border-zinc-300"
        >
          <Heart className="h-5 w-5" />
          <span className="sr-only">Add to wishlist</span>
        </Button>
      </div>

      <ProductPurchasePanel product={product} />

      <Separator className="my-7" />

      <div className="mt-7 grid gap-3 text-sm text-zinc-700">
        <ProductBenefit
          icon={ShieldCheck}
          title="Official Product"
          description="Sold directly from the official store."
        />
        <ProductBenefit
          icon={Truck}
          title="Delivery Support"
          description="Regular and instant courier options available."
        />
        <ProductBenefit
          icon={RotateCcw}
          title="Size Exchange"
          description="Exchange size based on store policy and stock availability."
        />
      </div>

      <Separator className="my-7" />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="details">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wide">
            Product Details
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-7 text-zinc-700">
            Product code: {product.code}. Category:{" "}
            {product.productCategory.name}. Weight:{" "}
            {product.weightGram ? `${product.weightGram} gram` : "Not listed"}.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shipping">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wide">
            Shipping Information
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-7 text-zinc-700">
            Shipping fees and delivery estimates will be calculated during
            checkout based on the customer address and selected courier.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="returns">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wide">
            Returns & Exchange
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-7 text-zinc-700">
            Size exchange is available according to store policy. Products must
            be unused, complete, and returned with original packaging.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function buildProductJsonLd(product: StorefrontProduct) {
  const primaryVariant = product.variants?.find((variant) => variant.isActive);
  const price = primaryVariant?.finalPrice ?? product.sellingPrice;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.name,
    image: product.images?.map((image) => image.url) ?? [],
    sku: primaryVariant?.sku ?? product.code,
    category: product.productCategory.name,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: `/products/${product.slug}`,
    },
  };
}

function ProductBenefit({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.7] text-black" />
      <div>
        <p className="font-semibold text-black">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-zinc-600">{description}</p>
      </div>
    </div>
  );
}
