"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getProductReviews, type ProductReviewsData } from "@/lib/api/review";

interface ProductReviewsSectionProps {
  productId: string;
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const [data, setData] = useState<ProductReviewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
