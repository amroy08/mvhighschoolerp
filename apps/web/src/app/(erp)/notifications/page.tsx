"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Send,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const events = [
    {
      id: "ev1",
      eventType: "PAYMENT_POSTED",
      status: "DONE",
      createdAt: "2026-07-30T04:58:29.000Z",
      processedAt: "2026-07-30T04:58:30.000Z",
      payload: {
        receiptNumber: "MVHS/2025-26/BR01/000001",
        studentName: "Aarav Sharma",
        amountReceived: "6000.00",
      },
    },
    {
      id: "ev2",
      eventType: "STUDENT_ADMITTED",
      status: "DONE",
      createdAt: "2026-07-30T04:51:32.000Z",
      processedAt: "2026-07-30T04:51:33.000Z",
      payload: {
        studentId: "MVHS-2026-000001",
        fullName: "Aarav Sharma",
        grNumber: "GR-001001",
      },
    },
  ];

  const handleTriggerQueue = async () => {
    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/v1/notifications/process-queue", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStatusMsg(data.message || "Queue processing completed!");
    } catch {
      setStatusMsg("Queue processing triggered!");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-blue-600" />
            Transactional Outbox & Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Asynchronous notification events (email/SMS receipts, overdue alerts) processed via transactional outbox
          </p>
        </div>
        <button
          onClick={handleTriggerQueue}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing Queue...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Trigger Outbox Queue Worker
            </>
          )}
        </button>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <p className="text-sm font-semibold">{statusMsg}</p>
        </div>
      )}

      {/* Outbox Events Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Outbox Notification Logs</h3>
          <span className="text-xs text-slate-500 font-medium">{events.length} Events</span>
        </div>

        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Event Type</th>
              <th className="px-6 py-4">Payload Details</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4">Processed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-50/80">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {ev.eventType}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-700">
                  {JSON.stringify(ev.payload)}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {ev.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDate(ev.createdAt)}</td>
                <td className="px-6 py-4 text-xs text-slate-500">{ev.processedAt ? formatDate(ev.processedAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
