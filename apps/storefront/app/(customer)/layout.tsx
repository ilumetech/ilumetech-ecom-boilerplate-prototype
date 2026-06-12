import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-14 lg:h-16 bg-black border-b border-zinc-800" />}>
        <Header cartCount={0} />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
