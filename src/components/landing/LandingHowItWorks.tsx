"use client";

import { useI18n } from "@/lib/i18n";

function BoxIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function LoaderIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  );
}

function ShipIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 17h20M2 13h20M2 9h20M5 5v4m14-4v4M12 3v6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

const stepIcons = [BoxIcon, LoaderIcon, ShipIcon, CheckIcon];

export default function LandingHowItWorks() {
  const { t } = useI18n();

  const steps = [
    { 
      step: "01", 
      title: "Nhận hàng & Thu gom", 
      desc: "Tiếp nhận yêu cầu mua hàng hoặc thông tin ký gửi kiện hàng từ phía khách hàng tại tổng kho Nam Ninh (Trung Quốc)." 
    },
    { 
      step: "02", 
      title: "Bốc xếp & Đóng gói", 
      desc: "Thực hiện quy trình phân loại chuyên nghiệp, bốc dỡ hàng hóa cẩn thận, cân đo thể tích chính xác và đóng gói bảo an." 
    },
    { 
      step: "03", 
      title: "Vận chuyển quốc tế", 
      desc: "Vận tải thông suốt liên biên giới, xử lý thông quan chính ngạch nhanh chóng về tổng kho Hà Nội/Bắc Ninh (Việt Nam)." 
    },
    { 
      step: "04", 
      title: "Đối soát & Giao tận nơi", 
      desc: "Đối chiếu thông tin, tự động cấn trừ số dư ví minh bạch và giao hàng thần tốc đến địa chỉ tận nơi tại Việt Nam." 
    },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-orange-500/20 bg-orange-50 text-orange-600">
            Hành trình hàng hóa
          </div>
          <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Quy Trình Đường Ray Vận Chuyển
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Hành trình trọn gói khép kín từ kho Trung Quốc đến tận tay khách hàng tại Việt Nam qua 4 bước tiêu chuẩn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((s, i) => {
            const Icon = stepIcons[i];
            return (
              <div key={s.step} className="relative group">
                {/* Horizontal flow line for desktops */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-[44px] left-[calc(100%-20px)] w-[calc(100%-40px)] h-0.5 bg-slate-200 z-0">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500 transform translate-x-1" />
                  </div>
                )}
                
                <div className="relative bg-slate-50 rounded-3xl p-8 border border-slate-100 group-hover:border-orange-500/30 group-hover:shadow-xl transition-all duration-300 z-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-orange-600 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                        <Icon />
                      </div>
                      <span className="text-sm font-black px-3.5 py-1.5 rounded-xl text-orange-600 bg-orange-500/10 border border-orange-500/20">
                        {t("landing.step")} {s.step}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors">
                      {s.title}
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
