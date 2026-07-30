"use client";

import { FileText } from "lucide-react";

export default function MastersDepartmentsPage() {
  const departments = [
    { code: "PRE_PRIMARY", name: "Pre-Primary Wing" },
    { code: "PRIMARY", name: "Primary Wing" },
    { code: "SECONDARY", name: "Secondary Wing" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <FileText className="w-7 h-7 text-blue-600" />
          School Departments Master
        </h1>
        <p className="text-slate-500 text-sm mt-1">Configure organizational school wings and departments</p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Department Code</th>
              <th className="px-6 py-4">Department Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((d) => (
              <tr key={d.code} className="hover:bg-slate-50/80">
                <td className="px-6 py-4 font-mono font-bold text-blue-600">{d.code}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{d.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
