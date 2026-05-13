import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-[12rem] md:text-[20rem] font-black leading-none tracking-tighter text-black select-none">
        404
      </h1>
      <div className="space-y-6 -mt-8 md:-mt-12 relative z-10">
        <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-widest">
          Page Not Found
        </h2>
        <p className="max-w-md mx-auto text-muted-foreground text-lg">
          THE PAGE YOU ARE LOOKING FOR DOES NOT EXIST OR HAS BEEN MOVED TO A DIFFERENT UNIVERSE.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button asChild size="lg" className="h-14 px-10 text-lg font-bold rounded-none border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-all duration-300">
            <Link href="/">BACK TO HOME</Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="h-14 px-10 text-lg font-bold rounded-none border-2 border-black hover:bg-black hover:text-white transition-all duration-300">
            <Link href="/products">BROWSE PRODUCTS</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
