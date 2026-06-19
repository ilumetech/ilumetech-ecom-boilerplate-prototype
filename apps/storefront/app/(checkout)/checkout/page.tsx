"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import Script from "next/script";
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
  type PromoCodeValidationResult,
} from "@/lib/api/promo-code";
import { useAuth, useUser } from "@clerk/nextjs";
import { createOrder } from "@/lib/api/order";
import { INDONESIA_DATA } from "@/lib/indonesia-data";
import { getAddresses, type CustomerAddress } from "@/lib/api/address";
import {
  getShippingQuotes,
  searchShippingDestinations,
  type ShippingDestination,
  type ShippingQuote,
} from "@/lib/api/shipping";

export default function CheckoutPage() {
  const { items: cartItems, clearCart, isLoaded } = useCart();
  const router = useRouter();
  const { isSignedIn, getToken, isLoaded: isAuthLoaded } = useAuth();
  const { user } = useUser();

  const [shippingService, setShippingService] = useState("");
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] =
    useState<PromoCodeValidationResult | null>(null);
  const [isPromoValidating, setIsPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("Jakarta Pusat");
  const [province, setProvince] = useState("DKI Jakarta");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("ID");
  const [shippingDestinationCode, setShippingDestinationCode] = useState("");
  const [shippingDestinationSearch, setShippingDestinationSearch] =
    useState("");
  const [shippingDestinations, setShippingDestinations] = useState<
    ShippingDestination[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Saved address states
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // Helper to apply saved address
  const applySavedAddress = useCallback((address: CustomerAddress) => {
    setFirstName(address.firstName);
    setLastName(address.lastName);
    setPhone(address.phone || "");
    setAddressLine1(address.addressLine1);
    setAddressLine2(address.addressLine2 || "");
    setProvince(address.province);
    setCity(address.city);
    setPostalCode(address.postalCode);
    setCountry(address.country);
    setShippingDestinationCode(address.shippingDestinationCode || "");
    setShippingDestinationSearch(address.shippingDestinationLabel || "");
  }, []);

  // Protect route
  useEffect(() => {
    if (isAuthLoaded && !isSignedIn) {
      router.push(`/sign-in?redirect_url=/checkout`);
    }
  }, [isAuthLoaded, isSignedIn, router]);

  // Load saved addresses on auth load
  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getAddresses(token);
        setSavedAddresses(data);
        if (data.length > 0) {
          const defaultAddr = data.find((a) => a.isDefault) || data[0];
          setSelectedAddressId(defaultAddr.id);
          applySavedAddress(defaultAddr);
        }
      } catch (err) {
        console.error("Failed to load saved addresses", err);
      }
    };
    if (isAuthLoaded && isSignedIn) {
      loadSavedAddresses();
    }
  }, [isAuthLoaded, isSignedIn, getToken, applySavedAddress]);

  // Pre-populate user details (only if no saved addresses are available)
  useEffect(() => {
    if (!user) return;

    queueMicrotask(() => {
      setEmail(user.primaryEmailAddress?.emailAddress || "");
      if (savedAddresses.length > 0) return;
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    });
  }, [user, savedAddresses]);

  const orderItems = useMemo(
    () =>
      cartItems
        .filter((item) => item.variantId)
        .map((item) => ({
          productVariantId: item.variantId as string,
          quantity: item.quantity,
        })),
    [cartItems],
  );

  useEffect(() => {
    if (!isSignedIn || shippingDestinationSearch.trim().length < 2) return;

    const timeout = window.setTimeout(async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const destinations = await searchShippingDestinations(
          shippingDestinationSearch.trim(),
          token,
        );
        setShippingDestinations(destinations);
      } catch {
        setShippingDestinations([]);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [getToken, isSignedIn, shippingDestinationSearch]);

  useEffect(() => {
    if (!shippingDestinationCode || orderItems.length === 0 || !isSignedIn)
      return;

    void loadShippingQuotes();

    async function loadShippingQuotes() {
      setIsLoadingShipping(true);
      setShippingError(null);

      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is unavailable");
        const quotes = await getShippingQuotes(
          shippingDestinationCode,
          orderItems,
          token,
        );
        setShippingQuotes(quotes);
        setShippingService((current) => {
          const stillAvailable = quotes.some(
            (quote) => quote.service === current,
          );
          return stillAvailable ? current : quotes[0]?.service || "";
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to calculate shipping";
        setShippingQuotes([]);
        setShippingService("");
        setShippingError(message);
      } finally {
        setIsLoadingShipping(false);
      }
    }
  }, [getToken, isSignedIn, orderItems, shippingDestinationCode]);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const discount = appliedPromo ? appliedPromo.discountAmount : 0;
  const selectedShippingQuote = shippingQuotes.find(
    (quote) => quote.service === shippingService,
  );
  const shipping = selectedShippingQuote?.amount ?? 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsPromoValidating(true);
    setPromoError(null);
    try {
      const result = await validatePromoCode(promoCodeInput.trim(), subtotal);
      setAppliedPromo(result);
    } catch (error: unknown) {
      setPromoError(getErrorMessage(error, "Failed to apply promo code"));
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

    if (
      !email ||
      !firstName ||
      !lastName ||
      !addressLine1 ||
      !city ||
      !province ||
      !postalCode ||
      !phone
    ) {
      alert("Please fill in all required shipping and contact details.");
      return;
    }
    if (!shippingDestinationCode || !shippingService) {
      alert("Please select a JNE shipping destination and service.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Could not retrieve authentication token.");

      if (orderItems.length === 0) {
        throw new Error("No valid variants in the cart to place an order.");
      }

      const orderInput = {
        items: orderItems,
        customerEmail: email,
        customerName: `${firstName} ${lastName}`.trim(),
        customerPhone: phone,
        shippingAddress: {
          firstName,
          lastName,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          province,
          postalCode,
          country,
          shippingDestinationCode,
        },
        shippingMethod: `JNE ${shippingService}`,
        shippingService,
        promoCode: appliedPromo?.code || undefined,
      };

      const order = await createOrder(orderInput, token);

      clearCart();
      if (order.snapToken) {
        const snap = (window as Window & { snap?: MidtransSnap }).snap;
        if (snap) {
          snap.pay(order.snapToken, {
            onSuccess: () => {
              router.push(`/pending?orderId=${order.id}`);
            },
            onPending: () => {
              router.push(`/pending?orderId=${order.id}`);
            },
            onError: () => {
              router.push(`/pending?orderId=${order.id}`);
            },
            onClose: () => {
              // User closed the payment popup without completing — allow retry
              setIsSubmitting(false);
            },
          });
        } else {
          // Fallback if Snap script is not loaded
          window.location.href =
            order.snapUrl || `/pending?orderId=${order.id}`;
        }
      } else if (order.snapUrl) {
        window.location.href = order.snapUrl;
      } else {
        router.push(`/pending?orderId=${order.id}`);
      }
    } catch (error: unknown) {
      console.error(error);
      alert(getErrorMessage(error, "Failed to place order. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || !isAuthLoaded) {
    return (
      <main className="min-h-screen bg-zinc-50 text-black flex flex-col">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
            <Link href="/" className="text-left">
              <div className="text-lg font-bold uppercase tracking-[0.25em] md:text-xl">
                Storefront
              </div>
              <div className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.3em] text-zinc-500">
                Official Store
              </div>
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
            <Link href="/" className="text-left">
              <div className="text-lg font-bold uppercase tracking-[0.25em] md:text-xl">
                Storefront
              </div>
              <div className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.3em] text-zinc-500">
                Official Store
              </div>
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
            <Link href="/products">Browse Products</Link>
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
          <Link href="/" className="text-left">
            <div className="text-lg font-bold uppercase tracking-[0.25em] md:text-xl">
              Storefront
            </div>
            <div className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.3em] text-zinc-500">
              Official Store
            </div>
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
              <h2 className="text-xl font-black uppercase tracking-tight">
                Contact
              </h2>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-black uppercase tracking-tight">
                  Delivery
                </h2>
                {savedAddresses.length > 0 && (
                  <div className="w-full sm:w-72">
                    <Select
                      value={selectedAddressId}
                      onValueChange={(val) => {
                        setSelectedAddressId(val);
                        if (val === "new") {
                          // Clear fields
                          setPhone("");
                          setAddressLine1("");
                          setAddressLine2("");
                          setPostalCode("");
                          setProvince("DKI Jakarta");
                          setCity("Jakarta Pusat");
                          setShippingDestinationCode("");
                          setShippingDestinationSearch("");
                          setShippingQuotes([]);
                          setShippingService("");
                        } else {
                          const addr = savedAddresses.find((a) => a.id === val);
                          if (addr) {
                            applySavedAddress(addr);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="h-11 w-full rounded-none border-zinc-300 bg-white text-xs font-semibold uppercase tracking-wider text-left">
                        <SelectValue placeholder="Use a saved address" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-zinc-200 max-h-[250px] overflow-y-auto">
                        {savedAddresses.map((addr) => (
                          <SelectItem
                            key={addr.id}
                            value={addr.id}
                            className="text-xs uppercase font-medium tracking-wide"
                          >
                            {addr.firstName} {addr.lastName} -{" "}
                            {addr.addressLine1}, {addr.city}{" "}
                            {addr.isDefault ? "(Default)" : ""}
                          </SelectItem>
                        ))}
                        <SelectItem
                          value="new"
                          className="text-xs uppercase font-semibold tracking-wide text-zinc-500"
                        >
                          + Use a new address
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-4">
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

                <div className="grid gap-3">
                  <Label
                    htmlFor="shippingDestinationSearch"
                    className="text-xs font-semibold uppercase tracking-wide text-zinc-600"
                  >
                    JNE Shipping Destination
                  </Label>
                  <Input
                    id="shippingDestinationSearch"
                    placeholder="Search district, city, or JNE code"
                    value={shippingDestinationSearch}
                    onChange={(event) => {
                      setShippingDestinationSearch(event.target.value);
                      setShippingDestinationCode("");
                      setShippingQuotes([]);
                      setShippingService("");
                    }}
                    className="h-12 rounded-none border-zinc-300 bg-white"
                  />
                  {shippingDestinationSearch.trim().length >= 2 &&
                    shippingDestinations.length > 0 && (
                      <Select
                        value={shippingDestinationCode}
                        onValueChange={(code) => {
                          const destination = shippingDestinations.find(
                            (item) => item.destinationCode === code,
                          );
                          setShippingDestinationCode(code);
                          setShippingDestinationSearch(
                            destination?.destinationLabel || code,
                          );
                        }}
                      >
                        <SelectTrigger className="h-12 w-full rounded-none border-zinc-300 bg-white text-left">
                          <SelectValue placeholder="Select the exact JNE destination" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] rounded-none border-zinc-200">
                          {shippingDestinations.map((destination) => (
                            <SelectItem
                              key={destination.destinationCode}
                              value={destination.destinationCode}
                            >
                              {destination.destinationLabel} (
                              {destination.destinationCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                    <Label htmlFor="province" className="sr-only">
                      Province
                    </Label>
                    <Select
                      value={province}
                      onValueChange={(val) => {
                        setProvince(val);
                        const cities = INDONESIA_DATA[val] || [];
                        setCity(cities[0] || "");
                      }}
                    >
                      <SelectTrigger className="h-12 w-full rounded-none border-zinc-300 bg-white text-left text-base md:text-sm">
                        <SelectValue placeholder="Province" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-zinc-200 max-h-[250px] overflow-y-auto">
                        {Object.keys(INDONESIA_DATA).map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 sm:col-span-1">
                    <Label htmlFor="city" className="sr-only">
                      City
                    </Label>
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger className="h-12 w-full rounded-none border-zinc-300 bg-white text-left text-base md:text-sm">
                        <SelectValue placeholder="City" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-zinc-200 max-h-[250px] overflow-y-auto">
                        {(INDONESIA_DATA[province] || []).map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 sm:col-span-1">
                    <Label htmlFor="postalCode" className="sr-only">
                      Postal code
                    </Label>
                    <Input
                      id="postalCode"
                      placeholder="Postal code *"
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
                    placeholder="Phone number *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
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
                value={shippingService}
                onValueChange={setShippingService}
                className="grid gap-3"
              >
                {shippingQuotes.map((quote) => (
                  <Card
                    key={`${quote.service}-${quote.shipmentType}`}
                    className="rounded-none border-zinc-300 shadow-none [&:has([data-state=checked])]:border-black [&:has([data-state=checked])]:bg-zinc-50"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem
                          value={quote.service}
                          id={`shipping-${quote.service}`}
                          className="text-black"
                        />
                        <Label
                          htmlFor={`shipping-${quote.service}`}
                          className="cursor-pointer font-semibold"
                        >
                          JNE {quote.service}
                          <span className="ml-2 text-xs font-normal text-zinc-500">
                            {quote.etd || "Estimate unavailable"}
                          </span>
                        </Label>
                      </div>
                      <span className="font-semibold">
                        {formatPrice(quote.amount)}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
              {isLoadingShipping && (
                <p className="text-sm text-zinc-500">Calculating shipping...</p>
              )}
              {!isLoadingShipping && !shippingDestinationCode && (
                <p className="text-sm text-zinc-500">
                  Select a JNE destination to view available services.
                </p>
              )}
              {shippingError && (
                <p className="text-sm font-semibold text-red-600">
                  {shippingError}
                </p>
              )}
            </section>

            <Separator />

            {/* Payment */}
            <section className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight">
                Payment Method
              </h2>
              <Card className="rounded-none border-zinc-300 shadow-none bg-zinc-50/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-12 bg-white rounded-none border border-zinc-300 flex items-center justify-center text-[8px] font-black text-black tracking-wider shrink-0 shadow-sm">
                      MIDTRANS
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide">
                        Secure Payment via Midtrans
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Supports Credit Card, Virtual Account (Bank Transfer),
                        and e-Wallet (GoPay, ShopeePay, etc.)
                      </p>
                    </div>
                  </div>
                  <Separator className="bg-zinc-200" />
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    After clicking &quot;Pay Now&quot;, you will be securely
                    redirected to Midtrans Payment Gateway to complete your
                    purchase.
                  </p>
                </CardContent>
              </Card>
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
                disabled={
                  isSubmitting ||
                  isLoadingShipping ||
                  !shippingDestinationCode ||
                  !shippingService
                }
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
                            (
                            {appliedPromo.discountType === "PERCENTAGE"
                              ? `${appliedPromo.discountValue}% off`
                              : `Rp ${appliedPromo.discountValue.toLocaleString("id-ID")} off`}
                            )
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
                        {selectedShippingQuote
                          ? formatPrice(shipping)
                          : "Calculated after destination"}
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

      <Script
        src={
          process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
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

interface MidtransSnap {
  pay: (
    token: string,
    callbacks: {
      onSuccess: () => void;
      onPending: () => void;
      onError: () => void;
      onClose: () => void;
    },
  ) => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
