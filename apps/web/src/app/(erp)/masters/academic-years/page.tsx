"use client";

import { BookOpen } from "lucide-react";

export default function MastersAcademicYearsPage() {
  const years = [
    { name: "2025-26", startDate: "01/06/2025", endDate: "31/05/2026", isCurrent: false },
    { name: "2026-27", startDate: "01/06/2026", endDate: "31/05/2027", isCurrent: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-blue-600" />
          Academic Years Master
        </h1>
        <p className="text-slate-500 text-sm mt-1">Configure academic year sessions and operational date ranges</p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Academic Year</th>
              <th className="px-6 py-4">Start Date</th>
              <th className="px-6 py-4">End Date</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {years.map((y) => (
              <tr key={y.name} className="hover:bg-slate-50/80">
                <td className="px-6 py-4 font-bold text-slate-900">{y.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-600">{y.startDate}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-600">{y.endDate}</td>
                <td className="px-6 py-4">
                  {y.isCurrent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      CURRENT SESSION
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">ARCHIVED</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
