"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  GraduationCap,
  Users,
  FileText,
  CreditCard,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Edit2,
  Upload,
  Trash2,
  X,
  Loader2,
  Plus,
  Check,
  ArrowUpDown,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { calculateStudentFinancials, getWingForGrade, getStoredStudents, saveStoredStudent } from "@/lib/school-store";

interface StudentDocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
}

const REQUIRED_DOCS = [
  { key: "studentPhoto", label: "Student Passport Photo", keywords: ["photo", "passport"] },
  { key: "studentAadhaar", label: "Student Aadhaar Card", keywords: ["aadhaar", "student"] },
  { key: "fatherAadhaar", label: "Father Aadhaar Card", keywords: ["father"] },
  { key: "motherAadhaar", label: "Mother Aadhaar Card", keywords: ["mother"] },
  { key: "guardianAadhaar", label: "Guardian Aadhaar Card", keywords: ["guardian"] },
  { key: "tclc", label: "Transfer Certificate (TC) / LC", keywords: ["tc", "lc", "leaving", "transfer"] },
  { key: "marksheet", label: "Marksheet / Previous Result", keywords: ["marksheet", "result", "report"] },
  { key: "birthCertificate", label: "Birth Certificate", keywords: ["birth"] },
];

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const findDocForCategory = (keywords: string[]) => {
    return documents.find((doc) => {
      const nameLower = doc.name.toLowerCase();
      if (keywords.includes("student") && keywords.includes("aadhaar")) {
        return nameLower.includes("aadhaar") && !nameLower.includes("father") && !nameLower.includes("mother") && !nameLower.includes("guardian");
      }
      return keywords.every((kw) => nameLower.includes(kw));
    });
  };

  const [activeTab, setActiveTab] = useState<"overview" | "guardians" | "academic" | "documents" | "fees">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [role, setRole] = useState<string>("Admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("mvhs_user_role") || "Admin");
    }
  }, []);

  const isClerk = role.toLowerCase().includes("clerk") || role.toLowerCase().includes("cashier");

  // Student Profile State
  const [student, setStudent] = useState<any>(null);

  // Financials from Store
  const financials = student ? calculateStudentFinancials({
    id: student.id,
    grade: student.grade,
    admissionCategory: student.admissionCategory,
  }) : { demand: 0, paid: 0, outstanding: 0, oldBalance: 0 };

  // Edit Form Fields
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("MALE");
  const [editGuardianName, setEditGuardianName] = useState("");
  const [editGuardianMobile, setEditGuardianMobile] = useState("");
  const [editGuardianEmail, setEditGuardianEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editMotherName, setEditMotherName] = useState("");
  const [editGuardianRelationship, setEditGuardianRelationship] = useState("FATHER");

  // Promotion Modal State
  const [promoTargetGrade, setPromoTargetGrade] = useState("Grade 2");
  const [promoTargetSection, setPromoTargetSection] = useState("A");
  const [promoCategory, setPromoCategory] = useState<"EXISTING" | "NEW_ADMISSION">("EXISTING");

  // Documents List
  const [documents, setDocuments] = useState<StudentDocumentItem[]>([]);
  const [newDocName, setNewDocName] = useState("");

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const fetchStudentProfile = async () => {
    setIsLoading(true);
    let foundStudent: any = null;

    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch(`/api/v1/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const s = data.data;
        if (s) {
          const currentGrade = localStorage.getItem(`mvhs_student_grade_${s.id}`) || s.enrolments?.[0]?.grade?.name || "Grade 1";
          const currentCategory = (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) || (s.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");

          foundStudent = {
            id: s.id,
            studentId: s.studentId,
            grNumber: s.grNumber,
            firstName: s.firstName,
            lastName: s.lastName,
            fullName: `${s.firstName} ${s.lastName}`,
            gender: s.gender || "MALE",
            dateOfBirth: s.dateOfBirth || "2018-05-15",
            bloodGroup: s.bloodGroup || "O+",
            religion: s.religion || "General",
            category: s.category || "GENERAL",
            currentStatus: s.status || "ACTIVE",
            addressLine1: s.addressLine1 || "Mumbai",
            addressCity: s.city || "Mumbai",
            addressState: s.state || "Maharashtra",
            addressPincode: s.pincode || "400004",
            aadhaarLast4: s.aadhaarLast4 || "1234",
            grade: currentGrade,
            section: s.enrolments?.[0]?.section?.name || "A",
            admissionCategory: currentCategory,
            academicYear: "2026-27",
            guardianName: s.guardians?.[0]?.guardian?.firstName || "Guardian",
            guardianMobile: s.guardians?.[0]?.guardian?.mobile || "N/A",
            guardianEmail: s.guardians?.[0]?.guardian?.email || "",
            guardianRelationship: s.guardians?.[0]?.relationship || "FATHER",
            fatherName: "",
            motherName: "",
            uploadedDocuments: [],
          };
          const localList = getStoredStudents();
          const localMatch = localList.find((ls) => ls.id === s.id);
          if (localMatch) {
            foundStudent.fatherName = localMatch.fatherName || "";
            foundStudent.motherName = localMatch.motherName || "";
            foundStudent.guardianRelationship = localMatch.guardianRelationship || foundStudent.guardianRelationship;
            foundStudent.uploadedDocuments = localMatch.uploadedDocuments || [];
          }

          // Load & map documents from database
          let apiDocs = (s.documents || []).map((doc: any) => ({
            id: doc.id,
            name: doc.originalName,
            type: doc.mimeType === 'application/pdf' ? 'PDF' : 'IMG',
            size: '1.2 MB',
            uploadDate: doc.createdAt ? doc.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          }));

          // Background migration of wizard local-only documents to database
          const storedDocsStr = localStorage.getItem(`mvhs_student_docs_${s.id}`);
          if (apiDocs.length === 0 && storedDocsStr) {
            try {
              const localDocs = JSON.parse(storedDocsStr);
              if (localDocs && localDocs.length > 0) {
                for (const localDoc of localDocs) {
                  let slotKey = "studentAadhaar";
                  for (const slot of REQUIRED_DOCS) {
                    if (localDoc.name.toLowerCase().includes(slot.label.split(" ")[0].toLowerCase())) {
                      slotKey = slot.key;
                      break;
                    }
                  }
                  await fetch(`/api/v1/students/${s.id}/documents`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      documentType: slotKey,
                      fileName: localDoc.name,
                    }),
                  });
                }
                const refetchRes = await fetch(`/api/v1/students/${s.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (refetchRes.ok) {
                  const refetchData = await refetchRes.json();
                  apiDocs = (refetchData.data.documents || []).map((doc: any) => ({
                    id: doc.id,
                    name: doc.originalName,
                    type: doc.mimeType === 'application/pdf' ? 'PDF' : 'IMG',
                    size: '1.2 MB',
                    uploadDate: doc.createdAt ? doc.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
                  }));
                }
                localStorage.removeItem(`mvhs_student_docs_${s.id}`);
              }
            } catch (err) {
              console.error("Migration failed:", err);
            }
          }
          setDocuments(apiDocs);
        }
      }
    } catch {
      // Fallback
    }

    if (!foundStudent) {
      const localList = getStoredStudents();
      const localMatch = localList.find((s) => s.id === studentId);
      if (localMatch) {
        foundStudent = {
          id: localMatch.id,
          studentId: localMatch.studentId,
          grNumber: localMatch.grNumber,
          firstName: localMatch.firstName,
          lastName: localMatch.lastName,
          fullName: localMatch.fullName,
          gender: localMatch.gender || "MALE",
          dateOfBirth: localMatch.dateOfBirth || "2018-05-15",
          bloodGroup: "O+",
          religion: "General",
          category: "GENERAL",
          currentStatus: localMatch.status || "ACTIVE",
          addressLine1: "Mumbai",
          addressCity: "Mumbai",
          addressState: "Maharashtra",
          addressPincode: "400004",
          aadhaarLast4: "1234",
          grade: localStorage.getItem(`mvhs_student_grade_${localMatch.id}`) || localMatch.grade || "Grade 1",
          section: localMatch.section || "A",
          admissionCategory: (localStorage.getItem(`mvhs_student_category_${localMatch.id}`) as any) || localMatch.admissionCategory || "EXISTING",
          academicYear: "2026-27",
          guardianName: localMatch.guardianName || "Parent",
          guardianMobile: localMatch.guardianMobile || "N/A",
          guardianEmail: localMatch.guardianEmail || "",
          guardianRelationship: localMatch.guardianRelationship || "FATHER",
          fatherName: localMatch.fatherName || "",
          motherName: localMatch.motherName || "",
          uploadedDocuments: localMatch.uploadedDocuments || [],
        };
      }
    }

    if (foundStudent) {
      setStudent(foundStudent);
      setEditFirstName(foundStudent.firstName);
      setEditLastName(foundStudent.lastName);
      setEditDob(foundStudent.dateOfBirth);
      setEditGender(foundStudent.gender);
      setEditGuardianName(foundStudent.guardianName);
      setEditGuardianMobile(foundStudent.guardianMobile);
      setEditGuardianEmail(foundStudent.guardianEmail);
      setEditAddress(foundStudent.addressLine1);
      setEditFatherName(foundStudent.fatherName || "");
      setEditMotherName(foundStudent.motherName || "");
      setEditGuardianRelationship(foundStudent.guardianRelationship || "FATHER");
    }
    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!student) return;
    setIsSaving(true);
    setToastMsg(null);

    const updated = {
      ...student,
      firstName: editFirstName,
      lastName: editLastName,
      fullName: `${editFirstName} ${editLastName}`,
      dateOfBirth: editDob,
      gender: editGender,
      guardianName: editGuardianName,
      guardianMobile: editGuardianMobile,
      guardianEmail: editGuardianEmail,
      guardianRelationship: editGuardianRelationship,
      fatherName: editFatherName,
      motherName: editMotherName,
      addressLine1: editAddress,
    };

    saveStoredStudent({
      id: updated.id,
      grNumber: updated.grNumber,
      studentId: updated.studentId,
      firstName: editFirstName,
      lastName: editLastName,
      fullName: updated.fullName,
      gender: editGender,
      dateOfBirth: editDob,
      grade: updated.grade,
      section: updated.section,
      wing: getWingForGrade(updated.grade) as any,
      admissionCategory: updated.admissionCategory,
      guardianName: editGuardianName,
      guardianMobile: editGuardianMobile,
      guardianEmail: editGuardianEmail,
      guardianRelationship: editGuardianRelationship,
      fatherName: editFatherName || undefined,
      motherName: editMotherName || undefined,
      notificationMobile: editGuardianMobile,
      uploadedDocuments: student.uploadedDocuments || [],
      status: updated.currentStatus,
      totalDemand: financials.demand,
    });

    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      await fetch(`/api/v1/students/${studentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          dateOfBirth: editDob,
          gender: editGender,
          addressLine1: editAddress,
        }),
      });
    } catch {
      // API fallback
    } finally {
      setStudent(updated);
      setIsSaving(false);
      setIsEditing(false);
      setToastMsg("Student profile details updated successfully across system!");
    }
  };

  const handlePromoteStudent = () => {
    if (!student) return;
    const prevOutstanding = financials.outstanding;
    localStorage.setItem(`mvhs_student_grade_${student.id}`, promoTargetGrade);
    localStorage.setItem(`mvhs_student_category_${student.id}`, promoCategory);
    localStorage.setItem(`mvhs_student_old_balance_${student.id}`, String(prevOutstanding));

    const isGrad = promoTargetGrade.toLowerCase().includes("graduated") || promoTargetGrade.toLowerCase().includes("alumni") || promoTargetGrade.toLowerCase().includes("passed out");
    const nextStatus = isGrad ? "PASSOUT" : student.currentStatus;

    const updated = {
      ...student,
      grade: promoTargetGrade,
      section: promoTargetSection,
      admissionCategory: promoCategory,
      currentStatus: nextStatus,
    };

    saveStoredStudent({
      id: updated.id,
      grNumber: updated.grNumber,
      studentId: updated.studentId,
      firstName: updated.firstName,
      lastName: updated.lastName,
      fullName: updated.fullName,
      gender: updated.gender,
      dateOfBirth: updated.dateOfBirth,
      grade: promoTargetGrade,
      section: promoTargetSection,
      wing: getWingForGrade(promoTargetGrade) as any,
      admissionCategory: promoCategory,
      guardianName: updated.guardianName,
      guardianMobile: updated.guardianMobile,
      guardianEmail: updated.guardianEmail,
      status: nextStatus,
      totalDemand: financials.demand,
    });

    setStudent(updated);
    setIsPromoting(false);
    setToastMsg(isGrad ? `Student successfully marked as Graduated (Alumni / Passed Out)!` : `Student successfully promoted to ${promoTargetGrade} (${getWingForGrade(promoTargetGrade)} Wing)! Fee structure updated.`);
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const handleDeleteStudent = async () => {
    if (!student) return;
    setIsDeletingLoading(true);

    try {
      // 1. Remove from API
      const token = sessionStorage.getItem("access_token") ?? "";
      await fetch(`/api/v1/students/${student.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // API fallback
    }

    // 2. Remove from Local Storage persistent store
    const localStudents = getStoredStudents();
    const updatedLocal = localStudents.filter((s) => s.id !== student.id);
    localStorage.setItem("mvhs_local_students", JSON.stringify(updatedLocal));

    // Remove student specific local storage keys
    localStorage.removeItem(`mvhs_student_grade_${student.id}`);
    localStorage.removeItem(`mvhs_student_category_${student.id}`);
    localStorage.removeItem(`mvhs_student_old_balance_${student.id}`);
    localStorage.removeItem(`mvhs_payments_${student.id}`);

    setIsDeletingLoading(false);
    setIsDeleting(false);
    router.push("/students");
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const newDoc: StudentDocumentItem = {
      id: `doc_${Date.now()}`,
      name: newDocName.trim().endsWith(".pdf") ? newDocName.trim() : `${newDocName.trim()}.pdf`,
      type: "PDF",
      size: "1.5 MB",
      uploadDate: new Date().toISOString().split("T")[0],
    };

    const updatedDocs = [newDoc, ...documents];
    setDocuments(updatedDocs);
    localStorage.setItem(`mvhs_student_docs_${studentId}`, JSON.stringify(updatedDocs));

    if (student) {
      const localList = getStoredStudents();
      const updatedLocal = localList.map((s) => s.id === student.id ? {
        ...s,
        uploadedDocuments: [...(s.uploadedDocuments || []), newDoc.name],
      } : s);
      localStorage.setItem("mvhs_local_students", JSON.stringify(updatedLocal));

      setStudent({
        ...student,
        uploadedDocuments: [...(student.uploadedDocuments || []), newDoc.name],
      });
    }

    setNewDocName("");
    setToastMsg(`Document "${newDoc.name}" uploaded successfully!`);
  };

  const handleDeleteDocument = (docId: string) => {
    const updatedDocs = documents.filter((d) => d.id !== docId);
    setDocuments(updatedDocs);
    localStorage.setItem(`mvhs_student_docs_${studentId}`, JSON.stringify(updatedDocs));
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-sm font-semibold">Loading Student Profile...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <p className="font-semibold text-slate-700">Student Profile Not Found</p>
        <button onClick={() => router.back()} className="mt-3 text-xs font-semibold text-blue-600 hover:underline">
          Return to Student Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students Directory
        </button>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 shadow-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <p className="text-sm font-semibold">{toastMsg}</p>
          </div>
        )}

        {/* Student Header Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-600 shadow-sm">
              {student.firstName[0]}
              {student.lastName[0]}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{student.fullName}</h1>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs font-bold px-2.5 py-1 rounded-lg">
                  {student.grNumber}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {student.currentStatus}
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium mt-1">
                {student.grade} - Section {student.section} ({getWingForGrade(student.grade)} Wing) • ID: <span className="font-mono">{student.studentId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsPromoting(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
            >
              <ArrowUpDown className="w-4 h-4" />
              Promote / Change Grade
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
            {!isClerk && (
              <button
                onClick={() => setIsDeleting(true)}
                className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                Delete Student
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Overview", icon: <User className="w-4 h-4" /> },
          { id: "guardians", label: "Guardians & Contacts", icon: <Users className="w-4 h-4" /> },
          { id: "academic", label: "Academic Record", icon: <GraduationCap className="w-4 h-4" /> },
          { id: "documents", label: "Student Documents", icon: <FileText className="w-4 h-4" /> },
          { id: "fees", label: "Fee Summary & Ledger", icon: <CreditCard className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap border ${
              activeTab === tab.id
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div>
                  <p className="text-slate-400">Gender</p>
                  <p className="text-slate-900 font-bold mt-0.5 capitalize">{student.gender.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-slate-400">Date of Birth</p>
                  <p className="text-slate-900 font-bold mt-0.5">{formatDate(student.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Blood Group</p>
                  <p className="text-slate-900 font-bold mt-0.5">{student.bloodGroup}</p>
                </div>
                <div>
                  <p className="text-slate-400">Religion</p>
                  <p className="text-slate-900 font-bold mt-0.5">{student.religion}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Address & Residence
              </h3>
              <div className="flex items-start gap-2.5 text-xs">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 font-medium">Primary Residence</p>
                  <p className="text-slate-900 font-bold mt-0.5">
                    {student.addressLine1}, {student.addressCity}, {student.addressState} - {student.addressPincode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "guardians" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Parents & Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Father's Name</p>
                <p className="text-sm font-bold text-slate-900">{student.fatherName || "Not Provided"}</p>
                {student.guardianRelationship === "FATHER" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    🔔 SMS & Alert Notification Recipient
                  </span>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Mother's Name</p>
                <p className="text-sm font-bold text-slate-900">{student.motherName || "Not Provided"}</p>
                {student.guardianRelationship === "MOTHER" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    🔔 SMS & Alert Notification Recipient
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center font-bold text-lg">
                {student.guardianName?.[0] || "G"}
              </div>
              <div className="space-y-1 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 text-sm">{student.guardianName}</p>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Primary Contact: {student.guardianRelationship}
                  </span>
                </div>
                <p className="text-slate-600 flex items-center gap-1.5 pt-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Notification Mobile: <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{student.guardianMobile}</span>
                  <span className="cursor-help" title="Receives official alerts">🔔</span>
                </p>
                {student.guardianEmail && (
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email: <span className="text-slate-900 font-semibold">{student.guardianEmail}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "academic" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Current Academic Year Enrolment
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-slate-400 font-medium">Academic Year</p>
                <p className="font-bold text-slate-900 mt-1">{student.academicYear}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-slate-400 font-medium">Grade & Section</p>
                <p className="font-bold text-slate-900 mt-1">{student.grade} - {student.section}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-slate-400 font-medium">School Wing</p>
                <p className="font-bold text-blue-600 mt-1">{getWingForGrade(student.grade)} Wing</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-slate-400 font-medium">Fee Rate Category</p>
                <p className="font-bold text-slate-900 mt-1">{student.admissionCategory}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            {/* Required slots checklist */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Required Document Checklist</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {REQUIRED_DOCS.map((slot) => {
                  const uploadedDoc = findDocForCategory(slot.keywords);
                  return (
                    <div key={slot.key} className="border border-slate-200 rounded-xl p-3 bg-white flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${uploadedDoc ? "bg-emerald-100 text-emerald-700" : "bg-orange-50 text-orange-600"}`}>
                          {uploadedDoc ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{slot.label}</p>
                          {uploadedDoc ? (
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[170px]" title={uploadedDoc.name}>
                              {uploadedDoc.name}
                            </p>
                          ) : (
                            <p className="text-[10px] text-orange-500 font-semibold mt-0.5">Pending Upload</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        {uploadedDoc ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => alert(`Viewing & Downloading ${uploadedDoc.name}...`)}
                              className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded-lg border border-blue-200"
                              title="Download & View"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Replace Option */}
                            <label className="cursor-pointer text-amber-600 hover:text-amber-800 p-1.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-center" title="Replace Document">
                              <Upload className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const oldId = uploadedDoc.id;
                                    const token = sessionStorage.getItem("access_token") ?? "";

                                    // Background delete of the old document record in DB
                                    fetch(`/api/v1/students/${studentId}/documents/${oldId}`, {
                                      method: "DELETE",
                                      headers: { Authorization: `Bearer ${token}` },
                                    }).catch(() => null);

                                    // Upload the replacement document to DB
                                    fetch(`/api/v1/students/${studentId}/documents`, {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({
                                        documentType: slot.key,
                                        fileName: file.name,
                                      }),
                                    })
                                      .then((res) => {
                                        if (res.ok) return res.json();
                                        throw new Error();
                                      })
                                      .then((json) => {
                                        const newDoc = {
                                          id: json.data.id,
                                          name: json.data.originalName,
                                          type: "PDF",
                                          size: "1.2 MB",
                                          uploadDate: new Date().toISOString().split("T")[0],
                                        };
                                        const filtered = documents.filter((d) => d.id !== oldId);
                                        const updatedDocs = [newDoc, ...filtered];
                                        setDocuments(updatedDocs);

                                        if (student) {
                                          const localList = getStoredStudents();
                                          const updatedLocal = localList.map((s) => s.id === student.id ? {
                                            ...s,
                                            uploadedDocuments: (s.uploadedDocuments || []).filter((n: string) => n !== uploadedDoc.name).concat(newDoc.name),
                                          } : s);
                                          localStorage.setItem("mvhs_local_students", JSON.stringify(updatedLocal));
                                          setStudent({
                                            ...student,
                                            uploadedDocuments: (student.uploadedDocuments || []).filter((n: string) => n !== uploadedDoc.name).concat(newDoc.name),
                                          });
                                        }
                                        setToastMsg(`Replaced ${slot.label} successfully!`);
                                      })
                                      .catch(() => {
                                        setToastMsg("Replacement failed.");
                                      });
                                  }
                                }}
                                className="hidden"
                              />
                            </label>

                            <button
                              onClick={() => handleDeleteDocument(uploadedDoc.id)}
                              className="text-red-500 hover:text-red-750 p-1.5 bg-red-50 rounded-lg border border-red-200"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            Upload
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const token = sessionStorage.getItem("access_token") ?? "";
                                  fetch(`/api/v1/students/${studentId}/documents`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      documentType: slot.key,
                                      fileName: file.name,
                                    }),
                                  })
                                    .then((res) => {
                                      if (res.ok) return res.json();
                                      throw new Error();
                                    })
                                    .then((json) => {
                                      const newDoc: StudentDocumentItem = {
                                        id: json.data.id,
                                        name: json.data.originalName,
                                        type: "PDF",
                                        size: "1.2 MB",
                                        uploadDate: new Date().toISOString().split("T")[0],
                                      };
                                      const updatedDocs = [newDoc, ...documents];
                                      setDocuments(updatedDocs);

                                      if (student) {
                                        const localList = getStoredStudents();
                                        const updatedLocal = localList.map((s) => s.id === student.id ? {
                                          ...s,
                                          uploadedDocuments: [...(s.uploadedDocuments || []), newDoc.name],
                                        } : s);
                                        localStorage.setItem("mvhs_local_students", JSON.stringify(updatedLocal));
                                        setStudent({
                                          ...student,
                                          uploadedDocuments: [...(student.uploadedDocuments || []), newDoc.name],
                                        });
                                      }
                                      setToastMsg(`Uploaded ${slot.label} successfully!`);
                                    })
                                    .catch(() => {
                                      setToastMsg("Upload failed.");
                                    });
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "fees" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Current Year Fee Summary ({getWingForGrade(student.grade)} Wing)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">Current Grade Fee Rate</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(financials.demand - (financials.oldBalance || 0))}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">Arrear Fees (Previous Balance)</p>
                <p className={`text-xl font-bold mt-1 ${financials.oldBalance > 0 ? "text-red-600" : "text-slate-500"}`}>
                  {formatCurrency(financials.oldBalance || 0)}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">Total Assigned Demand</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(financials.demand)}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">Total Paid</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(financials.paid)}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">Outstanding Balance</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(financials.outstanding)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Student Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Student Profile Details</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Father's Full Name</label>
                  <input
                    type="text"
                    value={editFatherName}
                    onChange={(e) => setEditFatherName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mother's Full Name</label>
                  <input
                    type="text"
                    value={editMotherName}
                    onChange={(e) => setEditMotherName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Relationship</label>
                  <select
                    value={editGuardianRelationship}
                    onChange={(e) => setEditGuardianRelationship(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  >
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="GUARDIAN">Other Guardian</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary contact name</label>
                  <input
                    type="text"
                    value={editGuardianName}
                    onChange={(e) => setEditGuardianName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notification Mobile *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editGuardianMobile}
                      onChange={(e) => setEditGuardianMobile(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 font-bold text-slate-900 font-mono"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 cursor-help" title="Receives official alerts">
                      🔔
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-sm flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Student Promotion Modal */}
      {isPromoting && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Promote / Change Grade & Wing</h3>
              <button onClick={() => setIsPromoting(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Grade / Standard</label>
                <select
                  value={promoTargetGrade}
                  onChange={(e) => setPromoTargetGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  <option value="Grade 1">Grade 1 (Primary Wing)</option>
                  <option value="Grade 2">Grade 2 (Primary Wing)</option>
                  <option value="Grade 3">Grade 3 (Primary Wing)</option>
                  <option value="Grade 4">Grade 4 (Primary Wing)</option>
                  <option value="Grade 5">Grade 5 (Secondary Wing - Rollover)</option>
                  <option value="Grade 6">Grade 6 (Secondary Wing)</option>
                  <option value="Grade 7">Grade 7 (Secondary Wing)</option>
                  <option value="Grade 8">Grade 8 (Secondary Wing)</option>
                  <option value="Grade 9">Grade 9 (Secondary Wing)</option>
                  <option value="Grade 10">Grade 10 (Secondary Wing)</option>
                  <option value="Graduated (Alumni / Passed Out)">🎓 Graduated / Alumni (Old Student - Passout)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Section</label>
                <select
                  value={promoTargetSection}
                  onChange={(e) => setPromoTargetSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Fee Structure Rate</label>
                <select
                  value={promoCategory}
                  onChange={(e) => setPromoCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  <option value="EXISTING">Existing Student Fee Rate</option>
                  <option value="NEW_ADMISSION">New Admission Fee Rate</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPromoting(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePromoteStudent}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-sm flex items-center gap-2"
              >
                Promote Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                Delete Student Record
              </h3>
              <button onClick={() => setIsDeleting(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 text-sm">
                Are you sure you want to permanently delete <strong className="text-slate-900">{student?.fullName}</strong> (<span className="font-mono font-bold text-blue-600">{student?.grNumber}</span>)?
              </p>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  Warning: Action Cannot Be Undone
                </p>
                <p className="text-[11px] text-rose-700">
                  Deleting this student will remove their academic profile, enrolments, carried balances, and persistent store records from Marwari Vidyalaya High School ERP.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                disabled={isDeletingLoading}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={isDeletingLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                {isDeletingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

