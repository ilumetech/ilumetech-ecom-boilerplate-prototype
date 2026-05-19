import { Button } from "@/components/ui/button";
import { Plus, MapPin, Pencil, Trash2 } from "lucide-react";

export const metadata = {
  title: "Addresses | Account",
  description: "Manage your shipping and billing addresses",
};

const addresses = [
  {
    id: "1",
    isDefault: true,
    type: "Shipping",
    name: "John Doe",
    street: "123 Brutalist Ave",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "United States",
    phone: "+1 (555) 000-0000",
  },
  {
    id: "2",
    isDefault: false,
    type: "Billing",
    name: "John Doe",
    street: "456 Minimalist Blvd",
    city: "Brooklyn",
    state: "NY",
    zip: "11201",
    country: "United States",
    phone: "+1 (555) 111-1111",
  },
];

export default function AddressesPage() {
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">
            Addresses
          </h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Manage your shipping and billing addresses.
          </p>
        </div>
        <Button className="rounded-none bg-black text-[10px] font-bold uppercase tracking-widest px-8 h-12 flex items-center gap-3 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add New Address
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="group relative border border-zinc-200 bg-white transition-all hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            {address.isDefault && (
              <div className="absolute top-0 right-0 bg-black text-white text-[8px] font-black uppercase tracking-widest px-3 py-1">
                Default
              </div>
            )}

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-100 group-hover:bg-black group-hover:text-white transition-colors">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors">
                  {address.type} Address
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-tight">
                  {address.name}
                </p>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {address.street}
                </p>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {address.city}, {address.state} {address.zip}
                </p>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {address.country}
                </p>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Phone: <span className="text-zinc-600">{address.phone}</span>
                </p>
              </div>
            </div>

            <div className="flex border-t border-zinc-100 group-hover:border-black transition-colors">
              <button className="flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors border-r border-zinc-100 group-hover:border-black">
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-colors">
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </div>
          </div>
        ))}

        {/* Empty State / Add Card Trigger */}
        <button className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-200 hover:border-black hover:bg-zinc-50 transition-all min-h-[320px]">
          <div className="p-4 bg-zinc-100 rounded-full group-hover:bg-black group-hover:text-white transition-all mb-4">
            <Plus className="h-8 w-8" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">
            Add another address
          </span>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            For faster checkout
          </p>
        </button>
      </div>
    </div>
  );
}
