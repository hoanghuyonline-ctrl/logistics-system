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
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");

  async function loadCredentials() {
    try {
      const res = await fetch("/api/auth/biometric/credentials");
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
        const identifier = profile.email || profile.phone;
        if (identifier) {
          const hasKeys = data.length > 0;
          localStorage.setItem(`has_biometric_${identifier}`, hasKeys ? "true" : "false");
          setDeviceHasBiometric(hasKeys);
        }
      }
    } catch (e) {
      console.error("Error loading biometric credentials:", e);
    } finally {
      setLoadingCredentials(false);
    }
  }

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
    const identifier = profile.email || profile.phone;
    if (identifier) {
      loadCredentials();
    }
  }, [profile.email, profile.phone]);

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
    const identifier = profile.email || profile.phone;
    if (!identifier) {
      toast("Bạn cần cập nhật email hoặc số điện thoại trước khi đăng ký sinh trắc học", "error");
      return;
    }
    setBiometricRegistering(true);
    try {
      // 1. Get registration options from server
      const optRes = await fetch("/api/auth/biometric/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "register", email: identifier }),
      });

      if (!optRes.ok) {
        const data = await optRes.json();
        throw new Error(data.error || "Không thể lấy thông tin đăng ký");
      }

      const { options } = await optRes.json();

      // 2. Enforce userVerification to preferred
      if (options.authenticatorSelection) {
        options.authenticatorSelection.userVerification = "preferred";
      }

      // 3. Prompt OS biometric credential creation
      const credential = await startRegistration(options);

      // 4. Verify credential on Server
      const finalName = newKeyName.trim() || `Khóa Vân Tay (${new Date().toLocaleDateString("vi-VN")})`;
      const verifyRes = await fetch("/api/auth/biometric/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: credential, name: finalName }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || "Xác thực thiết bị thất bại");
      }

      toast("Kích hoạt Đăng nhập nhanh bằng Vân tay/Thiết bị thành công!", "success");
      setNewKeyName("");
      loadCredentials();
    } catch (err: any) {
      console.error("[biometric-register] Error:", err);
      toast(err.message || "Không thể đăng ký sinh trắc học trên thiết bị này.", "error");
    } finally {
      setBiometricRegistering(false);
    }
  }

  async function deleteCredential(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa khóa sinh trắc học này?")) return;
    try {
      const res = await fetch("/api/auth/biometric/credentials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: id }),
      });

      if (res.ok) {
        toast("Đã xóa khóa sinh trắc học thành công.", "success");
        loadCredentials();
      } else {
        const data = await res.json();
        toast(data.error || "Không thể xóa khóa sinh trắc học.", "error");
      }
    } catch {
      toast("Lỗi kết nối khi xóa khóa sinh trắc học.", "error");
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
        <div className="space-y-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            Kích hoạt tính năng này cho phép bạn đăng nhập nhanh vào hệ thống bằng Vân tay, Khuôn mặt (Face ID / Windows Hello) hoặc mã khóa màn hình của thiết bị mà không cần nhập lại mật khẩu.
          </p>

          {!webAuthnSupported ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-xs leading-relaxed">
              ⚠️ Trình duyệt của bạn hiện tại không hỗ trợ hoặc đang chặn xác thực WebAuthn (Có thể do bạn đang sử dụng Chế độ ẩn danh / Incognito). Vui lòng thử lại trên trình duyệt chuẩn.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Registered Devices List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh sách thiết bị đã liên kết</h3>
                </div>
                {loadingCredentials ? (
                  <div className="p-4 text-center text-xs text-slate-400">Đang tải danh sách...</div>
                ) : credentials.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Chưa có thiết bị nào được liên kết Đăng nhập nhanh.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {credentials.map((c) => (
                      <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Loại: <span className="font-mono text-slate-600">{c.credentialDeviceType}</span> • Ngày đăng ký: {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteCredential(c.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-all duration-200 shrink-0"
                        >
                          Xóa khóa
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Key Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
                <button
                  type="button"
                  onClick={registerBiometric}
                  disabled={biometricRegistering}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-base font-extrabold rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-3 hover:scale-[1.02]"
                >
                  {biometricRegistering ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
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
                      {t("profile.useBiometric")}
                    </>
                  )}
                </button>
              </div>
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
