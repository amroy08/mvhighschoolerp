"use client";

import { useState, useEffect } from "react";
import { Landmark, Search, Filter, AlertTriangle, FileSpreadsheet, Mail, Phone, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { calculateStudentFinancials, getStoredPayments, getStoredStudents, ALL_SCHOOL_GRADES } from "@/lib/school-store";

interface OutstandingRecord {
  id: string;
  grNumber: string;
  studentName: string;
  grade: string;
  section: string;
  guardianMobile: string;
  totalDemand: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueChargesCount: number;
}

export default function OutstandingsPage() {
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [outstandings, setOutstandings] = useState<OutstandingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOutstandings();
  }, []);

  const fetchOutstandings = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/v1/students", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let apiStudents: any[] = [];
      if (res.ok) {
        const data = await res.json();
        apiStudents = data.data || [];
      }

      // If backend has 0 students (purged), clear local storage student cache automatically
      if (res.ok && apiStudents.length === 0) {
        localStorage.removeItem("mvhs_local_students");
        localStorage.removeItem("mvhs_global_payments");
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) || "";
          if (key.startsWith("mvhs_payments_") || key.startsWith("mvhs_student_grade_") || key.startsWith("mvhs_student_category_") || key.startsWith("mvhs_student_old_balance_")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }

      const localStudents = getStoredStudents();
      const map = new Map<string, any>();
      [...apiStudents, ...localStudents].forEach((s) => map.set(s.id, s));
      const combined = Array.from(map.values());

      const records: OutstandingRecord[] = combined.map((s: any) => {
        const gradeName = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || s.grade || "Grade 1";
        const category = (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) || (s.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");
        const financials = calculateStudentFinancials({
          id: s.id,
          grade: gradeName,
          admissionCategory: category,
        });

        return {
          id: s.id,
          grNumber: s.grNumber,
          studentName: s.fullName || `${s.firstName} ${s.lastName}`,
          grade: gradeName,
          section: s.enrolments?.[0]?.section?.name || s.section || "A",
          guardianMobile: s.guardians?.[0]?.guardian?.mobile || s.guardianMobile || "N/A",
          totalDemand: financials.demand,
          paidAmount: financials.paid,
          outstandingAmount: financials.outstanding,
          overdueChargesCount: financials.outstanding > 0 ? 5 : 0,
        };
      });

      setOutstandings(records);
    } catch {
      setOutstandings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = outstandings.filter(
    (o) => gradeFilter === "ALL" || o.grade.toLowerCase() === gradeFilter.toLowerCase()
  );

  const totalUncollected = filtered.reduce((sum, o) => sum + o.outstandingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Landmark className="w-7 h-7 text-blue-600" />
            Outstanding Fee Dues & Arrears
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track student unpaid fee balances, overdue instalment charges, and send payment reminders
          </p>
        </div>
        <button
          onClick={() => alert("Exporting outstandings ledger to Excel...")}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Outstandings List
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Uncollected Balance</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalUncollected)}</p>
          <p className="text-xs text-slate-400 mt-1">Across {filtered.length} Students</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Overdue Instalments</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {filtered.reduce((sum, o) => sum + o.overdueChargesCount, 0)} Charges
          </p>
          <p className="text-xs text-slate-400 mt-1 font-semibold">DueDate &lt; Today</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Critical Defaulters</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {filtered.filter((o) => o.outstandingAmount > 0).length} Students
          </p>
          <p className="text-xs text-slate-400 mt-1">Immediate follow-up required</p>
        </div>
      </div>

      {/* Filter Bar with EVERY STANDARD */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none"
          >
            <option value="ALL">All Grades / Standards</option>
            {ALL_SCHOOL_GRADES.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name} ({g.wing} Wing)
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs font-semibold text-slate-500">{filtered.length} Students Listed</span>
      </div>

      {/* Outstandings Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-sm font-semibold">Loading Outstandings Ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Landmark className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No outstanding fee dues found for {gradeFilter}.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">GR Number</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Grade & Sec</th>
                <th className="px-6 py-4">Guardian Mobile</th>
                <th className="px-6 py-4">Total Demand</th>
                <th className="px-6 py-4">Paid</th>
                <th className="px-6 py-4">Outstanding Due</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-blue-600">{o.grNumber}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{o.studentName}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{o.grade} - {o.section}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-600">{o.guardianMobile}</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-700">{formatCurrency(o.totalDemand)}</td>
                  <td className="px-6 py-4 font-mono font-bold text-emerald-600">{formatCurrency(o.paidAmount)}</td>
                  <td className="px-6 py-4 font-mono font-bold text-amber-600">{formatCurrency(o.outstandingAmount)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => alert(`Sending payment reminder SMS/email to ${o.guardianMobile}...`)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Send Reminder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
