"use client";

import { useState } from "react";
import { Settings, School, Shield, Pencil, X, Save, CheckCircle2, Key, FileText } from "lucide-react";

interface InstitutionInfo {
  schoolName: string;
  branchCode: string;
  receiptPrefix: string;
}

interface SecurityInfo {
  encryption: string;
  hashing: string;
}

export default function SettingsPage() {
  const [institution, setInstitution] = useState<InstitutionInfo>({
    schoolName: "Marwari Vidyalaya High School",
    branchCode: "BR01 - Main Campus",
    receiptPrefix: "MVHS/YYYY-YY/BR01/XXXXXX",
  });

  const [security, setSecurity] = useState<SecurityInfo>({
    encryption: "AES-256-GCM Active",
    hashing: "Argon2id Memory Hard",
  });

  const [editInstitution, setEditInstitution] = useState(false);
  const [editSecurity, setEditSecurity] = useState(false);
  const [instForm, setInstForm] = useState<InstitutionInfo>({ ...institution });
  const [secForm, setSecForm] = useState<SecurityInfo>({ ...security });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const saveInstitution = () => {
    setInstitution({ ...instForm });
    setEditInstitution(false);
    showToast("Institution info updated successfully");
  };

  const saveSecurity = () => {
    setSecurity({ ...secForm });
    setEditSecurity(false);
    showToast("Security settings updated");
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-600" />
          School ERP System Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Configure global organisation parameters, security policies, and receipt templates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Institution Information Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <School className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Institution Information</h3>
            </div>
            <button
              onClick={() => { setInstForm({ ...institution }); setEditInstitution(true); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-all"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-500">School Name</label>
              <p className="font-semibold text-slate-900 mt-0.5">{institution.schoolName}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Branch Code</label>
              <p className="font-mono text-slate-800 mt-0.5">{institution.branchCode}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Receipt Prefix Format</label>
              <p className="font-mono text-blue-600 font-bold mt-0.5">{institution.receiptPrefix}</p>
            </div>
          </div>
        </div>

        {/* Security & Encryption Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Security &amp; Encryption</h3>
            </div>
            <button
              onClick={() => { setSecForm({ ...security }); setEditSecurity(true); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-all"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-500">Aadhaar Encryption</label>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mt-1">
                {security.encryption}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Password Hashing</label>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 mt-1">
                {security.hashing}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Institution Modal */}
      {editInstitution && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <School className="w-4 h-4 text-blue-600" />
                Edit Institution Information
              </h2>
              <button onClick={() => setEditInstitution(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  <FileText className="w-3 h-3 inline mr-1" />
                  School Name
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  value={instForm.schoolName}
                  onChange={(e) => setInstForm({ ...instForm, schoolName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Branch Code</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  value={instForm.branchCode}
                  onChange={(e) => setInstForm({ ...instForm, branchCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Receipt Prefix Format</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  value={instForm.receiptPrefix}
                  onChange={(e) => setInstForm({ ...instForm, receiptPrefix: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1">Use YYYY-YY for academic year and XXXXXX for sequential number</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEditInstitution(false)} className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button
                onClick={saveInstitution}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Security Modal */}
      {editSecurity && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                Edit Security Settings
              </h2>
              <button onClick={() => setEditSecurity(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Aadhaar Encryption Algorithm</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  value={secForm.encryption}
                  onChange={(e) => setSecForm({ ...secForm, encryption: e.target.value })}
                >
                  <option>AES-256-GCM Active</option>
                  <option>AES-256-CBC Active</option>
                  <option>ChaCha20-Poly1305 Active</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password Hashing Algorithm</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  value={secForm.hashing}
                  onChange={(e) => setSecForm({ ...secForm, hashing: e.target.value })}
                >
                  <option>Argon2id Memory Hard</option>
                  <option>bcrypt (12 rounds)</option>
                  <option>scrypt N=32768</option>
                </select>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium">
                ⚠️ Changing security algorithms may require re-hashing existing stored credentials.
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEditSecurity(false)} className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button
                onClick={saveSecurity}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
