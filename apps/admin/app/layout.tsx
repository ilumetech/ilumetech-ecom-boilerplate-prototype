import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { QueryProvider } from "@/components/providers/query-provider";
import { AntdProvider } from "@/components/providers/antd-provider";
import { ApiAuthInjector } from "@/components/providers/api-auth-injector";
import "./globals.css";

export const metadata: Metadata = {
  title: "IlumeTech ERP",
  description: "Stock and logistics ERP system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <AntdRegistry>
            <AntdProvider>
              <QueryProvider>
                <ApiAuthInjector />
                {children}
              </QueryProvider>
            </AntdProvider>
          </AntdRegistry>
        </body>
      </html>
    </ClerkProvider>
  );
}
