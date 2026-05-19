import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Eye, FileText, UserCheck, Bell } from "lucide-react";

const sections = [
  {
    title: "Data Collection",
    icon: Eye,
    content:
      "We collect information you provide directly to us when you create an account, make a purchase, or communicate with us. This may include your name, email address, phone number, shipping address, and payment information.",
  },
  {
    title: "How We Use Data",
    icon: FileText,
    content:
      "Your data is primarily used to process orders, manage your account, and provide customer support. We also use information to improve our services, send marketing communications (with your consent), and prevent fraudulent transactions.",
  },
  {
    title: "Data Security",
    icon: Shield,
    content:
      "We implement industry-standard security measures to protect your personal information. All transactions are processed through secure gateways, and we do not store sensitive payment details on our servers.",
  },
  {
    title: "Information Sharing",
    icon: Lock,
    content:
      "We do not sell your personal data. We only share information with trusted third-party service providers (like shipping couriers and payment processors) necessary to fulfill your orders and operate our business.",
  },
  {
    title: "Your Rights",
    icon: UserCheck,
    content:
      "You have the right to access, update, or delete your personal information at any time. You can also opt-out of marketing communications by following the unsubscribe instructions in our emails.",
  },
  {
    title: "Policy Updates",
    icon: Bell,
    content:
      'We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last Updated" date.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:py-10">
        <div className="mb-8 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>/</span>
          <span className="text-black">Privacy Policy</span>
        </div>

        <div className="max-w-4xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Legal & Privacy
          </p>
          <h1 className="text-5xl font-black uppercase leading-none tracking-tight md:text-6xl lg:text-7xl">
            Privacy Policy.
          </h1>
          <p className="mt-8 text-lg leading-8 text-zinc-600 md:text-xl">
            At Storefront, we take your privacy seriously. This policy explains
            how we collect, use, and protect your personal information when you
            shop with us.
          </p>
          <p className="mt-4 text-sm text-zinc-400">
            Last Updated: May 13, 2026
          </p>
        </div>
      </section>

      <Separator className="mx-auto max-w-7xl" />

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="group">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-none bg-zinc-50 group-hover:bg-black group-hover:text-white transition-colors duration-300">
                  <Icon className="h-6 w-6 stroke-[1.5]" />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-tight md:text-2xl">
                  {section.title}
                </h2>
                <p className="mt-4 text-base leading-8 text-zinc-600">
                  {section.content}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-zinc-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black uppercase tracking-tight md:text-4xl">
              Questions about your privacy?
            </h2>
            <p className="mt-6 text-lg text-zinc-600">
              If you have any questions or concerns about how we handle your
              data, please don't hesitate to reach out to our legal team or
              customer support.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="mailto:privacy@storefront.com"
                className="inline-flex h-12 items-center justify-center border border-black bg-black px-8 text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800 transition-colors"
              >
                Email Privacy Team
              </Link>
              <Link
                href="https://wa.me/6281234567890"
                className="inline-flex h-12 items-center justify-center border border-black bg-transparent px-8 text-xs font-semibold uppercase tracking-wide text-black hover:bg-black hover:text-white transition-colors"
              >
                Contact via WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
