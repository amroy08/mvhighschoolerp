"use client";

import { useState } from "react";
import { Users, UserPlus, Shield, Pencil, Trash2, X, Save, CheckCircle2 } from "lucide-react";

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INACTIVE";
}

const ROLES = ["Super Admin", "School Admin", "Accountant", "Clerk", "Auditor"];

const DEFAULT_USERS: SystemUser[] = [
  { id: "u1", name: "Super Administrator", email: "superadmin@mvhighschool.edu.in", role: "Super Admin", status: "ACTIVE" },
  { id: "u2", name: "School Admin", email: "admin@mvhighschool.edu.in", role: "School Admin", status: "ACTIVE" },
  { id: "u3", name: "Accountant", email: "accounts@mvhighschool.edu.in", role: "Accountant", status: "ACTIVE" },
  { id: "u4", name: "Clerk", email: "cashier@mvhighschool.edu.in", role: "Clerk", status: "ACTIVE" },
  { id: "u5", name: "Internal Auditor", email: "auditor@mvhighschool.edu.in", role: "Auditor", status: "ACTIVE" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>(DEFAULT_USERS);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "Accountant", status: "ACTIVE" as "ACTIVE" | "INACTIVE" });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openEdit = (u: SystemUser) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, status: u.status });
  };

  const saveEdit = () => {
    if (!editingUser) return;
    setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...form } : u)));
    setEditingUser(null);
    showToast("User updated successfully");
  };

  const confirmDelete = () => {
    if (!deletingUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
    setDeletingUser(null);
    showToast("User removed");
  };

  const addUser = () => {
    const newUser: SystemUser = {
      id: `u${Date.now()}`,
      name: form.name,
      email: form.email,
      role: form.role,
      status: form.status,
    };
    setUsers((prev) => [...prev, newUser]);
    setIsAddOpen(false);
    setForm({ name: "", email: "", role: "Accountant", status: "ACTIVE" });
    showToast("New user added");
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-right-4">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            System User Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage staff accounts, RBAC role assignments, and login access</p>
        </div>
        <button
          onClick={() => { setIsAddOpen(true); setForm({ name: "", email: "", role: "Accountant", status: "ACTIVE" }); }}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add System User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">User Name</th>
              <th className="px-6 py-4">Email Address</th>
              <th className="px-6 py-4">RBAC Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900">{u.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-600">{u.email}</td>
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${u.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingUser(u)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                Edit User
              </h2>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <input
                  type="email"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">RBAC Role</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "INACTIVE" })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEditingUser(null)} className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Remove User?</h2>
              <p className="text-sm text-slate-500">
                Are you sure you want to remove <span className="font-semibold text-slate-800">{deletingUser.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setDeletingUser(null)} className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Add New System User
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <input
                  type="email"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  placeholder="user@mvhighschool.edu.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">RBAC Role</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setIsAddOpen(false)} className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button
                onClick={addUser}
                disabled={!form.name || !form.email}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
