import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Sign Up | Storefront",
  description: "Create a customer account",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-white relative">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute left-6 top-6 z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black hover:opacity-70 md:text-white md:hover:opacity-80"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Shop
      </Link>

      {/* Visual Banner - Left side */}
      <div className="relative hidden w-full md:flex md:w-1/2 bg-zinc-900 flex-col justify-end p-12 text-white min-h-screen">
        <Image
          src="/images/auth_banner.png"
          alt="Luxury fashion showcase"
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-60 mix-blend-luminosity"
        />
        <div className="relative z-10 space-y-4">
          <div className="text-sm font-semibold uppercase tracking-[0.3em] opacity-80">
            Storefront Official
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight lg:text-5xl font-heading leading-none max-w-md">
            Join the Club
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-300 max-w-sm leading-relaxed">
            Create an account to track your orders, manage shipping addresses, and enjoy faster checkout.
          </p>
        </div>
      </div>

      {/* Form Container - Right side */}
      <div className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 md:px-12 md:py-24">
        <div className="w-full max-w-lg space-y-6">
          {/* Unified custom header */}
          <div className="text-center md:text-left mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tight text-black font-heading">
              Create Account
            </h2>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Join to track orders and checkout faster
            </p>
          </div>

          <div className="flex justify-center md:justify-start w-full">
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              appearance={{
                variables: {
                  borderRadius: "0px",
                },
                elements: {
                  rootBox: "!w-full !max-w-none flex justify-center md:justify-start",
                  cardBox: "!shadow-none !border-none !bg-transparent !w-full !max-w-none !overflow-visible",
                  card: "!shadow-none !border-none !bg-transparent !w-full !max-w-none !p-0 !overflow-visible",
                  main: "!w-full",
                  form: "!w-full",
                  header: "!hidden",
                  headerTitle: "!hidden",
                  headerSubtitle: "!hidden",
                  socialButtonsBlockButton: "!border !border-zinc-200 hover:!border-black !rounded-none transition-all text-[10px] font-bold uppercase tracking-widest h-12 !shadow-none !w-full",
                  socialButtonsBlockButtonText: "text-black font-semibold",
                  socialButtonsProviderIcon: "dark:invert",
                  dividerLine: "!bg-zinc-200",
                  dividerText: "text-xs font-bold uppercase tracking-widest text-zinc-400",
                  formFieldLabel: "text-[10px] font-black uppercase tracking-widest text-zinc-500",
                  formFieldInput: "h-12 !rounded-none !border !border-zinc-200 focus-visible:!ring-0 focus-visible:!border-black text-xs font-bold px-4 !w-full",
                  formButtonPrimary: "h-12 !rounded-none !bg-black text-[10px] font-bold uppercase tracking-widest hover:!bg-zinc-800 transition-all !shadow-none !border-none !w-full",
                  footerActionLink: "text-black hover:underline text-xs font-bold uppercase tracking-widest",
                  footerActionText: "text-zinc-500 text-xs font-bold uppercase tracking-widest",
                  formFieldInputShowPasswordButton: "text-zinc-500 hover:text-black",
                },
              }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
