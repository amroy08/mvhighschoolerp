"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  IndianRupee,
  Users,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Download,
  GraduationCap,
  ArrowUpRight,
  Award,
  Clock,
  Zap,
  Target,
  Percent,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  getStoredPayments,
  calculateStudentFinancials,
  getStoredStudents,
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
  arrears: number;
}

interface TopDefaulter {
  name: string;
  grade: string;
  grNumber: string;
  outstanding: number;
  demand: number;
  rate: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalDemand: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    collectionRate: 0,
    totalStudents: 0,
    settledCount: 0,
    defaulterCount: 0,
    totalArrears: 0,
    paymentModes: [] as { mode: string; amount: number; percentage: number }[],
  });
  const [gradeStats, setGradeStats] = useState<GradeStats[]>([]);
  const [topDefaulters, setTopDefaulters] = useState<TopDefaulter[]>([]);
  const [wingStats, setWingStats] = useState<{ wing: string; students: number; demand: number; collected: number; rate: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setLastRefreshed(new Date());
    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/v1/students", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let allStudents: any[] = [];
      if (res.ok) {
        const data = await res.json();
        allStudents = data.data || [];
      }

      const localStudents = getStoredStudents();
      const studentMap = new Map<string, any>();
      [...allStudents, ...localStudents].forEach((s) => studentMap.set(s.id, s));
      const combinedStudents = Array.from(studentMap.values());

      let totalDemand = 0;
      let totalCollected = 0;
      let settledCnt = 0;
      let defaulterCnt = 0;
      let totalArrears = 0;

      // Grade-level breakdown
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
          arrears: 0,
        });
      });

      const defaulterList: TopDefaulter[] = [];

      combinedStudents.forEach((s) => {
        const gradeName =
          localStorage.getItem(`mvhs_student_grade_${s.id}`) ||
          s.enrolments?.[0]?.grade?.name ||
          s.grade ||
          "Grade 1";
        const category =
          (localStorage.getItem(`mvhs_student_category_${s.id}`) as any) ||
          (s.enrolments?.[0]?.admissionType === "NEW" ? "NEW_ADMISSION" : "EXISTING");
        const financials = calculateStudentFinancials({
          id: s.id,
          grade: gradeName,
          admissionCategory: category,
        });
        totalDemand += financials.demand;
        totalCollected += financials.paid;

        const oldBal = financials.oldBalance || 0;
        totalArrears += oldBal;

        if (financials.outstanding <= 0) settledCnt++;
        else {
          defaulterCnt++;
          const name = s.fullName || `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Unknown";
          defaulterList.push({
            name,
            grade: gradeName,
            grNumber: s.grNumber,
            outstanding: financials.outstanding,
            demand: financials.demand,
            rate: financials.demand > 0 ? parseFloat(((financials.paid / financials.demand) * 100).toFixed(1)) : 0,
          });
        }

        const gs = gradeMap.get(gradeName);
        if (gs) {
          gs.students++;
          gs.demand += financials.demand;
          gs.collected += financials.paid;
          gs.outstanding += financials.outstanding;
          gs.arrears += oldBal;
          gs.rate = gs.demand > 0 ? parseFloat(((gs.collected / gs.demand) * 100).toFixed(1)) : 0;
          gradeMap.set(gradeName, gs);
        }
      });

      // Sort defaulters by outstanding descending, take top 10
      defaulterList.sort((a, b) => b.outstanding - a.outstanding);
      setTopDefaulters(defaulterList.slice(0, 10));

      // Wing aggregation
      const wingMap = new Map<string, { students: number; demand: number; collected: number }>();
      gradeMap.forEach((g) => {
        if (g.students > 0) {
          const w = wingMap.get(g.wing) || { students: 0, demand: 0, collected: 0 };
          w.students += g.students;
          w.demand += g.demand;
          w.collected += g.collected;
          wingMap.set(g.wing, w);
        }
      });
      const wingArr = Array.from(wingMap.entries()).map(([wing, d]) => ({
        wing,
        students: d.students,
        demand: d.demand,
        collected: d.collected,
        rate: d.demand > 0 ? parseFloat(((d.collected / d.demand) * 100).toFixed(1)) : 0,
      }));
      setWingStats(wingArr);

      // Payment modes
      const globalPayments = getStoredPayments();
      const modeMap = new Map<string, number>();
      globalPayments.forEach((p) => {
        const mode = p.paymentMode || "CASH";
        modeMap.set(mode, (modeMap.get(mode) || 0) + p.amount);
      });
      const totalPaidGlobal = globalPayments.reduce((sum, p) => sum + p.amount, 0);
      const paymentModes = Array.from(modeMap.entries()).map(([mode, amt]) => ({
        mode,
        amount: amt,
        percentage:
          totalPaidGlobal > 0
            ? parseFloat(((amt / totalPaidGlobal) * 100).toFixed(1))
            : 0,
      }));

      const totalOutstanding = Math.max(0, totalDemand - totalCollected);
      const collectionRate =
        totalDemand > 0
          ? parseFloat(((totalCollected / totalDemand) * 100).toFixed(2))
          : 0;

      setStats({
        totalDemand,
        totalCollected,
        totalOutstanding,
        collectionRate,
        totalStudents: combinedStudents.length,
        settledCount: settledCnt,
        defaulterCount: defaulterCnt,
        totalArrears,
        paymentModes:
          paymentModes.length > 0
            ? paymentModes
            : [{ mode: "CASH", amount: 0, percentage: 0 }],
      });
      setGradeStats(Array.from(gradeMap.values()).filter((g) => g.students > 0));
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  const modeColors: Record<string, string> = {
    CASH: "bg-emerald-500",
    CARD: "bg-blue-500",
    UPI: "bg-purple-500",
    NEFT: "bg-amber-500",
    CHEQUE: "bg-rose-500",
    ONLINE: "bg-indigo-500",
  };

  const wingColors: Record<string, string> = {
    Primary: "border-l-blue-500",
    Secondary: "border-l-purple-500",
    "Pre-Primary": "border-l-emerald-500",
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-blue-600" />
            School Fee Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Comprehensive insights into fee collection, student accounts, and grade performance · AY 2026-27
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Reports
          </Link>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Fee Demand",
            value: isLoading ? "..." : formatCurrency(stats.totalDemand),
            sub: "AY 2026-27",
            icon: <Target className="w-5 h-5 text-indigo-600" />,
            bg: "bg-indigo-50",
            color: "text-indigo-700",
          },
          {
            label: "Total Collected",
            value: isLoading ? "..." : formatCurrency(stats.totalCollected),
            sub: "Settled payments",
            icon: <IndianRupee className="w-5 h-5 text-emerald-600" />,
            bg: "bg-emerald-50",
            color: "text-emerald-700",
            badge: "Live",
          },
          {
            label: "Total Outstanding",
            value: isLoading ? "..." : formatCurrency(stats.totalOutstanding),
            sub: "Pending balance",
            icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
            bg: "bg-amber-50",
            color: "text-amber-700",
          },
          {
            label: "Collection Rate",
            value: isLoading ? "..." : `${stats.collectionRate}%`,
            sub: "Target: 95%",
            icon: <Percent className="w-5 h-5 text-blue-600" />,
            bg: "bg-blue-50",
            color: stats.collectionRate >= 80 ? "text-emerald-700" : "text-amber-700",
          },
          {
            label: "Total Students",
            value: isLoading ? "..." : stats.totalStudents.toString(),
            sub: "Active enrolments",
            icon: <Users className="w-5 h-5 text-slate-600" />,
            bg: "bg-slate-100",
            color: "text-slate-800",
          },
          {
            label: "Fully Settled",
            value: isLoading ? "..." : stats.settledCount.toString(),
            sub: `${stats.totalStudents > 0 ? ((stats.settledCount / stats.totalStudents) * 100).toFixed(0) : 0}% of students`,
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
            bg: "bg-emerald-50",
            color: "text-emerald-700",
          },
          {
            label: "With Dues",
            value: isLoading ? "..." : stats.defaulterCount.toString(),
            sub: "Pending settlement",
            icon: <Clock className="w-5 h-5 text-rose-600" />,
            bg: "bg-rose-50",
            color: "text-rose-700",
          },
          {
            label: "Carried Arrears",
            value: isLoading ? "..." : formatCurrency(stats.totalArrears),
            sub: "Previous year balance",
            icon: <Award className="w-5 h-5 text-purple-600" />,
            bg: "bg-purple-50",
            color: "text-purple-700",
          },
        ].map((c, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center`}>
                {c.icon}
              </div>
              {c.badge && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Zap className="w-2.5 h-2.5" />
                  {c.badge}
                </span>
              )}
            </div>
            <p className={`text-xl font-bold tracking-tight ${c.color}`}>{c.value}</p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{c.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Collection Progress Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Annual Collection Progress</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Collected: {formatCurrency(stats.totalCollected)} &nbsp;·&nbsp; Target: {formatCurrency(stats.totalDemand)}
            </p>
          </div>
          <span
            className={`text-sm font-bold px-3 py-1 rounded-full ${
              stats.collectionRate >= 80
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {stats.collectionRate}% Collected
          </span>
        </div>
        <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
            style={{
              width:
                stats.totalDemand > 0
                  ? `${Math.min(100, (stats.totalCollected / stats.totalDemand) * 100)}%`
                  : "0%",
            }}
          />
          <div
            className="absolute top-0 h-full bg-amber-300/60 rounded-r-full transition-all duration-1000"
            style={{
              left:
                stats.totalDemand > 0
                  ? `${Math.min(100, (stats.totalCollected / stats.totalDemand) * 100)}%`
                  : "0%",
              width:
                stats.totalDemand > 0
                  ? `${Math.min(100, (stats.totalOutstanding / stats.totalDemand) * 100)}%`
                  : "0%",
            }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Collected
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 inline-block" /> Outstanding
          </span>
        </div>
      </div>

      {/* Wing Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {wingStats.map((w) => (
          <div
            key={w.wing}
            className={`bg-white border-l-4 ${wingColors[w.wing] || "border-l-blue-500"} border border-slate-200/80 rounded-2xl p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900">{w.wing} Wing</h4>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  w.rate >= 80
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {w.rate}%
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Students</span>
                <span className="font-bold text-slate-800">{w.students}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Demand</span>
                <span className="font-mono font-semibold text-slate-700">{formatCurrency(w.demand)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Collected</span>
                <span className="font-mono font-semibold text-emerald-700">{formatCurrency(w.collected)}</span>
              </div>
            </div>
            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${w.wing === "Primary" ? "bg-blue-500" : w.wing === "Secondary" ? "bg-purple-500" : "bg-emerald-500"}`}
                style={{ width: `${w.rate}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Grade-wise Detailed Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Grade-wise Detailed Breakdown
          </h3>
          <span className="text-xs text-slate-500 font-medium">{gradeStats.length} Grades with Enrolments</span>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading analytics data...</div>
        ) : gradeStats.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No student data found</p>
            <p className="text-xs text-slate-400 mt-1">Import students to view analytics</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Grade / Wing</th>
                  <th className="px-5 py-3.5 text-center">Students</th>
                  <th className="px-5 py-3.5 text-right">Total Demand</th>
                  <th className="px-5 py-3.5 text-right">Collected</th>
                  <th className="px-5 py-3.5 text-right">Outstanding</th>
                  <th className="px-5 py-3.5 text-right">Arrears</th>
                  <th className="px-5 py-3.5 text-center">Rate</th>
                  <th className="px-5 py-3.5">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gradeStats.map((g) => (
                  <tr key={g.grade} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            g.wing === "Primary"
                              ? "bg-blue-500"
                              : g.wing === "Secondary"
                              ? "bg-purple-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <div>
                          <p className="font-bold text-slate-900">{g.grade}</p>
                          <p className="text-slate-400 text-xs">{g.wing} Wing</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800 text-sm">
                      {g.students}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                      {formatCurrency(g.demand)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(g.collected)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-amber-700">
                      {formatCurrency(g.outstanding)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-purple-700">
                      {g.arrears > 0 ? formatCurrency(g.arrears) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          g.rate >= 80
                            ? "bg-emerald-50 text-emerald-700"
                            : g.rate >= 50
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {g.rate}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            g.rate >= 80
                              ? "bg-emerald-500"
                              : g.rate >= 50
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${g.rate}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <td className="px-5 py-3.5 text-slate-900 font-bold">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      TOTALS
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-900 font-bold">
                    {gradeStats.reduce((s, g) => s + g.students, 0)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-900">
                    {formatCurrency(gradeStats.reduce((s, g) => s + g.demand, 0))}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-emerald-800">
                    {formatCurrency(gradeStats.reduce((s, g) => s + g.collected, 0))}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-amber-800">
                    {formatCurrency(gradeStats.reduce((s, g) => s + g.outstanding, 0))}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-purple-800">
                    {formatCurrency(gradeStats.reduce((s, g) => s + g.arrears, 0))}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                      {stats.collectionRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5" />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two-col bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Modes */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            Collection by Payment Mode
          </h3>
          <div className="space-y-4">
            {stats.paymentModes.map((pm) => (
              <div key={pm.mode}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${modeColors[pm.mode] || "bg-blue-500"}`}
                    />
                    {pm.mode}
                  </span>
                  <span className="flex gap-3">
                    <span className="font-mono text-slate-500">{formatCurrency(pm.amount)}</span>
                    <span className="font-bold text-slate-900 w-12 text-right">{pm.percentage}%</span>
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${modeColors[pm.mode] || "bg-blue-500"}`}
                    style={{ width: `${pm.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Defaulters Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Top Pending Accounts
            </h3>
            <Link
              href="/outstandings"
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {topDefaulters.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-700">
                All accounts settled!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Grade</th>
                    <th className="px-5 py-3 text-right">Outstanding</th>
                    <th className="px-5 py-3 text-center">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topDefaulters.map((d, i) => (
                    <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-400">{i + 1}</td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900 leading-tight">{d.name}</p>
                        <p className="text-slate-400 font-mono text-xs">{d.grNumber}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-medium">{d.grade}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-amber-700">
                        {formatCurrency(d.outstanding)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            d.rate >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : d.rate >= 50
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {d.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer stamp */}
      <div className="text-center text-xs text-slate-400 font-medium py-2">
        Last refreshed: {lastRefreshed.toLocaleTimeString("en-IN")} ·{" "}
        <button onClick={fetchAnalytics} className="text-blue-500 hover:underline font-semibold">
          Refresh now
        </button>
      </div>
    </div>
  );
}
