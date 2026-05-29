"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";

export default function ProfilePage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState({ fullName: "", phone: "", address: "", email: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [deviceHasBiometric, setDeviceHasBiometric] = useState(false);
  const [biometricRegistering, setBiometricRegistering] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setProfile({ fullName: d.fullName || "", phone: d.phone || "", address: d.address || "", email: d.email || "" });
        setLoading(false);
      });

    try {
      setWebAuthnSupported(browserSupportsWebAuthn());
    } catch {
      setWebAuthnSupported(false);
    }
  }, []);

  useEffect(() => {
    if (profile.email) {
      try {
        const stored = localStorage.getItem(`has_biometric_${profile.email}`);
        setDeviceHasBiometric(stored === "true");
      } catch {
        setDeviceHasBiometric(false);
      }
    }
  }, [profile.email]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    toast(res.ok ? t("profile.updateSuccess") : t("profile.updateFailed"), res.ok ? "success" : "error");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwords),
    });
    const data = await res.json();
    if (res.ok) {
      toast(t("profile.passwordSuccess"), "success");
      setPasswords({ currentPassword: "", newPassword: "" });
    } else {
      toast(data.error || t("profile.passwordFailed"), "error");
    }
  }

  async function registerBiometric() {
    if (!profile.email) return;
    setBiometricRegistering(true);
    try {
      // 1. Get registration options from server
      const optRes = await fetch("/api/auth/biometric/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "register", email: profile.email }),
      });

      if (!optRes.ok) {
        const data = await optRes.json();
        throw new Error(data.error || "Không thể lấy thông tin đăng ký");
      }

      const { options } = await optRes.json();

      // 2. Enforce userVerification to "preferred" on client options to bypass Samsung Face ID and old Android hardware strictness
      if (options.authenticatorSelection) {
        options.authenticatorSelection.userVerification = "preferred";
      }

      // 3. Prompt OS biometric credential creation (FIDO2 navigator.credentials.create)
      const credential = await startRegistration(options);

      // 4. Verify credential on Server
      const verifyRes = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: credential }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || "Xác thực thiết bị thất bại");
      }

      // 5. Update local state on success
      localStorage.setItem(`has_biometric_${profile.email}`, "true");
      setDeviceHasBiometric(true);
      toast("Kích hoạt Đăng nhập nhanh bằng Vân tay/Thiết bị thành công!", "success");
    } catch (err: any) {
      console.error("[biometric-register] Error:", err);
      toast(err.message || "Không thể đăng ký sinh trắc học trên thiết bị này.", "error");
    } finally {
      setBiometricRegistering(false);
    }
  }

  function unregisterBiometric() {
    if (!profile.email) return;
    try {
      localStorage.removeItem(`has_biometric_${profile.email}`);
      setDeviceHasBiometric(false);
      toast("Đã hủy liên kết Đăng nhập nhanh trên thiết bị này.", "success");
    } catch {
      // ignore
    }
  }

  if (loading) return <LoadingSpinner text={t("profile.loading")} />;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} />

      <Card title={t("profile.personalInfo")}>
        <form onSubmit={saveProfile} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("orderDetail.email")}</label>
            <input type="email" value={profile.email} disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("profile.fullName")}</label>
            <input type="text" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("orderDetail.phone")}</label>
            <input type="text" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("orderDetail.address")}</label>
            <textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" rows={2} />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            {t("profile.saveChanges")}
          </button>
        </form>
      </Card>

      {/* Premium FIDO2/Passkey Biometric Registration Card */}
      <Card title="🔐 Bảo mật Sinh trắc học (Passkeys / FIDO2)">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Kích hoạt tính năng này cho phép bạn đăng nhập nhanh vào hệ thống bằng Vân tay, Khuôn mặt (Face ID / Windows Hello) hoặc mã khóa màn hình của thiết bị mà không cần nhập lại mật khẩu.
          </p>

          {!webAuthnSupported ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-xs leading-relaxed">
              ⚠️ Trình duyệt của bạn hiện tại không hỗ trợ hoặc đang chặn xác thực WebAuthn (Có thể do bạn đang sử dụng Chế độ ẩn danh / Incognito). Vui lòng thử lại trên trình duyệt chuẩn.
            </div>
          ) : deviceHasBiometric ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 items-center">
                <span className="text-emerald-600 text-xl">✓</span>
                <div className="text-xs text-emerald-800 font-medium">
                  Hệ thống đã nhận diện được khóa liên kết Đăng nhập nhanh đang hoạt động trên thiết bị này!
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={registerBiometric}
                  disabled={biometricRegistering}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all duration-200"
                >
                  {biometricRegistering ? "Đang xử lý..." : "Đăng ký thêm thiết bị"}
                </button>
                
                <button
                  type="button"
                  onClick={unregisterBiometric}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all duration-200"
                >
                  Hủy liên kết thiết bị này
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-600 text-xs leading-relaxed">
                ℹ Thiết bị của bạn chưa được đăng ký Đăng nhập nhanh. Hãy nhấp vào nút bên dưới để liên kết ngay.
              </div>

              <button
                type="button"
                onClick={registerBiometric}
                disabled={biometricRegistering}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
              >
                {biometricRegistering ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang thiết lập...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
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
                    Kích hoạt Đăng nhập bằng Vân tay / Thiết bị
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </Card>

      <Card title={t("profile.changePassword")}>
        <form onSubmit={changePassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("profile.currentPassword")}</label>
            <input type="password" value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("profile.newPassword")}</label>
            <input type="password" value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required minLength={6} />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            {t("profile.changePassword")}
          </button>
        </form>
      </Card>
    </div>
  );
}
