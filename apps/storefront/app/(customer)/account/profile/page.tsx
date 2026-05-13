import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const metadata = {
  title: "Profile | Account",
  description: "Manage your profile information",
}

export default function ProfilePage() {
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tight">Profile</h2>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
          Manage your personal information.
        </p>
      </div>

      <div className="space-y-8">
        <div className="border border-zinc-200 bg-white transition-all hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-8">
            <h3 className="text-sm font-black uppercase tracking-tight mb-8">Personal Information</h3>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="first-name" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">First name</Label>
                  <Input id="first-name" defaultValue="John" className="h-12 rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black text-xs font-bold uppercase tracking-widest" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="last-name" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Last name</Label>
                  <Input id="last-name" defaultValue="Doe" className="h-12 rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black text-xs font-bold uppercase tracking-widest" />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email address</Label>
                <Input id="email" type="email" defaultValue="john.doe@example.com" className="h-12 rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black text-xs font-bold uppercase tracking-widest" />
              </div>
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Phone number</Label>
                <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" className="h-12 rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black text-xs font-bold uppercase tracking-widest" />
              </div>
            </div>
          </div>
          <div className="bg-zinc-50 border-t border-zinc-200 p-6 flex justify-end">
            <Button className="rounded-none bg-black text-[10px] font-bold uppercase tracking-widest px-10">
              Save Details
            </Button>
          </div>
        </div>


        <div className="pt-12 border-t border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight text-red-600">Danger Zone</h4>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button variant="outline" className="rounded-none border-red-200 text-red-600 hover:bg-red-600 hover:text-white text-[10px] font-bold uppercase tracking-widest px-8">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
