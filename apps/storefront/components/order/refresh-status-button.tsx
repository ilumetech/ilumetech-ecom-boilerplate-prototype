"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshOrderStatus } from "@/lib/api/order";

interface RefreshStatusButtonProps {
  orderId: string;
  className?: string;
  variant?: "default" | "outline" | "sidebar";
}

export function RefreshStatusButton({
  orderId,
  className,
  variant = "default",
}: RefreshStatusButtonProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleRefresh = async () => {
    setIsLoading(true);
    setStatus("idle");
    setMessage("");
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("You must be logged in to perform this action.");
      }
      const updatedOrder = await refreshOrderStatus(orderId, token);
      
      setStatus("success");
      if (updatedOrder.status === "CONFIRMED") {
        setMessage("Payment confirmed successfully!");
      } else if (updatedOrder.status === "CANCELLED") {
        setMessage("Order cancelled or payment failed.");
      } else {
        setMessage("Order is still pending. Please complete payment.");
      }
      
      // Refresh the page data
      router.refresh();
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to refresh status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonStyle = () => {
    if (variant === "sidebar") {
      return "w-full h-11 rounded-none border-2 border-black bg-white text-black hover:bg-zinc-50 font-bold uppercase tracking-wider text-[10px]";
    }
    return "h-14 rounded-none border-2 border-black bg-white text-black hover:bg-zinc-50 px-10 text-sm font-bold uppercase tracking-widest";
  };

  return (
    <div className="flex flex-col items-center w-full sm:w-auto">
      <Button
        type="button"
        onClick={handleRefresh}
        disabled={isLoading}
        className={`${getButtonStyle()} ${className || ""}`}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        {isLoading ? "Checking status..." : "Refresh Status"}
      </Button>

      {status !== "idle" && (
        <div
          className={`mt-3 flex items-center gap-2 p-3 text-xs font-semibold uppercase tracking-wider rounded-none border w-full text-center justify-center animate-in fade-in slide-in-from-top-2 duration-300 ${
            status === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 animate-in"
              : "bg-red-50 border-red-200 text-red-800 animate-in"
          }`}
        >
          {status === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
