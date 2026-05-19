// apps/storefront/app/(public)/terms/page.tsx
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: `Welcome to Storefront. These Terms & Conditions govern your use of our website and the purchase of products from our official store. By accessing or using our services, you agree to be bound by these terms. If you do not agree with any part of these terms, please do not use our website.`,
  },
  {
    id: "orders",
    title: "2. Orders & Payments",
    content: `When you place an order, you are making an offer to purchase the products in your cart. We reserve the right to accept or decline any order for any reason. All prices are listed in IDR (Indonesian Rupiah) unless stated otherwise. Payments must be made through our authorized payment gateways. Once payment is confirmed, your order will be processed for shipping.`,
  },
  {
    id: "shipping",
    title: "3. Shipping & Delivery",
    content: `We aim to process and ship orders within 24 hours of payment confirmation. Delivery times vary based on your location in Indonesia. While we strive to meet estimated delivery dates, we are not liable for delays caused by shipping couriers or external factors beyond our control. Risk of loss and title for products pass to you upon delivery to the carrier.`,
  },
  {
    id: "returns",
    title: "4. Returns & Refunds",
    content: `We want you to be satisfied with your purchase. If you receive a damaged or incorrect item, please contact us within 48 hours of delivery with photo evidence. Items must be returned in their original condition, unworn, and with all tags attached. Refunds or exchanges are processed once we receive and inspect the returned items. Please refer to our Returns Policy for more details.`,
  },
  {
    id: "privacy",
    title: "5. Privacy Policy",
    content: `Your privacy is important to us. We collect and use your personal information only to process orders and improve your shopping experience. We do not sell or share your data with third parties for marketing purposes. For more information, please view our full Privacy Policy.`,
  },
  {
    id: "intellectual-property",
    title: "6. Intellectual Property",
    content: `All content on this website, including text, graphics, logos, images, and software, is the property of Storefront or its content suppliers and is protected by Indonesian and international copyright laws. You may not use, reproduce, or distribute any content without our prior written consent.`,
  },
  {
    id: "limitation-of-liability",
    title: "7. Limitation of Liability",
    content: `Storefront shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services or products. Our total liability to you for any claim arising out of these terms shall not exceed the amount paid by you for the product in question.`,
  },
  {
    id: "governing-law",
    title: "8. Governing Law",
    content: `These terms are governed by and construed in accordance with the laws of the Republic of Indonesia. Any disputes arising from these terms shall be resolved exclusively in the courts of Indonesia.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:py-10">
        <div className="mb-8 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>/</span>
          <span className="text-black">Terms & Conditions</span>
        </div>

        <div className="max-w-3xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Legal Information
          </p>
          <h1 className="text-5xl font-black uppercase leading-none tracking-tight md:text-6xl lg:text-7xl">
            Terms of Service.
          </h1>
          <p className="mt-8 text-lg leading-8 text-zinc-700">
            Last updated: May 13, 2024. Please read these terms carefully before
            using our services.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Contents
              </p>
              <ul className="space-y-3 text-sm font-medium">
                {sections.map((section) => (
                  <li key={section.id}>
                    <Link
                      href={`#${section.id}`}
                      className="text-zinc-500 transition-colors hover:text-black"
                    >
                      {section.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="space-y-16">
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
                  {section.title}
                </h2>
                <div className="mt-6 space-y-6 text-base leading-8 text-zinc-700 md:text-lg md:leading-9">
                  <p>{section.content}</p>
                </div>
                <Separator className="mt-12" />
              </div>
            ))}

            <div className="rounded-md bg-zinc-50 p-8 md:p-12">
              <h3 className="text-xl font-bold uppercase tracking-tight">
                Questions?
              </h3>
              <p className="mt-4 text-zinc-600">
                If you have any questions regarding these Terms & Conditions,
                please contact our customer support team.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="mailto:legal@example.com"
                  className="inline-flex h-12 items-center justify-center bg-black px-8 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-zinc-800"
                >
                  Email Legal Team
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex h-12 items-center justify-center border border-black px-8 text-xs font-semibold uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
                >
                  View FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
