"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Minus, Plus } from "lucide-react";
import type { ProductVariant } from "@ilumetech/types";
import { Button } from "@/components/ui/button";
import type { StorefrontProduct } from "@/lib/api/product";
import { formatPrice } from "@/lib/utils/format-price";
import { useCart } from "@/lib/hooks/use-cart";


interface ProductPurchasePanelProps {
  product: StorefrontProduct;
}

type SelectedOptions = Record<string, string>;

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const { addItem } = useCart();
  const router = useRouter();

  const activeVariants = useMemo(
    () => product.variants?.filter((variant) => variant.isActive) ?? [],
    [product.variants],
  );
  const defaultVariant = activeVariants[0];
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(() =>
    buildDefaultSelectedOptions(product, defaultVariant),
  );

  const selectedVariant = useMemo(
    () => findSelectedVariant(activeVariants, selectedOptions),
    [activeVariants, selectedOptions],
  );
  const displayVariant = selectedVariant ?? defaultVariant;
  const price = displayVariant?.finalPrice ?? product.sellingPrice;
  const compareAtPrice = displayVariant?.compareAtPrice;
  const hasUnavailableSelection = activeVariants.length > 0 && !selectedVariant;
  const whatsappMessage = buildWhatsappMessage({
    product,
    quantity,
    selectedOptions,
    selectedVariant: displayVariant,
  });

  const colorway = Object.entries(selectedOptions)
    .filter(([key]) => key.toLowerCase() === "color")
    .map(([, value]) => value)
    .join(" / ") || product.productCategory.name;

  const size = Object.entries(selectedOptions)
    .filter(([key]) => key.toLowerCase() === "size")
    .map(([, value]) => value)
    .join(", ") || "One Size";

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: displayVariant?.id,
      name: product.name,
      slug: product.slug,
      colorway,
      size,
      price,
      quantity,
      imageUrl: displayVariant?.imageUrl || product.images?.[0]?.url,
    });
    router.push("/cart");
  };

  const handleBuyNow = () => {
    addItem({
      productId: product.id,
      variantId: displayVariant?.id,
      name: product.name,
      slug: product.slug,
      colorway,
      size,
      price,
      quantity,
      imageUrl: displayVariant?.imageUrl || product.images?.[0]?.url,
    });
    router.push("/checkout");
  };

  function handleOptionChange(optionName: string, value: string) {
    setSelectedOptions((current) => ({ ...current, [optionName]: value }));
  }

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-baseline gap-3">
        <p className="text-2xl font-bold">{formatPrice(price)}</p>
        {compareAtPrice && compareAtPrice > price ? (
          <p className="text-sm font-semibold text-zinc-500 line-through">
            {formatPrice(compareAtPrice)}
          </p>
        ) : null}
      </div>

      {displayVariant ? (
        <p className="mt-2 text-xs font-semibold uppercase text-zinc-500">
          SKU: {displayVariant.sku}
        </p>
      ) : null}

      <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-700">
        {product.description ?? "Product details will be updated soon."}
      </p>

      <div className="mt-7 grid gap-7">
        {product.options?.map((option) => (
          <div key={option.id}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase">{option.name}</h2>
              {option.name.toLowerCase() === "size" ? (
                <Link
                  href="/size-guide"
                  className="text-xs font-semibold underline underline-offset-4"
                >
                  Size Guide
                </Link>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isSelected = selectedOptions[option.name] === value.value;
                const isDisabled = !isOptionValueAvailable(
                  activeVariants,
                  selectedOptions,
                  option.name,
                  value.value,
                );

                return (
                  <button
                    key={value.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleOptionChange(option.name, value.value)}
                    className="h-11 min-w-12 rounded-none border border-zinc-300 px-4 text-sm font-semibold transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-300"
                    data-selected={isSelected}
                  >
                    <span className={isSelected ? "underline" : undefined}>
                      {value.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {hasUnavailableSelection ? (
        <p className="mt-4 text-sm font-semibold text-zinc-600">
          This option combination is currently unavailable.
        </p>
      ) : null}

      <div className="mt-7">
        <h2 className="mb-3 text-xs font-bold uppercase">Quantity</h2>
        <div className="flex h-12 w-36 items-center justify-between border border-zinc-300">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="flex h-full w-12 items-center justify-center hover:bg-zinc-100"
          >
            <Minus className="h-4 w-4" />
            <span className="sr-only">Decrease quantity</span>
          </button>
          <span className="text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((current) => current + 1)}
            className="flex h-full w-12 items-center justify-center hover:bg-zinc-100"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Increase quantity</span>
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          disabled={hasUnavailableSelection}
          onClick={handleAddToCart}
          className="h-12 rounded-none bg-black text-xs font-semibold uppercase text-white hover:bg-zinc-800 disabled:bg-zinc-300"
        >
          Add to Cart
        </Button>
        <Button
          type="button"
          disabled={hasUnavailableSelection}
          onClick={handleBuyNow}
          variant="outline"
          className="h-12 rounded-none border-black text-xs font-semibold uppercase hover:bg-black hover:text-white"
        >
          Buy Now
        </Button>
      </div>

      <Button
        asChild
        variant="outline"
        className="mt-3 h-12 w-full rounded-none border-zinc-300 text-xs font-semibold uppercase hover:border-black"
      >
        <Link href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Order via WhatsApp
        </Link>
      </Button>
    </div>
  );
}

function buildDefaultSelectedOptions(
  product: StorefrontProduct,
  defaultVariant: ProductVariant | undefined,
): SelectedOptions {
  const selectedOptions: SelectedOptions = {};

  product.options?.forEach((option) => {
    const variantValue = defaultVariant?.optionValues.find(
      (optionValue) => optionValue.optionName === option.name,
    );
    selectedOptions[option.name] = variantValue?.value ?? option.values[0]?.value ?? "";
  });

  return selectedOptions;
}

function findSelectedVariant(
  variants: NonNullable<StorefrontProduct["variants"]>,
  selectedOptions: SelectedOptions,
) {
  if (variants.length === 0) return undefined;
  const selectedEntries = Object.entries(selectedOptions).filter(
    ([, value]) => value !== "",
  );

  return variants.find((variant) =>
    selectedEntries.every(([optionName, value]) =>
      variant.optionValues.some(
        (optionValue) =>
          optionValue.optionName === optionName && optionValue.value === value,
      ),
    ),
  );
}

function isOptionValueAvailable(
  variants: NonNullable<StorefrontProduct["variants"]>,
  selectedOptions: SelectedOptions,
  optionName: string,
  value: string,
): boolean {
  if (variants.length === 0) return true;
  const nextOptions = { ...selectedOptions, [optionName]: value };
  return Boolean(findSelectedVariant(variants, nextOptions));
}

function buildWhatsappMessage({
  product,
  quantity,
  selectedOptions,
  selectedVariant,
}: {
  product: StorefrontProduct;
  quantity: number;
  selectedOptions: SelectedOptions;
  selectedVariant: ProductVariant | undefined;
}): string {
  const optionSummary = Object.entries(selectedOptions)
    .filter(([, value]) => value !== "")
    .map(([optionName, value]) => `${optionName}: ${value}`)
    .join(", ");
  const skuSummary = selectedVariant ? ` SKU: ${selectedVariant.sku}.` : "";
  const optionText = optionSummary ? ` Options: ${optionSummary}.` : "";

  return `Hi, I want to order ${product.name}.${skuSummary}${optionText} Quantity: ${quantity}.`;
}
