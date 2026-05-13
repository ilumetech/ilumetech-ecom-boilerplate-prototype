// Customer route group — protected by clerkMiddleware() in proxy.ts

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
