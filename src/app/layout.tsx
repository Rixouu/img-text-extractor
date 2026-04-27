import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PWARegistration } from "@/components/pwa-registration";

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
    apple: "/apple-icon-180.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#FFC91E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PWARegistration />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
