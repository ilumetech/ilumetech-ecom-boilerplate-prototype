"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCustomerProfile, updateCustomerProfile } from "@/lib/api/customer";
import type { AppCustomer } from "@ilumetech/types";

export function ProfileForm() {
  const { isSignedIn, getToken, isLoaded: isAuthLoaded } = useAuth();
  const [profile, setProfile] = useState<AppCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getCustomerProfile(token);
        setProfile(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setUsername(data.username || "");
        setEmail(data.email || "");
      } catch (err: any) {
        console.error("Failed to load profile", err);
        setStatus({
          type: "error",
          message: err.message || "Failed to load profile information.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthLoaded) {
      if (isSignedIn) {
        loadProfile();
      } else {
        setIsLoading(false);
      }
    }
  }, [isAuthLoaded, isSignedIn, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) return;

    setIsSaving(true);
    setStatus(null);

    try {
      const token = await getToken();
      if (!token) return;

      const updated = await updateCustomerProfile(token, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        username: username || undefined,
      });

      setProfile(updated);
      setFirstName(updated.firstName || "");
      setLastName(updated.lastName || "");
      setUsername(updated.username || "");

      setStatus({
        type: "success",
        message: "Profile details updated successfully!",
      });
    } catch (err: any) {
      console.error("Failed to update profile", err);
      setStatus({
        type: "error",
        message: err.message || "Failed to update profile details.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    alert("To permanently delete your account and all associated data, please contact customer support.");
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
        Loading profile details...
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 text-black">
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tight">
          Profile
        </h2>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
          Manage your personal information.
        </p>
      </div>

      <div className="space-y-8">
        <form onSubmit={handleSubmit} className="border border-zinc-200 bg-white transition-all hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-8">
            <h3 className="text-sm font-black uppercase tracking-tight mb-8">
              Personal Information
            </h3>

            {status && (
              <div
                className={`mb-8 p-4 border text-xs font-bold uppercase tracking-wider ${
                  status.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800 animate-in fade-in duration-300"
                    : "border-red-200 bg-red-50 text-red-800 animate-in fade-in duration-300"
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label
                    htmlFor="first-name"
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
                  >
                    First name
                  </Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black text-xs font-bold uppercase tracking-widest bg-white"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="last-name"
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
                  >
                    Last name
                  </Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black text-xs font-bold uppercase tracking-widest bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label
                    htmlFor="username"
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
                  >
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black text-xs font-bold uppercase tracking-widest bg-white"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
                  >
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="h-12 rounded-none border-zinc-200 bg-zinc-50 text-zinc-400 text-xs font-bold uppercase tracking-widest cursor-not-allowed"
                  />
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    Email address is managed by your account provider.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="phone"
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
                >
                  Phone number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value="Managed via shipping addresses"
                  disabled
                  className="h-12 rounded-none border-zinc-200 bg-zinc-50 text-zinc-400 text-xs font-bold uppercase tracking-widest cursor-not-allowed"
                />
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                  Phone numbers are configured per shipping address.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-50 border-t border-zinc-200 p-6 flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-none bg-black text-[10px] font-bold uppercase tracking-widest px-10 h-12 hover:bg-zinc-800 disabled:bg-zinc-700 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Details"}
            </Button>
          </div>
        </form>

        <div className="pt-12 border-t border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight text-red-600">
                Danger Zone
              </h4>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button
              onClick={handleDeleteAccount}
              variant="outline"
              className="rounded-none border-red-200 text-red-600 hover:bg-red-600 hover:text-white text-[10px] font-bold uppercase tracking-widest px-8 cursor-pointer"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
