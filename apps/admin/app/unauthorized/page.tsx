"use client";

import Link from "next/link";
import { Button, Result } from "antd";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

export default function UnauthorizedPage() {
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirectUrl: "/sign-in" });
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Result
        status="403"
        title="Akses Ditolak"
        subTitle="Anda tidak memiliki izin untuk mengakses halaman ini."
        extra={
          <div className="flex justify-center gap-3">
            <Button type="primary" disabled={isLoggingOut}>
              <Link href="/dashboard">Kembali ke Dashboard</Link>
            </Button>
            <Button onClick={handleLogout} loading={isLoggingOut} danger>
              Keluar (Log Out)
            </Button>
          </div>
        }
      />
    </div>
  );
}
