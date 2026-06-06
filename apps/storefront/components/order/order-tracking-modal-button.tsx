"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Truck, RefreshCw, AlertTriangle, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getOrderTracking, type TrackingResult } from "@/lib/api/order";
import { Separator } from "@/components/ui/separator";

interface OrderTrackingModalButtonProps {
  orderId: string;
  trackingCode: string;
  shippingCourier?: string | null;
}

export function OrderTrackingModalButton({
  orderId,
  trackingCode,
  shippingCourier,
}: OrderTrackingModalButtonProps) {
  const { getToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackingResult | null>(null);

  const fetchTracking = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("You must be logged in to track your order.");
      }
      const result = await getOrderTracking(orderId, token);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load tracking details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTracking();
    }
  }, [isOpen, orderId]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-9 rounded-none border-2 border-black bg-white text-black hover:bg-zinc-50 text-[10px] font-bold uppercase tracking-wider px-4 shrink-0 transition-colors"
        >
          <Truck className="mr-1.5 h-3.5 w-3.5" />
          Track Package
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md border-l border-zinc-200 bg-white p-0 text-black flex flex-col h-full">
        <SheetHeader className="p-6 pb-4 border-b border-zinc-100 flex-shrink-0">
          <SheetTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Truck className="h-5 w-5 text-black" />
            Track Shipment
          </SheetTitle>
          <SheetDescription className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] mt-1">
            {shippingCourier || "Courier"} &bull; Ref #{trackingCode}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-8 w-8 text-black animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Fetching shipment status...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-none border border-red-200 bg-red-50 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-red-950">
                    Tracking Unavailable
                  </h4>
                  <p className="mt-1 text-xs text-red-800 leading-relaxed font-semibold uppercase tracking-wide">
                    {error}
                  </p>
                </div>
              </div>
              <Button
                onClick={fetchTracking}
                className="w-full h-9 rounded-none bg-red-900 hover:bg-red-950 text-white font-bold uppercase tracking-wider text-[10px]"
              >
                Try Again
              </Button>
            </div>
          ) : data ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Status Header */}
              <div className="rounded-none border border-zinc-200 p-5 bg-zinc-50/50 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-black"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Current Status
                  </span>
                  <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-none">
                    {data.status}
                  </span>
                </div>
                
                {data.recipient && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Received by: <strong className="text-black uppercase">{data.recipient}</strong></span>
                  </div>
                )}
              </div>

              {/* Metadata Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                {data.sender && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                      Sender
                    </span>
                    <p className="font-semibold text-black uppercase">{data.sender}</p>
                  </div>
                )}
                {data.destination && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                      Destination
                    </span>
                    <p className="font-semibold text-black uppercase">{data.destination}</p>
                  </div>
                )}
                {data.shippingDate && (
                  <div className="space-y-1 col-span-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                      Shipping Date
                    </span>
                    <p className="font-semibold text-black uppercase flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      {data.shippingDate}
                    </p>
                  </div>
                )}
              </div>

              <Separator className="bg-zinc-100" />

              {/* Timeline */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Tracking History
                </h4>
                
                {data.history.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider text-center py-4 bg-zinc-50 border border-dashed border-zinc-200">
                    No timeline details available yet.
                  </p>
                ) : (
                  <div className="space-y-1 mt-4">
                    {data.history.map((item, index) => (
                      <div key={index} className="relative flex gap-4">
                        {index !== data.history.length - 1 && (
                          <div className="absolute left-[15px] top-7 h-full w-[2px] bg-zinc-200" />
                        )}
                        <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white ${
                          index === 0 ? "border-black bg-black text-white" : "border-zinc-200 text-zinc-400"
                        }`}>
                          <div className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-white" : "bg-zinc-300"}`} />
                        </div>
                        <div className="pb-6">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                            {item.date}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-zinc-950 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Truck className="h-10 w-10 text-zinc-300" />
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Ready to track shipment
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
