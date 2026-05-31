"use client";

import { useI18n } from "@/lib/i18n";

function TruckIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.75A1.5 1.5 0 0 1 2.25 17.25V6.75A1.5 1.5 0 0 1 3.75 5.25h12.75a1.5 1.5 0 0 1 1.5 1.5v3.375M18 10.5h2.25A2.25 2.25 0 0 1 22.5 12.75v4.5A2.25 2.25 0 0 1 20.25 19.5H18M8.25 18.75h6m0 0a1.5 1.5 0 0 1 3 0m-3 0a1.5 1.5 0 0 0 3 0m-3 0h1.5m-9-9h.008v.008H8.25V9.75Zm.563 0h.008v.008H8.813V9.75Zm-.563 2.25h.008v.008H8.25v-.008Zm.563 0h.008v.008H8.813v-.008Z" />
    </svg>
  );
}

function WarehouseIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function GlobalIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
    </svg>
  );
}

export default function LandingServices() {
  const { t } = useI18n();

  const services = [
    {
      title: "Vận tải nội địa Bắc - Trung - Nam",
      desc: "Hệ thống xe tải, container trung chuyển liên tỉnh kết nối chặt chẽ và luân chuyển hàng hóa thần tốc qua các dải vùng miền cả nước.",
      icon: <TruckIcon />,
      bg: "bg-slate-900",
      iconBg: "bg-orange-500/10",
      iconFg: "text-orange-500",
      border: "border-slate-800",
    },
    {
      title: "Dịch vụ bến bãi & Lưu kho",
      desc: "Hệ thống tổng kho lưu chuyển diện tích lớn tại Trung Quốc (Nam Ninh) và Việt Nam (Lạng Sơn, Hà Nội, Bắc Ninh) được camera an ninh giám sát 24/7.",
      icon: <WarehouseIcon />,
      bg: "bg-slate-900",
      iconBg: "bg-orange-500/10",
      iconFg: "text-orange-500",
      border: "border-slate-800",
    },
    {
      title: "Thông quan hải quan",
      desc: "Xử lý trọn gói các thủ tục thông quan chính ngạch, cung cấp hóa đơn đỏ VAT đầy đủ, kê khai thuế hải quan và ủy thác xuất nhập khẩu an toàn.",
      icon: <ShieldIcon />,
      bg: "bg-slate-900",
      iconBg: "bg-orange-500/10",
      iconFg: "text-orange-500",
      border: "border-slate-800",
    },
    {
      title: "Thương mại quốc tế",
      desc: "Đấu nối các cổng đặt hàng tiện lợi, mua hàng hiệu quả từ Taobao, 1688, Tmall với tỷ giá quy đổi 3980 công khai minh bạch.",
      icon: <GlobalIcon />,
      bg: "bg-slate-900",
      iconBg: "bg-orange-500/10",
      iconFg: "text-orange-500",
      border: "border-slate-800",
    },
  ];

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5 blur-3xl" style={{ background: "radial-gradient(circle, var(--brand-blue), transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-orange-500/30 bg-orange-950/20 text-orange-400">
            Dịch vụ của chúng tôi
          </div>
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Năng Lực Đóng Gói Logistics
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Chúng tôi xây dựng hệ thống cơ sở hạ tầng bền vững để đáp ứng mọi yêu cầu logistics nghiêm ngặt nhất từ quý doanh nghiệp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s, idx) => (
            <div 
              key={idx} 
              className="relative group rounded-3xl p-8 bg-slate-950 border border-slate-800/80 hover:border-orange-500/40 hover:-translate-y-1.5 transition-all duration-300 shadow-xl"
            >
              {/* Highlight bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-amber-500 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${s.iconBg} ${s.iconFg} border border-orange-500/20`}>
                {s.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">
                {s.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
