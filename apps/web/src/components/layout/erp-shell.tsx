"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function ERPShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-200/80 bg-white">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
