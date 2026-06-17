import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Command Inbox",
  description: "Keyboard-first email and calendar command center",
  applicationName: "Command Inbox",
  openGraph: {
    title: "Command Inbox",
    description: "Keyboard-first Gmail + Calendar command center with AI triage and Corsair MCP",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Command Inbox" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Command Inbox",
    description: "Keyboard-first Gmail + Calendar command center with AI triage and Corsair MCP",
    images: ["/opengraph-image"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Command Inbox",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#f5f5f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} font-sans`}>{children}</body>
    </html>
  );
}
