"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/lib/hooks/use-cart";
import {
  validatePromoCode,
  usePromoCode,
  type PromoCodeValidationResult,
} from "@/lib/api/promo-code";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { createOrder } from "@/lib/api/order";

export default function CheckoutPage() {
  const { items: cartItems, clearCart, isLoaded } = useCart();
  const router = useRouter();
  const { isSignedIn, getToken, isLoaded: isAuthLoaded } = useAuth();
  const { user } = useUser();

  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeValidationResult | null>(null);
  const [isPromoValidating, setIsPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("JKT");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("ID");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Protect route
  useEffect(() => {
    if (isAuthLoaded && !isSignedIn) {
      router.push(`/sign-in?redirect_url=/checkout`);
    }
  }, [isAuthLoaded, isSignedIn, router]);

  // Pre-populate user details
  useEffect(() => {
    if (user) {
      setEmail(user.primaryEmailAddress?.emailAddress || "");
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const discount = appliedPromo ? appliedPromo.discountAmount : 0;
  const shipping = shippingMethod === "standard" ? 50000 : 100000;
  const total = Math.max(0, subtotal - discount + shipping);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsPromoValidating(true);
    setPromoError(null);
    try {
      const result = await validatePromoCode(promoCodeInput.trim(), subtotal);
      setAppliedPromo(result);
    } catch (e: any) {
      setPromoError(e.message || "Failed to apply promo code");
      setAppliedPromo(null);
    } finally {
      setIsPromoValidating(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError(null);
  };

  const handlePayNow = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/checkout`);
      return;
    }

    if (!email || !firstName || !lastName || !addressLine1 || !city || !province || !postalCode) {
      alert("Please fill in all required shipping and contact details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Could not retrieve authentication token.");

      const orderItems = cartItems
        .filter((item) => item.variantId)
        .map((item) => ({
          productVariantId: item.variantId!,
          quantity: item.quantity,
        }));

      if (orderItems.length === 0) {
        throw new Error("No valid variants in the cart to place an order.");
      }

      const orderInput = {
        items: orderItems,
        customerEmail: email,
        customerName: `${firstName} ${lastName}`.trim(),
        customerPhone: phone || undefined,
        shippingAddress: {
          firstName,
          lastName,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          province,
          postalCode,
          country,
        },
        shippingMethod: shippingMethod === "standard" ? "Standard Delivery" : "Express Delivery",
        shippingAmount: shipping,
        promoCode: appliedPromo?.code || undefined,
      };

      const order = await createOrder(orderInput, token);

      clearCart();
      router.push(`/success?orderId=${order.id}`);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || !isAuthLoaded) {
    return (
      <main className="min-h-screen bg-zinc-50 text-black flex flex-col">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
            <Link
              href="/"
              className="text-xl font-black uppercase tracking-tighter"
            >
              Brand<span className="text-zinc-500">Name</span>
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Lock className="h-4 w-4" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-black" />
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            Loading checkout...
          </p>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-50 text-black flex flex-col">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
            <Link
              href="/"
              className="text-xl font-black uppercase tracking-tighter"
            >
              Brand<span className="text-zinc-500">Name</span>
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Lock className="h-4 w-4" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-4">
          <CheckCircle2 className="mx-auto h-16 w-16 text-zinc-300 stroke-[1.2] mb-6" />
          <h1 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
            Your Checkout is Empty
          </h1>
          <p className="mt-3 text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
            There are no items in your cart to checkout.
          </p>
          <Button
            asChild
            className="mt-8 rounded-none bg-black px-8 py-6 text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800"
          >
            <Link href="/products">
              Browse Products
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-black">
      {/* Checkout Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link
            href="/"
            className="text-xl font-black uppercase tracking-tighter"
          >
            Brand<span className="text-zinc-500">Name</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <Lock className="h-4 w-4" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:py-12">
        <div className="mb-8 hidden items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:flex">
          <Link href="/cart" className="hover:text-black">
            Cart
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-black">Information & Shipping</span>
          <ChevronRight className="h-3 w-3" />
          <span>Payment</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
          {/* Left Column - Forms */}
          <div className="space-y-8">
            {/* Contact Information */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tight">
                  Contact
                </h2>
                <Link
                  href="/login"
                  className="text-sm text-zinc-500 underline hover:text-black"
                >
                  Log in
                </Link>
              </div>
              <div className="space-y-3">
                <div className="grid gap-2">
                  <Input
                    type="email"
                    placeholder="Email or mobile phone number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-none border-zinc-300 bg-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="marketing"
                    className="rounded-none border-zinc-300 data-[state=checked]:bg-black data-[state=checked]:text-white"
                  />
                  <Label
                    htmlFor="marketing"
                    className="text-sm text-zinc-600 font-normal"
                  >
                    Email me with news and offers
                  </Label>
                </div>
              </div>
            </section>

            <Separator />

            {/* Delivery */}
            <section className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight">
                Delivery
              </h2>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="country" className="sr-only">
                    Country/Region
                  </Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-12 w-full rounded-none border-zinc-300 bg-white">
                      <SelectValue placeholder="Country/Region" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-zinc-200">
                      <SelectItem value="ID">Indonesia</SelectItem>
                      <SelectItem value="SG">Singapore</SelectItem>
                      <SelectItem value="MY">Malaysia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName" className="sr-only">
                      First name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-12 rounded-none border-zinc-300 bg-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName" className="sr-only">
                      Last name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-12 rounded-none border-zinc-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company" className="sr-only">
                    Company (optional)
                  </Label>
                  <Input
                    id="company"
                    placeholder="Company (optional)"
                    className="h-12 rounded-none border-zinc-300 bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address" className="sr-only">
                    Address
                  </Label>
                  <Input
                    id="address"
                    placeholder="Address"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                    className="h-12 rounded-none border-zinc-300 bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="apartment" className="sr-only">
                    Apartment, suite, etc. (optional)
                  </Label>
                  <Input
                    id="apartment"
                    placeholder="Apartment, suite, etc. (optional)"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="h-12 rounded-none border-zinc-300 bg-white"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2 sm:col-span-1">
                    <Label htmlFor="city" className="sr-only">
                      City
                    </Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="h-12 rounded-none border-zinc-300 bg-white"
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-1">
                    <Label htmlFor="province" className="sr-only">
                      Province
                    </Label>
                    <Select value={province} onValueChange={setProvince}>
                      <SelectTrigger className="h-12 w-full rounded-none border-zinc-300 bg-white">
                        <SelectValue placeholder="Province" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-zinc-200">
                        <SelectItem value="JKT">DKI Jakarta</SelectItem>
                        <SelectItem value="JB">Jawa Barat</SelectItem>
                        <SelectItem value="BT">Banten</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 sm:col-span-1">
                    <Label htmlFor="postalCode" className="sr-only">
                      Postal code
                    </Label>
                    <Input
                      id="postalCode"
                      placeholder="Postal code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      className="h-12 rounded-none border-zinc-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone" className="sr-only">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Phone (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 rounded-none border-zinc-300 bg-white"
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Shipping Method */}
            <section className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight">
                Shipping Method
              </h2>
              <RadioGroup
                value={shippingMethod}
                onValueChange={(val) => setShippingMethod(val as "standard" | "express")}
                className="grid gap-3"
              >
                <Card className="rounded-none border-zinc-300 shadow-none [&:has([data-state=checked])]:border-black [&:has([data-state=checked])]:bg-zinc-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem
                        value="standard"
                        id="standard"
                        className="text-black"
                      />
                      <Label
                        htmlFor="standard"
                        className="font-semibold cursor-pointer"
                      >
                        Standard Delivery
                      </Label>
                    </div>
                    <span className="font-semibold">{formatPrice(50000)}</span>
                  </CardContent>
                </Card>
                <Card className="rounded-none border-zinc-300 shadow-none [&:has([data-state=checked])]:border-black [&:has([data-state=checked])]:bg-zinc-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem
                        value="express"
                        id="express"
                        className="text-black"
                      />
                      <Label
                        htmlFor="express"
                        className="font-semibold cursor-pointer"
                      >
                        Express Delivery
                      </Label>
                    </div>
                    <span className="font-semibold">{formatPrice(100000)}</span>
                  </CardContent>
                </Card>
              </RadioGroup>
            </section>

            <Separator />

            {/* Payment */}
            <section className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight">
                Payment
              </h2>
              <p className="text-sm text-zinc-500">
                All transactions are secure and encrypted.
              </p>

              <RadioGroup
                defaultValue="credit-card"
                className="grid gap-0 -space-y-px"
              >
                {/* Credit Card */}
                <div className="relative border border-zinc-300 bg-white p-4 [&:has([data-state=checked])]:border-black [&:has([data-state=checked])]:z-10 [&:has([data-state=checked])]:bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem
                        value="credit-card"
                        id="credit-card"
                        className="text-black"
                      />
                      <Label
                        htmlFor="credit-card"
                        className="font-semibold cursor-pointer"
                      >
                        Credit Card
                      </Label>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 hidden-when-not-checked">
                    <Input
                      placeholder="Card number"
                      className="h-12 rounded-none border-zinc-300 bg-white"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Expiration date (MM / YY)"
                        className="h-12 rounded-none border-zinc-300 bg-white"
                      />
                      <Input
                        placeholder="Security code"
                        className="h-12 rounded-none border-zinc-300 bg-white"
                      />
                    </div>
                    <Input
                      placeholder="Name on card"
                      className="h-12 rounded-none border-zinc-300 bg-white"
                    />
                  </div>
                </div>

                {/* Bank Transfer */}
                <div className="relative border border-zinc-300 bg-white p-4 [&:has([data-state=checked])]:border-black [&:has([data-state=checked])]:z-10 [&:has([data-state=checked])]:bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem
                        value="bank-transfer"
                        id="bank-transfer"
                        className="text-black"
                      />
                      <Label
                        htmlFor="bank-transfer"
                        className="font-semibold cursor-pointer"
                      >
                        Virtual Account / Bank Transfer
                      </Label>
                    </div>
                  </div>
                </div>

                {/* e-Wallet */}
                <div className="relative border border-zinc-300 bg-white p-4 [&:has([data-state=checked])]:border-black [&:has([data-state=checked])]:z-10 [&:has([data-state=checked])]:bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem
                        value="ewallet"
                        id="ewallet"
                        className="text-black"
                      />
                      <Label
                        htmlFor="ewallet"
                        className="font-semibold cursor-pointer"
                      >
                        e-Wallet (GoPay, OVO, Dana)
                      </Label>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </section>

            {/* Actions */}
            <div className="pt-6 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/cart"
                className="flex items-center justify-center text-sm font-semibold uppercase tracking-wide text-zinc-600 hover:text-black"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to cart
              </Link>
              <Button
                type="button"
                onClick={handlePayNow}
                disabled={isSubmitting}
                className="h-14 rounded-none bg-black px-8 text-sm font-bold uppercase tracking-widest text-white hover:bg-zinc-800 disabled:bg-zinc-700 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Placing Order..." : "Pay Now"}
              </Button>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8">
            <Card className="rounded-none border-zinc-200 shadow-none bg-white">
              <CardHeader className="bg-zinc-50 border-b border-zinc-200 pb-4">
                <CardTitle className="text-lg font-black uppercase tracking-tight">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 divide-y divide-zinc-100 max-h-[350px] overflow-y-auto scrollbar-thin">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center gap-4"
                    >
                      <div className="relative h-16 w-16 shrink-0 bg-zinc-100 border border-zinc-200">
                        <div className="h-full w-full overflow-hidden">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-zinc-300 uppercase rotate-12">
                              Product
                            </div>
                          )}
                        </div>
                        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-500 text-[10px] font-bold text-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold uppercase tracking-wide truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {item.colorway} / {item.size}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-zinc-200 bg-zinc-50/50 space-y-4">
                  {!appliedPromo ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Discount code"
                          value={promoCodeInput}
                          onChange={(e) => {
                            setPromoCodeInput(e.target.value);
                            setPromoError(null);
                          }}
                          className="h-12 rounded-none border-zinc-300 bg-white"
                          disabled={isPromoValidating}
                        />
                        <Button
                          variant="outline"
                          onClick={handleApplyPromo}
                          disabled={isPromoValidating || !promoCodeInput.trim()}
                          className="h-12 rounded-none border-zinc-300 px-6 text-xs font-bold uppercase tracking-wide hover:bg-zinc-100"
                        >
                          {isPromoValidating ? "Applying..." : "Apply"}
                        </Button>
                      </div>
                      {promoError && (
                        <p className="text-xs font-semibold text-red-600">
                          {promoError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-zinc-100 p-3 border border-zinc-200">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          Promo Code Applied
                        </span>
                        <span className="text-sm font-black uppercase tracking-wide">
                          {appliedPromo.code}
                          <span className="ml-2 text-xs font-semibold normal-case text-zinc-500">
                            ({appliedPromo.discountType === "PERCENTAGE" ? `${appliedPromo.discountValue}% off` : `Rp ${appliedPromo.discountValue.toLocaleString("id-ID")} off`})
                          </span>
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePromo}
                        className="text-xs font-bold uppercase text-red-600 hover:text-red-800 hover:bg-transparent p-0 h-auto cursor-pointer"
                      >
                        Remove
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Subtotal</span>
                      <span className="font-semibold">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    {appliedPromo && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount ({appliedPromo.code})</span>
                        <span className="font-semibold">
                          -{formatPrice(appliedPromo.discountAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Shipping</span>
                      <span className="font-semibold">
                        {formatPrice(shipping)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-zinc-200 flex items-center justify-between">
                  <span className="text-base font-black uppercase tracking-tight">
                    Total
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-zinc-500 mr-2">IDR</span>
                    <span className="text-2xl font-black">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <CheckCircle2 className="h-4 w-4" />
              <span>Secure encrypted checkout</span>
            </div>
          </div>
        </div>
      </section>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hidden-when-not-checked {
          display: none;
        }
        [data-state="checked"] + label + .hidden-when-not-checked,
        div:has([data-state="checked"]) > .hidden-when-not-checked,
        div:has([data-state="checked"]) + .hidden-when-not-checked {
          display: grid;
        }
      `,
        }}
      />
    </main>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
