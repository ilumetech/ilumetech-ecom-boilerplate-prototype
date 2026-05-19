import Link from "next/link";
import { User, Package, MapPin, Heart, Bell } from "lucide-react";

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/account/profile",
    icon: <User className="h-4 w-4" />,
  },
  {
    title: "Orders",
    href: "/account/orders",
    icon: <Package className="h-4 w-4" />,
  },
  {
    title: "Addresses",
    href: "/account/addresses",
    icon: <MapPin className="h-4 w-4" />,
  },
  {
    title: "Wishlist",
    href: "/account/wishlist",
    icon: <Heart className="h-4 w-4" />,
  },
  {
    title: "Notifications",
    href: "/account/notifications",
    icon: <Bell className="h-4 w-4" />,
  },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20">
      <div className="flex flex-col space-y-12 md:flex-row md:space-x-16 md:space-y-0">
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="mb-10">
            <h1 className="text-4xl font-black uppercase tracking-tight md:text-5xl">
              Account
            </h1>
            <div className="mt-4 h-1 w-12 bg-black" />
            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Manage your profile and preferences.
            </p>
          </div>
          <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1 overflow-x-auto pb-4 md:pb-0 hide-scrollbar border-b border-zinc-200 md:border-none">
            {sidebarNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center space-x-3 border border-transparent px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all hover:border-black hover:bg-black hover:text-white whitespace-nowrap text-zinc-500"
              >
                <span className="shrink-0 transition-transform group-hover:scale-110">
                  {item.icon}
                </span>
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
