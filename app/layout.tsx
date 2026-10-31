import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "Canvas & Co. | Paintings and handmade art", template: "%s | Canvas & Co." },
  description: "Original paintings and handmade art: clay toys, crochet pieces and decor. Free shipping over ₹999.",
  openGraph: { type: "website", siteName: "Canvas & Co." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
          {children}
        </main>
        <footer className="mt-16 border-t px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© Canvas &amp; Co. Demo store running on Razorpay test mode. No real payments are taken.</p>
        </footer>
      </body>
    </html>
  );
}
