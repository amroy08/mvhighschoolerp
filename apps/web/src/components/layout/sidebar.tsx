"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  BookOpen,
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  GraduationCap,
  ClipboardList,
  ArrowUpDown,
  Import,
  Bell,
  Shield,
  Landmark,
  TrendingUp,
  Megaphone,
  Calendar,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "Students",
    icon: <Users className="w-4 h-4" />,
    children: [
      { label: "All Students", href: "/students", icon: <Users className="w-4 h-4" /> },
      { label: "Enrolments", href: "/students/enrolments", icon: <GraduationCap className="w-4 h-4" /> },
    ],
  },
  {
    label: "Admissions",
    href: "/admissions",
    icon: <UserPlus className="w-4 h-4" />,
  },
  {
    label: "Fees & Billing",
    icon: <CreditCard className="w-4 h-4" />,
    children: [
      { label: "Collect Fees", href: "/fee-collection", icon: <CreditCard className="w-4 h-4" /> },
      { label: "Fee Structures", href: "/fee-structures", icon: <ClipboardList className="w-4 h-4" /> },
      { label: "Ledger", href: "/ledger", icon: <BookOpen className="w-4 h-4" /> },
      { label: "Outstandings", href: "/outstandings", icon: <Landmark className="w-4 h-4" /> },
    ],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    label: "Promotions",
    href: "/promotions",
    icon: <ArrowUpDown className="w-4 h-4" />,
  },
  {
    label: "Imports",
    href: "/imports",
    icon: <Import className="w-4 h-4" />,
  },
  // ── Hidden for now — can re-enable later ──
  // {
  //   label: "Notices & Circulars",
  //   href: "/notices",
  //   icon: <Megaphone className="w-4 h-4" />,
  // },
  {
    label: "Academic Planner",
    href: "/planner",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: <Bell className="w-4 h-4" />,
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    label: "Masters",
    icon: <FileText className="w-4 h-4" />,
    children: [
      { label: "Grades & Sections", href: "/masters/grades", icon: <GraduationCap className="w-4 h-4" /> },
      { label: "Fee Heads", href: "/masters/fee-heads", icon: <CreditCard className="w-4 h-4" /> },
      { label: "Academic Years", href: "/masters/academic-years", icon: <BookOpen className="w-4 h-4" /> },
      { label: "Departments", href: "/masters/departments", icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    label: "Users",
    href: "/users",
    icon: <Users className="w-4 h-4" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="w-4 h-4" />,
  },
];

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const hasChildren = Boolean(item.children && item.children.length > 0);

  const isChildActive = hasChildren
    ? item.children?.some(
        (child) => child.href && (pathname === child.href || (child.href !== "/students" && pathname.startsWith(child.href + "/")))
      ) ?? false
    : false;

  const isExactActive = item.href
    ? pathname === item.href || (item.href !== "/dashboard" && item.href !== "/students" && pathname.startsWith(item.href + "/"))
    : false;

  const isActive = isExactActive || isChildActive;

  const [isOpen, setIsOpen] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [pathname, isChildActive]);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-150 group",
            isChildActive
              ? "bg-blue-50 text-blue-700 font-semibold"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <span className={cn("flex-shrink-0", isChildActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700")}>
            {item.icon}
          </span>
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200 text-slate-400",
              isOpen ? "rotate-180" : ""
            )}
          />
        </button>

        {isOpen && (
          <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5">
            {item.children!.map((child) => (
              <NavItemComponent key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-150 group",
        isExactActive
          ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <span className={cn("flex-shrink-0", isExactActive ? "text-white" : "text-slate-500 group-hover:text-slate-700")}>
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const [role, setRole] = useState<string>("Admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("mvhs_user_role") || "Admin");
    }
  }, []);

  const isClerk = role.toLowerCase().includes("clerk") || role.toLowerCase().includes("cashier");
  const isAccountant = role.toLowerCase().includes("accountant") || role.toLowerCase().includes("accounts");
  const isAuditor = role.toLowerCase().includes("auditor");

  // Dynamically filter NAV_ITEMS based on role
  const filteredNavItems = NAV_ITEMS.map((item) => {
    // If Clerk, Accountant, or Auditor, hide certain menus
    if (isClerk || isAccountant || isAuditor) {
      if (
        item.label === "Imports" ||
        item.label === "Promotions" ||
        item.label === "Audit Logs" ||
        item.label === "Masters" ||
        item.label === "Users" ||
        item.label === "Settings" ||
        item.label === "Analytics"
      ) {
        return null;
      }
    }

    if (item.children) {
      // Filter child items
      const filteredChildren = item.children.filter((child) => {
        if (isClerk && child.label === "Fee Structures") {
          return false; // Clerk cannot see or edit Fee Structures
        }
        return true;
      });
      return { ...item, children: filteredChildren };
    }

    return item;
  }).filter(Boolean) as NavItem[];

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200/80">
      {/* School Branding */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-600/30">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-slate-900 leading-tight truncate">MVHS ERP</p>
          <p className="text-xs text-slate-500 leading-tight truncate">School Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredNavItems.map((item) => (
          <NavItemComponent key={item.label} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-500 text-center font-medium">Academic Year 2026-27</p>
      </div>
    </aside>
  );
}
