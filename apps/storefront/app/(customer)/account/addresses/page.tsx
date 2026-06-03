"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, MapPin, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type CustomerAddress,
} from "@/lib/api/address";
import { INDONESIA_DATA, normalizeProvince } from "@/lib/indonesia-data";

export default function AddressesPage() {
  const { isSignedIn, getToken, isLoaded: isAuthLoaded } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  
  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("Jakarta Pusat");
  const [province, setProvince] = useState("DKI Jakarta");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("ID");
  const [phone, setPhone] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAddresses = async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getAddresses(token);
      setAddresses(data);
    } catch (err) {
      console.error("Failed to load addresses", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      fetchAddresses();
    } else if (isAuthLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isAuthLoaded, isSignedIn]);

  const openAddModal = () => {
    setEditingAddress(null);
    setFirstName("");
    setLastName("");
    setAddressLine1("");
    setAddressLine2("");
    setProvince("DKI Jakarta");
    setCity("Jakarta Pusat");
    setPostalCode("");
    setCountry("ID");
    setPhone("");
    setIsDefault(addresses.length === 0); // default to true if first address
    setIsModalOpen(true);
  };

  const openEditModal = (address: CustomerAddress) => {
    setEditingAddress(address);
    setFirstName(address.firstName);
    setLastName(address.lastName);
    setAddressLine1(address.addressLine1);
    setAddressLine2(address.addressLine2 || "");
    const normProvince = normalizeProvince(address.province);
    setProvince(normProvince);
    setCity(address.city);
    setPostalCode(address.postalCode);
    setCountry(address.country);
    setPhone(address.phone || "");
    setIsDefault(address.isDefault);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) return;
    
    if (!firstName || !lastName || !addressLine1 || !city || !province || !postalCode || !phone) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const payload = {
        firstName,
        lastName,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        province,
        postalCode,
        country,
        phone,
        isDefault,
      };

      if (editingAddress) {
        await updateAddress(editingAddress.id, payload, token);
      } else {
        await createAddress(payload, token);
      }
      
      setIsModalOpen(false);
      await fetchAddresses();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSignedIn || !confirm("Are you sure you want to delete this address?")) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteAddress(id, token);
      await fetchAddresses();
    } catch (err) {
      console.error("Failed to delete address", err);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      await setDefaultAddress(id, token);
      await fetchAddresses();
    } catch (err) {
      console.error("Failed to set default address", err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
        Loading addresses...
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">
            Addresses
          </h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Manage your shipping and billing addresses.
          </p>
        </div>
        <Button 
          onClick={openAddModal}
          className="rounded-none bg-black text-[10px] font-bold uppercase tracking-widest px-8 h-12 flex items-center gap-3 self-start sm:self-auto hover:bg-zinc-800"
        >
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
              <div className="absolute top-0 right-0 bg-black text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 flex items-center gap-1">
                <Check className="h-2.5 w-2.5 stroke-[3]" /> Default
              </div>
            )}

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-100 group-hover:bg-black group-hover:text-white transition-colors">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors">
                  Shipping Address
                </span>
              </div>

              <div className="space-y-1 text-zinc-800">
                <p className="text-sm font-black uppercase tracking-tight text-black">
                  {address.firstName} {address.lastName}
                </p>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {address.addressLine1}
                </p>
                {address.addressLine2 && (
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    {address.addressLine2}
                  </p>
                )}
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {address.city}, {address.province} {address.postalCode}
                </p>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {address.country === "ID" ? "Indonesia" : address.country}
                </p>
                {address.phone && (
                  <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Phone: <span className="text-zinc-600 font-bold">{address.phone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex border-t border-zinc-100 group-hover:border-black transition-colors">
              <button 
                onClick={() => openEditModal(address)}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors border-r border-zinc-100 group-hover:border-black cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              {!address.isDefault && (
                <button 
                  onClick={() => handleSetDefault(address.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors border-r border-zinc-100 group-hover:border-black cursor-pointer"
                >
                  Set Default
                </button>
              )}
              <button 
                onClick={() => handleDelete(address.id)}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </div>
          </div>
        ))}

        {/* Empty State / Add Card Trigger */}
        <button 
          onClick={openAddModal}
          className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-200 hover:border-black hover:bg-zinc-50 transition-all min-h-[320px] w-full text-black"
        >
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

      {/* Address Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-xl rounded-none border-zinc-300 shadow-2xl overflow-hidden bg-white max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-black uppercase tracking-tight text-black">
                  {editingAddress ? "Edit Address" : "Add Address"}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-black">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-11 rounded-none border-zinc-300 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-11 rounded-none border-zinc-300 bg-white"
                    />
                  </div>
                </div>



                 <div className="space-y-1.5">
                  <Label htmlFor="addressLine1" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Address line 1 *</Label>
                  <Input
                    id="addressLine1"
                    placeholder="Street name, P.O. box"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                    className="h-11 rounded-none border-zinc-300 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="addressLine2" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Address line 2 (Optional)</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Apartment, suite, unit, building, floor"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="h-11 rounded-none border-zinc-300 bg-white"
                  />
                </div>

                 <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="province" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Province *</Label>
                    <Select
                      value={province}
                      onValueChange={(val) => {
                        setProvince(val);
                        const cities = INDONESIA_DATA[val] || [];
                        setCity(cities[0] || "");
                      }}
                    >
                      <SelectTrigger className="h-11 w-full rounded-none border-zinc-300 bg-white text-left">
                        <SelectValue placeholder="Province" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-zinc-200 max-h-[250px] overflow-y-auto">
                        {Object.keys(INDONESIA_DATA).map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="city" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">City *</Label>
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger className="h-11 w-full rounded-none border-zinc-300 bg-white text-left">
                        <SelectValue placeholder="City" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-zinc-200 max-h-[250px] overflow-y-auto">
                        {(() => {
                          const list = INDONESIA_DATA[province] || [];
                          const options = [...list];
                          if (city && !options.includes(city)) {
                            options.unshift(city);
                          }
                          return options.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="postalCode" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      className="h-11 rounded-none border-zinc-300 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-11 rounded-none border-zinc-300 bg-white"
                  />
                </div>

                {(!editingAddress || !editingAddress.isDefault) && (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="isDefault"
                      checked={isDefault}
                      onCheckedChange={(checked) => setIsDefault(checked === true)}
                      className="rounded-none border-zinc-300 data-[state=checked]:bg-black data-[state=checked]:text-white"
                    />
                    <Label
                      htmlFor="isDefault"
                      className="text-xs text-zinc-600 font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      Set as default address
                    </Label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="h-12 rounded-none border-zinc-300 text-[10px] font-bold uppercase tracking-widest px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 rounded-none bg-black text-[10px] font-bold uppercase tracking-widest px-8 hover:bg-zinc-800 disabled:bg-zinc-700"
                  >
                    {isSubmitting ? "Saving..." : "Save Address"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
