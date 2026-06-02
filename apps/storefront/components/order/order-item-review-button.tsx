"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitReview } from "@/lib/api/review";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface OrderItemReviewButtonProps {
  productId: string;
  productName: string;
  orderStatus: string;
}

export function OrderItemReviewButton({
  productId,
  productName,
  orderStatus,
}: OrderItemReviewButtonProps) {
  const { isSignedIn, getToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (orderStatus !== "COMPLETED" || !isSignedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found.");

      await submitReview(
        {
          productId,
          rating,
          comment: comment.trim() || undefined,
        },
        token,
      );

      setSubmitSuccess(true);
      setComment("");
      setRating(5);
      // Wait a moment then close sheet
      setTimeout(() => {
        setIsOpen(false);
        setSubmitSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message ?? "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="text-black underline underline-offset-2 hover:text-zinc-600 cursor-pointer">
          Review Product
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-6 bg-white border-l border-zinc-200">
        <SheetHeader className="pb-6 border-b border-zinc-100">
          <SheetTitle className="text-lg font-black uppercase tracking-tight text-black">
            Write a Review
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">
            For {productName}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Rating Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
              Your Rating
            </label>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => {
                const starValue = i + 1;
                return (
                  <button
                    key={i}
                    type="button"
                    className="p-1 -ml-1 transition-transform hover:scale-110 cursor-pointer"
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(starValue)}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        starValue <= (hoverRating ?? rating)
                          ? "fill-black stroke-black text-black"
                          : "text-zinc-200"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment input */}
          <div className="space-y-2">
            <label
              htmlFor="review-comment-drawer"
              className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block"
            >
              Your Review Comment
            </label>
            <textarea
              id="review-comment-drawer"
              rows={5}
              required
              placeholder="WHAT DID YOU THINK OF THIS PRODUCT?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-none border border-zinc-200 bg-white p-3 text-xs font-bold uppercase tracking-wider placeholder:text-zinc-300 focus:border-black focus:outline-none focus:ring-0 text-black leading-relaxed"
            />
          </div>

          {submitError && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3 border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="text-xs font-semibold text-green-700 bg-green-50 p-3 border border-green-100">
              Thank you! Your review has been submitted and is pending moderation.
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || submitSuccess}
            className="h-12 w-full rounded-none bg-black text-[10px] font-black uppercase tracking-widest text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 border border-black cursor-pointer"
          >
            {isSubmitting ? "Submitting..." : submitSuccess ? "Submitted!" : "Submit Review"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
