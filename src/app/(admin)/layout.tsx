import Sidebar from "@/components/layouts/Sidebar";
import ZaloQRWidget from "@/components/ui/ZaloQRWidget";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">{children}</div>
      </main>
      <ZaloQRWidget className="fixed bottom-4 left-4 md:left-[276px] z-30 md:z-50" />
    </div>
  );
}
