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
  title: {
    default: "Mosaic Atelier — Pixel Studio",
    template: "%s · Mosaic Atelier",
  },
  description:
    "A washi-paper pixelation atelier. Upload any image, tune pixel density, shape, color, focal-point variable density, then export to PNG, SVG, HTML, CSS, JSON or ASCII. 100% client-side.",
  keywords: [
    "pixelate",
    "mosaic",
    "pixel art",
    "canvas",
    "image editor",
    "washi",
    "Japanese aesthetic",
    "svg export",
    "vector mosaic",
    "color palette",
    "pixelation studio",
  ],
  authors: [{ name: "Mosaic Atelier" }],
  creator: "Mosaic Atelier",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: undefined,
  openGraph: {
    title: "Mosaic Atelier — Pixel Studio",
    description:
      "A washi-paper pixelation atelier. Tune density, shape, hue, focal density & palette lock, then export to 6 formats.",
    type: "website",
    locale: "en_US",
    siteName: "Mosaic Atelier",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mosaic Atelier — Pixel Studio",
    description: "A washi-paper pixelation atelier. 16 presets, 6 export formats, 16 keyboard shortcuts.",
  },
  category: "design",
  applicationName: "Mosaic Atelier",
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
