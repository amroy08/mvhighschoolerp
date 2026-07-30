"use client";

import { CreditCard, Plus } from "lucide-react";

export default function MastersFeeHeadsPage() {
  const feeHeads = [
    { code: "TUITION", name: "Tuition Fee", isRefundable: false },
    { code: "DEVELOPMENT", name: "Development Fee", isRefundable: false },
    { code: "TERM", name: "Term Fee", isRefundable: false },
    { code: "COMPUTER", name: "Computer Fee", isRefundable: false },
    { code: "ARREAR", name: "Arrear Fee", isRefundable: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <CreditCard className="w-7 h-7 text-blue-600" />
          Fee Heads Master
        </h1>
        <p className="text-slate-500 text-sm mt-1">Configure revenue fee heads and financial GL ledger accounts</p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Fee Code</th>
              <th className="px-6 py-4">Fee Head Name</th>
              <th className="px-6 py-4">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {feeHeads.map((f) => (
              <tr key={f.code} className="hover:bg-slate-50/80">
                <td className="px-6 py-4 font-mono font-bold text-blue-600">{f.code}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{f.name}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-600">Standard Revenue Head</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
