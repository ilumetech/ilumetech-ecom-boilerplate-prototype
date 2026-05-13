// app/(public)/faq/page.tsx
import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

const faqs = [
  {
    category: 'Orders & Shipping',
    questions: [
      {
        q: 'How long does shipping take?',
        a: 'Orders are processed within 24 hours. Delivery typically takes 2-5 business days depending on your location in Indonesia. You will receive a tracking number once your order ships.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes! Once your order is dispatched, you will receive an email with a tracking link. You can also view your order status directly on our Track Order page.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently, we only ship within Indonesia. We are looking to expand our shipping areas in the near future.',
      },
    ],
  },
  {
    category: 'Returns & Exchanges',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 14 days of delivery for unworn, unwashed items in their original condition and packaging. Final sale items are not eligible for returns.',
      },
      {
        q: 'How do I start an exchange?',
        a: 'To initiate an exchange, please contact our support team via WhatsApp with your order number. We will guide you through the process.',
      },
      {
        q: 'When will I get my refund?',
        a: 'Once we receive and inspect your return, refunds are processed within 3-5 business days back to your original payment method.',
      },
    ],
  },
  {
    category: 'Products & Sizing',
    questions: [
      {
        q: 'How do I find the right size?',
        a: 'Each product page includes a detailed size guide. If you are between sizes, we recommend sizing up for a more relaxed fit or contacting us for specific measurements.',
      },
      {
        q: 'Are your products authentic?',
        a: 'Yes, 100%. As the official store, we guarantee the authenticity of every product sold through our channel.',
      },
      {
        q: 'Will sold out items be restocked?',
        a: 'We frequently restock popular core items. For limited collections, once they are gone, they may not return. Follow our social media for restock announcements.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <>

      <section className="mx-auto max-w-4xl px-4 py-6 md:px-6 lg:py-10">
        <div className="mb-8 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
          <Link href="/" className="hover:text-black">Home</Link>
          <span>/</span>
          <span className="text-black">FAQ</span>
        </div>

        <div className="mb-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Help Center
          </p>
          <h1 className="text-4xl font-black uppercase leading-none tracking-tight md:text-5xl lg:text-6xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-700">
            Find answers to common questions about our products, shipping, returns, and more. If you can't find what you're looking for, our team is always ready to help.
          </p>
        </div>

        <div className="space-y-12">
          {faqs.map((category, idx) => (
            <div key={idx}>
              <h2 className="mb-6 text-xl font-bold uppercase tracking-tight">
                {category.category}
              </h2>
              <Accordion type="multiple" className="w-full">
                {category.questions.map((faq, fIdx) => (
                  <AccordionItem key={fIdx} value={`${idx}-${fIdx}`}>
                    <AccordionTrigger className="text-left text-sm font-semibold uppercase tracking-wide hover:no-underline hover:text-zinc-600">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-7 text-zinc-600">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-20 rounded-md border border-zinc-200 bg-zinc-50 p-8 text-center md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Still Have Questions?
          </p>
          <h3 className="mt-4 text-2xl font-black uppercase tracking-tight md:text-3xl">
            We're Here to Help
          </h3>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-zinc-600">
            Can't find the answer you're looking for? Reach out to our customer support team directly.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild className="h-12 rounded-none bg-black px-8 text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800">
              <Link href="https://wa.me/6281234567890">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </>
  )
}
