"use client";

import { useState, useEffect } from "react";
import {
  ArrowUpDown,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Calendar,
  Sparkles,
  RotateCcw,
  ArrowDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { calculateStudentFinancials, getWingForGrade, getStoredStudents } from "@/lib/school-store";

interface Candidate {
  studentId: string;
  fullName: string;
  grNumber: string;
  currentGrade: string;
  currentSection: string;
  arrearAmount: number;
  action: "PROMOTE" | "DETAIN" | "DEMOTE";
  targetFeeCategory: "EXISTING" | "NEW_ADMISSION";
}

export default function PromotionsPage() {
  const [selectedGrade, setSelectedGrade] = useState("Grade 1");
  const [targetGrade, setTargetGrade] = useState("Grade 2");
  const [targetSection, setTargetSection] = useState("Section A");
  const [defaultFeeCategory, setDefaultFeeCategory] = useState<"EXISTING" | "NEW_ADMISSION">("EXISTING");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dbGrades, setDbGrades] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Load master data from API on mount
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const token = sessionStorage.getItem("access_token") ?? "";
        
        // Fetch Grades
        const gradesRes = await fetch("/api/v1/grades", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (gradesRes.ok) {
          const json = await gradesRes.json();
          setDbGrades(json.data || []);
        }

        // Fetch Academic Years
        const ayRes = await fetch("/api/v1/academic-years", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ayRes.ok) {
          const json = await ayRes.json();
          setAcademicYears(json.data || []);
        }
      } catch {
        // Fallback to offline defaults
      }
    };
    loadMasters();
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [selectedGrade]);

  const fetchCandidates = async () => {
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
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

      // Filter students by selectedGrade
      const filtered = combined.filter((s) => {
        const gradeName = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || s.grade || "Grade 1";
        return gradeName === selectedGrade;
      });

      const matched: Candidate[] = filtered.map((s: any) => {
        const gradeName = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || s.grade || "Grade 1";
        const category = (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) || s.admissionCategory || (s.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");
        const financials = calculateStudentFinancials({
          id: s.id,
          grade: gradeName,
          admissionCategory: category,
        });

        return {
          studentId: s.id,
          fullName: s.fullName || `${s.firstName} ${s.lastName}`,
          grNumber: s.grNumber,
          currentGrade: gradeName,
          currentSection: s.enrolments?.[0]?.section?.name || s.section || "A",
          arrearAmount: financials.outstanding,
          action: "PROMOTE",
          targetFeeCategory: "EXISTING",
        };
      });
      setCandidates(matched);
    } catch {
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudentAction = (studentId: string, newAction: "PROMOTE" | "DETAIN" | "DEMOTE") => {
    setCandidates(
      candidates.map((c) => (c.studentId === studentId ? { ...c, action: newAction } : c))
    );
  };

  const toggleStudentFeeCategory = (studentId: string, category: "EXISTING" | "NEW_ADMISSION") => {
    setCandidates(
      candidates.map((c) => (c.studentId === studentId ? { ...c, targetFeeCategory: category } : c))
    );
  };

  const handleExecutePromotion = async () => {
    if (candidates.length === 0) return;
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    // Resolve target section name ("Section A" -> "A")
    const secName = targetSection.toLowerCase().includes("b") ? "B" : "A";

    // Resolve academic years (from 2025-26 to 2026-27 by default, or look them up)
    const fromAY = academicYears.find((ay) => ay.name === "2025-26") || { id: "00000000-0000-0000-0000-000000000010" };
    const toAY = academicYears.find((ay) => ay.name === "2026-27") || { id: "00000000-0000-0000-0000-000000000011" };

    // Resolve grade UUIDs from database list
    const fromGradeObj = dbGrades.find((g) => g.name.toLowerCase() === selectedGrade.toLowerCase());
    const toGradeObj = dbGrades.find((g) => g.name.toLowerCase() === targetGrade.toLowerCase());
    const toSectionObj = toGradeObj?.sections?.find((s: any) => s.name.toUpperCase() === secName);

    if (!fromGradeObj || !toGradeObj || !toSectionObj) {
      setErrorMessage(`Cannot execute rollover. Grade/Section mapping mismatch in database. Ensure "${selectedGrade}" and "${targetGrade}" Section "${secName}" exist in the system.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const payload = {
        fromAcademicYearId: fromAY.id,
        toAcademicYearId: toAY.id,
        fromGradeId: fromGradeObj.id,
        toGradeId: toGradeObj.id,
        toSectionId: toSectionObj.id,
      };

      const res = await fetch("/api/v1/promotions/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Update local storage assignments for pages that still read from it
        candidates.forEach((c) => {
          if (c.action === "PROMOTE") {
            const financials = calculateStudentFinancials({
              id: c.studentId,
              grade: selectedGrade,
              admissionCategory: (localStorage.getItem(`mvhs_student_category_${c.studentId}`) as any) || "EXISTING",
            });
            const prevOutstanding = financials.outstanding;

            localStorage.setItem(`mvhs_student_grade_${c.studentId}`, targetGrade);
            localStorage.setItem(`mvhs_student_category_${c.studentId}`, c.targetFeeCategory);
            localStorage.setItem(`mvhs_student_old_balance_${c.studentId}`, String(prevOutstanding));
          }
        });

        const promotedCount = candidates.filter((c) => c.action === "PROMOTE").length;
        const detainedCount = candidates.filter((c) => c.action === "DETAIN").length;

        setSuccessMessage(
          `Batch execution complete! ${promotedCount} student(s) promoted to ${targetGrade} (${getWingForGrade(targetGrade)} Wing) and ${detainedCount} student(s) retained in current standard.`
        );
      } else {
        const errJson = await res.json().catch(() => null);
        setErrorMessage(errJson?.message || `Failed to execute batch promotion on the database (Server Error ${res.status}).`);
      }
    } catch {
      setErrorMessage("Network error — could not reach the promotions server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <ArrowUpDown className="w-7 h-7 text-blue-600" />
          Batch Student Promotion, Rollover & Wing Transfer
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Promote, detain, or demote students between standards with automatic wing fee structure assignment (Primary 1-4 vs Secondary 5-10)
        </p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Configuration Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>Select Promotion Target & Year Rollover Configuration</span>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Current Wing: {getWingForGrade(selectedGrade)} → Target Wing: {getWingForGrade(targetGrade)}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Source Grade (2025-26)</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedGrade(val);
                if (val === "Grade 10") setTargetGrade("Graduated (Alumni / Passed Out)");
                else if (val === "Grade 9") setTargetGrade("Grade 10");
                else if (val === "Grade 8") setTargetGrade("Grade 9");
                else if (val === "Grade 7") setTargetGrade("Grade 8");
                else if (val === "Grade 6") setTargetGrade("Grade 7");
                else if (val === "Grade 5") setTargetGrade("Grade 6");
                else if (val === "Grade 4") setTargetGrade("Grade 5");
                else if (val === "Grade 3") setTargetGrade("Grade 4");
                else if (val === "Grade 2") setTargetGrade("Grade 3");
                else if (val === "Grade 1") setTargetGrade("Grade 2");
                else if (val === "Senior KG") setTargetGrade("Grade 1");
                else if (val === "Junior KG") setTargetGrade("Senior KG");
                else if (val === "Nursery") setTargetGrade("Junior KG");
              }}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="Nursery">Nursery (Pre-Primary)</option>
              <option value="Junior KG">Junior KG (Pre-Primary)</option>
              <option value="Senior KG">Senior KG (Pre-Primary)</option>
              <option value="Grade 1">Grade 1 (Primary)</option>
              <option value="Grade 2">Grade 2 (Primary)</option>
              <option value="Grade 3">Grade 3 (Primary)</option>
              <option value="Grade 4">Grade 4 (Primary)</option>
              <option value="Grade 5">Grade 5 (Secondary)</option>
              <option value="Grade 6">Grade 6 (Secondary)</option>
              <option value="Grade 7">Grade 7 (Secondary)</option>
              <option value="Grade 8">Grade 8 (Secondary)</option>
              <option value="Grade 9">Grade 9 (Secondary)</option>
              <option value="Grade 10">Grade 10 (Secondary - Passing Out)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Grade (2026-27)</label>
            <select
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="Junior KG">Junior KG (Pre-Primary)</option>
              <option value="Senior KG">Senior KG (Pre-Primary)</option>
              <option value="Grade 1">Grade 1 (Primary)</option>
              <option value="Grade 2">Grade 2 (Primary)</option>
              <option value="Grade 3">Grade 3 (Primary)</option>
              <option value="Grade 4">Grade 4 (Primary)</option>
              <option value="Grade 5">Grade 5 (Secondary - Wing Change)</option>
              <option value="Grade 6">Grade 6 (Secondary)</option>
              <option value="Grade 7">Grade 7 (Secondary)</option>
              <option value="Grade 8">Grade 8 (Secondary)</option>
              <option value="Grade 9">Grade 9 (Secondary)</option>
              <option value="Grade 10">Grade 10 (Secondary)</option>
              <option value="Graduated (Alumni / Passed Out)">🎓 Graduated / Alumni (Old Student - Passout)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Section</label>
            <select
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Target Fee Structure</label>
            <select
              value={defaultFeeCategory}
              onChange={(e) => setDefaultFeeCategory(e.target.value as any)}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="EXISTING">Existing Student Rate</option>
              <option value="NEW_ADMISSION">New Admission Rate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates Preview Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Individual Promotion & Result Decision Table</h3>
          <span className="text-xs text-slate-500 font-medium">{candidates.length} Active Candidates</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-sm font-semibold">Loading Promotion Candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No active students found in {selectedGrade}.</p>
            <p className="text-xs text-slate-400 mt-1">Admit students into this grade to execute batch promotion.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">GR Number</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Current Grade & Sec</th>
                  <th className="px-6 py-4">Carried Arrear Balance</th>
                  <th className="px-6 py-4">Fee Structure Category</th>
                  <th className="px-6 py-4 text-right">Academic Decision & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c) => (
                  <tr key={c.studentId} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{c.grNumber}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{c.fullName}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{c.currentGrade} - {c.currentSection}</td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-600">
                      {c.arrearAmount > 0 ? formatCurrency(c.arrearAmount) : "Nil (Settled)"}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={c.targetFeeCategory}
                        onChange={(e) => toggleStudentFeeCategory(c.studentId, e.target.value as any)}
                        className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
                      >
                        <option value="EXISTING">Existing Student Rate</option>
                        <option value="NEW_ADMISSION">New Admission Rate</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleStudentAction(c.studentId, "PROMOTE")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            c.action === "PROMOTE"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Promote → {targetGrade}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStudentAction(c.studentId, "DETAIN")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            c.action === "DETAIN"
                              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Keep in {c.currentGrade}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStudentAction(c.studentId, "DEMOTE")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            c.action === "DEMOTE"
                              ? "bg-red-600 text-white border-red-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Demote
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Execution Bar */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs text-slate-500 font-medium">
                Executing promotion will transfer student enrolments and assign target wing fee structure ({getWingForGrade(targetGrade)}).
              </p>
              <button
                onClick={handleExecutePromotion}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing Rollover...
                  </>
                ) : (
                  <>
                    Execute Batch Promotion & Rollover
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
