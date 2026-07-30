"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Search, Filter, Loader2, Users } from "lucide-react";
import { getStoredStudents } from "@/lib/school-store";

interface EnrolmentRecord {
  id: string;
  studentName: string;
  grNumber: string;
  academicYear: string;
  grade: string;
  section: string;
  status: string;
}

export default function EnrolmentsPage() {
  const [enrolments, setEnrolments] = useState<EnrolmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEnrolments();
  }, []);

  const fetchEnrolments = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/v1/students", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const apiRecords = (data.data || []).map((s: any) => {
          const currentGrade = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || "Grade 1";
          return {
            id: s.id,
            studentName: `${s.firstName} ${s.lastName}`,
            grNumber: s.grNumber,
            academicYear: "2026-27",
            grade: currentGrade,
            section: s.enrolments?.[0]?.section?.name || "A",
            status: s.status || "ACTIVE",
          };
        });

        // Merge with locally stored newly admitted students
        const localStudents = getStoredStudents();
        const map = new Map<string, EnrolmentRecord>();
        [...apiRecords, ...localStudents.map(s => ({
          id: s.id,
          studentName: s.fullName,
          grNumber: s.grNumber,
          academicYear: "2026-27",
          grade: localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.grade || "Grade 1",
          section: s.section,
          status: "ACTIVE",
        }))].forEach(r => map.set(r.id, r));

        setEnrolments(Array.from(map.values()));
      }
    } catch {
      setEnrolments([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <GraduationCap className="w-7 h-7 text-blue-600" />
          Academic Class Enrolments
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          View active grade and section enrolments for Academic Year 2026-27
        </p>
      </div>

      {/* Enrolments Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Enrolment Roster</h3>
          <span className="text-xs font-semibold text-slate-500">{enrolments.length} Active Records</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-sm font-semibold">Loading Class Enrolments...</p>
          </div>
        ) : enrolments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No active class enrolments found.</p>
            <p className="text-xs text-slate-400 mt-1">Admit students from Admissions to populate enrolments roster.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">GR Number</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Academic Year</th>
                <th className="px-6 py-4">Grade & Section</th>
                <th className="px-6 py-4">Enrolment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrolments.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-4 font-mono font-bold text-blue-600">{e.grNumber}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{e.studentName}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">{e.academicYear}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800">{e.grade} - {e.section}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {e.status}
                    </span>
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
