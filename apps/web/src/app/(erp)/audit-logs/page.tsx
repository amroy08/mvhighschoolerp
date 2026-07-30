"use client";

import { useState } from "react";
import {
  Shield,
  Search,
  User,
  Clock,
  Filter,
  Eye,
  FileCode,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AuditLogsPage() {
  const [selectedModule, setSelectedModule] = useState("");

  const logs = [
    {
      id: "a1",
      action: "BATCH_PROMOTION_COMPLETED",
      module: "promotions",
      recordId: "46a9bd6b-26dd-40d7-87f9-d2b5e2376c53",
      user: { name: "School Admin", email: "admin@mvhighschool.edu.in" },
      createdAt: "2026-07-30T05:02:16.000Z",
      afterValues: {
        promotedCount: 1,
        targetGradeName: "Grade 2",
        targetSectionName: "A",
      },
    },
    {
      id: "a2",
      action: "PAYMENT_COLLECTED",
      module: "payments",
      recordId: "8ff55912-32c2-4381-af17-fd9a4c23df3c",
      user: { name: "School Admin", email: "admin@mvhighschool.edu.in" },
      createdAt: "2026-07-30T04:58:29.000Z",
      afterValues: {
        receiptNumber: "MVHS/2025-26/BR01/000001",
        studentName: "Aarav Sharma",
        amountReceived: "6000.00",
        paymentMode: "CASH",
      },
    },
    {
      id: "a3",
      action: "FEE_STRUCTURE_ASSIGNED",
      module: "fee_structures",
      recordId: "be91468b-7bbb-4724-94ad-34eb29450444",
      user: { name: "School Admin", email: "admin@mvhighschool.edu.in" },
      createdAt: "2026-07-30T04:54:49.000Z",
      afterValues: {
        studentName: "Aarav Sharma",
        structureName: "Grade 1 Standard Fee Structure 2026-27",
        totalChargesGenerated: 11,
      },
    },
    {
      id: "a4",
      action: "STUDENT_ADMITTED",
      module: "students",
      recordId: "64da776a-79fc-4a39-af37-b42261614230",
      user: { name: "School Admin", email: "admin@mvhighschool.edu.in" },
      createdAt: "2026-07-30T04:51:32.000Z",
      afterValues: {
        studentId: "MVHS-2026-000001",
        grNumber: "GR-001001",
        fullName: "Aarav Sharma",
        gradeName: "Grade 1",
        sectionName: "A",
      },
    },
  ];

  const filteredLogs = selectedModule
    ? logs.filter((l) => l.module === selectedModule)
    : logs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-blue-600" />
          Append-Only Security Audit Trail
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Immutable audit log tracking all system user actions, financial transactions, and configuration changes
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Modules</option>
            <option value="students">Students</option>
            <option value="payments">Payments</option>
            <option value="fee_structures">Fee Structures</option>
            <option value="promotions">Promotions</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">{filteredLogs.length} Events Recorded</span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Module</th>
              <th className="px-6 py-4">Performed By</th>
              <th className="px-6 py-4">Audit Details</th>
              <th className="px-6 py-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.module}</td>
                <td className="px-6 py-4 text-xs">
                  <p className="font-bold text-slate-900">{log.user?.name ?? "System"}</p>
                  <p className="text-slate-400">{log.user?.email}</p>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-700 max-w-xs truncate">
                  {JSON.stringify(log.afterValues)}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
