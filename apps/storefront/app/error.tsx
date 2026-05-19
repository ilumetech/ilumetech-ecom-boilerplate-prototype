"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-[10rem] md:text-[15rem] font-black leading-none tracking-tighter text-destructive select-none">
        ERROR
      </h1>
      <div className="space-y-6 -mt-4 md:-mt-8 relative z-10">
        <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-widest">
          Something went wrong
        </h2>
        <p className="max-w-md mx-auto text-muted-foreground text-lg uppercase">
          An unexpected error occurred. Our team of digital blacksmiths is
          already on it.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button
            onClick={() => reset()}
            size="lg"
            className="h-14 px-10 text-lg font-bold rounded-none border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-all duration-300"
          >
            TRY AGAIN
          </Button>
          <Button
            variant="outline"
            asChild
            size="lg"
            className="h-14 px-10 text-lg font-bold rounded-none border-2 border-black hover:bg-black hover:text-white transition-all duration-300"
          >
            <Link href="/">BACK TO HOME</Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
