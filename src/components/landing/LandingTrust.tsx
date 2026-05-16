"use client";

const TRUST_ITEMS = [
  {
    icon: "🏭",
    title: "Có kho Trung Quốc",
    desc: "Kho hàng riêng tại Quảng Châu, nhận hàng trực tiếp từ nhà cung cấp",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: "📡",
    title: "Theo dõi đơn realtime",
    desc: "Cập nhật trạng thái đơn hàng theo thời gian thực qua hệ thống",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: "🇻🇳",
    title: "Hỗ trợ tiếng Việt",
    desc: "Toàn bộ hệ thống và nhân viên hỗ trợ bằng tiếng Việt 100%",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: "🔔",
    title: "Zalo thông báo tự động",
    desc: "Nhận thông báo trạng thái đơn hàng tự động qua Zalo OA",
    color: "bg-purple-50 text-purple-600",
  },
];

export default function LandingTrust() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            Tại sao chọn Bắc Trung Hải?
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Dịch vụ vận chuyển hàng Trung Quốc uy tín, nhanh chóng
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl mb-3 ${item.color}`}>
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
