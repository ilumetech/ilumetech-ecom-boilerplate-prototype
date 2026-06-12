// components/footer.tsx
import Link from "next/link";
import { MessageCircle, Mail } from "lucide-react";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const customerServiceLinks = [
  { label: "FAQ", href: "/faq" },
  { label: "How to Order", href: "/how-to-order" },
  { label: "Shipping Info", href: "/shipping" },
  { label: "Returns & Refund", href: "/returns" },
  { label: "Track Order", href: "/account/orders" },
];

const informationLinks = [
  { label: "About Us", href: "/about" },
  { label: "Size Guide", href: "/size-guide" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

const contactItems = [
  { label: "WhatsApp: 0812-3456-7890", href: "https://wa.me/6281234567890" },
  { label: "Email: hello@example.com", href: "mailto:hello@example.com" },
  { label: "Mon - Sat, 09.00 - 18.00", href: null },
];

const paymentMethods = [
  "BCA",
  "Mandiri",
  "BNI",
  "BRI",
  "OVO",
  "DANA",
  "GoPay",
  "ShopeePay",
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-6 md:grid-cols-2 md:px-6 lg:grid-cols-5 lg:py-8">
        <div>
          <BrandLogo />
          <p className="mt-5 max-w-xs text-sm leading-6 text-zinc-400">
            Thank you for trusting us. We’re here to provide the best products
            and experience for you.
          </p>

          <div className="mt-6 flex items-center gap-4">
            <Link
              href="https://instagram.com"
              aria-label="Instagram"
              className="hover:opacity-60"
            >
              <InstagramIcon className="h-5 w-5" />
            </Link>
            <Link
              href="https://tiktok.com"
              aria-label="TikTok"
              className="hover:opacity-60"
            >
              <TikTokIcon className="h-5 w-5" />
            </Link>
            <Link
              href="https://wa.me/6281234567890"
              aria-label="WhatsApp"
              className="hover:opacity-60"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
            <Link
              href="mailto:hello@example.com"
              aria-label="Email"
              className="hover:opacity-60"
            >
              <Mail className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <FooterLinkColumn
          title="Customer Service"
          links={customerServiceLinks}
        />
        <FooterLinkColumn title="Information" links={informationLinks} />

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide">
            Contact Us
          </h3>
          <ul className="mt-5 space-y-3 text-sm text-zinc-400">
            {contactItems.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide">
            Payment Method
          </h3>
          <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 text-sm font-bold uppercase text-white sm:grid-cols-4 lg:grid-cols-2">
            {paymentMethods.map((method) => (
              <span key={method}>{method}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-zinc-800 px-4 py-5 text-center text-xs text-zinc-500 md:px-6">
        © 2024 SHOETING STARS OFFICIAL STORE. All rights reserved.
      </div>
    </footer>
  );
}

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm text-zinc-400">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/images/shoeting_stars_logo_white_transparent_HD.png"
        alt="Shoeting Stars Logo"
        className="h-20 md:h-24 w-auto object-contain"
      />
    </div>
  );
}
