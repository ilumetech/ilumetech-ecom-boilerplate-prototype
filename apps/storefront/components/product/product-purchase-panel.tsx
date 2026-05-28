"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, Minus, Plus, X } from "lucide-react";
import type { ProductVariant } from "@ilumetech/types";
import { Button } from "@/components/ui/button";
import type { StorefrontProduct } from "@/lib/api/product";
import { formatPrice } from "@/lib/utils/format-price";
import { useCart } from "@/lib/hooks/use-cart";
import { cn } from "@/lib/utils";


interface ProductPurchasePanelProps {
  product: StorefrontProduct;
}

type SelectedOptions = Record<string, string>;

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const { addItem, items } = useCart();
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
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const selectedVariant = useMemo(
    () => findSelectedVariant(activeVariants, selectedOptions),
    [activeVariants, selectedOptions],
  );
  const displayVariant = selectedVariant ?? defaultVariant;
  const stock = displayVariant?.stockOnHand ?? 0;
  const isOutOfStock = stock === 0;

  const colorway = Object.entries(selectedOptions)
    .filter(([key]) => {
      const lowerKey = key.toLowerCase();
      return lowerKey.includes("color") || lowerKey.includes("colour") || lowerKey.includes("warna");
    })
    .map(([, value]) => value)
    .join(" / ") || product.productCategory.name;

  const size = Object.entries(selectedOptions)
    .filter(([key]) => {
      const lowerKey = key.toLowerCase();
      return lowerKey.includes("size") || lowerKey.includes("ukuran");
    })
    .map(([, value]) => value)
    .join(", ") || "One Size";

  const existingCartItem = items.find(
    (item) =>
      item.productId === product.id &&
      item.colorway === colorway &&
      item.size === size,
  );
  const cartQuantity = existingCartItem?.quantity ?? 0;
  const remainingStock = Math.max(0, stock - cartQuantity);

  // Clamping quantity to remaining stock range during render to avoid synchronous useEffect setStates
  if (remainingStock === 0 && quantity !== 0) {
    setQuantity(0);
  } else if (remainingStock > 0 && quantity > remainingStock) {
    setQuantity(remainingStock);
  } else if (remainingStock > 0 && quantity === 0) {
    setQuantity(1);
  }
  const price = displayVariant?.finalPrice ?? product.sellingPrice;
  const compareAtPrice = displayVariant?.compareAtPrice;
  const hasUnavailableSelection = activeVariants.length > 0 && !selectedVariant;

  const whatsappMessage = buildWhatsappMessage({
    product,
    quantity,
    selectedOptions,
    selectedVariant: displayVariant,
  });

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
      stockOnHand: stock,
    });
    setShowToast(true);
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
      stockOnHand: stock,
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

      {displayVariant && !hasUnavailableSelection && (
        <div className="mt-3 flex items-center gap-2">
          {stock > 0 ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stock <= 5 ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${stock <= 5 ? "bg-amber-500" : "bg-emerald-500"}`}></span>
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${stock <= 5 ? "text-amber-600" : "text-emerald-600"}`}>
                {stock <= 5 ? `Only ${stock} left in stock - order soon` : `In Stock (${stock} available)`}
              </span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                Out of Stock
              </span>
            </>
          )}
        </div>
      )}

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
                    className={cn(
                      "h-11 min-w-12 rounded-none border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-300",
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-zinc-300 bg-white text-black hover:border-black hover:bg-black hover:text-white"
                    )}
                    data-selected={isSelected}
                  >
                    <span>
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
            disabled={quantity <= 1 || isOutOfStock || remainingStock <= 0}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="flex h-full w-12 items-center justify-center hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Minus className="h-4 w-4" />
            <span className="sr-only">Decrease quantity</span>
          </button>
          <span className="text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            disabled={quantity >= remainingStock || isOutOfStock || remainingStock <= 0}
            onClick={() => setQuantity((current) => current + 1)}
            className="flex h-full w-12 items-center justify-center hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Increase quantity</span>
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          disabled={hasUnavailableSelection || isOutOfStock || quantity > remainingStock || quantity === 0 || remainingStock <= 0}
          onClick={handleAddToCart}
          className="h-12 rounded-none bg-black text-xs font-semibold uppercase text-white hover:bg-zinc-800 disabled:bg-zinc-300"
        >
          {isOutOfStock
            ? "Out of Stock"
            : remainingStock <= 0
            ? "Max Qty in Cart"
            : "Add to Cart"}
        </Button>
        <Button
          type="button"
          disabled={hasUnavailableSelection || isOutOfStock || quantity > remainingStock || quantity === 0 || remainingStock <= 0}
          onClick={handleBuyNow}
          variant="outline"
          className="h-12 rounded-none border-black text-xs font-semibold uppercase hover:bg-black hover:text-white disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400"
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

      {/* Added to Cart Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-[100] w-auto md:w-96 bg-white border border-zinc-200 shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900">Added to Cart</p>
                <button
                  onClick={() => setShowToast(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded-full hover:bg-zinc-100 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mt-2 flex gap-3">
                {(displayVariant?.imageUrl || product.images?.[0]?.url) && (
                  <div className="h-12 w-12 shrink-0 overflow-hidden bg-zinc-100 border border-zinc-100 relative">
                    <Image
                      src={displayVariant?.imageUrl || product.images?.[0]?.url || ""}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-900 truncate">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {colorway} • {size}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-zinc-900">
                    {quantity} × {formatPrice(price)}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-none border-zinc-300 text-xs font-semibold uppercase h-9"
                >
                  <Link href="/cart" onClick={() => setShowToast(false)}>
                    View Cart
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="rounded-none bg-black text-white hover:bg-zinc-800 text-xs font-semibold uppercase h-9"
                >
                  <Link href="/checkout" onClick={() => setShowToast(false)}>
                    Checkout
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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

  return variants.find((variant) => {
    // 1. Try to match using optionValues relations if they are populated
    if (variant.optionValues && variant.optionValues.length > 0) {
      return selectedEntries.every(([optionName, value]) =>
        variant.optionValues.some(
          (optionValue) =>
            optionValue.optionName === optionName && optionValue.value === value,
        ),
      );
    }

    // 2. Fallback: match by parsing the variant name (e.g. "Merah" or "ppp / 42")
    const nameParts = variant.name.split("/").map((part) => part.trim().toLowerCase());
    return selectedEntries.every(([, value]) =>
      nameParts.includes(value.toLowerCase()),
    );
  });
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
