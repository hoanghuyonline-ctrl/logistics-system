"use client";

import Link from "next/link";

export default function BiometricHelpPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-6 lg:px-8">
      <div className="max-w-xl mx-auto w-full bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden transform transition-all duration-300">
        {/* Top illustrative banner */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-10 flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-9 h-9"
            >
              <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
              <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
              <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
              <path d="M2 12a10 10 0 0 1 18-6" />
              <path d="M2 17c2.3 2 4.87 3 7 3" />
              <path d="M6 10.42C6.26 8.5 7.7 6.5 12 6.5c3.5 0 5.5 2.08 6 4.5" />
              <path d="M9.53 16.3C9.2 14.6 9 13.5 9 12" />
              <path d="M20.89 16.64c.04-.32.11-1.23.11-1.64" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-center px-4">Hướng dẫn Đăng nhập nhanh trên Thiết bị</h1>
          <p className="mt-1.5 text-blue-100 text-sm">Khắc phục sự cố và thiết lập sinh trắc học</p>
        </div>

        <div className="p-8 space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-blue-600">💡</span> Hướng dẫn nhanh cho thiết bị di động
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tính năng <strong>Đăng nhập nhanh</strong> sử dụng công nghệ WebAuthn (Passkeys) an toàn của thiết bị. Khi đăng nhập, bạn sẽ không cần nhập mật khẩu.
            </p>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Cách kích hoạt trên từng thiết bị:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Thiết bị Samsung / Android</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Vào <strong>Cài đặt</strong> → <strong>Bảo mật & Quyền riêng tư</strong> → <strong>Sinh trắc học</strong>. Hãy đảm bảo bạn đã bật Vân tay hoặc Nhận diện khuôn mặt. 
                    <br />
                    <em>* Đối với các dòng máy Samsung sử dụng nhận diện khuôn mặt dạng phần mềm (2D), bạn vẫn có thể ký xác thực nhanh bằng cách nhập mã PIN hoặc hình vẽ (Pattern) của máy.</em>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">iPhone / iPad (iOS)</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Vào <strong>Settings (Cài đặt)</strong> → <strong>Face ID & Passcode (Face ID & Mật mã)</strong>. Đảm bảo Face ID hoặc Touch ID của bạn đang hoạt động bình thường.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Máy tính (macOS / Windows Hello)</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Đảm bảo thiết bị của bạn hỗ trợ Touch ID (Macbook) hoặc Windows Hello (Windows 10/11) và tính năng này đã được bật trong cài đặt hệ thống.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          <section className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-lg">⚠️</span>
            <div className="text-xs text-amber-800 leading-relaxed">
              <strong>Lưu ý về Chế độ ẩn danh (Incognito):</strong> Trình duyệt sẽ tự động chặn việc đọc/ghi Passkey khi bạn đang mở tab ẩn danh để bảo vệ quyền riêng tư. Vui lòng mở lại tab thường để sử dụng tính năng này.
            </div>
          </section>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center text-sm shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              Quay lại Đăng nhập
            </Link>
            <a
              href="https://zalo.me/0989711888"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-center text-sm transition-all duration-200"
            >
              Liên hệ Hỗ trợ Zalo
            </a>
          </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-slate-400 mt-8">
        © {new Date().getFullYear()} Bắc Trung Hải Logistics. All rights reserved.
      </p>
    </div>
  );
}
