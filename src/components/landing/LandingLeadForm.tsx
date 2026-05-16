"use client";

import { useState } from "react";

export default function LandingLeadForm() {
  const [form, setForm] = useState({ fullName: "", phone: "", zaloName: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      setError("Vui lòng nhập họ tên và số điện thoại");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        setForm({ fullName: "", phone: "", zaloName: "", notes: "" });
      } else {
        const data = await res.json();
        setError(data.error || "Có lỗi xảy ra, vui lòng thử lại");
      }
    } catch {
      setError("Mất kết nối, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section id="lead-form" className="py-16 bg-slate-50">
        <div className="max-w-xl mx-auto px-6 text-center">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-slate-900">Cảm ơn bạn đã liên hệ!</h3>
            <p className="text-sm text-slate-500 mt-2">
              Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất qua Zalo hoặc điện thoại.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Gửi thêm yêu cầu khác
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="lead-form" className="py-16 bg-slate-50">
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            Đăng ký tư vấn miễn phí
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Để lại thông tin, chúng tôi sẽ liên hệ tư vấn dịch vụ vận chuyển phù hợp
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Họ tên *</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Nguyễn Văn A"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Số điện thoại *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="0912 345 678"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Zalo (nếu khác SĐT)</label>
            <input
              type="text"
              value={form.zaloName}
              onChange={(e) => setForm((p) => ({ ...p, zaloName: e.target.value }))}
              placeholder="Tên Zalo hoặc số Zalo"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nhu cầu nhập hàng</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="VD: Nhập quần áo từ Quảng Châu, khoảng 50kg/tháng..."
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 text-white text-sm font-semibold rounded-xl shadow-md hover:opacity-90 hover:shadow-lg transition-all disabled:opacity-50"
            style={{ backgroundColor: "var(--brand-navy)" }}
          >
            {submitting ? "Đang gửi..." : "📩 Gửi yêu cầu tư vấn"}
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            Thông tin của bạn được bảo mật. Chúng tôi sẽ liên hệ trong 24h.
          </p>
        </form>
      </div>
    </section>
  );
}
