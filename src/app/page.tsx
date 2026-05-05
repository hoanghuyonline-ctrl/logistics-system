import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 text-white">
      <nav className="flex items-center justify-between px-8 py-4">
        <h1 className="text-2xl font-bold">VN Logistics</h1>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-sm hover:text-blue-300 transition">
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Register
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold mb-6">
            China to Vietnam
            <br />
            <span className="text-blue-400">Shipping Made Easy</span>
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Order from Taobao, 1688, Tmall — we handle purchasing, warehousing,
            and delivery to your door in Vietnam.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            {
              title: "Easy Ordering",
              desc: "Paste any product link from Taobao, 1688, or Tmall and we handle the rest.",
              icon: "🛒",
            },
            {
              title: "Real-Time Tracking",
              desc: "Track your order from purchase to delivery with detailed status updates.",
              icon: "📍",
            },
            {
              title: "Transparent Pricing",
              desc: "See full cost breakdown including fees, exchange rates, and shipping.",
              icon: "💰",
            },
          ].map((f) => (
            <div key={f.title} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-10">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Place Order", desc: "Submit product link and quantity" },
              { step: "2", title: "We Purchase", desc: "We buy from the Chinese seller" },
              { step: "3", title: "Ship to Vietnam", desc: "Via our warehouse network" },
              { step: "4", title: "Delivery", desc: "Delivered to your door" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                  {s.step}
                </div>
                <h4 className="font-semibold mb-1">{s.title}</h4>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-gray-500 text-sm">
        &copy; 2026 VN Logistics. All rights reserved.
      </footer>
    </div>
  );
}
