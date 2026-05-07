"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

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
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", fullName: "", phone: "", role: "CUSTOMER" });
  const [createError, setCreateError] = useState("");

  function loadUsers() {
    setLoading(true);
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
  }

  useEffect(() => { loadUsers(); }, [page, roleFilter, search]);

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

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage all system users and their roles"
        action={
          <button onClick={() => setShowCreate(!showCreate)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            + Create User
          </button>
        }
      />

      {showCreate && (
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Create New User</h2>
          {createError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm border border-red-100">
              <span>⚠️</span><span>{createError}</span>
            </div>
          )}
          <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Full Name *" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
            <input type="email" placeholder="Email *" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
            <input type="password" placeholder="Password *" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
            <input type="text" placeholder="Phone" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Admin</option>
              <option value="WAREHOUSE_CN">Warehouse CN</option>
              <option value="WAREHOUSE_VN">Warehouse VN</option>
              <option value="ACCOUNTANT">Accountant</option>
            </select>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
              Create User
            </button>
          </form>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input type="text" placeholder="Search by name/email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
          <option value="WAREHOUSE_CN">Warehouse CN</option>
          <option value="WAREHOUSE_VN">Warehouse VN</option>
          <option value="ACCOUNTANT">Accountant</option>
        </select>
      </div>

      {loading ? <LoadingSpinner text="Loading users..." /> : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{u.fullName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${roleColors[u.role] || "bg-slate-100 text-slate-700"}`}>
                        {u.role.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{u.wallet ? `${parseFloat(u.wallet.balance).toLocaleString()} VND` : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleActive(u.id, u.isActive)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${u.isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}
