"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  wallet: { balance: string; debt: string } | null;
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-violet-50 text-violet-700",
  CUSTOMER: "bg-blue-50 text-blue-700",
  WAREHOUSE_CN: "bg-amber-50 text-amber-700",
  WAREHOUSE_VN: "bg-teal-50 text-teal-700",
  ACCOUNTANT: "bg-indigo-50 text-indigo-700",
};

export default function UsersPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const currentUserId = (session?.user as Record<string, unknown>)?.id as string | undefined;
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", fullName: "", phone: "", role: "CUSTOMER" });
  const [createError, setCreateError] = useState("");

  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", role: "", isActive: true });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadUsers = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (roleFilter) params.set("role", roleFilter);
    if (search) params.set("search", search);

    fetch(`/api/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || []);
        setTotalPages(d.totalPages || 1);
        setLoading(false);
      });
  }, [page, roleFilter, search]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (roleFilter) params.set("role", roleFilter);
    if (search) params.set("search", search);

    fetch(`/api/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setUsers(d.users || []);
        setTotalPages(d.totalPages || 1);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, roleFilter, search]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (!res.ok) {
      const data = await res.json();
      setCreateError(data.error);
      return;
    }
    setShowCreate(false);
    setNewUser({ email: "", password: "", fullName: "", phone: "", role: "CUSTOMER" });
    loadUsers();
  }

  async function toggleActive(userId: string, isActive: boolean) {
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    loadUsers();
  }

  function openEditModal(u: User) {
    setEditUser(u);
    setEditForm({ fullName: u.fullName, email: u.email, role: u.role, isActive: u.isActive });
    setEditError("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditSaving(true);
    setEditError("");
    const res = await fetch(`/api/users/${editUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setEditError(data.error || t("users.updateFailed"));
      return;
    }
    setEditUser(null);
    loadUsers();
  }

  function openDeleteConfirm(u: User) {
    if (u.id === currentUserId) {
      alert(t("users.cannotDeleteSelf"));
      return;
    }
    setDeleteUser(u);
  }

  async function confirmDelete() {
    if (!deleteUser) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/users/${deleteUser.id}`, { method: "DELETE" });
    setDeleteLoading(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || t("users.deactivateFailed"));
      return;
    }
    setDeleteUser(null);
    loadUsers();
  }

  async function exportExcel() {
    try {
      const res = await fetch("/api/users/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `users-export-${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert(t("users.exportFailed"));
    }
  }

  return (
    <div>
      <PageHeader
        title={t("users.title")}
        subtitle={t("users.subtitle")}
        action={
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
              {t("users.exportExcel")}
            </button>
            <button onClick={() => setShowCreate(!showCreate)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              + {t("users.createUser")}
            </button>
          </div>
        }
      />

      {showCreate && (
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">{t("users.createNewUser")}</h2>
          {createError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm border border-red-100">
              <span>⚠️</span><span>{createError}</span>
            </div>
          )}
          <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder={`${t("profile.fullName")} *`} value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
            <input type="email" placeholder={`${t("orderDetail.email")} *`} value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
            <input type="password" placeholder={`${t("auth.passwordLabel")} *`} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
            <input type="text" placeholder={t("orderDetail.phone")} value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <option value="CUSTOMER">{t("role.CUSTOMER")}</option>
              <option value="ADMIN">{t("role.ADMIN")}</option>
              <option value="WAREHOUSE_CN">{t("role.WAREHOUSE_CN")}</option>
              <option value="WAREHOUSE_VN">{t("role.WAREHOUSE_VN")}</option>
              <option value="ACCOUNTANT">{t("role.ACCOUNTANT")}</option>
            </select>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
              {t("users.createUser")}
            </button>
          </form>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input type="text" placeholder={t("users.searchPlaceholder")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
          <option value="">{t("users.allRoles")}</option>
          <option value="CUSTOMER">{t("role.CUSTOMER")}</option>
          <option value="ADMIN">{t("role.ADMIN")}</option>
          <option value="WAREHOUSE_CN">{t("role.WAREHOUSE_CN")}</option>
          <option value="WAREHOUSE_VN">{t("role.WAREHOUSE_VN")}</option>
          <option value="ACCOUNTANT">{t("role.ACCOUNTANT")}</option>
        </select>
      </div>

      {loading ? <LoadingSpinner text={t("users.loading")} /> : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orderDetail.name")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orderDetail.email")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("audit.role")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("wallet.balance")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.status")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{u.fullName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${roleColors[u.role] || "bg-slate-100 text-slate-700"}`}>
                        {t(`role.${u.role}`, u.role.replace(/_/g, " "))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{u.wallet ? `${parseFloat(u.wallet.balance).toLocaleString()} VND` : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {u.isActive ? t("users.active") : t("users.inactive")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(u)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                          {t("users.edit")}
                        </button>
                        <button onClick={() => toggleActive(u.id, u.isActive)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${u.isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
                          {u.isActive ? t("users.deactivate") : t("users.activate")}
                        </button>
                        {u.isActive && u.id !== currentUserId && (
                          <button onClick={() => openDeleteConfirm(u)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                            {t("users.delete")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">{t("users.editUser")}</h2>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">
                  <span>⚠️</span><span>{editError}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("users.fullName")}</label>
                <input type="text" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("users.email")}</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("users.role")}</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option value="CUSTOMER">{t("role.CUSTOMER")}</option>
                  <option value="ADMIN">{t("role.ADMIN")}</option>
                  <option value="WAREHOUSE_CN">{t("role.WAREHOUSE_CN")}</option>
                  <option value="WAREHOUSE_VN">{t("role.WAREHOUSE_VN")}</option>
                  <option value="ACCOUNTANT">{t("role.ACCOUNTANT")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("users.status")}</label>
                <select value={editForm.isActive ? "true" : "false"} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "true" })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option value="true">{t("users.active")}</option>
                  <option value="false">{t("users.inactive")}</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                  {t("users.cancel")}
                </button>
                <button type="submit" disabled={editSaving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {t("users.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDeleteUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-xl">⚠</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{t("users.deleteConfirmTitle")}</h3>
              <p className="text-sm text-slate-600 mb-1 font-medium">{deleteUser.fullName} ({deleteUser.email})</p>
              <p className="text-sm text-slate-500 mb-6">{t("users.deleteConfirmMessage")}</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setDeleteUser(null)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                  {t("users.cancel")}
                </button>
                <button onClick={confirmDelete} disabled={deleteLoading}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                  {t("users.confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
