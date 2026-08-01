"use client";

import { useState, useEffect } from "react";
import {
  Users,
  IndianRupee,
  AlertTriangle,
  Percent,
  ArrowUpRight,
  TrendingUp,
  GraduationCap,
  CheckCircle2,
  Clock,
  Zap,
  BookOpen,
  BarChart3,
  UserCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  getStoredStudents,
  calculateStudentFinancials,
  getStoredPayments,
  ALL_SCHOOL_GRADES,
} from "@/lib/school-store";
import Link from "next/link";

interface GradeStats {
  grade: string;
  wing: string;
  students: number;
  demand: number;
  collected: number;
  outstanding: number;
  rate: number;
}

export default function DashboardPage() {
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [totalDemand, setTotalDemand] = useState(0);
  const [gradeStats, setGradeStats] = useState<GradeStats[]>([]);
  const [paymentModes, setPaymentModes] = useState<{ mode: string; amount: number; pct: number }[]>([]);
  const [settledCount, setSettledCount] = useState(0);
  const [defaulterCount, setDefaulterCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    setUserName(localStorage.getItem("mvhs_user_name") || "Admin");
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/v1/students", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let apiStudents: any[] = [];
      if (res.ok) {
        const data = await res.json();
        apiStudents = data.data || [];
      }

      if (res.ok && apiStudents.length === 0) {
        localStorage.removeItem("mvhs_local_students");
        localStorage.removeItem("mvhs_global_payments");
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) || "";
          if (
            key.startsWith("mvhs_payments_") ||
            key.startsWith("mvhs_student_grade_") ||
            key.startsWith("mvhs_student_category_") ||
            key.startsWith("mvhs_student_old_balance_")
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }

      const localStudents = getStoredStudents();
      const map = new Map<string, any>();
      [...apiStudents, ...localStudents].forEach((s) => map.set(s.id, s));
      const combinedStudents = Array.from(map.values());

      setActiveStudentsCount(combinedStudents.length);

      let collectedSum = 0;
      let outstandingSum = 0;
      let demandSum = 0;
      let settledCnt = 0;
      let defaulterCnt = 0;

      // Per-grade breakdown
      const gradeMap = new Map<string, GradeStats>();
      ALL_SCHOOL_GRADES.forEach((g) => {
        gradeMap.set(g.name, {
          grade: g.name,
          wing: g.wing,
          students: 0,
          demand: 0,
          collected: 0,
          outstanding: 0,
          rate: 0,
        });
      });

      combinedStudents.forEach((s) => {
        const gradeName =
          localStorage.getItem(`mvhs_student_grade_${s.id}`) ||
          s.enrolments?.[0]?.grade?.name ||
          s.grade ||
          "Grade 1";
        const category =
          (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) ||
          s.admissionCategory ||
          (s.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");
        const financials = calculateStudentFinancials({
          id: s.id,
          grade: gradeName,
          admissionCategory: category,
        });
        collectedSum += financials.paid;
        outstandingSum += financials.outstanding;
        demandSum += financials.demand;

        if (financials.outstanding <= 0) settledCnt++;
        else defaulterCnt++;

        const gs = gradeMap.get(gradeName);
        if (gs) {
          gs.students++;
          gs.demand += financials.demand;
          gs.collected += financials.paid;
          gs.outstanding += financials.outstanding;
          gs.rate = gs.demand > 0 ? parseFloat(((gs.collected / gs.demand) * 100).toFixed(1)) : 0;
          gradeMap.set(gradeName, gs);
        }
      });

      // Payment modes
      const globalPayments = getStoredPayments();
      const modeMap = new Map<string, number>();
      globalPayments.forEach((p) => {
        const mode = p.paymentMode || "CASH";
        modeMap.set(mode, (modeMap.get(mode) || 0) + p.amount);
      });
      const totalPaid = globalPayments.reduce((sum, p) => sum + p.amount, 0);
      const modes = Array.from(modeMap.entries()).map(([mode, amt]) => ({
        mode,
        amount: amt,
        pct: totalPaid > 0 ? parseFloat(((amt / totalPaid) * 100).toFixed(1)) : 0,
      }));

      setTotalCollected(collectedSum);
      setTotalOutstanding(outstandingSum);
      setTotalDemand(demandSum);
      setSettledCount(settledCnt);
      setDefaulterCount(defaulterCnt);
      setGradeStats(
        Array.from(gradeMap.values()).filter((g) => g.students > 0)
      );
      setPaymentModes(modes.length > 0 ? modes : [{ mode: "CASH", amount: 0, pct: 0 }]);
    } catch {
      const localStudents = getStoredStudents();
      setActiveStudentsCount(localStudents.length);
    } finally {
      setIsLoading(false);
    }
  };

  const collectionRate =
    totalDemand > 0 ? ((totalCollected / totalDemand) * 100).toFixed(1) : "0.0";

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good Morning"
      : now.getHours() < 17
      ? "Good Afternoon"
      : "Good Evening";

  const modeColors: Record<string, string> = {
    CASH: "bg-emerald-500",
    CARD: "bg-blue-500",
    UPI: "bg-purple-500",
    NEFT: "bg-amber-500",
    CHEQUE: "bg-rose-500",
    ONLINE: "bg-indigo-500",
  };

  return (
    <div className="space-y-7">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {greeting},{" "}
            <span className="text-blue-600">{userName.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Here is your school overview for{" "}
            <span className="font-semibold text-slate-700">Academic Year 2026-27</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Dashboard
          </span>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Full Analytics
          </Link>
        </div>
      </div>

      {/* KPI Grid — 6 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            title: "Active Students",
            value: isLoading ? "..." : activeStudentsCount.toLocaleString(),
            sub: "AY 2026-27",
            icon: <Users className="w-4 h-4 text-blue-600" />,
            bg: "bg-blue-50 border-blue-100",
            val: "text-slate-900",
          },
          {
            title: "Total Demand",
            value: isLoading ? "..." : formatCurrency(totalDemand),
            sub: "Annual fee demand",
            icon: <BookOpen className="w-4 h-4 text-indigo-600" />,
            bg: "bg-indigo-50 border-indigo-100",
            val: "text-indigo-700",
          },
          {
            title: "Fee Collected",
            value: isLoading ? "..." : formatCurrency(totalCollected),
            sub: "Settled payments",
            icon: <IndianRupee className="w-4 h-4 text-emerald-600" />,
            bg: "bg-emerald-50 border-emerald-100",
            val: "text-emerald-700",
            badge: "Live",
          },
          {
            title: "Outstanding",
            value: isLoading ? "..." : formatCurrency(totalOutstanding),
            sub: "Pending collection",
            icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
            bg: "bg-amber-50 border-amber-100",
            val: "text-amber-700",
          },
          {
            title: "Collection Rate",
            value: isLoading ? "..." : `${collectionRate}%`,
            sub: "Target: 95%",
            icon: <Percent className="w-4 h-4 text-purple-600" />,
            bg: "bg-purple-50 border-purple-100",
            val: parseFloat(collectionRate) >= 80 ? "text-emerald-700" : "text-amber-700",
          },
          {
            title: "Defaulters",
            value: isLoading ? "..." : defaulterCount.toString(),
            sub: `${settledCount} settled`,
            icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
            bg: "bg-rose-50 border-rose-100",
            val: "text-rose-700",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg ${card.bg} border flex items-center justify-center`}>
                {card.icon}
              </div>
              {card.badge && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Zap className="w-2.5 h-2.5" />
                  {card.badge}
                </span>
              )}
            </div>
            <p className={`text-lg font-bold tracking-tight ${card.val}`}>{card.value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-tight">{card.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions — immediately after KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Collect Fees", href: "/fee-collection", icon: <IndianRupee className="w-5 h-5" />, color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
          { label: "New Admission", href: "/admissions", icon: <Users className="w-5 h-5" />, color: "bg-blue-600 hover:bg-blue-700 text-white" },
          { label: "Promotions", href: "/promotions", icon: <TrendingUp className="w-5 h-5" />, color: "bg-purple-600 hover:bg-purple-700 text-white" },
          { label: "Reports", href: "/reports", icon: <BarChart3 className="w-5 h-5" />, color: "bg-slate-700 hover:bg-slate-800 text-white" },
        ].map((q, i) => (
          <Link
            key={i}
            href={q.href}
            className={`${q.color} flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-sm`}
          >
            {q.icon}
            {q.label}
          </Link>
        ))}
      </div>

      {/* Progress Bars Row */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Annual Fee Collection Progress</h3>
            <p className="text-xs text-slate-500 mt-0.5">AY 2026-27 target: ₹95% collection efficiency</p>
          </div>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${parseFloat(collectionRate) >= 80 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
            {collectionRate}% Collected
          </span>
        </div>
        <div className="space-y-4">
          {[
            { label: "Total Collected", value: totalCollected, total: totalDemand, color: "bg-emerald-500" },
            { label: "Total Outstanding", value: totalOutstanding, total: totalDemand, color: "bg-amber-500" },
          ].map((bar, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>{bar.label}</span>
                <span className="font-mono">{formatCurrency(bar.value)}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${bar.color} rounded-full transition-all duration-700`}
                  style={{ width: bar.total > 0 ? `${Math.min(100, (bar.value / bar.total) * 100).toFixed(1)}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3-col panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade-wise Breakdown Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              Grade-wise Collection Summary
            </h3>
            <Link href="/analytics" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
              Detailed Analytics <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
          ) : gradeStats.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No student data yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Grade</th>
                    <th className="px-5 py-3 text-center">Students</th>
                    <th className="px-5 py-3 text-right">Demand</th>
                    <th className="px-5 py-3 text-right">Collected</th>
                    <th className="px-5 py-3 text-right">Outstanding</th>
                    <th className="px-5 py-3 text-center">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gradeStats.map((g) => (
                    <tr key={g.grade} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${g.wing === "Primary" ? "bg-blue-500" : g.wing === "Secondary" ? "bg-purple-500" : "bg-emerald-500"}`} />
                          {g.grade}
                        </div>
                        <p className="text-slate-400 font-normal ml-4">{g.wing}</p>
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-slate-800">{g.students}</td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">{formatCurrency(g.demand)}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(g.collected)}</td>
                      <td className="px-5 py-3 text-right font-mono text-amber-700">{formatCurrency(g.outstanding)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.rate >= 80 ? "bg-emerald-50 text-emerald-700" : g.rate >= 50 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                          {g.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Payment Mode + Quick Stats */}
        <div className="space-y-5">
          {/* Payment Modes */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              Payment Channels
            </h3>
            <div className="space-y-3">
              {paymentModes.map((pm) => (
                <div key={pm.mode}>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{pm.mode}</span>
                    <span className="font-mono">{pm.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${modeColors[pm.mode] || "bg-blue-500"}`}
                      style={{ width: `${pm.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{formatCurrency(pm.amount)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Student Health */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Accounts Health
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-900">Fully Settled</span>
                </div>
                <span className="text-lg font-bold text-emerald-700">{settledCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-semibold text-rose-900">With Dues</span>
                </div>
                <span className="text-lg font-bold text-rose-700">{defaulterCount}</span>
              </div>
              {activeStudentsCount > 0 && (
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Settled Rate</span>
                    <span>{activeStudentsCount > 0 ? ((settledCount / activeStudentsCount) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: activeStudentsCount > 0 ? `${(settledCount / activeStudentsCount) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
