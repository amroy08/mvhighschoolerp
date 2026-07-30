import type { Metadata } from "next";
import { ERPShell } from "@/components/layout/erp-shell";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | MVHS School ERP",
  },
};

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  return <ERPShell>{children}</ERPShell>;
}
