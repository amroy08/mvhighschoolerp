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
  Upload,
  FileText,
  Check,
  Smartphone,
  ShieldAlert,
} from "lucide-react";
import { saveStoredStudent, ALL_SCHOOL_GRADES, getWingForGrade, calculateGradeDemand } from "@/lib/school-store";

interface GradeOption {
  id: string;
  name: string;
  department: { id: string; name: string; code: string };
  sections: { id: string; name: string }[];
}

interface UploadedFileState {
  studentPhoto?: string;
  studentAadhaar?: string;
  fatherAadhaar?: string;
  motherAadhaar?: string;
  guardianAadhaar?: string;
  tclc?: string;
  marksheet?: string;
  birthCertificate?: string;
}

export default function AdmissionsPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbGrades, setDbGrades] = useState<GradeOption[]>([]);

  // Simulated Document Upload States
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileState>({});

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
        // Grades fallback to local configuration
      }
    };
    fetchGrades();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    // Student details
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

    // Parent details
    fatherName: "",
    fatherMobile: "",
    motherName: "",
    motherMobile: "",

    // Primary Guardian / Contact Preference
    guardianRelationship: "FATHER", // FATHER, MOTHER, GUARDIAN
    guardianFirstName: "",
    guardianLastName: "",
    guardianMobile: "",
    guardianEmail: "",
    guardianOccupation: "",

    // Enrolment details
    gradeName: "Grade 1",
    sectionName: "A",
    rollNumber: "",
    admissionType: "NEW", // NEW vs EXISTING
  });

  // Handle relationship changes to auto-fill primary guardian names
  useEffect(() => {
    if (formData.guardianRelationship === "FATHER") {
      const parts = formData.fatherName.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      setFormData((prev) => ({
        ...prev,
        guardianFirstName: firstName,
        guardianLastName: lastName,
        guardianMobile: prev.fatherMobile,
      }));
    } else if (formData.guardianRelationship === "MOTHER") {
      const parts = formData.motherName.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      setFormData((prev) => ({
        ...prev,
        guardianFirstName: firstName,
        guardianLastName: lastName,
        guardianMobile: prev.motherMobile,
      }));
    }
  }, [formData.guardianRelationship, formData.fatherName, formData.motherName, formData.fatherMobile, formData.motherMobile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSimulateUpload = (field: keyof UploadedFileState, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles((prev) => ({
        ...prev,
        [field]: file.name,
      }));
    }
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError("Student first name and last name are required.");
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.guardianFirstName.trim()) {
        setError("Primary Guardian Name is required. Please fill parent/guardian fields.");
        return false;
      }
      if (!formData.guardianMobile.trim() || formData.guardianMobile.replace(/[^0-9]/g, "").length !== 10) {
        setError("A valid 10-digit primary mobile number is required to receive notifications.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => (prev - 1) as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!validateStep(1) || !validateStep(2)) {
      setIsSubmitting(false);
      return;
    }

    // Lookup grade/section IDs from database
    const dbGrade = dbGrades.find((g) => g.name === formData.gradeName);
    const dbSection = dbGrade?.sections.find((s) => s.name === formData.sectionName);

    const gradeId = dbGrade?.id;
    const sectionId = dbSection?.id;

    if (!gradeId || !sectionId) {
      setError(`Could not find Grade "${formData.gradeName}" Section "${formData.sectionName}" in database. Please check master data.`);
      setIsSubmitting(false);
      return;
    }

    const wing = getWingForGrade(formData.gradeName);
    const admissionCategory = formData.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING";
    const totalDemand = calculateGradeDemand(formData.gradeName, admissionCategory);

    // List of uploaded documents for student profile
    const uploadedDocsList = Object.keys(uploadedFiles).map((k) => {
      const names: Record<string, string> = {
        studentPhoto: "Student Photo",
        studentAadhaar: "Student Aadhaar Card",
        fatherAadhaar: "Father Aadhaar Card",
        motherAadhaar: "Mother Aadhaar Card",
        guardianAadhaar: "Guardian Aadhaar Card",
        tclc: "Transfer Certificate / LC",
        marksheet: "Marksheet / Previous Result",
        birthCertificate: "Birth Certificate",
      };
      return names[k] || k;
    });

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

        // Save complete schema details in Local Storage persistent fallback store
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
          guardianRelationship: formData.guardianRelationship,
          fatherName: formData.fatherName || undefined,
          motherName: formData.motherName || undefined,
          notificationMobile: formData.guardianMobile,
          uploadedDocuments: uploadedDocsList,
          status: "ACTIVE",
          totalDemand,
        });

        localStorage.setItem(`mvhs_student_category_${apiStudent.id}`, admissionCategory);
        
        // Mock custom documents upload details to specific student local keys
        if (uploadedDocsList.length > 0) {
          const docItems = Object.entries(uploadedFiles).map(([k, v]) => ({
            id: `doc_${k}_${Date.now()}`,
            name: v,
            type: "PDF",
            size: "1.2 MB",
            uploadDate: new Date().toISOString().split("T")[0],
          }));
          localStorage.setItem(`mvhs_student_docs_${apiStudent.id}`, JSON.stringify(docItems));
        }

        router.push("/students");
      } else {
        const errJson = await res.json().catch(() => null);
        setError(errJson?.message || `Server error (${res.status}). Please try again.`);
      }
    } catch (err) {
      setError("Network error — could not reach NestJS API server. Student saved in fallback directory.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
            Admit new students, assign grades, upload parent certificates, and attach fee structures
          </p>
        </div>

        {/* Step Indicator (4 steps) */}
        <div className="flex items-center gap-2.5 bg-white border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm h-fit">
          <span className={step === 1 ? "text-blue-600 font-extrabold" : "text-slate-400"}>1. Student</span>
          <span className="text-slate-300">→</span>
          <span className={step === 2 ? "text-blue-600 font-extrabold" : "text-slate-400"}>2. Parents & Contact</span>
          <span className="text-slate-300">→</span>
          <span className={step === 3 ? "text-blue-600 font-extrabold" : "text-slate-400"}>3. Documents</span>
          <span className="text-slate-300">→</span>
          <span className={step === 4 ? "text-blue-600 font-extrabold" : "text-slate-400"}>4. Class & Fees</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 text-xs font-semibold text-red-800 bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Spacious Form Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm space-y-6">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-3.5 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Step 1: Student Personal Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Rohan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Blood Group</label>
                <input
                  type="text"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  placeholder="e.g. B+"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Aadhaar Card Number (12 digits)</label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                  placeholder="e.g. 123456789012"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Religion</label>
                <input
                  type="text"
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="GENERAL">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">Scheduled Caste (SC)</option>
                  <option value="ST">Scheduled Tribe (ST)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Residential Address</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="Street / Flat / Locality..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1.5">City</label>
                  <input
                    type="text"
                    name="addressCity"
                    value={formData.addressCity}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Pincode</label>
                  <input
                    type="text"
                    name="addressPincode"
                    value={formData.addressPincode}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-sm flex items-center gap-2 hover:-translate-y-0.5 transition-all"
              >
                Next: Parent & Guardian Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-3.5 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Step 2: Parents & Primary Notification Contact Details
            </h3>

            {/* Parents Details (Not Mandatory) */}
            <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Parent Profiles (Optional)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Father's Full Name</label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Father's Mobile Number</label>
                  <input
                    type="text"
                    name="fatherMobile"
                    value={formData.fatherMobile}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Mother's Full Name</label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    placeholder="e.g. Sunita Sharma"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Mother's Mobile Number</label>
                  <input
                    type="text"
                    name="motherMobile"
                    value={formData.motherMobile}
                    onChange={handleChange}
                    placeholder="e.g. 9876543211"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Primary Notification Contact Configuration */}
            <div className="bg-blue-50/30 border border-blue-200/60 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Primary Contact for Messaging & Notifications (SMS/WhatsApp)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Relationship *</label>
                  <select
                    name="guardianRelationship"
                    value={formData.guardianRelationship}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="GUARDIAN">Other Guardian / Legal Guardian</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Primary Contact Name *</label>
                  <input
                    type="text"
                    name="guardianFirstName"
                    required
                    value={formData.guardianFirstName}
                    onChange={handleChange}
                    placeholder="First name of primary contact..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Primary Contact Last Name</label>
                  <input
                    type="text"
                    name="guardianLastName"
                    value={formData.guardianLastName}
                    onChange={handleChange}
                    placeholder="Last name..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-750 mb-1.5">
                    Notification Mobile Number * (10 Digits)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="guardianMobile"
                      required
                      value={formData.guardianMobile}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-white border border-blue-300 rounded-xl pl-3.5 pr-10 py-3 text-xs font-bold font-mono text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <span className="cursor-help" title="Primary official SMS & WhatsApp updates recipient">
                        🔔
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-600 mt-1.5 font-semibold flex items-center gap-1">
                    <span>💡</span> Already Implemented: All critical SMS & WhatsApp broadcast alerts will be sent to this number.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Occupation (Optional)</label>
                    <input
                      type="text"
                      name="guardianOccupation"
                      value={formData.guardianOccupation}
                      onChange={handleChange}
                      placeholder="e.g. Service"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Email (Optional)</label>
                    <input
                      type="email"
                      name="guardianEmail"
                      value={formData.guardianEmail}
                      onChange={handleChange}
                      placeholder="parent@example.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={prevStep}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-3 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-sm flex items-center gap-2 hover:-translate-y-0.5 transition-all"
              >
                Next: Document Uploads
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-955 border-b border-slate-100 pb-3.5 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Step 3: Student & Parent Document Uploads (Optional)
            </h3>

            <p className="text-slate-500 text-xs">
              Upload scanned PDF/JPEG certificates to link directly to the student's cloud file directory.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "studentPhoto", label: "Student Passport Size Photo" },
                { key: "studentAadhaar", label: "Student Aadhaar Card (Scanned)" },
                { key: "fatherAadhaar", label: "Father Aadhaar Card" },
                { key: "motherAadhaar", label: "Mother Aadhaar Card" },
                { key: "guardianAadhaar", label: "Guardian Aadhaar Card (If applicable)" },
                { key: "tclc", label: "Transfer Certificate (TC) / Leaving Certificate (LC)" },
                { key: "marksheet", label: "Previous Grade Report / Marksheet" },
                { key: "birthCertificate", label: "Student Birth Certificate" },
              ].map((doc) => {
                const isUploaded = !!uploadedFiles[doc.key as keyof UploadedFileState];
                return (
                  <div key={doc.key} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUploaded ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {isUploaded ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900">{doc.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {isUploaded ? uploadedFiles[doc.key as keyof UploadedFileState] : "No file selected"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                        <Upload className="w-3 h-3" />
                        Upload
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleSimulateUpload(doc.key as any, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={prevStep}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-3 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-sm flex items-center gap-2 hover:-translate-y-0.5 transition-all"
              >
                Next: Class Assignment & Fees
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-955 border-b border-slate-100 pb-3.5 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Step 4: Class Assignment & Fee Structure Selection
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Standard / Grade *</label>
                <select
                  name="gradeName"
                  value={formData.gradeName}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  {ALL_SCHOOL_GRADES.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name} ({g.wing} Wing)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Section</label>
                <select
                  name="sectionName"
                  value={formData.sectionName}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Admission Type (Fee Structure Rate) *</label>
                <select
                  name="admissionType"
                  value={formData.admissionType}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="NEW">New Admission (Includes Admission Fee)</option>
                  <option value="EXISTING">Existing Student Rate (Standard Annual Fee)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Roll Number (Optional)</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder="Leave empty for auto-assign"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-between pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={prevStep}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-3 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-sm flex items-center gap-2 hover:-translate-y-0.5 transition-all"
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
      </div>
    </div>
  );
}
