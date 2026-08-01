"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Filter,
  Loader2,
  X,
  Eye,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStoredPayments, calculateStudentFinancials, getStoredStudents, PaymentLogStore } from "@/lib/school-store";

interface GradeStudentRow {
  sn: number;
  id: string;
  fullName: string;
  grNumber: string;
  studentId: string;
  grade: string;
  section: string;
  contact: string;
  demand: number;
  paid: number;
  outstanding: number;
  paymentStatus: "PAID_FULL" | "PARTLY_PAID" | "NOT_PAID";
  oldBalance: number;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "defaulters" | "grades">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(true);

  const [dailyPayments, setDailyPayments] = useState<PaymentLogStore[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [gradeSummaries, setGradeSummaries] = useState<any[]>([]);
  const [allStudentsList, setAllStudentsList] = useState<any[]>([]);

  // Active Grade Modal State
  const [selectedGradeModal, setSelectedGradeModal] = useState<string | null>(null);
  const [gradeModalStudents, setGradeModalStudents] = useState<GradeStudentRow[]>([]);
  const [modalFilterStatus, setModalFilterStatus] = useState<"ALL" | "PAID_FULL" | "PARTLY_PAID" | "NOT_PAID">("ALL");

  useEffect(() => {
    fetchReportData();
  }, [selectedDate]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/v1/students?limit=1000", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let allStudents: any[] = [];
      if (res.ok) {
        const data = await res.json();
        allStudents = data.data || [];
      }



      const localStudents = getStoredStudents();
      const map = new Map<string, any>();
      [...allStudents, ...localStudents].forEach((s) => map.set(s.id, s));
      const combined = Array.from(map.values());
      setAllStudentsList(combined);

      // 1. Daily Payments
      const globalPayments = getStoredPayments();
      const todayLogs = globalPayments.filter((p) => p.paidDate === selectedDate);
      setDailyPayments(todayLogs);

      // 2. Defaulters List
      const defaulterList: any[] = [];
      combined.forEach((s) => {
        const gradeName = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || s.grade || "Grade 1";
        const category = (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) || (s.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");
        const financials = calculateStudentFinancials({ id: s.id, grade: gradeName, admissionCategory: category });

        if (financials.outstanding > 0) {
          defaulterList.push({
            student: {
              fullName: s.fullName || `${s.firstName} ${s.lastName}`,
              grNumber: s.grNumber,
              studentId: s.studentId,
              mobile: s.guardians?.[0]?.guardian?.mobile || s.guardianMobile || "N/A",
            },
            grade: gradeName,
            section: s.enrolments?.[0]?.section?.name || s.section || "A",
            overdueTotal: financials.outstanding,
            chargesCount: 5,
          });
        }
      });
      setDefaulters(defaulterList);

      // 3. Grade-wise Summary
      const gradeMap = new Map<string, { demand: number; paid: number; outstanding: number; studentCount: number }>();
      combined.forEach((s) => {
        const gradeName = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || s.grade || "Grade 1";
        const category = (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) || (s.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");
        const financials = calculateStudentFinancials({ id: s.id, grade: gradeName, admissionCategory: category });

        const curr = gradeMap.get(gradeName) || { demand: 0, paid: 0, outstanding: 0, studentCount: 0 };
        gradeMap.set(gradeName, {
          demand: curr.demand + financials.demand,
          paid: curr.paid + financials.paid,
          outstanding: curr.outstanding + financials.outstanding,
          studentCount: curr.studentCount + 1,
        });
      });

      const gradeSummariesArr = Array.from(gradeMap.entries()).map(([gName, val]) => ({
        gradeName: gName,
        totalDemand: val.demand,
        totalPaid: val.paid,
        totalOutstanding: val.outstanding,
        studentCount: val.studentCount,
        collectionRate: val.demand > 0 ? `${((val.paid / val.demand) * 100).toFixed(1)}%` : "0.0%",
      }));

      setGradeSummaries(gradeSummariesArr);
    } catch {
      // Clean fallback
    } finally {
      setIsLoading(false);
    }
  };

  const openGradeRosterModal = (gradeName: string) => {
    setSelectedGradeModal(gradeName);
    setModalFilterStatus("ALL");

    const filteredStudents = allStudentsList.filter((s) => {
      const g = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || s.grade || "Grade 1";
      return g === gradeName;
    });

    const rows: GradeStudentRow[] = filteredStudents.map((s, idx) => {
      const gName = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || s.grade || "Grade 1";
      const category = (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) || (s.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");
      const financials = calculateStudentFinancials({ id: s.id, grade: gName, admissionCategory: category });

      let status: "PAID_FULL" | "PARTLY_PAID" | "NOT_PAID" = "NOT_PAID";
      if (financials.outstanding === 0 && financials.paid > 0) {
        status = "PAID_FULL";
      } else if (financials.paid > 0) {
        status = "PARTLY_PAID";
      }

      return {
        sn: idx + 1,
        id: s.id,
        fullName: s.fullName || `${s.firstName} ${s.lastName}`,
        grNumber: s.grNumber,
        studentId: s.studentId,
        grade: gName,
        section: s.enrolments?.[0]?.section?.name || s.section || "A",
        contact: s.guardians?.[0]?.guardian?.mobile || s.guardianMobile || "N/A",
        demand: financials.demand,
        paid: financials.paid,
        outstanding: financials.outstanding,
        paymentStatus: status,
        oldBalance: financials.oldBalance || 0,
      };
    });

    setGradeModalStudents(rows);
  };

  const exportGradeToExcel = (gradeName: string, rows: GradeStudentRow[]) => {
    const excelData = rows.map((r) => ({
      "SN": r.sn,
      "Student Name": r.fullName,
      "GR Number": r.grNumber,
      "Grade & Section": `${r.grade} - ${r.section}`,
      "Contact": r.contact,
      "Current Grade Fees": r.demand - (r.oldBalance || 0),
      "Previous Year Balance": r.oldBalance || 0,
      "Total Fees (with Arrears)": r.demand,
      "Received": r.paid,
      "Outstanding": r.outstanding,
      "Payment Status": r.paymentStatus === "PAID_FULL" ? "PAID FULL" : r.paymentStatus === "PARTLY_PAID" ? "PARTLY PAID" : "NOT PAID",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, gradeName);
    XLSX.writeFile(wb, `MVHS_${gradeName.replace(/\s+/g, "_")}_Fee_Status_Report.xlsx`);
  };

  const exportAllReportsToExcel = () => {
    const excelData: any[] = [];
    allStudentsList.forEach((s, idx) => {
      const gName = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || s.grade || "Grade 1";
      const category = (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) || (s.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");
      const financials = calculateStudentFinancials({ id: s.id, grade: gName, admissionCategory: category });

      let status = "NOT PAID";
      if (financials.outstanding === 0 && financials.paid > 0) status = "PAID FULL";
      else if (financials.paid > 0) status = "PARTLY PAID";

      excelData.push({
        "SN": idx + 1,
        "Student Name": s.fullName || `${s.firstName} ${s.lastName}`,
        "GR Number": s.grNumber,
        "Grade": gName,
        "Section": s.enrolments?.[0]?.section?.name || s.section || "A",
        "Contact": s.guardians?.[0]?.guardian?.mobile || s.guardianMobile || "N/A",
        "Current Grade Fees": financials.demand - (financials.oldBalance || 0),
        "Previous Year Balance": financials.oldBalance || 0,
        "Total Fees (with Arrears)": financials.demand,
        "Total Paid": financials.paid,
        "Outstanding Balance": financials.outstanding,
        "Payment Status": status,
      });
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master School Roster");
    XLSX.writeFile(wb, "MVHS_Master_Financial_Report_2026-27.xlsx");
  };

  const displayedModalStudents = gradeModalStudents.filter((s) => {
    if (modalFilterStatus === "ALL") return true;
    return s.paymentStatus === modalFilterStatus;
  });

  const totalCollectedSelectedDate = dailyPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Financial Reports Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Daily collection logs, defaulter statements, grade-wise student rosters, and Excel exports
          </p>
        </div>
        <button
          onClick={exportAllReportsToExcel}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export All Reports to Excel (.xlsx)
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2">
        {[
          { id: "daily", label: "Daily Collection Log", icon: <Calendar className="w-4 h-4" /> },
          { id: "defaulters", label: "Fee Defaulters List", icon: <AlertTriangle className="w-4 h-4" /> },
          { id: "grades", label: "Grade-wise Summary & Rosters", icon: <TrendingUp className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-sm font-semibold">Generating Financial Reports...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Daily Collection */}
          {activeTab === "daily" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-700">Select Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-900 focus:outline-none font-semibold"
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">Total Collected ({selectedDate})</p>
                  <p className="text-xl font-bold text-emerald-600 mt-0.5">{formatCurrency(totalCollectedSelectedDate)}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                {dailyPayments.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No payment receipts logged on {selectedDate}.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Receipt Number</th>
                        <th className="px-6 py-4">Student ID</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Payment Mode</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dailyPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="px-6 py-4 font-mono font-bold text-blue-600">{p.invoiceNo}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-700">{p.studentId}</td>
                          <td className="px-6 py-4 font-mono font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {p.paymentMode}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-500">{p.paidDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Defaulters List */}
          {activeTab === "defaulters" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Students with Overdue Fee Balance</h3>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {defaulters.length} Defaulters Found
                  </span>
                </div>

                {defaulters.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                    <p className="font-semibold text-slate-700">All student accounts are fully paid!</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Student Name</th>
                        <th className="px-6 py-4">GR Number</th>
                        <th className="px-6 py-4">Grade & Section</th>
                        <th className="px-6 py-4">Mobile</th>
                        <th className="px-6 py-4">Total Overdue Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {defaulters.map((d, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="px-6 py-4 font-semibold text-slate-900">{d.student.fullName}</td>
                          <td className="px-6 py-4 font-mono text-xs text-blue-600 font-bold">{d.student.grNumber}</td>
                          <td className="px-6 py-4 text-xs text-slate-700">{d.grade} - {d.section}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-mono">{d.student.mobile}</td>
                          <td className="px-6 py-4 font-mono font-bold text-amber-600">{formatCurrency(d.overdueTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Grade-wise Summary & Rosters */}
          {activeTab === "grades" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm space-y-4 p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Grade-wise Financial Summary & Rosters</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Click any grade row to view student roster (Paid Full, Partly Paid, Not Paid)</p>
                </div>
              </div>

              {gradeSummaries.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <TrendingUp className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No grade financial summaries available.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700 border-collapse">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Grade / Standard</th>
                        <th className="px-6 py-4">Students Count</th>
                        <th className="px-6 py-4">Total Demand</th>
                        <th className="px-6 py-4">Total Paid</th>
                        <th className="px-6 py-4">Total Outstanding</th>
                        <th className="px-6 py-4">Collection Rate</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gradeSummaries.map((g, idx) => (
                        <tr
                          key={idx}
                          onClick={() => openGradeRosterModal(g.gradeName)}
                          className="hover:bg-blue-50/80 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2 group-hover:text-blue-600">
                            <Eye className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {g.gradeName}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                              {g.studentCount} Students
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-700">{formatCurrency(g.totalDemand)}</td>
                          <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{formatCurrency(g.totalPaid)}</td>
                          <td className="px-6 py-4 font-mono text-amber-600 font-bold">{formatCurrency(g.totalOutstanding)}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {g.collectionRate}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openGradeRosterModal(g.gradeName);
                              }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-all"
                            >
                              View Roster & Export
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Grade Roster Drill-Down Modal */}
      {selectedGradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl max-w-5xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  {selectedGradeModal} — Student Payment Roster
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed payment status breakdown (Paid Full, Partly Paid, Not Paid) for {selectedGradeModal}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => exportGradeToExcel(selectedGradeModal, gradeModalStudents)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export {selectedGradeModal} to Excel (.xlsx)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGradeModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Status Filter Tabs */}
            <div className="flex gap-2 border-b border-slate-100 pb-2">
              {[
                { id: "ALL", label: `All Students (${gradeModalStudents.length})` },
                {
                  id: "PAID_FULL",
                  label: `Paid Full (${gradeModalStudents.filter((s) => s.paymentStatus === "PAID_FULL").length})`,
                },
                {
                  id: "PARTLY_PAID",
                  label: `Partly Paid (${gradeModalStudents.filter((s) => s.paymentStatus === "PARTLY_PAID").length})`,
                },
                {
                  id: "NOT_PAID",
                  label: `Not Paid (${gradeModalStudents.filter((s) => s.paymentStatus === "NOT_PAID").length})`,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setModalFilterStatus(f.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                    modalFilterStatus === f.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Roster Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 font-bold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-center">SN</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">GR Number</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3 text-right">Total Fees</th>
                    <th className="px-4 py-3 text-right">Received</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3 text-center">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedModalStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">
                        No students found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedModalStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-center text-slate-500">{s.sn}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{s.fullName}</td>
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{s.grNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{s.grade} - {s.section}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{s.contact}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatCurrency(s.demand)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{formatCurrency(s.paid)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600">{formatCurrency(s.outstanding)}</td>
                        <td className="px-4 py-3 text-center">
                          {s.paymentStatus === "PAID_FULL" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" />
                              PAID FULL
                            </span>
                          )}
                          {s.paymentStatus === "PARTLY_PAID" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              PARTLY PAID
                            </span>
                          )}
                          {s.paymentStatus === "NOT_PAID" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                              NOT PAID
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedGradeModal(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-5 py-2 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
