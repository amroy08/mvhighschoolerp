"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

const PATH_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  students: "Students",
  enrolments: "Enrolments",
  admissions: "Admissions",
  "fee-collection": "Collect Fees",
  "fee-structures": "Fee Structures",
  ledger: "Ledger",
  outstandings: "Outstandings",
  analytics: "Analytics",
  reports: "Reports",
  promotions: "Promotions",
  imports: "Imports",
  notifications: "Notifications",
  "audit-logs": "Audit Logs",
  masters: "Masters",
  grades: "Grades & Sections",
  "fee-heads": "Fee Heads",
  "academic-years": "Academic Years",
  departments: "Departments",
  users: "Users",
  settings: "Settings",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label = PATH_LABELS[segment] ?? segment;
    return { href, label };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link
        href="/dashboard"
        className="text-slate-400 hover:text-slate-700 transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>
      {crumbs.map((crumb, idx) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          {idx === crumbs.length - 1 ? (
            <span className="text-slate-900 font-semibold">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-slate-500 hover:text-slate-800 transition-colors font-medium">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
