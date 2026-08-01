"use client";

import { useState, useEffect } from "react";
import {
  Landmark,
  Search,
  Filter,
  AlertTriangle,
  FileSpreadsheet,
  Mail,
  Phone,
  Loader2,
  CheckSquare,
  Square,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  calculateStudentFinancials,
  getStoredPayments,
  getStoredStudents,
  ALL_SCHOOL_GRADES,
} from "@/lib/school-store";

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
  const [duesFilter, setDuesFilter] = useState<"DEFAULTERS" | "OVER_5K" | "OVER_10K" | "ALL">("DEFAULTERS");
  const [outstandings, setOutstandings] = useState<OutstandingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkIndex, setBulkIndex] = useState(0);

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

      if (res.ok && apiStudents.length === 0) {
        localStorage.removeItem("mvhs_local_students");
        localStorage.removeItem("mvhs_global_payments");
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) || "";
          if (
            key.startsWith("mvhs_payments_") ||
            key.startsWith("mvhs_student_grade_") ||
            key.startsWith("mvhs_student_category_") ||
            key.startsWith("mvhs_student_old_balance_")
          ) {
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
        const gradeName =
          localStorage.getItem(`mvhs_student_grade_${s.id}`) ||
          s.enrolments?.[0]?.grade?.name ||
          s.grade ||
          "Grade 1";
        const category =
          (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) ||
          s.admissionCategory ||
          (s.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");
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
          guardianMobile:
            s.guardianMobile ||
            s.primaryGuardian?.mobile ||
            s.guardians?.[0]?.guardian?.mobile ||
            s.contactNumber ||
            s.mobile ||
            s.phone ||
            "N/A",
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

  // Filter records
  const filtered = outstandings.filter((o) => {
    const matchesGrade = gradeFilter === "ALL" || o.grade.toLowerCase() === gradeFilter.toLowerCase();
    if (!matchesGrade) return false;

    if (duesFilter === "DEFAULTERS") return o.outstandingAmount > 0;
    if (duesFilter === "OVER_5K") return o.outstandingAmount >= 5000;
    if (duesFilter === "OVER_10K") return o.outstandingAmount >= 10000;
    return true; // "ALL"
  });

  const defaultersOnly = filtered.filter((o) => o.outstandingAmount > 0);
  const totalUncollected = filtered.reduce((sum, o) => sum + o.outstandingAmount, 0);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === defaultersOnly.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(defaultersOnly.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedStudents = outstandings.filter((o) => selectedIds.includes(o.id));

  // Single WhatsApp send
  const sendSingleWhatsApp = (o: OutstandingRecord) => {
    const rawPhone = o.guardianMobile.replace(/[^0-9]/g, "");
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const msg = `Dear Parent, fee payment reminder from Marwari Vidyalaya High School for your ward ${o.studentName} (${o.grNumber}, ${o.grade}). Pending fee amount due: INR ${o.outstandingAmount.toLocaleString("en-IN")}. Kindly settle at the fee counter. Thank you!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Start bulk dispatch
  const startBulkDispatch = () => {
    if (selectedStudents.length === 0) return;
    setBulkIndex(0);
    setBulkModalOpen(true);
  };

  // Send next in bulk modal
  const sendNextBulk = () => {
    const student = selectedStudents[bulkIndex];
    if (!student) return;

    sendSingleWhatsApp(student);
    setBulkIndex(bulkIndex + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Landmark className="w-7 h-7 text-blue-600" />
            Outstanding Fee Dues &amp; Arrears
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track student unpaid fee balances, select defaulters, and send bulk WhatsApp payment reminders
          </p>
        </div>
        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={startBulkDispatch}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition-all animate-pulse"
            >
              <Send className="w-4 h-4" />
              Send WhatsApp to Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => alert("Exporting outstandings ledger to Excel...")}
            className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export List
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Uncollected Balance</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalUncollected)}</p>
          <p className="text-xs text-slate-400 mt-1">Across {defaultersOnly.length} Unpaid Defaulters</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Selected for Reminder</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{selectedIds.length} Students</p>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Ready for WhatsApp Broadcast</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Critical Defaulters in View</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {filtered.filter((o) => o.outstandingAmount > 0).length} Students
          </p>
          <p className="text-xs text-slate-400 mt-1">Immediate follow-up required</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          
          {/* Grade Selector */}
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

          {/* Dues Filter Toggle Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setDuesFilter("DEFAULTERS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                duesFilter === "DEFAULTERS" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ⚠️ Unpaid Only (Dues &gt; 0)
            </button>
            <button
              onClick={() => setDuesFilter("OVER_5K")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                duesFilter === "OVER_5K" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              &gt; ₹5,000 Dues
            </button>
            <button
              onClick={() => setDuesFilter("OVER_10K")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                duesFilter === "OVER_10K" ? "bg-red-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              &gt; ₹10,000 Dues
            </button>
            <button
              onClick={() => setDuesFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                duesFilter === "ALL" ? "bg-slate-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Records
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">{filtered.length} Students Listed</span>
          {defaultersOnly.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
            >
              {selectedIds.length === defaultersOnly.length ? "Deselect All Defaulters" : `Select All ${defaultersOnly.length} Defaulters`}
            </button>
          )}
        </div>
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
            <p className="font-semibold text-slate-700">No outstanding fee dues match your filter criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={defaultersOnly.length > 0 && selectedIds.length === defaultersOnly.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">GR Number</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Grade &amp; Sec</th>
                <th className="px-6 py-4">Guardian Mobile</th>
                <th className="px-6 py-4">Total Demand</th>
                <th className="px-6 py-4">Paid</th>
                <th className="px-6 py-4">Outstanding Due</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((o) => {
                const isSelected = selectedIds.includes(o.id);
                const hasDues = o.outstandingAmount > 0;

                return (
                  <tr
                    key={o.id}
                    className={`transition-colors ${
                      isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-4 py-4 text-center">
                      {hasDues ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(o.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">{o.grNumber}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{o.studentName}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {o.grade} - {o.section}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600">{o.guardianMobile}</td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">
                      {formatCurrency(o.totalDemand)}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                      {formatCurrency(o.paidAmount)}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">
                      {hasDues ? (
                        <span className="text-amber-600">{formatCurrency(o.outstandingAmount)}</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md uppercase font-bold">
                          ✓ Settled (₹0)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hasDues ? (
                        <button
                          onClick={() => sendSingleWhatsApp(o)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          Send WhatsApp
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">No Dues</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─────────────── BULK WHATSAPP DISPATCH MODAL ─────────────── */}
      {bulkModalOpen && selectedStudents.length > 0 && (() => {
        const total = selectedStudents.length;
        const done = bulkIndex;
        const currentStudent = selectedStudents[bulkIndex];
        const progress = Math.round((done / total) * 100);
        const isFinished = done >= total;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-4.5 h-4.5 text-emerald-600" />
                  Bulk Fee Reminder Broadcast
                </h2>
                <button
                  onClick={() => setBulkModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span>
                      Sending {done} of {total} WhatsApp Reminders
                    </span>
                    <span className="font-mono text-emerald-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {!isFinished && currentStudent ? (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                        Target Student {bulkIndex + 1} of {total}
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-700">
                        {currentStudent.grNumber}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {currentStudent.studentName}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {currentStudent.grade} - Section {currentStudent.section}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-emerald-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400 font-semibold text-[10px] uppercase">Guardian Phone</p>
                        <p className="font-mono font-bold text-slate-800">{currentStudent.guardianMobile}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 font-semibold text-[10px] uppercase">Pending Dues</p>
                        <p className="font-mono font-bold text-amber-600">
                          {formatCurrency(currentStudent.outstandingAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-900">All {total} Reminders Sent!</h3>
                    <p className="text-xs text-slate-600">
                      Bulk WhatsApp fee reminder queue has finished successfully.
                    </p>
                  </div>
                )}

                {/* Helper Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    Ensure <strong>WhatsApp Web</strong> is open in Chrome. Each click opens the message for the current student in WhatsApp so you can hit send!
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setBulkModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl"
                  >
                    {isFinished ? "Done" : "Pause / Close"}
                  </button>
                  {!isFinished && (
                    <button
                      onClick={sendNextBulk}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      Send WhatsApp to {currentStudent?.studentName} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
