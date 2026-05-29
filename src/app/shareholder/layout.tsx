import Sidebar from "@/components/layouts/Sidebar";
import BackToTop from "@/components/ui/BackToTop";

export default function ShareholderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">{children}</div>
      </main>
      <BackToTop />
    </div>
  );
}
