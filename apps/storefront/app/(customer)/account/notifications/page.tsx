import { Bell, ShoppingBag, Tag, Info, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export const metadata = {
  title: "Notifications | Account",
  description: "Stay updated with your order status and exclusive offers",
}

const notifications = [
  {
    id: 1,
    type: "order",
    title: "Order Delivered",
    message: "Your order #ORD-7729 has been successfully delivered. We hope you enjoy your purchase!",
    time: "2 hours ago",
    read: false,
    icon: <ShoppingBag className="h-4 w-4" />,
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    id: 2,
    type: "promo",
    title: "Flash Sale Alert",
    message: "Get 20% OFF on all summer collections. Use code: SUMMER20 at checkout.",
    time: "5 hours ago",
    read: true,
    icon: <Tag className="h-4 w-4" />,
    color: "bg-orange-50 text-orange-600 border-orange-100",
  },
  {
    id: 3,
    type: "system",
    title: "Security Update",
    message: "Your account password was successfully updated yesterday.",
    time: "1 day ago",
    read: true,
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-green-50 text-green-600 border-green-100",
  },
  {
    id: 4,
    type: "order",
    title: "Order Shipped",
    message: "Exciting news! Your order #ORD-7729 has been shipped and is on its way.",
    time: "2 days ago",
    read: true,
    icon: <Clock className="h-4 w-4" />,
    color: "bg-zinc-50 text-zinc-600 border-zinc-100",
  },
]

export default function NotificationsPage() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Notifications</h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Stay updated with your activity and offers.
          </p>
        </div>
        <Button variant="outline" className="rounded-none border-black text-[10px] font-bold uppercase tracking-widest h-10 px-6 hover:bg-black hover:text-white transition-all">
          Mark All As Read
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-black">
            <h3 className="text-sm font-black uppercase tracking-tight">Recent Activity</h3>
            <span className="text-[10px] font-black bg-black text-white px-2 py-0.5">4 TOTAL</span>
          </div>
          
          <div className="space-y-4 pt-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`group relative border ${notification.read ? 'border-zinc-200 bg-white' : 'border-black bg-zinc-50'} p-6 transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1`}
              >
                {!notification.read && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-black -translate-y-1/2 translate-x-1/2 rotate-45" />
                )}
                <div className="flex gap-6">
                  <div className={`shrink-0 w-12 h-12 flex items-center justify-center border-2 border-black transition-transform group-hover:scale-110 ${notification.color}`}>
                    {notification.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-black uppercase tracking-tight">
                        {notification.title}
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed font-medium text-zinc-600 max-w-md">
                      {notification.message}
                    </p>
                    <div className="pt-3 flex gap-4">
                      <button className="text-[9px] font-black uppercase tracking-widest text-black underline underline-offset-4 hover:opacity-70">
                        View Details
                      </button>
                      {notification.read ? (
                        <button className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-black">
                          Archive
                        </button>
                      ) : (
                        <button className="text-[9px] font-black uppercase tracking-widest text-black hover:opacity-70">
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="ghost" className="w-full rounded-none border border-dashed border-zinc-300 text-[10px] font-bold uppercase tracking-widest h-14 hover:border-black hover:bg-transparent">
            Load Older Notifications
          </Button>
        </div>

        <div className="space-y-8">
          <div className="border-2 border-black bg-white p-8 sticky top-8">
            <h3 className="text-sm font-black uppercase tracking-tight mb-8">Preferences</h3>
            
            <div className="space-y-10">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Order Updates</Label>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 leading-tight">
                    Shipment tracking and delivery status.
                  </p>
                </div>
                <Switch defaultChecked className="" />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Marketing</Label>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 leading-tight">
                    Exclusive offers and new arrivals.
                  </p>
                </div>
                <Switch defaultChecked className="" />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Security Alerts</Label>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 leading-tight">
                    Account login and password changes.
                  </p>
                </div>
                <Switch defaultChecked disabled className="" />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Newsletter</Label>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 leading-tight">
                    Weekly digest of the best stories.
                  </p>
                </div>
                <Switch className="" />
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-zinc-100">
              <Button className="w-full rounded-none bg-black text-[10px] font-black uppercase tracking-widest h-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
