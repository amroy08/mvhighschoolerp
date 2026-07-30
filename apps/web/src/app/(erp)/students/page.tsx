"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  GraduationCap,
  Phone,
  Calendar,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ALL_SCHOOL_GRADES, getStoredStudents } from "@/lib/school-store";

interface StudentRecord {
  id: string;
  grNumber: string;
  studentId: string;
  fullName: string;
  gender: string;
  grade: string;
  section: string;
  guardianName: string;
  guardianMobile: string;
  dob: string;
  status: string;
}

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch(`/api/v1/students?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let apiStudents: StudentRecord[] = [];
      if (res.ok) {
        const data = await res.json();
        apiStudents = (data.data || []).map((s: any) => {
          const currentGrade = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || "Grade 1";
          return {
            id: s.id,
            grNumber: s.grNumber,
            studentId: s.studentId,
            fullName: `${s.firstName} ${s.lastName}`,
            gender: s.gender || "MALE",
            grade: currentGrade,
            section: s.enrolments?.[0]?.section?.name || "A",
            guardianName: s.guardians?.[0]?.guardian
              ? `${s.guardians[0].guardian.firstName} ${s.guardians[0].guardian.lastName || ""}`
              : "Guardian",
            guardianMobile: s.guardians?.[0]?.guardian?.mobile || "N/A",
            dob: s.dateOfBirth || "2018-05-15",
            status: s.status || "ACTIVE",
          };
        });

        // Auto-sync clean/purged database state to local storage
        if (search.trim() === "" && apiStudents.length === 0) {
          localStorage.removeItem("mvhs_local_students");
          localStorage.removeItem("mvhs_global_payments");
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) || "";
            if (key.startsWith("mvhs_payments_") || key.startsWith("mvhs_student_grade_") || key.startsWith("mvhs_student_category_") || key.startsWith("mvhs_student_old_balance_")) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        }
      }

      const localStudents = getStoredStudents();
      const map = new Map<string, StudentRecord>();
      [...apiStudents, ...localStudents.map(s => ({
        id: s.id,
        grNumber: s.grNumber,
        studentId: s.studentId,
        fullName: s.fullName,
        gender: s.gender,
        grade: localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.grade || "Grade 1",
        section: s.section,
        guardianName: s.guardianName,
        guardianMobile: s.guardianMobile,
        dob: s.dateOfBirth,
        status: s.status,
      }))].forEach(r => map.set(r.id, r));

      setStudents(Array.from(map.values()));
    } catch {
      const localStudents = getStoredStudents();
      setStudents(localStudents as any);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    const matchSearch = search.trim() === "" ||
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.grNumber.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "ALL" || s.grade.toLowerCase() === gradeFilter.toLowerCase();
    return matchSearch && matchGrade;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            Student Directory
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage student admissions, profiles, and class enrolments
          </p>
        </div>
        <Link
          href="/admissions"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
        >
          <UserPlus className="w-4 h-4" />
          New Admission
        </Link>
      </div>

      {/* Filter Bar with Every Standard */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, GR number..."
            className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-semibold focus:outline-none"
          >
            <option value="ALL">All Standards / Grades</option>
            {ALL_SCHOOL_GRADES.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name} ({g.wing} Wing)
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
            {filtered.length} Enrolled Students
          </span>
        </div>
      </div>

      {/* Student Directory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-sm font-semibold">Loading Student Directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No student records found for selected filter.</p>
            <p className="text-xs text-slate-400 mt-1">Click "New Admission" to admit a student into Marwari Vidyalaya High School.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 min-w-[820px]">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap w-36">GR Number</th>
                  <th className="px-4 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5 whitespace-nowrap w-36">Grade &amp; Section</th>
                  <th className="px-4 py-3.5">Guardian Info</th>
                  <th className="px-4 py-3.5 whitespace-nowrap w-28">DOB</th>
                  <th className="px-4 py-3.5 w-24">Status</th>
                  <th className="px-4 py-3.5 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* GR Number — fixed width, no wrap */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 inline-block">
                        {s.grNumber}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-1 truncate max-w-[130px]">{s.studentId}</p>
                    </td>

                    {/* Student Name */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900 leading-tight">{s.fullName}</p>
                      <p className="text-xs text-slate-500 font-normal mt-0.5">{s.gender}</p>
                    </td>

                    {/* Grade & Section — single row, no wrap */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        <GraduationCap className="w-3 h-3 text-blue-600 flex-shrink-0" />
                        <span className="whitespace-nowrap">{s.grade} · Sec {s.section}</span>
                      </span>
                    </td>

                    {/* Guardian */}
                    <td className="px-4 py-3.5 text-xs">
                      <p className="font-medium text-slate-900 leading-tight">{s.guardianName}</p>
                      <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="font-mono">{s.guardianMobile}</span>
                      </p>
                    </td>

                    {/* DOB */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 font-mono whitespace-nowrap">
                      {formatDate(s.dob)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        s.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {s.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/students/${s.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
