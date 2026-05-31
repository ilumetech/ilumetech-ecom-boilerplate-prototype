"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Star, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getProductReviews, submitReview, type ProductReviewsData } from "@/lib/api/review";

interface ProductReviewsSectionProps {
  productId: string;
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const { isSignedIn, getToken } = useAuth();
  const [data, setData] = useState<ProductReviewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const reviewsData = await getProductReviews(productId);
      setData(reviewsData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load product reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) return;

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
      // Re-fetch reviews to show updated state (though they'll start as PENDING, so they won't show instantly in list until approved)
      await fetchReviews();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message ?? "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="py-12 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
        Loading reviews...
      </div>
    );
  }

  const reviewsList = data?.reviews ?? [];
  const averageRating = data?.averageRating ?? 0;
  const totalCount = data?.totalCount ?? 0;
  const distribution = data?.distribution ?? [
    { rating: 5, count: 0, percentage: 0 },
    { rating: 4, count: 0, percentage: 0 },
    { rating: 3, count: 0, percentage: 0 },
    { rating: 2, count: 0, percentage: 0 },
    { rating: 1, count: 0, percentage: 0 },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_2fr] xl:gap-20">
        {/* Rating Summary Left Side */}
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight md:text-2xl">
            Customer Reviews
          </h2>

          <div className="flex items-baseline gap-4">
            <span className="text-5xl font-black tracking-tighter">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starValue = i + 1;
                  return (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        starValue <= Math.round(averageRating)
                          ? "fill-black stroke-black text-black"
                          : "text-zinc-200"
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Based on {totalCount} {totalCount === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>

          <Separator className="bg-zinc-200" />

          {/* Star Distribution Progress Bars */}
          <div className="space-y-3">
            {distribution.map((dist) => (
              <div key={dist.rating} className="flex items-center gap-4 text-xs">
                <span className="w-12 font-bold uppercase tracking-wider text-zinc-500">
                  {dist.rating} STAR
                </span>
                <div className="relative h-2 flex-1 bg-zinc-100">
                  <div
                    className="absolute inset-y-0 left-0 bg-black transition-all duration-500"
                    style={{ width: `${dist.percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right font-bold text-zinc-500">
                  {dist.percentage}%
                </span>
              </div>
            ))}
          </div>

          <Separator className="bg-zinc-200" />

          {/* Review Submission Form */}
          <div className="bg-zinc-50 p-6 border border-zinc-200">
            <h3 className="text-sm font-black uppercase tracking-wide mb-4">
              Write a Review
            </h3>

            {isSignedIn ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Stars Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starValue = i + 1;
                      return (
                        <button
                          key={i}
                          type="button"
                          className="p-1 -ml-1 hover:scale-110 transition-transform cursor-pointer"
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(starValue)}
                        >
                          <Star
                            className={`h-6 w-6 transition-colors ${
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

                {/* Comment Textarea */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="review-comment"
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
                  >
                    Your Comment
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    required
                    placeholder="WHAT DID YOU THINK OF THIS PRODUCT?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-none border border-zinc-200 bg-white p-3 text-xs font-bold uppercase tracking-wider placeholder:text-zinc-300 focus:border-black focus:outline-none focus:ring-0"
                  />
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {submitSuccess && (
                  <div className="text-xs font-semibold text-green-700 bg-green-50 p-3">
                    Thank you! Your review has been submitted and is pending moderation.
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-none bg-black text-[10px] font-black uppercase tracking-widest text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 leading-relaxed">
                  Only registered customers can leave reviews.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-none border-black w-full h-11 text-[10px] font-black uppercase tracking-widest"
                >
                  <a href="/sign-in">Sign In to Review</a>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews List Right Side */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <h3 className="text-sm font-black uppercase tracking-widest">
              Reviews ({reviewsList.length})
            </h3>
          </div>

          {reviewsList.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {reviewsList.map((review) => {
                const date = new Date(review.createdAt).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                const authorName =
                  review.customer.firstName || review.customer.lastName
                    ? `${review.customer.firstName ?? ""} ${review.customer.lastName ?? ""}`.trim()
                    : "Verified Buyer";

                return (
                  <div key={review.id} className="py-8 first:pt-0">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-wider">
                          {authorName}
                        </p>
                        <p className="text-[10px] font-semibold text-zinc-400">
                          {date}
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < review.rating
                                ? "fill-black stroke-black text-black"
                                : "text-zinc-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {review.comment && (
                      <p className="mt-4 text-xs font-medium leading-relaxed text-zinc-700 uppercase tracking-wide">
                        {review.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400">
              <MessageSquare className="h-10 w-10 text-zinc-200 mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">
                No reviews yet. Be the first to write one!
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
