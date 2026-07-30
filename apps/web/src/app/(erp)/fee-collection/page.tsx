"use client";

import { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  User,
  IndianRupee,
  Loader2,
  Printer,
  X,
  History,
  GraduationCap,
  Sparkles,
  Eye,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calculateStudentFinancials, getStoredPayments, saveStoredPayment, getStoredStudents, PaymentLogStore, calculateGradeDemand } from "@/lib/school-store";

interface StudentData {
  id: string;
  grNumber: string;
  studentId: string;
  fullName: string;
  grade: string;
  section: string;
  guardianName: string;
  relationship: string;
  totalDemand: number;
  outstandingTotal: number;
}

export default function FeeCollectionPage() {
  const [grSearch, setGrSearch] = useState("");
  const [searchResults, setSearchResults] = useState<StudentData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "CHEQUE" | "NEFT">("CASH");
  const [transactionRef, setTransactionRef] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [remarks, setRemarks] = useState("Counter Fee Payment");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Invoice Modal State
  const [activeInvoiceModal, setActiveInvoiceModal] = useState<PaymentLogStore | null>(null);

  // Active Student State
  const [currentStudent, setCurrentStudent] = useState<StudentData | null>(null);
  const [outstandingTotal, setOutstandingTotal] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState<PaymentLogStore[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Auto-search engine suggestions searching BOTH live backend API and persistent store
  useEffect(() => {
    const query = grSearch.trim();
    if (!query) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      let apiMatches: StudentData[] = [];
      try {
        const token = sessionStorage.getItem("access_token") ?? "";
        const res = await fetch(`/api/v1/students?search=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          apiMatches = (data.data || []).map((s: any) => {
            const gradeName = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || "Grade 1";
            const category = (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) || (s.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");
            const financials = calculateStudentFinancials({ id: s.id, grade: gradeName, admissionCategory: category });

            return {
              id: s.id,
              grNumber: s.grNumber,
              studentId: s.studentId,
              fullName: `${s.firstName} ${s.lastName}`,
              grade: gradeName,
              section: s.enrolments?.[0]?.section?.name || "A",
              guardianName: s.guardians?.[0]?.guardian?.firstName || "Parent",
              relationship: s.guardians?.[0]?.relationship || "Guardian",
              totalDemand: financials.demand,
              outstandingTotal: financials.outstanding,
            };
          });
        }
      } catch {
        apiMatches = [];
      }

      // Search local persistent store with flexible substring matching
      const localStudents = getStoredStudents();
      const q = query.toLowerCase();
      const localFiltered = localStudents.filter((s) => {
        const fName = s.fullName.toLowerCase();
        const fFirst = s.firstName.toLowerCase();
        const fLast = s.lastName.toLowerCase();
        const gr = s.grNumber.toLowerCase();
        const stId = s.studentId.toLowerCase();
        return (
          fName.includes(q) ||
          fFirst.includes(q) ||
          fLast.includes(q) ||
          gr.includes(q) ||
          stId.includes(q) ||
          q.includes(fFirst) ||
          q.includes(fLast)
        );
      });

      const localMatches: StudentData[] = localFiltered.map((s) => {
        const gradeName = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.grade || "Grade 1";
        const category = (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) || s.admissionCategory || "EXISTING";
        const financials = calculateStudentFinancials({ id: s.id, grade: gradeName, admissionCategory: category });

        return {
          id: s.id,
          grNumber: s.grNumber,
          studentId: s.studentId,
          fullName: s.fullName,
          grade: gradeName,
          section: s.section || "A",
          guardianName: s.guardianName || "Parent",
          relationship: "Guardian",
          totalDemand: financials.demand,
          outstandingTotal: financials.outstanding,
        };
      });

      const resultMap = new Map<string, StudentData>();
      [...apiMatches, ...localMatches].forEach((item) => resultMap.set(item.id, item));
      const combined = Array.from(resultMap.values());

      setSearchResults(combined);
      setShowDropdown(combined.length > 0);
    }, 100);

    return () => clearTimeout(timer);
  }, [grSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectStudent = (student: StudentData) => {
    setCurrentStudent(student);
    setGrSearch(student.grNumber);
    setShowDropdown(false);
    setSearchError(null);

    // Load stored payments
    const logs = getStoredPayments(student.id);
    setPaymentHistory(logs);
    const paidSum = logs.reduce((sum, p) => sum + p.amount, 0);
    setOutstandingTotal(Math.max(0, student.totalDemand - paidSum));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setIsSearching(true);
    setShowDropdown(false);

    const query = grSearch.trim();
    if (!query) {
      setIsSearching(false);
      return;
    }

    if (searchResults.length > 0) {
      selectStudent(searchResults[0]);
      setIsSearching(false);
      return;
    }

    const localStudents = getStoredStudents();
    const q = query.toLowerCase();
    const localMatch = localStudents.find((s) => {
      const fName = s.fullName.toLowerCase();
      const fFirst = s.firstName.toLowerCase();
      const fLast = s.lastName.toLowerCase();
      const gr = s.grNumber.toLowerCase();
      const stId = s.studentId.toLowerCase();
      return fName.includes(q) || fFirst.includes(q) || fLast.includes(q) || gr.includes(q) || stId.includes(q);
    });

    if (localMatch) {
      const gradeName = localStorage.getItem(`mvhs_student_grade_${localMatch.id}`) || localMatch.grade || "Grade 1";
      const category = (localStorage.getItem(`mvhs_student_category_${localMatch.id}`) as any) || localMatch.admissionCategory || "EXISTING";
      const financials = calculateStudentFinancials({ id: localMatch.id, grade: gradeName, admissionCategory: category });

      selectStudent({
        id: localMatch.id,
        grNumber: localMatch.grNumber,
        studentId: localMatch.studentId,
        fullName: localMatch.fullName,
        grade: gradeName,
        section: localMatch.section || "A",
        guardianName: localMatch.guardianName || "Parent",
        relationship: "Guardian",
        totalDemand: financials.demand,
        outstandingTotal: financials.outstanding,
      });
    } else {
      setSearchError(`No student records found matching "${grSearch}". Please verify the GR Number or Name.`);
    }

    setIsSearching(false);
  };

  const getDynamicCharges = () => {
    if (!currentStudent) {
      return [
        { id: "c1", feeHeadName: "Monthly Fees (July - Dec 2026)", dueDate: "2026-07-10", netDue: 18000, status: "DUE" },
        { id: "c2", feeHeadName: "Term Fees (Term 1 & 2)", dueDate: "2026-09-10", netDue: 3000, status: "DUE" },
        { id: "c3", feeHeadName: "MS Fees (Annual)", dueDate: "2026-10-10", netDue: 2500, status: "DUE" },
      ];
    }

    const studentOldBalance = parseFloat(localStorage.getItem(`mvhs_student_old_balance_${currentStudent.id}`) || "0") || 0;
    const list = [];
    if (studentOldBalance > 0) {
      list.push({
        id: "c0",
        feeHeadName: "Arrear Fees (Previous Balance)",
        dueDate: "2026-06-01",
        netDue: studentOldBalance,
        status: "DUE",
      });
    }

    const currentGradeRate = currentStudent.totalDemand - studentOldBalance;
    let monthlyFeesVal = 18000;
    let termFeesVal = 3000;
    let msFeesVal = 2500;

    if (currentGradeRate === 28800) {
      monthlyFeesVal = 21800;
      termFeesVal = 4000;
      msFeesVal = 3000;
    } else if (currentGradeRate === 31000) {
      monthlyFeesVal = 23000;
      termFeesVal = 5000;
      msFeesVal = 3000;
    } else if (currentGradeRate === 25500) {
      monthlyFeesVal = 19500;
      termFeesVal = 3500;
      msFeesVal = 2500;
    } else if (currentGradeRate === 29500) {
      monthlyFeesVal = 22500;
      termFeesVal = 4000;
      msFeesVal = 3000;
    }

    list.push({ id: "c1", feeHeadName: "Monthly Fees (July - Dec 2026)", dueDate: "2026-07-10", netDue: monthlyFeesVal, status: "DUE" });
    list.push({ id: "c2", feeHeadName: "Term Fees (Term 1 & 2)", dueDate: "2026-09-10", netDue: termFeesVal, status: "DUE" });
    list.push({ id: "c3", feeHeadName: "MS Fees (Annual)", dueDate: "2026-10-10", netDue: msFeesVal, status: "DUE" });

    return list;
  };

  const charges = getDynamicCharges();

  const handlePostPayment = async () => {
    if (!currentStudent) return;
    setIsSubmitting(true);
    const paidAmt = parseFloat(amountInput) || 0;
    if (paidAmt <= 0) {
      setIsSubmitting(false);
      return;
    }

    const studentOldBalance = parseFloat(localStorage.getItem(`mvhs_student_old_balance_${currentStudent.id}`) || "0") || 0;
    const currentGradeRate = currentStudent.totalDemand - studentOldBalance;

    let monthlyFeesVal = 18000;
    let termFeesVal = 3000;
    let msFeesVal = 2500;

    if (currentGradeRate === 28800) {
      monthlyFeesVal = 21800;
      termFeesVal = 4000;
      msFeesVal = 3000;
    } else if (currentGradeRate === 31000) {
      monthlyFeesVal = 23000;
      termFeesVal = 5000;
      msFeesVal = 3000;
    } else if (currentGradeRate === 25500) {
      monthlyFeesVal = 19500;
      termFeesVal = 3500;
      msFeesVal = 2500;
    } else if (currentGradeRate === 29500) {
      monthlyFeesVal = 22500;
      termFeesVal = 4000;
      msFeesVal = 3000;
    }

    let remaining = paidAmt;
    let allocatedAdmission = Math.min(remaining, studentOldBalance);
    remaining -= allocatedAdmission;

    let allocatedMonthly = Math.min(remaining, monthlyFeesVal);
    remaining -= allocatedMonthly;

    let allocatedTerm = Math.min(remaining, termFeesVal);
    remaining -= allocatedTerm;

    let allocatedMS = Math.min(remaining, msFeesVal);

    const nextInvoiceNo = `MVHS#00${1252 + paymentHistory.length + 1}`;
    const todayStr = new Date().toISOString().split("T")[0];

    const newLog: PaymentLogStore = {
      srNo: paymentHistory.length + 1,
      id: `p_${Date.now()}`,
      studentId: currentStudent.id,
      invoiceNo: nextInvoiceNo,
      paidDate: todayStr,
      insertedBy: "counter",
      amount: paidAmt,
      splitStructure: {
        admissionFees: allocatedAdmission,
        monthlyFees: allocatedMonthly,
        termFees: allocatedTerm,
        msFees: allocatedMS,
      },
      transactionId: transactionRef || paymentMode.toLowerCase(),
      paymentMode,
      grade: currentStudent.grade,
    };

    saveStoredPayment(newLog);

    const updatedLogs = getStoredPayments(currentStudent.id);
    setPaymentHistory(updatedLogs);

    const paidSum = updatedLogs.reduce((sum, p) => sum + p.amount, 0);
    setOutstandingTotal(Math.max(0, currentStudent.totalDemand - paidSum));

    setActiveInvoiceModal(newLog);
    setAmountInput("");
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <CreditCard className="w-7 h-7 text-blue-600" />
          Marwari Vidyalaya Fee Collection Counter
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Search student by GR Number or Name, post payments with automatic fee head split allocation, and issue official invoices
        </p>
      </div>

      {/* Live Search Engine Input */}
      <div ref={searchContainerRef} className="relative z-30">
        <form onSubmit={handleSearch} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={grSearch}
                onChange={(e) => setGrSearch(e.target.value)}
                placeholder="Enter GR Number (e.g. GR-001001) or Student Name (e.g. Anay, Devanshi, Hitesh) to search..."
                className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !grSearch.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </button>
          </div>

          {searchError && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
        </form>

        {/* Search Suggestions Popup */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50 divide-y divide-slate-100">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Matching Student Records ({searchResults.length})</span>
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            </div>

            {searchResults.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => selectStudent(student)}
                className="w-full px-5 py-3 text-left hover:bg-blue-50/80 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {student.fullName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {student.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-mono font-bold text-blue-600">{student.grNumber}</span> • {student.grade} - Sec {student.section}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                    Due: {formatCurrency(student.outstandingTotal)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Student Details & Payment Counter Workspace */}
      {!currentStudent ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
          <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-800 text-base">Search for a student to open Fee Collection Workspace</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Type the student's GR Number or Name into the search engine above to load fee charges, ledger balance, and issue receipts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Outstanding Charges & Payment Receipts Table */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Student Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-600/30">
                  {currentStudent.fullName[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentStudent.fullName}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {currentStudent.grade} - Section {currentStudent.section} • GR: <span className="font-mono font-bold text-blue-600">{currentStudent.grNumber}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Guardian: {currentStudent.guardianName} ({currentStudent.relationship})
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Outstanding Balance</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">{formatCurrency(outstandingTotal)}</p>
              </div>
            </div>

            {/* Charges Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Outstanding Fee Charges</h4>
                <span className="text-xs text-slate-500 font-medium">Chronological Due Order</span>
              </div>

              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Fee Head Item</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Net Due</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {charges.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3.5 font-medium text-slate-900">{c.feeHeadName}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-500 font-mono">{c.dueDate}</td>
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-900">{formatCurrency(c.netDue)}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment Receipts History Table matching Portal design */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-sky-500 px-6 py-3 text-white font-bold text-sm flex items-center justify-between">
                <span>Financial Year : 2026-27</span>
                <span className="text-xs font-normal opacity-90">{currentStudent.fullName}</span>
              </div>

              {paymentHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                  No payment receipts issued for this student yet. Post a payment on the right to generate an invoice.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead className="bg-sky-500 text-white font-bold border-b border-sky-600">
                      <tr>
                        <th className="px-3 py-3 border-r border-sky-400/50">Sr. No.</th>
                        <th className="px-3 py-3 border-r border-sky-400/50">Paid Date</th>
                        <th className="px-3 py-3 border-r border-sky-400/50">Inserted By</th>
                        <th className="px-3 py-3 border-r border-sky-400/50">Amount</th>
                        <th className="px-4 py-3 border-r border-sky-400/50">Split Structure</th>
                        <th className="px-3 py-3 border-r border-sky-400/50">Transaction Id</th>
                        <th className="px-3 py-3 border-r border-sky-400/50">View invoice</th>
                        <th className="px-3 py-3 border-r border-sky-400/50">Edit</th>
                        <th className="px-3 py-3">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {paymentHistory.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-3 border-r border-slate-100 font-mono text-center">{p.srNo}</td>
                          <td className="px-3 py-3 border-r border-slate-100 font-mono whitespace-nowrap">{p.paidDate}</td>
                          <td className="px-3 py-3 border-r border-slate-100 font-medium text-slate-600">{p.insertedBy}</td>
                          <td className="px-3 py-3 border-r border-slate-100 font-mono font-bold text-slate-900">
                            {p.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 font-mono text-[11px] leading-relaxed text-slate-600">
                            <p>Admission Fees : {p.splitStructure.admissionFees.toFixed(2)}</p>
                            <p>Monthly Fees : {p.splitStructure.monthlyFees.toFixed(2)}</p>
                            <p>Term Fees : {p.splitStructure.termFees.toFixed(2)}</p>
                            <p>MS Fees : {p.splitStructure.msFees.toFixed(2)}</p>
                          </td>
                          <td className="px-3 py-3 border-r border-slate-100 font-mono text-slate-700 font-semibold">
                            {p.transactionId}
                          </td>
                          <td className="px-3 py-3 border-r border-slate-100 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setActiveInvoiceModal(p)}
                              className="text-sky-600 hover:text-sky-800 font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Invoice
                            </button>
                          </td>
                          <td className="px-3 py-3 border-r border-slate-100 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => alert(`Edit payment invoice ${p.invoiceNo}`)}
                              className="text-sky-600 hover:text-sky-800 font-semibold hover:underline"
                            >
                              Edit
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                const remainingLogs = paymentHistory.filter((x) => x.id !== p.id);
                                setPaymentHistory(remainingLogs);
                                localStorage.setItem("mvhs_global_payments", JSON.stringify(remainingLogs));
                                localStorage.setItem(`mvhs_payments_${currentStudent.id}`, JSON.stringify(remainingLogs));
                                const newPaidTotal = remainingLogs.reduce((sum, item) => sum + item.amount, 0);
                                setOutstandingTotal(Math.max(0, currentStudent.totalDemand - newPaidTotal));
                              }}
                              className="text-sky-600 hover:text-red-600 font-semibold hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right: Payment Collection Form */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5 h-fit">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Payment Collection Details</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Payment Mode *</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["NEFT", "CASH", "UPI", "CHEQUE"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      paymentMode === mode
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / Cheque No *</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. NEFT-645241200792 or cash"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Received (₹) *</label>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Enter fee amount..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Note</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional payment notes..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="button"
              onClick={handlePostPayment}
              disabled={isSubmitting || !amountInput}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting Payment...
                </>
              ) : (
                <>
                  Post Payment & Issue Invoice
                  <Receipt className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Official Invoice Modal */}
      {activeInvoiceModal && currentStudent && (() => {
        const invoiceOldBalance = parseFloat(localStorage.getItem(`mvhs_student_old_balance_${currentStudent.id}`) || "0") || 0;
        const invoiceStoredCategory = localStorage.getItem(`mvhs_student_category_${currentStudent.id}`) as any || "EXISTING";
        const invoiceGradeDemand = calculateGradeDemand(currentStudent.grade, invoiceStoredCategory);
        const invoiceTotalDemand = invoiceGradeDemand + invoiceOldBalance;

        const invoiceStudentPayments = getStoredPayments(currentStudent.id);
        const invoiceTotalPaidSum = invoiceStudentPayments.reduce((sum, p) => sum + p.amount, 0);
        const invoiceRemainingOutstanding = Math.max(0, invoiceTotalDemand - invoiceTotalPaidSum);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl max-w-2xl w-full p-8 space-y-6 max-h-[95vh] overflow-y-auto">
              {/* Header with Circular Logo */}
              <div className="text-center space-y-2 border-b border-slate-200 pb-6 relative">
                <button
                  type="button"
                  onClick={() => setActiveInvoiceModal(null)}
                  className="absolute right-0 top-0 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-16 h-16 bg-red-700 rounded-full flex items-center justify-center text-yellow-300 font-bold text-xl mx-auto shadow-md border-2 border-yellow-400">
                  MV
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wide">
                  MARWARI VIDYALAYA SANCHILIT
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  463-475, S.V.P. ROAD, PRARTHNA SAMAJ,Charni Road, Sardar Vallabhbhai Patel Road,Opera House, Mumbai,Maharashtra 400004
                </p>
              </div>

              {/* Metadata Bar */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                <div className="space-y-1">
                  <p>Invoice Date : <span className="font-mono text-slate-900 font-bold">{activeInvoiceModal.paidDate}</span></p>
                  <p>Invoice No : <span className="font-mono text-slate-900 font-bold">{activeInvoiceModal.invoiceNo}</span></p>
                  <p>Tel: <span className="text-slate-600 font-normal">02386845 / 47836669</span></p>
                  <p>Email : <span className="text-slate-600 font-normal">mawari.vidyalaya@gmail.com</span></p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-slate-400 uppercase font-bold text-[11px]">Receipt To</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{currentStudent.fullName}</p>
                  <p className="text-slate-600 font-normal">s/o {currentStudent.guardianName}</p>
                  <p className="text-slate-800 font-bold">{currentStudent.grade}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border-t border-b border-slate-200 py-2">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 w-8">#</th>
                      <th className="py-2">Description</th>
                      <th className="py-2 text-right">Fee paid</th>
                      <th className="py-2 text-center w-12">Qty</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    <tr>
                      <td className="py-2.5">1</td>
                      <td className="py-2.5 font-bold">Arrear Fees :</td>
                      <td className="py-2.5 text-right font-mono">INR {activeInvoiceModal.splitStructure.admissionFees.toFixed(2)} /-</td>
                      <td className="py-2.5 text-center font-mono">1</td>
                      <td className="py-2.5 text-right font-mono font-bold">INR {activeInvoiceModal.splitStructure.admissionFees.toFixed(2)} /-</td>
                    </tr>
                    <tr>
                      <td className="py-2.5">2</td>
                      <td className="py-2.5 font-bold">Monthly Fees :</td>
                      <td className="py-2.5 text-right font-mono">INR {activeInvoiceModal.splitStructure.monthlyFees.toFixed(2)} /-</td>
                      <td className="py-2.5 text-center font-mono">1</td>
                      <td className="py-2.5 text-right font-mono font-bold">INR {activeInvoiceModal.splitStructure.monthlyFees.toFixed(2)} /-</td>
                    </tr>
                    <tr>
                      <td className="py-2.5">3</td>
                      <td className="py-2.5 font-bold">Term Fees :</td>
                      <td className="py-2.5 text-right font-mono">INR {activeInvoiceModal.splitStructure.termFees.toFixed(2)} /-</td>
                      <td className="py-2.5 text-center font-mono">1</td>
                      <td className="py-2.5 text-right font-mono font-bold">INR {activeInvoiceModal.splitStructure.termFees.toFixed(2)} /-</td>
                    </tr>
                    <tr>
                      <td className="py-2.5">4</td>
                      <td className="py-2.5 font-bold">MS Fees :</td>
                      <td className="py-2.5 text-right font-mono">INR {activeInvoiceModal.splitStructure.msFees.toFixed(2)} /-</td>
                      <td className="py-2.5 text-center font-mono">1</td>
                      <td className="py-2.5 text-right font-mono font-bold">INR {activeInvoiceModal.splitStructure.msFees.toFixed(2)} /-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals Block */}
              <div className="flex justify-between items-start text-xs pt-2">
                <div>
                  <p className="font-semibold text-slate-700">Transaction Mode:</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{activeInvoiceModal.transactionId}</p>
                </div>

                <div className="w-56 space-y-1.5 text-right">
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Sub Total</span>
                    <span className="font-mono">{activeInvoiceModal.amount.toFixed(2)}/-</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-sm">
                    <span>Total Paid</span>
                    <span className="font-mono">INR {activeInvoiceModal.amount.toFixed(2)}/-</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Account Balance Statement Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-semibold text-slate-700">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Student Account Balance Statement</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p>Current Grade Fee Rate: <span className="font-mono text-slate-900 font-bold">{formatCurrency(invoiceGradeDemand)}</span></p>
                    <p>Previous Year Arrears (Old Balance): <span className="font-mono text-slate-900 font-bold">{formatCurrency(invoiceOldBalance)}</span></p>
                    <p>Total Life Demand: <span className="font-mono text-slate-900 font-bold">{formatCurrency(invoiceTotalDemand)}</span></p>
                  </div>
                  <div className="text-right space-y-1">
                    <p>Paid in this Receipt: <span className="font-mono text-emerald-600 font-bold">{formatCurrency(activeInvoiceModal.amount)}</span></p>
                    <p>Total Paid (Lifetime): <span className="font-mono text-emerald-600 font-bold">{formatCurrency(invoiceTotalPaidSum)}</span></p>
                    <p className="border-t border-slate-200 pt-1 text-slate-900 font-bold">
                      Remaining Balance Outstanding: <span className="font-mono text-amber-600">{formatCurrency(invoiceRemainingOutstanding)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer & Signatures */}
              <div className="flex justify-between items-end pt-6 border-t border-slate-200 text-xs">
                <div>
                  <p className="font-bold text-slate-700 mb-0.5">Terms & Condition</p>
                  <p className="text-slate-500 font-medium">This is software generated invoice.Signature is not mandatory.</p>
                </div>

                <div className="text-center space-y-1">
                  <div className="w-40 border-b border-slate-400"></div>
                  <p className="font-bold text-slate-700">Authorized person</p>
                  <p className="text-[11px] text-slate-500">(Seal & Signature)</p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveInvoiceModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print Official Invoice
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
