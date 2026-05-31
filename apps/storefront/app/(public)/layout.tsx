import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-20 lg:h-24 bg-white border-b border-zinc-200" />}>
        <Header cartCount={0} />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
