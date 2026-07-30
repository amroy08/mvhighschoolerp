"use client";

import { Bell, Search, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Breadcrumb } from "./breadcrumb";

export function Header() {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState("School Admin");
  const [userEmail, setUserEmail] = useState("admin@mvhighschool.edu.in");
  const [userRole, setUserRole] = useState("Admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserName(localStorage.getItem("mvhs_user_name") || "School Admin");
      setUserEmail(localStorage.getItem("mvhs_user_email") || "admin@mvhighschool.edu.in");
      
      const roleStr = localStorage.getItem("mvhs_user_role") || "Admin";
      if (roleStr.toLowerCase().includes("cashier") || roleStr.toLowerCase().includes("clerk")) {
        setUserRole("Clerk");
      } else if (roleStr.toLowerCase().includes("accounts") || roleStr.toLowerCase().includes("accountant")) {
        setUserRole("Accountant");
      } else {
        setUserRole(roleStr);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("access_token") ?? ""}`,
        },
      });
    } finally {
      sessionStorage.removeItem("access_token");
      router.push("/login");
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <Breadcrumb />
      </div>

      {/* Centered School Name and Logo */}
      <div className="flex-1 flex justify-center items-center gap-2.5">
        <img
          src="/logo.jpeg"
          alt="MVHS Logo"
          className="w-8 h-8 rounded-lg object-cover shadow-sm border border-slate-200"
          onError={(e) => {
            // Fallback if logo is missing during local build
            e.currentTarget.style.display = "none";
          }}
        />
        <span className="hidden sm:inline font-black text-sm md:text-base text-slate-800 tracking-wider uppercase">
          Marwari Vidyalaya High School
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Academic Year Badge */}
        <div className="hidden md:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span className="text-xs font-semibold text-blue-700">AY 2026-27</span>
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-100 rounded-full transition-all group"
            aria-label="User menu"
            aria-expanded={isUserMenuOpen}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
              {userName[0]}
            </div>
            <div className="hidden md:block text-left pr-1">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{userName}</p>
              <p className="text-xs text-slate-500 leading-tight">{userRole}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-500">{userEmail}</p>
                </div>

                <div className="p-1.5">
                  <button
                    onClick={() => { setIsUserMenuOpen(false); router.push("/users/profile"); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors font-medium"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    My Profile
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); router.push("/settings"); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    Settings
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      id="logout-button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
