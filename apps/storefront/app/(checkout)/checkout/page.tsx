import Link from 'next/link'
import { ArrowLeft, ChevronRight, Lock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const cartItems = [
  {
    id: 1,
    name: 'Product Name',
    colorway: 'Black / White',
    size: '42',
    price: 1299000,
    quantity: 1,
  },
  {
    id: 2,
    name: 'Product Name',
    colorway: 'Grey',
    size: '40',
    price: 999000,
    quantity: 1,
  },
]

const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
const shipping = 50000
const total = subtotal + shipping

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-black">
      {/* Checkout Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="text-xl font-black uppercase tracking-tighter">
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
          <Link href="/cart" className="hover:text-black">Cart</Link>
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
                <h2 className="text-xl font-black uppercase tracking-tight">Contact</h2>
                <Link href="/login" className="text-sm text-zinc-500 underline hover:text-black">
                  Log in
                </Link>
              </div>
              <div className="space-y-3">
                <div className="grid gap-2">
                  <Input 
                    type="email" 
                    placeholder="Email or mobile phone number" 
                    className="h-12 rounded-none border-zinc-300 bg-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="marketing" className="rounded-none border-zinc-300 data-[state=checked]:bg-black data-[state=checked]:text-white" />
                  <Label htmlFor="marketing" className="text-sm text-zinc-600 font-normal">
                    Email me with news and offers
                  </Label>
                </div>
              </div>
            </section>

            <Separator />

            {/* Delivery */}
            <section className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight">Delivery</h2>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="country" className="sr-only">Country/Region</Label>
                  <Select defaultValue="ID">
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
                    <Label htmlFor="firstName" className="sr-only">First name</Label>
                    <Input id="firstName" placeholder="First name" className="h-12 rounded-none border-zinc-300 bg-white" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName" className="sr-only">Last name</Label>
                    <Input id="lastName" placeholder="Last name" className="h-12 rounded-none border-zinc-300 bg-white" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company" className="sr-only">Company (optional)</Label>
                  <Input id="company" placeholder="Company (optional)" className="h-12 rounded-none border-zinc-300 bg-white" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address" className="sr-only">Address</Label>
                  <Input id="address" placeholder="Address" className="h-12 rounded-none border-zinc-300 bg-white" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="apartment" className="sr-only">Apartment, suite, etc. (optional)</Label>
                  <Input id="apartment" placeholder="Apartment, suite, etc. (optional)" className="h-12 rounded-none border-zinc-300 bg-white" />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2 sm:col-span-1">
                    <Label htmlFor="city" className="sr-only">City</Label>
                    <Input id="city" placeholder="City" className="h-12 rounded-none border-zinc-300 bg-white" />
                  </div>
                  <div className="grid gap-2 sm:col-span-1">
                    <Label htmlFor="province" className="sr-only">Province</Label>
                    <Select>
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
                    <Label htmlFor="postalCode" className="sr-only">Postal code</Label>
                    <Input id="postalCode" placeholder="Postal code" className="h-12 rounded-none border-zinc-300 bg-white" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone" className="sr-only">Phone</Label>
                  <Input id="phone" type="tel" placeholder="Phone" className="h-12 rounded-none border-zinc-300 bg-white" />
                </div>
              </div>
            </section>

            <Separator />

            {/* Shipping Method */}
            <section className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight">Shipping Method</h2>
              <RadioGroup defaultValue="standard" className="grid gap-3">
                <Card className="rounded-none border-zinc-300 shadow-none [&:has([data-state=checked])]:border-black [&:has([data-state=checked])]:bg-zinc-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="standard" id="standard" className="text-black" />
                      <Label htmlFor="standard" className="font-semibold cursor-pointer">Standard Delivery</Label>
                    </div>
                    <span className="font-semibold">{formatPrice(50000)}</span>
                  </CardContent>
                </Card>
                <Card className="rounded-none border-zinc-300 shadow-none [&:has([data-state=checked])]:border-black [&:has([data-state=checked])]:bg-zinc-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="express" id="express" className="text-black" />
                      <Label htmlFor="express" className="font-semibold cursor-pointer">Express Delivery</Label>
                    </div>
                    <span className="font-semibold">{formatPrice(100000)}</span>
                  </CardContent>
                </Card>
              </RadioGroup>
            </section>

            <Separator />

            {/* Payment */}
            <section className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight">Payment</h2>
              <p className="text-sm text-zinc-500">All transactions are secure and encrypted.</p>
              
              <RadioGroup defaultValue="credit-card" className="grid gap-0 -space-y-px">
                {/* Credit Card */}
                <div className="relative border border-zinc-300 bg-white p-4 [&:has([data-state=checked])]:border-black [&:has([data-state=checked])]:z-10 [&:has([data-state=checked])]:bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="credit-card" id="credit-card" className="text-black" />
                      <Label htmlFor="credit-card" className="font-semibold cursor-pointer">Credit Card</Label>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 hidden-when-not-checked">
                    <Input placeholder="Card number" className="h-12 rounded-none border-zinc-300 bg-white" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Expiration date (MM / YY)" className="h-12 rounded-none border-zinc-300 bg-white" />
                      <Input placeholder="Security code" className="h-12 rounded-none border-zinc-300 bg-white" />
                    </div>
                    <Input placeholder="Name on card" className="h-12 rounded-none border-zinc-300 bg-white" />
                  </div>
                </div>

                {/* Bank Transfer */}
                <div className="relative border border-zinc-300 bg-white p-4 [&:has([data-state=checked])]:border-black [&:has([data-state=checked])]:z-10 [&:has([data-state=checked])]:bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="bank-transfer" id="bank-transfer" className="text-black" />
                      <Label htmlFor="bank-transfer" className="font-semibold cursor-pointer">Virtual Account / Bank Transfer</Label>
                    </div>
                  </div>
                </div>

                {/* e-Wallet */}
                <div className="relative border border-zinc-300 bg-white p-4 [&:has([data-state=checked])]:border-black [&:has([data-state=checked])]:z-10 [&:has([data-state=checked])]:bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="ewallet" id="ewallet" className="text-black" />
                      <Label htmlFor="ewallet" className="font-semibold cursor-pointer">e-Wallet (GoPay, OVO, Dana)</Label>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </section>

            {/* Actions */}
            <div className="pt-6 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/cart" className="flex items-center justify-center text-sm font-semibold uppercase tracking-wide text-zinc-600 hover:text-black">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to cart
              </Link>
              <Button className="h-14 rounded-none bg-black px-8 text-sm font-bold uppercase tracking-widest text-white hover:bg-zinc-800">
                Pay Now
              </Button>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8">
            <Card className="rounded-none border-zinc-200 shadow-none bg-white">
              <CardHeader className="bg-zinc-50 border-b border-zinc-200 pb-4">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 divide-y divide-zinc-100">
                  {cartItems.map((item) => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                      <div className="relative h-16 w-16 shrink-0 bg-zinc-100 border border-zinc-200">
                        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-500 text-[10px] font-bold text-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold uppercase tracking-wide truncate">{item.name}</h3>
                        <p className="text-xs text-zinc-500">{item.colorway} / {item.size}</p>
                      </div>
                      <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-zinc-200 bg-zinc-50/50 space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Discount code" className="h-12 rounded-none border-zinc-300 bg-white" />
                    <Button variant="outline" className="h-12 rounded-none border-zinc-300 px-6 text-xs font-bold uppercase tracking-wide hover:bg-zinc-100">
                      Apply
                    </Button>
                  </div>
                  
                  <div className="space-y-2 pt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Subtotal</span>
                      <span className="font-semibold">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Shipping</span>
                      <span className="font-semibold">{formatPrice(shipping)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-zinc-200 flex items-center justify-between">
                  <span className="text-base font-black uppercase tracking-tight">Total</span>
                  <div className="text-right">
                    <span className="text-xs text-zinc-500 mr-2">IDR</span>
                    <span className="text-2xl font-black">{formatPrice(total)}</span>
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
      <style dangerouslySetInnerHTML={{__html: `
        .hidden-when-not-checked {
          display: none;
        }
        [data-state="checked"] + label + .hidden-when-not-checked,
        div:has([data-state="checked"]) > .hidden-when-not-checked,
        div:has([data-state="checked"]) + .hidden-when-not-checked {
          display: grid;
        }
      `}} />
    </main>
  )
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}
