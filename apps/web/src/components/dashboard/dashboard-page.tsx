"use client";

import {
  Users,
  TrendingDown,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Percent,
  Clock,
} from "lucide-react";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: { value: number; label: string };
  icon: React.ReactNode;
  color: string;
}

function KPICard({ label, value, sub, trend, icon, color }: KPICardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            <TrendingDown className={`w-3 h-3 ${isPositive ? "rotate-180" : ""}`} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        <p className="text-sm text-slate-400 mt-1">{label}</p>
        {trend && (
          <p className="text-xs text-slate-600 mt-0.5">{trend.label}</p>
        )}
      </div>
    </div>
  );
}

// Hardcoded from seed data — Phase 1: static placeholders from real seeded values
const KPI_SEED_DATA = {
  totalStudents: 0,      // Will come from API once students are seeded
  collectionRate: 0,
  totalCollected: 0,
  totalOutstanding: 0,
  newAdmissions: 0,
  defaulters: 0,
  concessionAmount: 0,
  pendingVerification: 0,
};

export function DashboardPage() {
  const kpi = KPI_SEED_DATA;

  const cards: KPICardProps[] = [
    {
      label: "Total Active Students",
      value: kpi.totalStudents.toLocaleString("en-IN"),
      sub: "Academic Year 2026-27",
      icon: <Users className="w-5 h-5 text-blue-400" />,
      color: "bg-blue-500/10",
    },
    {
      label: "Total Fee Collected",
      value: formatCompactCurrency(kpi.totalCollected),
      sub: "This academic year",
      trend: { value: 12.5, label: "vs last year" },
      icon: <IndianRupee className="w-5 h-5 text-emerald-400" />,
      color: "bg-emerald-500/10",
    },
    {
      label: "Total Outstanding",
      value: formatCompactCurrency(kpi.totalOutstanding),
      sub: "Pending collection",
      icon: <TrendingDown className="w-5 h-5 text-red-400" />,
      color: "bg-red-500/10",
    },
    {
      label: "Collection Rate",
      value: `${kpi.collectionRate.toFixed(1)}%`,
      sub: "Of total fee demand",
      icon: <CheckCircle2 className="w-5 h-5 text-violet-400" />,
      color: "bg-violet-500/10",
    },
    {
      label: "New Admissions",
      value: kpi.newAdmissions.toLocaleString("en-IN"),
      sub: "This academic year",
      icon: <UserPlus className="w-5 h-5 text-sky-400" />,
      color: "bg-sky-500/10",
    },
    {
      label: "Defaulters (30+ days)",
      value: kpi.defaulters.toLocaleString("en-IN"),
      sub: "Students with overdue balance",
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      color: "bg-amber-500/10",
    },
    {
      label: "Concessions Granted",
      value: formatCompactCurrency(kpi.concessionAmount),
      sub: "Total approved concessions",
      icon: <Percent className="w-5 h-5 text-pink-400" />,
      color: "bg-pink-500/10",
    },
    {
      label: "Pending Verification",
      value: kpi.pendingVerification.toLocaleString("en-IN"),
      sub: "UPI/Bank payments",
      icon: <Clock className="w-5 h-5 text-orange-400" />,
      color: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          School-wide fee collection overview for Academic Year 2026-27
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Monthly Collection Trend</h3>
          <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
            Chart will appear after fee data is imported
          </div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Grade-wise Outstanding</h3>
          <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
            Chart will appear after fee data is imported
          </div>
        </div>
      </div>

      {/* Getting started guide */}
      <div className="bg-gradient-to-br from-blue-500/10 to-violet-500/5 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-3">🚀 Getting Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Configure Masters", desc: "Set up Grades, Sections, and Fee Heads", href: "/masters/grades" },
            { step: "2", title: "Create Fee Structures", desc: "Define fee structures for each grade", href: "/fee-structures" },
            { step: "3", title: "Import Students", desc: "Import student data from old system", href: "/imports" },
          ].map((item) => (
            <a
              key={item.step}
              href={item.href}
              className="flex items-start gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
            >
              <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
