import Sidebar from "@/components/layouts/Sidebar";
import ZaloQRWidget from "@/components/ui/ZaloQRWidget";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">{children}</div>
      </main>
      <ZaloQRWidget className="fixed bottom-4 left-[276px] z-50" />
    </div>
  );
}
