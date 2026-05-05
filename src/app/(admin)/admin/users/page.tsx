"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + Create User
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New User</h2>
          {createError && <div className="bg-red-50 text-red-600 p-2 rounded mb-3 text-sm">{createError}</div>}
          <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Full Name *" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <input type="email" placeholder="Email *" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <input type="password" placeholder="Password *" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <input type="text" placeholder="Phone" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Admin</option>
              <option value="WAREHOUSE_CN">Warehouse CN</option>
              <option value="WAREHOUSE_VN">Warehouse VN</option>
              <option value="ACCOUNTANT">Accountant</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Create</button>
          </form>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <input type="text" placeholder="Search by name/email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm w-64" />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
          <option value="WAREHOUSE_CN">Warehouse CN</option>
          <option value="WAREHOUSE_VN">Warehouse VN</option>
          <option value="ACCOUNTANT">Accountant</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-lg shadow border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Balance</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.fullName}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100">{u.role}</span></td>
                    <td className="px-4 py-3">{u.wallet ? `${parseFloat(u.wallet.balance).toLocaleString()} VND` : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(u.id, u.isActive)} className={`text-xs px-2 py-1 rounded ${u.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}>
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
