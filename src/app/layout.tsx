import type { Metadata } from "next";
import { Geist, Geist_Mono, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mosaic Atelier — Pixel Studio",
  description:
    "A washi-paper pixelation atelier. Tune density, shape, hue and focal density, then export to PNG, HTML or CSS.",
  keywords: [
    "pixelate",
    "mosaic",
    "pixel art",
    "canvas",
    "image editor",
    "washi",
    "Japanese aesthetic",
  ],
  authors: [{ name: "Mosaic Atelier" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Mosaic Atelier — Pixel Studio",
    description:
      "A washi-paper pixelation atelier. Tune density, shape, hue and focal density.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mosaic Atelier — Pixel Studio",
    description: "A washi-paper pixelation atelier.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${shippori.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              boxShadow: "0 8px 24px -8px oklch(0.3 0.03 50 / 0.3)",
            },
          }}
        />
      </body>
    </html>
  );
}
