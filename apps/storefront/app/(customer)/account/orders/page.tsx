import Link from "next/link";
import { Package, ChevronRight, Search, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Mock data for orders
const orders = [
  {
    id: "ORD-98765",
    date: "May 14, 2026",
    status: "Processing",
    total: "$129.00",
    itemCount: 2,
    items: [
      {
        name: "Premium Wireless Headphones",
        image:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80",
      },
      {
        name: "USB-C Charging Cable",
        image:
          "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=100&q=80",
      },
    ],
  },
  {
    id: "ORD-87654",
    date: "April 28, 2026",
    status: "Shipped",
    total: "$89.50",
    itemCount: 1,
    items: [
      {
        name: "Ergonomic Office Mouse",
        image:
          "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&q=80",
      },
    ],
  },
  {
    id: "ORD-76543",
    date: "April 15, 2026",
    status: "Delivered",
    total: "$245.00",
    itemCount: 3,
    items: [
      {
        name: "Mechanical Keyboard",
        image:
          "https://images.unsplash.com/photo-1595225476474-87563907a212?w=100&q=80",
      },
      {
        name: "Desk Mat",
        image:
          "https://images.unsplash.com/photo-1614064010892-0b62140410ec?w=100&q=80",
      },
      {
        name: "Wrist Rest",
        image:
          "https://images.unsplash.com/photo-1632205561081-30ba1925b42d?w=100&q=80",
      },
    ],
  },
  {
    id: "ORD-65432",
    date: "March 02, 2026",
    status: "Delivered",
    total: "$55.00",
    itemCount: 1,
    items: [
      {
        name: 'Laptop Sleeve 15"',
        image:
          "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100&q=80",
      },
    ],
  },
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "shipped":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export default function OrdersPage() {
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">
            Order History
          </h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Check the status of recent orders and manage returns.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-none border-zinc-200 text-[10px] font-bold uppercase tracking-widest hover:border-black hover:bg-black hover:text-white"
          >
            <Filter className="mr-2 h-3 w-3" /> Filter
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="search"
            placeholder="SEARCH BY ORDER ID OR PRODUCT..."
            className="h-12 rounded-none border-zinc-200 pl-10 text-[10px] font-bold uppercase tracking-widest focus-visible:ring-0 focus-visible:border-black"
          />
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <select className="flex h-12 w-[180px] items-center justify-between border border-zinc-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-black">
            <option>Last 30 days</option>
            <option>Past 3 months</option>
            <option>Past 6 months</option>
            <option>2025</option>
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {orders.map((order) => (
          <div
            key={order.id}
            className="group relative border border-zinc-200 bg-white transition-all duration-300 hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-5 group-hover:bg-white transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full sm:w-auto">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Placed
                    </p>
                    <p className="text-xs font-black uppercase tracking-tight">
                      {order.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Total
                    </p>
                    <p className="text-xs font-black uppercase tracking-tight">
                      {order.total}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Order #
                    </p>
                    <p className="text-xs font-black uppercase tracking-tight">
                      {order.id}
                    </p>
                  </div>
                  <div className="flex items-center sm:justify-end">
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(order.status)} rounded-none border-none text-[10px] font-black uppercase tracking-widest px-3 py-1`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-10 rounded-none border-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white"
                  >
                    <Link href={`/account/orders/${order.id}`}>Details</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                <div className="flex -space-x-4 overflow-hidden">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="inline-block h-20 w-20 border border-zinc-200 bg-zinc-100 overflow-hidden relative flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-500"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                  ))}
                  {order.itemCount > order.items.length && (
                    <div className="inline-flex h-20 w-20 items-center justify-center border border-zinc-200 bg-black text-white text-[10px] font-black uppercase tracking-widest z-10 flex-shrink-0">
                      +{order.itemCount - order.items.length}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {order.items.length === 1 ? (
                    <h3 className="text-sm font-black uppercase tracking-tight">
                      {order.items[0].name}
                    </h3>
                  ) : (
                    <h3 className="text-sm font-black uppercase tracking-tight">
                      {order.items[0].name}{" "}
                      <span className="text-zinc-400 font-bold tracking-widest text-[10px]">
                        {" "}
                        & {order.itemCount - 1} OTHERS
                      </span>
                    </h3>
                  )}
                  <div className="mt-4 flex flex-wrap gap-4">
                    <button className="text-[10px] font-bold uppercase tracking-widest text-black underline underline-offset-4 hover:text-zinc-500 transition-colors">
                      Buy again
                    </button>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-black underline underline-offset-4 hover:text-zinc-500 transition-colors">
                      Track package
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200">
          <div className="h-16 w-16 bg-zinc-100 flex items-center justify-center mb-6">
            <Package className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">
            No orders found
          </h3>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 max-w-xs mb-8">
            Start shopping to find something you'll love.
          </p>
          <Button
            asChild
            className="rounded-none bg-black text-[10px] font-bold uppercase tracking-widest px-8"
          >
            <Link href="/products">Browse Catalog</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
