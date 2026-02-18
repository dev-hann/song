import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/app-layout";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SONG - 광고 없는 영상 플레이어",
  description: "YouTube 영상을 광고 없이 시청하세요",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SONG",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" style={{ height: '100%' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ height: '100%' }}
      >
        <div id="app">
          <Providers>
            <AppLayout>{children}</AppLayout>
          </Providers>
        </div>
      </body>
    </html>
  );
}
