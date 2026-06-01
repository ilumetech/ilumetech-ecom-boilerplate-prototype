import Link from "next/link";
import Image from "next/image";
import { Package, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getCustomerOrders } from "@/lib/api/order-server";
import type { OrderStatus } from "@ilumetech/types";

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "pending":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "processing":
    case "confirmed":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

interface OrdersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const status = params.status as OrderStatus | undefined;
  const page = params.page ? parseInt(params.page) : 1;

  let ordersResponse;
  try {
    ordersResponse = await getCustomerOrders({
      search: search || undefined,
      status: status || undefined,
      page,
      limit: 10,
    });
  } catch (error) {
    console.error("Failed to load customer orders:", error);
    ordersResponse = { data: [], meta: { total: 0, page: 1, limit: 10 } };
  }

  const orders = ordersResponse.data;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    })
      .format(price)
      .replace("Rp", "RP ");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
      </div>

      <form method="GET" action="/account/orders" className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            name="search"
            type="search"
            defaultValue={search}
            placeholder="SEARCH BY ORDER ID..."
            className="h-12 rounded-none border-zinc-200 pl-10 text-[10px] font-bold uppercase tracking-widest focus-visible:ring-0 focus-visible:border-black text-black"
          />
        </div>
        <div className="flex gap-2">
          <select
            name="status"
            defaultValue={status || ""}
            className="flex h-12 w-[180px] items-center justify-between border border-zinc-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-black text-black"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Button
            type="submit"
            className="rounded-none bg-black text-[10px] font-bold uppercase tracking-widest px-8 h-12 hover:bg-zinc-800"
          >
            Search
          </Button>
        </div>
      </form>

      <div className="space-y-8">
        {orders.map((order) => {
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          
          return (
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
                      <p className="text-xs font-black uppercase tracking-tight text-black">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                        Total
                      </p>
                      <p className="text-xs font-black uppercase tracking-tight text-black">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                        Order #
                      </p>
                      <p className="text-xs font-black uppercase tracking-tight text-black">
                        {order.orderNumber}
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
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="inline-block h-20 w-20 border border-zinc-200 bg-zinc-100 overflow-hidden relative flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-500"
                      >
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-zinc-300 uppercase rotate-12">
                            Product
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="inline-flex h-20 w-20 items-center justify-center border border-zinc-200 bg-black text-white text-[10px] font-black uppercase tracking-widest z-10 flex-shrink-0">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    {order.items.length === 1 ? (
                      <h3 className="text-sm font-black uppercase tracking-tight text-black">
                        {order.items[0].productName}
                      </h3>
                    ) : (
                      <h3 className="text-sm font-black uppercase tracking-tight text-black">
                        {order.items[0].productName}{" "}
                        <span className="text-zinc-400 font-bold tracking-widest text-[10px]">
                          {" "}
                          & {itemCount - order.items[0].quantity} OTHERS
                        </span>
                      </h3>
                    )}
                    <div className="mt-4 flex flex-wrap gap-4">
                      <Button
                        variant="link"
                        asChild
                        className="p-0 text-[10px] font-bold uppercase tracking-widest text-black underline underline-offset-4 hover:text-zinc-500 transition-colors h-auto"
                      >
                        <Link href={`/account/orders/${order.id}`}>
                          Track package
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
            Start shopping to find something you&apos;ll love.
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
