"use client";

import { GraduationCap } from "lucide-react";

export default function MastersGradesPage() {
  const grades = [
    { name: "Nursery", code: "NUR", sortOrder: 1, department: "Pre-Primary" },
    { name: "Junior KG", code: "JKG", sortOrder: 2, department: "Pre-Primary" },
    { name: "Senior KG", code: "SKG", sortOrder: 3, department: "Pre-Primary" },
    { name: "Grade 1", code: "G01", sortOrder: 4, department: "Primary (Grades 1-4)" },
    { name: "Grade 2", code: "G02", sortOrder: 5, department: "Primary (Grades 1-4)" },
    { name: "Grade 3", code: "G03", sortOrder: 6, department: "Primary (Grades 1-4)" },
    { name: "Grade 4", code: "G04", sortOrder: 7, department: "Primary (Grades 1-4)" },
    { name: "Grade 5", code: "G05", sortOrder: 8, department: "Secondary (Grades 5-10)" },
    { name: "Grade 6", code: "G06", sortOrder: 9, department: "Secondary (Grades 5-10)" },
    { name: "Grade 7", code: "G07", sortOrder: 10, department: "Secondary (Grades 5-10)" },
    { name: "Grade 8", code: "G08", sortOrder: 11, department: "Secondary (Grades 5-10)" },
    { name: "Grade 9", code: "G09", sortOrder: 12, department: "Secondary (Grades 5-10)" },
    { name: "Grade 10", code: "G10", sortOrder: 13, department: "Secondary (Grades 5-10)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            Grades & Sections Master
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pre-Primary (Nursery, Jr/Sr KG) • Primary (Grades 1 to 4) • Secondary (Grades 5 to 10)
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Sort Order</th>
              <th className="px-6 py-4">Grade Name</th>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Department / Wing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grades.map((g) => (
              <tr key={g.code} className="hover:bg-slate-50/80">
                <td className="px-6 py-4 font-mono text-slate-500">{g.sortOrder}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{g.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-blue-600 font-bold">{g.code}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-600">{g.department}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
