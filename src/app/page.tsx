import Link from "next/link";

const features = [
  {
    title: "Easy Ordering",
    desc: "Paste any product link from Taobao, 1688, or Tmall. We handle purchasing, quality checks, and warehousing.",
    icon: "🛒",
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Real-Time Tracking",
    desc: "Track your order from purchase through China warehouse, international shipping, and Vietnam delivery.",
    icon: "📍",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Transparent Pricing",
    desc: "See full cost breakdown with exchange rates, service fees, and shipping costs before you order.",
    icon: "💰",
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "Secure Wallet",
    desc: "Deposit funds, track balances, and view transaction history. All payments are logged and transparent.",
    icon: "🔒",
    color: "bg-violet-50 text-violet-600",
  },
];

const steps = [
  { step: "01", title: "Place Your Order", desc: "Submit the product URL, quantity, and we calculate costs instantly", icon: "📝" },
  { step: "02", title: "We Purchase & Ship", desc: "Our team buys from the seller and ships to our China warehouse", icon: "🏭" },
  { step: "03", title: "Cross-Border Transit", desc: "Goods are consolidated, packed, and shipped from China to Vietnam", icon: "✈️" },
  { step: "04", title: "Delivered to You", desc: "Receive your goods at your door in Vietnam, fully tracked", icon: "🏠" },
];

const stats = [
  { value: "10K+", label: "Orders Delivered" },
  { value: "99.5%", label: "Delivery Rate" },
  { value: "5-7", label: "Days Average" },
  { value: "24/7", label: "Support" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">VN</span>
            </div>
            <span className="text-lg font-bold text-slate-900">VN Logistics</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-6 border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Trusted by 2,000+ businesses in Vietnam
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              China to Vietnam
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Shipping Made Easy
              </span>
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-slate-500 leading-relaxed max-w-2xl">
              Order from Taobao, 1688, Tmall — we handle purchasing, warehousing,
              cross-border shipping, and last-mile delivery to your door in Vietnam.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="inline-flex items-center justify-center px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 text-sm">
                Start Shipping Today →
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm">
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              Everything You Need
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              A complete logistics platform from order to delivery
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              How It Works
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              Simple 4-step process from China to your doorstep in Vietnam
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-slate-200" />
                )}
                <div className="relative bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{s.icon}</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      STEP {s.step}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 mb-2">{s.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Ready to start shipping?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Join thousands of businesses using VN Logistics for reliable China-to-Vietnam shipping.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg text-sm">
              Create Free Account
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm">
              Sign In →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">VN</span>
              </div>
              <span className="text-sm font-semibold text-white">VN Logistics</span>
            </div>
            <p className="text-sm">&copy; 2026 VN Logistics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
