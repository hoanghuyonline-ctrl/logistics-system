import type { Metadata, Viewport } from "next";
import ScannerAuthGuard from "@/components/scanner/ScannerAuthGuard";

export const metadata: Metadata = {
  title: "Quét Kho Mini — Bắc Trung Hải Logistics",
  description: "Ứng dụng quét mã vạch kho hàng di động. Tra cứu kiện hàng, cập nhật trạng thái, theo dõi lịch sử quét.",
  manifest: "/scanner-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quét Kho Mini",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return <ScannerAuthGuard>{children}</ScannerAuthGuard>;
}
