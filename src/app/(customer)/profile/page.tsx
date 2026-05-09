"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";

export default function ProfilePage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState({ fullName: "", phone: "", address: "", email: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setProfile({ fullName: d.fullName || "", phone: d.phone || "", address: d.address || "", email: d.email || "" });
        setLoading(false);
      });
  }, []);

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
