"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  User,
  GraduationCap,
  Calendar,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStoredStudents, calculateStudentFinancials, getStoredPayments } from "@/lib/school-store";
import { SchoolLogo } from "@/components/shared/school-logo";

interface StudentLedgerData {
  student: {
    id: string;
    fullName: string;
    grNumber: string;
    studentId: string;
    grade: string;
  };
  summary: {
    totalDemand: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  transactions: {
    id: string;
    date: string;
    type: "CHARGE" | "PAYMENT";
    reference: string;
    mode: string;
    description: string;
    amount: number;
    runningBalance: number;
  }[];
}

export default function StudentLedgerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ledger, setLedger] = useState<StudentLedgerData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    setIsLoading(true);
    setSearchError(null);

    let found: any = null;

    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch(`/api/v1/students?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.length > 0) {
          found = data.data[0];
        }
      }
    } catch {
      found = null;
    }

    if (!found) {
      const localStudents = getStoredStudents();
      const match = localStudents.find((s) => {
        const q = query.toLowerCase();
        return (
          s.fullName.toLowerCase().includes(q) ||
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.grNumber.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q)
        );
      });
      if (match) {
        found = {
          id: match.id,
          firstName: match.firstName,
          lastName: match.lastName,
          grNumber: match.grNumber,
          studentId: match.studentId,
          enrolments: [{ grade: { name: match.grade }, section: { name: match.section } }],
          admissionCategory: match.admissionCategory,
        };
      }
    }

    if (found) {
      const gradeName = localStorage.getItem(`mvhs_student_grade_${found.id}`) || found.enrolments?.[0]?.grade?.name || "Grade 1";
      const category =
        (localStorage.getItem(`mvhs_student_category_${found.id}`) as any) ||
        found.admissionCategory ||
        (found.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");
      const financials = calculateStudentFinancials({ id: found.id, grade: gradeName, admissionCategory: category });
      const payments = getStoredPayments(found.id);

      const txList: any[] = [
        {
          id: `demand_${found.id}`,
          date: "2026-06-01",
          type: "CHARGE",
          reference: `DEMAND-${found.grNumber}`,
          mode: "SYSTEM",
          description: `${gradeName} Standard Fee Schedule Demand`,
          amount: financials.demand,
          runningBalance: financials.demand,
        },
      ];

      let running = financials.demand;
      payments.forEach((p) => {
        running -= p.amount;
        txList.push({
          id: p.id,
          date: p.paidDate,
          type: "PAYMENT",
          reference: p.invoiceNo,
          mode: p.paymentMode,
          description: `Fee Payment Receipt (${p.transactionId})`,
          amount: p.amount,
          runningBalance: Math.max(0, running),
        });
      });

      setLedger({
        student: {
          id: found.id,
          fullName: `${found.firstName} ${found.lastName}`,
          grNumber: found.grNumber,
          studentId: found.studentId,
          grade: `${gradeName} - Section ${found.enrolments?.[0]?.section?.name || "A"}`,
        },
        summary: {
          totalDemand: financials.demand,
          totalPaid: financials.paid,
          totalOutstanding: financials.outstanding,
        },
        transactions: txList,
      });
    } else {
      setLedger(null);
      setSearchError(`No student ledger found for "${searchTerm}". Please enter a valid GR Number or Name.`);
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header (Screen only) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-blue-600" />
            Student Financial Ledger
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete transaction statement of fee demands, payments, allocations, and receipts
          </p>
        </div>
        <button
          onClick={() => window.print()}
          disabled={!ledger}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-50 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          Print Statement
        </button>
      </div>

      {/* Search Bar (Screen only) */}
      <form onSubmit={handleSearch} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm no-print">
        <div className="relative max-w-xl flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student ledger by GR Number or Name (e.g. Anay, Devanshi)..."
              className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search Ledger"}
          </button>
        </div>
        {searchError && (
          <p className="text-xs font-semibold text-red-600 mt-2">{searchError}</p>
        )}
      </form>

      {!ledger ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-sm no-print">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-800 text-base">Search for a student to view Financial Ledger Statement</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Type the student's GR Number or Name in the search box above.
          </p>
        </div>
      ) : (
        <div className="printable-receipt-area space-y-6">
          {/* Printable Statement School Header (visible on print & screen) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-2">
            <SchoolLogo className="w-16 h-16 mx-auto drop-shadow-sm" />
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">
              MARWARI VIDYALAYA SANCHILIT
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              463-475, S.V.P. ROAD, PRARTHNA SAMAJ, Charni Road, Opera House, Mumbai, Maharashtra 400004
            </p>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider pt-1 border-t border-slate-100 max-w-xs mx-auto">
              Official Student Financial Ledger Statement
            </p>
          </div>

          {/* Student Banner & Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Student Profile Card */}
            <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center font-bold text-lg">
                {ledger.student.fullName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{ledger.student.fullName}</h2>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs font-bold px-2 py-0.5 rounded">
                    {ledger.student.grNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{ledger.student.grade} • ID: {ledger.student.studentId}</p>
              </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Total Fee Demand</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{formatCurrency(ledger.summary.totalDemand)}</p>
              <p className="text-[11px] text-slate-400 font-medium">Academic Year 2026-27</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Total Paid / Outstanding</p>
              <p className="text-lg font-bold text-emerald-600 mt-0.5">{formatCurrency(ledger.summary.totalPaid)}</p>
              <p className="text-[11px] text-amber-600 font-bold">Due: {formatCurrency(ledger.summary.totalOutstanding)}</p>
            </div>
          </div>

          {/* Ledger Statement Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Ledger Transaction Statement</h3>
              <span className="text-xs text-slate-500 font-medium">Generated Date: {new Date().toISOString().split("T")[0]}</span>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-right">Debit (Demand)</th>
                  <th className="px-5 py-3 text-right">Credit (Paid)</th>
                  <th className="px-5 py-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {ledger.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3 font-mono text-slate-600">{tx.date}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tx.type === "PAYMENT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-800">{tx.reference}</td>
                    <td className="px-5 py-3 text-slate-600">{tx.description}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                      {tx.type === "CHARGE" ? formatCurrency(tx.amount) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-emerald-600">
                      {tx.type === "PAYMENT" ? formatCurrency(tx.amount) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-amber-600">
                      {formatCurrency(tx.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Statement Footer */}
            <div className="p-5 border-t border-slate-200 flex justify-between items-end text-xs">
              <div>
                <p className="font-bold text-slate-700">Official School Statement</p>
                <p className="text-slate-500 text-[11px]">Computer generated ledger statement for Marwari Vidyalaya High School.</p>
              </div>

              <div className="text-center space-y-0.5">
                <div className="w-36 border-b border-slate-400"></div>
                <p className="font-bold text-slate-700 text-xs">Accountant / Principal</p>
                <p className="text-[10px] text-slate-400">(Seal &amp; Signature)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

