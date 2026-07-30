"use client";

export interface StudentRecordStore {
  id: string;
  grNumber: string;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  grade: string;
  section: string;
  wing: "PRE-PRIMARY" | "PRIMARY" | "SECONDARY";
  admissionCategory: "NEW_ADMISSION" | "EXISTING";
  guardianName: string;
  guardianMobile: string;
  guardianEmail?: string;
  status: string;
  totalDemand: number;
  oldBalance?: number;
}

export interface PaymentLogStore {
  srNo: number;
  id: string;
  studentId: string;
  invoiceNo: string;
  paidDate: string;
  insertedBy: string;
  amount: number;
  splitStructure: {
    admissionFees: number;
    monthlyFees: number;
    termFees: number;
    msFees: number;
  };
  transactionId: string;
  paymentMode: string;
  remarks?: string;
  grade?: string;
}

export const ALL_SCHOOL_GRADES = [
  { id: "Nursery", name: "Nursery", wing: "PRE-PRIMARY" },
  { id: "Junior KG", name: "Junior KG", wing: "PRE-PRIMARY" },
  { id: "Senior KG", name: "Senior KG", wing: "PRE-PRIMARY" },
  { id: "Grade 1", name: "Grade 1", wing: "PRIMARY" },
  { id: "Grade 2", name: "Grade 2", wing: "PRIMARY" },
  { id: "Grade 3", name: "Grade 3", wing: "PRIMARY" },
  { id: "Grade 4", name: "Grade 4", wing: "PRIMARY" },
  { id: "Grade 5", name: "Grade 5", wing: "SECONDARY" },
  { id: "Grade 6", name: "Grade 6", wing: "SECONDARY" },
  { id: "Grade 7", name: "Grade 7", wing: "SECONDARY" },
  { id: "Grade 8", name: "Grade 8", wing: "SECONDARY" },
  { id: "Grade 9", name: "Grade 9", wing: "SECONDARY" },
  { id: "Grade 10", name: "Grade 10", wing: "SECONDARY" },
] as const;

// Grade Fee Schedule Calculator according to Marwari Vidyalaya 2026-27 schedule
export function calculateGradeDemand(gradeName: string, category: "NEW_ADMISSION" | "EXISTING" = "EXISTING"): number {
  const g = gradeName.toLowerCase();
  if (g.includes("nursery") || g.includes("jr kg") || g.includes("junior kg") || g.includes("sr kg") || g.includes("senior kg") || g.includes("pre-primary")) {
    return 29500;
  }
  if (g.includes("5") || g.includes("6") || g.includes("7") || g.includes("8") || g.includes("9") || g.includes("10") || g.includes("secondary")) {
    return category === "NEW_ADMISSION" ? 31000 : 28800;
  }
  // Primary (Grades 1 to 4)
  return category === "NEW_ADMISSION" ? 25500 : 23500;
}

export function getWingForGrade(gradeName: string): "PRE-PRIMARY" | "PRIMARY" | "SECONDARY" {
  const g = gradeName.toLowerCase();
  if (g.includes("nursery") || g.includes("jr kg") || g.includes("junior kg") || g.includes("sr kg") || g.includes("senior kg") || g.includes("pre-primary")) {
    return "PRE-PRIMARY";
  }
  if (g.includes("5") || g.includes("6") || g.includes("7") || g.includes("8") || g.includes("9") || g.includes("10") || g.includes("secondary")) {
    return "SECONDARY";
  }
  return "PRIMARY";
}

// Student Persistent Storage Helpers
export function getStoredStudents(): StudentRecordStore[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("mvhs_local_students") || "[]");
}

export function saveStoredStudent(student: StudentRecordStore) {
  if (typeof window === "undefined") return;
  const list = getStoredStudents();
  const updated = [student, ...list.filter((s) => s.id !== student.id)];
  localStorage.setItem("mvhs_local_students", JSON.stringify(updated));
}

// Payment Persistent Storage Helpers
export function getStoredPayments(studentId?: string): PaymentLogStore[] {
  if (typeof window === "undefined") return [];
  const allLogs: PaymentLogStore[] = JSON.parse(localStorage.getItem("mvhs_global_payments") || "[]");
  if (studentId) {
    const studentLogs: PaymentLogStore[] = JSON.parse(localStorage.getItem(`mvhs_payments_${studentId}`) || "[]");
    const mergedMap = new Map<string, PaymentLogStore>();
    [...allLogs.filter((p) => p.studentId === studentId), ...studentLogs].forEach((p) => mergedMap.set(p.id, p));
    return Array.from(mergedMap.values());
  }
  return allLogs;
}

export function saveStoredPayment(log: PaymentLogStore) {
  if (typeof window === "undefined") return;
  const allLogs = getStoredPayments();
  const updated = [log, ...allLogs.filter((p) => p.id !== log.id)];
  localStorage.setItem("mvhs_global_payments", JSON.stringify(updated));

  const studentLogs = getStoredPayments(log.studentId);
  const updatedStudentLogs = [log, ...studentLogs.filter((p) => p.id !== log.id)];
  localStorage.setItem(`mvhs_payments_${log.studentId}`, JSON.stringify(updatedStudentLogs));
}

export function calculateStudentFinancials(student: { id: string; grade: string; admissionCategory?: "NEW_ADMISSION" | "EXISTING" }) {
  const storedCategory = (typeof window !== "undefined" && localStorage.getItem(`mvhs_student_category_${student.id}`) as any) || student.admissionCategory || "EXISTING";
  const oldBalance = (typeof window !== "undefined" && parseFloat(localStorage.getItem(`mvhs_student_old_balance_${student.id}`) || "0")) || 0;
  const gradeDemand = calculateGradeDemand(student.grade, storedCategory);
  const demand = gradeDemand + oldBalance;
  
  const payments = getStoredPayments(student.id).filter((p) => !p.grade || p.grade === student.grade);
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(0, demand - paid);
  return { demand, paid, outstanding, category: storedCategory, oldBalance };
}

