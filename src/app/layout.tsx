import type { Metadata } from "next";
import "./globals.css";
import { PWARegistration } from "@/components/pwa-registration";
import { InstallBanner } from "@/components/install-banner";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Image Text Extractor",
  description: "Extract text from images with ease using OCR technology.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ImgExtractor",
  },
  icons: {
    icon: [
      { url: "/favicon-196.png" },
      { url: "/favicon.png" },
      { url: "/favicon.ico" }
    ],
    apple: "/apple-icon-180.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#FFCA1D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PWARegistration />
        <InstallBanner />
        <Toaster />
        {children}
      </body>
    </html>
  );
}
