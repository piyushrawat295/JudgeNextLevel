import './globals.css'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner"; // ✅ Import Sonner Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hackathon Judge Panel",
  description: "Judge and score hackathon teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {/* ✅ Mount Sonner Toaster globally */}
          <Toaster richColors position="top-right" />

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
