"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  Users,
  User,
  CreditCard,
} from "lucide-react";
import { saveStoredStudent, ALL_SCHOOL_GRADES, getWingForGrade, calculateGradeDemand } from "@/lib/school-store";

interface GradeOption {
  id: string;
  name: string;
  department: { id: string; name: string; code: string };
  sections: { id: string; name: string }[];
}

export default function AdmissionsPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbGrades, setDbGrades] = useState<GradeOption[]>([]);

  // Fetch grades from DB on mount
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const token = sessionStorage.getItem("access_token") ?? "";
        const res = await fetch("/api/v1/grades", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setDbGrades(json.data || []);
        }
      } catch {
        // Grades will use fallback ALL_SCHOOL_GRADES for display
      }
    };
    fetchGrades();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    // Student
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "MALE",
    dateOfBirth: "2018-05-15",
    bloodGroup: "O+",
    religion: "Hinduism",
    category: "GENERAL",
    addressLine1: "Marwari Lane, Opera House",
    addressCity: "Mumbai",
    addressState: "Maharashtra",
    addressPincode: "400004",
    aadhaarNumber: "",
    // Enrolment
    gradeName: "Grade 1",
    sectionName: "A",
    rollNumber: "",
    admissionType: "NEW", // NEW vs EXISTING
    // Primary Guardian
    guardianFirstName: "",
    guardianLastName: "",
    guardianRelationship: "FATHER",
    guardianMobile: "",
    guardianEmail: "",
    guardianOccupation: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("Student first name and last name are required.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.guardianFirstName.trim()) {
      setError("Guardian first name is required.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.guardianMobile.trim() || formData.guardianMobile.replace(/[^0-9]/g, "").length !== 10) {
      setError("A valid 10-digit mobile number is required for the guardian.");
      setIsSubmitting(false);
      return;
    }

    // Lookup grade/section IDs from DB data
    const dbGrade = dbGrades.find((g) => g.name === formData.gradeName);
    const dbSection = dbGrade?.sections.find((s) => s.name === formData.sectionName);

    const gradeId = dbGrade?.id;
    const sectionId = dbSection?.id;

    if (!gradeId || !sectionId) {
      setError(`Could not find Grade "${formData.gradeName}" Section "${formData.sectionName}" in the database. Please contact admin.`);
      setIsSubmitting(false);
      return;
    }

    const wing = getWingForGrade(formData.gradeName);
    const admissionCategory = formData.admissionType === "NEW" ? ("NEW_ADMISSION" as const) : ("EXISTING" as const);
    const totalDemand = calculateGradeDemand(formData.gradeName, admissionCategory);

    try {
      const payload = {
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        bloodGroup: formData.bloodGroup || undefined,
        religion: formData.religion || undefined,
        category: formData.category || undefined,
        addressLine1: formData.addressLine1 || undefined,
        addressCity: formData.addressCity,
        addressState: formData.addressState,
        addressPincode: formData.addressPincode,
        aadhaarNumber: formData.aadhaarNumber || undefined,
        gradeId,
        sectionId,
        rollNumber: formData.rollNumber || undefined,
        admissionType: formData.admissionType,
        primaryGuardian: {
          firstName: formData.guardianFirstName,
          lastName: formData.guardianLastName || undefined,
          relationship: formData.guardianRelationship,
          mobile: formData.guardianMobile,
          email: formData.guardianEmail || undefined,
          occupation: formData.guardianOccupation || undefined,
          address: `${formData.addressLine1}, ${formData.addressCity}`,
        },
      };

      const token = sessionStorage.getItem("access_token") ?? "";

      const res = await fetch("/api/v1/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const apiStudent = json.data;

        // Also save to localStorage for pages that still read from it
        saveStoredStudent({
          id: apiStudent.id,
          grNumber: apiStudent.grNumber,
          studentId: apiStudent.studentId,
          firstName: apiStudent.firstName,
          lastName: apiStudent.lastName,
          fullName: apiStudent.fullName,
          gender: apiStudent.gender,
          dateOfBirth: formData.dateOfBirth,
          grade: formData.gradeName,
          section: formData.sectionName,
          wing,
          admissionCategory,
          guardianName: `${formData.guardianFirstName} ${formData.guardianLastName}`.trim(),
          guardianMobile: formData.guardianMobile,
          guardianEmail: formData.guardianEmail,
          status: "ACTIVE",
          totalDemand,
        });

        // Store category for financial calculations
        localStorage.setItem(`mvhs_student_category_${apiStudent.id}`, admissionCategory);

        router.push("/students");
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.message || `Server error (${res.status}). Please try again.`;
        setError(errMsg);
      }
    } catch (err) {
      setError("Network error — could not reach the server. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Student Directory
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserPlus className="w-7 h-7 text-blue-600" />
            New Student Admission Wizard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Admit new students, assign grades, and automatically attach fee structures
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 bg-white border border-slate-200/80 px-4 py-2 rounded-xl text-xs shadow-sm h-fit">
          <span className={step === 1 ? "text-blue-600 font-bold" : "text-slate-400"}>1. Student</span>
          <span className="text-slate-300">•</span>
          <span className={step === 2 ? "text-blue-600 font-bold" : "text-slate-400"}>2. Guardian</span>
          <span className="text-slate-300">•</span>
          <span className={step === 3 ? "text-blue-600 font-bold" : "text-slate-400"}>3. Class & Fees</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Steps */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Step 1: Student Personal Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Rohan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <input
                  type="text"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  placeholder="e.g. B+"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="Street / Flat / Colony..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City / Pincode</label>
                <input
                  type="text"
                  name="addressCity"
                  value={formData.addressCity}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                Next: Guardian Info
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Step 2: Primary Guardian Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guardian First Name *</label>
                <input
                  type="text"
                  name="guardianFirstName"
                  required
                  value={formData.guardianFirstName}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guardian Last Name</label>
                <input
                  type="text"
                  name="guardianLastName"
                  value={formData.guardianLastName}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relationship *</label>
                <select
                  name="guardianRelationship"
                  value={formData.guardianRelationship}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="GUARDIAN">Guardian</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  name="guardianMobile"
                  required
                  value={formData.guardianMobile}
                  onChange={handleChange}
                  placeholder="10-digit mobile..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold font-mono text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="guardianEmail"
                  value={formData.guardianEmail}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                Next: Class & Fee Structure
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              Step 3: Class Assignment & Fee Structure Selection
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard / Grade *</label>
                <select
                  name="gradeName"
                  value={formData.gradeName}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  {ALL_SCHOOL_GRADES.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name} ({g.wing} Wing)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Section</label>
                <select
                  name="sectionName"
                  value={formData.sectionName}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admission Type (Fee Structure Rate) *</label>
              <select
                name="admissionType"
                value={formData.admissionType}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
              >
                <option value="NEW">New Admission (Includes Admission Fee)</option>
                <option value="EXISTING">Existing Student Rate (Standard Annual Fee)</option>
              </select>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Admitting Student...
                  </>
                ) : (
                  <>
                    Complete Admission & Issue Fee Structure
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
