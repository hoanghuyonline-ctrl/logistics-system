import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layouts/Providers";
import ZaloQRWidget from "@/components/ui/ZaloQRWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bắc Trung Hải Logistics - Vận chuyển Trung Quốc Việt Nam",
  description: "Công ty TNHH Bắc Trung Hải Logistics — Dịch vụ vận chuyển hàng hóa Trung Quốc - Việt Nam uy tín, nhanh chóng. Đối tác ESP. Hotline: 0989 711 888",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <ZaloQRWidget />
        </Providers>
      </body>
    </html>
  );
}
