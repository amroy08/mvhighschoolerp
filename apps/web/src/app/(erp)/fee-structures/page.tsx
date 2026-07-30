"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Lock,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LineItem {
  feeHeadId: string;
  feeHeadName: string;
  frequency: string;
  amount: number;
  instalmentNumber: number;
}

interface FeeStructure {
  id: string;
  name: string;
  academicYear: { name: string };
  section: "PRE-PRIMARY" | "PRIMARY" | "SECONDARY";
  admissionCategory: "NEW_ADMISSION" | "EXISTING";
  lines: {
    id: string;
    feeHeadId: string;
    feeHead: { name: string; code: string };
    frequency: string;
    amount: string;
    instalmentNumber: number;
  }[];
}

// Exact Official Fee Structures from Marwari Vidyalaya High School Document (2026-27)
const OFFICIAL_FEE_STRUCTURES: FeeStructure[] = [
  // 1. PRE-PRIMARY (New Admission) - Nursery, Jr KG, Sr KG
  {
    id: "fs_pre_new",
    name: "Pre-Primary Wing (Nursery / Jr KG / Sr KG) — New Admission",
    academicYear: { name: "2026-27" },
    section: "PRE-PRIMARY",
    admissionCategory: "NEW_ADMISSION",
    lines: [
      { id: "l1", feeHeadId: "fh_adm", feeHead: { name: "Admission Fees", code: "ADMISSION" }, frequency: "ONE_TIME", amount: "2000.00", instalmentNumber: 1 },
      { id: "l2", feeHeadId: "fh_mon", feeHead: { name: "Monthly Fees", code: "MONTHLY" }, frequency: "MONTHLY", amount: "1500.00", instalmentNumber: 12 },
      { id: "l3", feeHeadId: "fh_trm", feeHead: { name: "Term Fees", code: "TERM" }, frequency: "ANNUAL", amount: "3000.00", instalmentNumber: 1 },
      { id: "l4", feeHeadId: "fh_ms", feeHead: { name: "MS Fees", code: "MS" }, frequency: "ANNUAL", amount: "2000.00", instalmentNumber: 1 },
      { id: "l5", feeHeadId: "fh_kit", feeHead: { name: "School Kit", code: "KIT" }, frequency: "ANNUAL", amount: "4500.00", instalmentNumber: 1 },
    ],
  },
  // 2. PRE-PRIMARY (Existing) - Nursery, Jr KG, Sr KG
  {
    id: "fs_pre_ext",
    name: "Pre-Primary Wing (Nursery / Jr KG / Sr KG) — Existing Student",
    academicYear: { name: "2026-27" },
    section: "PRE-PRIMARY",
    admissionCategory: "EXISTING",
    lines: [
      { id: "l6", feeHeadId: "fh_adm", feeHead: { name: "Admission Fees", code: "ADMISSION" }, frequency: "ONE_TIME", amount: "2000.00", instalmentNumber: 1 },
      { id: "l7", feeHeadId: "fh_mon", feeHead: { name: "Monthly Fees", code: "MONTHLY" }, frequency: "MONTHLY", amount: "1500.00", instalmentNumber: 12 },
      { id: "l8", feeHeadId: "fh_trm", feeHead: { name: "Term Fees", code: "TERM" }, frequency: "ANNUAL", amount: "3000.00", instalmentNumber: 1 },
      { id: "l9", feeHeadId: "fh_ms", feeHead: { name: "MS Fees", code: "MS" }, frequency: "ANNUAL", amount: "2000.00", instalmentNumber: 1 },
      { id: "l10", feeHeadId: "fh_kit", feeHead: { name: "School Kit", code: "KIT" }, frequency: "ANNUAL", amount: "4500.00", instalmentNumber: 1 },
    ],
  },
  // 3. PRIMARY (New Admission) — Grade 1 to Grade 4 ONLY
  {
    id: "fs_pri_new",
    name: "Primary Wing (Grade 1 to Grade 4) — New Admission",
    academicYear: { name: "2026-27" },
    section: "PRIMARY",
    admissionCategory: "NEW_ADMISSION",
    lines: [
      { id: "l11", feeHeadId: "fh_adm", feeHead: { name: "Admission Fees", code: "ADMISSION" }, frequency: "ONE_TIME", amount: "2000.00", instalmentNumber: 1 },
      { id: "l12", feeHeadId: "fh_mon", feeHead: { name: "Monthly Fees", code: "MONTHLY" }, frequency: "MONTHLY", amount: "1500.00", instalmentNumber: 12 },
      { id: "l13", feeHeadId: "fh_trm", feeHead: { name: "Term Fees", code: "TERM" }, frequency: "BI_ANNUAL", amount: "1500.00", instalmentNumber: 2 },
      { id: "l14", feeHeadId: "fh_ms", feeHead: { name: "MS Fees", code: "MS" }, frequency: "ANNUAL", amount: "2500.00", instalmentNumber: 1 },
    ],
  },
  // 4. PRIMARY (Existing) — Grade 1 to Grade 4 ONLY
  {
    id: "fs_pri_ext",
    name: "Primary Wing (Grade 1 to Grade 4) — Existing Student",
    academicYear: { name: "2026-27" },
    section: "PRIMARY",
    admissionCategory: "EXISTING",
    lines: [
      { id: "l15", feeHeadId: "fh_mon", feeHead: { name: "Monthly Fees", code: "MONTHLY" }, frequency: "MONTHLY", amount: "1500.00", instalmentNumber: 12 },
      { id: "l16", feeHeadId: "fh_trm", feeHead: { name: "Term Fees", code: "TERM" }, frequency: "BI_ANNUAL", amount: "1500.00", instalmentNumber: 2 },
      { id: "l17", feeHeadId: "fh_ms", feeHead: { name: "MS Fees", code: "MS" }, frequency: "ANNUAL", amount: "2500.00", instalmentNumber: 1 },
    ],
  },
  // 5. SECONDARY (New Admission) — Grade 5 to Grade 10
  {
    id: "fs_sec_new",
    name: "Secondary Wing (Grade 5 to Grade 10) — New Admission",
    academicYear: { name: "2026-27" },
    section: "SECONDARY",
    admissionCategory: "NEW_ADMISSION",
    lines: [
      { id: "l18", feeHeadId: "fh_adm", feeHead: { name: "Admission Fees", code: "ADMISSION" }, frequency: "ONE_TIME", amount: "2000.00", instalmentNumber: 1 },
      { id: "l19", feeHeadId: "fh_mon", feeHead: { name: "Monthly Fees", code: "MONTHLY" }, frequency: "MONTHLY", amount: "1800.00", instalmentNumber: 12 },
      { id: "l20", feeHeadId: "fh_trm", feeHead: { name: "Term Fees", code: "TERM" }, frequency: "BI_ANNUAL", amount: "1800.00", instalmentNumber: 2 },
      { id: "l21", feeHeadId: "fh_ms", feeHead: { name: "MS Fees", code: "MS" }, frequency: "ANNUAL", amount: "3600.00", instalmentNumber: 1 },
    ],
  },
  // 6. SECONDARY (Existing) — Grade 5 to Grade 10
  {
    id: "fs_sec_ext",
    name: "Secondary Wing (Grade 5 to Grade 10) — Existing Student",
    academicYear: { name: "2026-27" },
    section: "SECONDARY",
    admissionCategory: "EXISTING",
    lines: [
      { id: "l22", feeHeadId: "fh_mon", feeHead: { name: "Monthly Fees", code: "MONTHLY" }, frequency: "MONTHLY", amount: "1800.00", instalmentNumber: 12 },
      { id: "l23", feeHeadId: "fh_trm", feeHead: { name: "Term Fees", code: "TERM" }, frequency: "BI_ANNUAL", amount: "1800.00", instalmentNumber: 2 },
      { id: "l24", feeHeadId: "fh_ms", feeHead: { name: "MS Fees", code: "MS" }, frequency: "ANNUAL", amount: "3600.00", instalmentNumber: 1 },
    ],
  },
];

export default function FeeStructuresPage() {
  const [selectedSectionTab, setSelectedSectionTab] = useState<"PRE-PRIMARY" | "PRIMARY" | "SECONDARY">("PRIMARY");
  const [structures, setStructures] = useState<FeeStructure[]>(OFFICIAL_FEE_STRUCTURES);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [structureName, setStructureName] = useState("");
  const [category, setCategory] = useState<"NEW_ADMISSION" | "EXISTING">("EXISTING");
  const [lines, setLines] = useState<LineItem[]>([
    { feeHeadId: "fh_mon", feeHeadName: "Monthly Fees", frequency: "MONTHLY", amount: 1500, instalmentNumber: 12 },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [role, setRole] = useState<string>("Admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("mvhs_user_role") || "Admin");
    }
  }, []);

  const isClerk = role.toLowerCase().includes("clerk") || role.toLowerCase().includes("cashier");

  const filteredStructures = structures.filter((s) => s.section === selectedSectionTab);

  const openCreateModal = () => {
    setEditingStructureId(null);
    setStructureName(`${selectedSectionTab} New Admission Fee Structure 2026-27`);
    setCategory("NEW_ADMISSION");
    setLines([
      { feeHeadId: "fh_adm", feeHeadName: "Admission Fees", frequency: "ONE_TIME", amount: 2000, instalmentNumber: 1 },
      { feeHeadId: "fh_mon", feeHeadName: "Monthly Fees", frequency: "MONTHLY", amount: 1500, instalmentNumber: 12 },
      { feeHeadId: "fh_trm", feeHeadName: "Term Fees", frequency: "BI_ANNUAL", amount: 1500, instalmentNumber: 2 },
      { feeHeadId: "fh_ms", feeHeadName: "MS Fees", frequency: "ANNUAL", amount: 2500, instalmentNumber: 1 },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (fs: FeeStructure) => {
    setEditingStructureId(fs.id);
    setStructureName(fs.name);
    setCategory(fs.admissionCategory);
    setLines(
      fs.lines.map((l) => ({
        feeHeadId: l.feeHeadId,
        feeHeadName: l.feeHead.name,
        frequency: l.frequency,
        amount: parseFloat(l.amount),
        instalmentNumber: l.instalmentNumber,
      }))
    );
    setIsModalOpen(true);
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        feeHeadId: "fh_custom",
        feeHeadName: "Special Fees",
        frequency: "ANNUAL",
        amount: 2000,
        instalmentNumber: 1,
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleSaveStructure = async () => {
    setIsSaving(true);
    setToastMsg(null);

    try {
      if (editingStructureId) {
        setStructures(
          structures.map((s) =>
            s.id === editingStructureId
              ? {
                  ...s,
                  name: structureName,
                  admissionCategory: category,
                  lines: lines.map((l, idx) => ({
                    id: `l_${idx}`,
                    feeHeadId: l.feeHeadId,
                    feeHead: { name: l.feeHeadName, code: l.feeHeadName.toUpperCase() },
                    frequency: l.frequency,
                    amount: l.amount.toString(),
                    instalmentNumber: l.instalmentNumber,
                  })),
                }
              : s
          )
        );
        setToastMsg(`${structureName} updated successfully!`);
      } else {
        const newStruct: FeeStructure = {
          id: `fs_${Date.now()}`,
          name: structureName,
          academicYear: { name: "2026-27" },
          section: selectedSectionTab,
          admissionCategory: category,
          lines: lines.map((l, idx) => ({
            id: `l_${idx}`,
            feeHeadId: l.feeHeadId,
            feeHead: { name: l.feeHeadName, code: l.feeHeadName.toUpperCase() },
            frequency: l.frequency,
            amount: l.amount.toString(),
            instalmentNumber: l.instalmentNumber,
          })),
        };
        setStructures([newStruct, ...structures]);
        setToastMsg(`${structureName} created successfully!`);
      }
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            Marwari Vidyalaya High School Fee Structure (2026-27)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pre-Primary (Nursery, Jr/Sr KG) • Primary (Grades 1-4) • Secondary (Grades 5-10)
          </p>
        </div>
        {!isClerk && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Create Fee Structure
          </button>
        )}
      </div>

      {toastMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <p className="text-sm font-semibold">{toastMsg}</p>
        </div>
      )}

      {/* Immutability Notice Banner */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-900">
        <Lock className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <p className="text-xs font-medium leading-relaxed">
          <span className="font-bold">Fee Immutability Rule:</span> Master fee structures reflect the official Marwari Vidyalaya High School 2026-27 schedule. Historical student fee assignments remain immutable upon allocation.
        </p>
      </div>

      {/* Section Tabs (Pre-Primary, Primary, Secondary) */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: "PRE-PRIMARY", label: "PRE-PRIMARY (Nursery, Jr KG, Sr KG)" },
            { id: "PRIMARY", label: "PRIMARY (Grades 1 to 4)" },
            { id: "SECONDARY", label: "SECONDARY (Grades 5 to 10)" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedSectionTab(tab.id as any)}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap border ${
              selectedSectionTab === tab.id
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Structure Cards List */}
      <div className="space-y-6">
        {filteredStructures.map((fs) => {
          const totalAnnual = fs.lines.reduce(
            (sum, l) => sum + parseFloat(l.amount) * (l.instalmentNumber || 1),
            0
          );

          return (
            <div key={fs.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{fs.name}</h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        fs.admissionCategory === "NEW_ADMISSION"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {fs.admissionCategory === "NEW_ADMISSION" ? "New Admission" : "Existing Student"}
                    </span>
                    {!isClerk && (
                      <button
                        onClick={() => openEditModal(fs)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Master
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Academic Year: {fs.academicYear.name} • Section: {fs.section}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">Total Annual Demand</p>
                  <p className="text-2xl font-bold text-blue-600 mt-0.5">{formatCurrency(totalAnnual)}/-</p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Fee Head Line</th>
                    <th className="px-6 py-3">Frequency</th>
                    <th className="px-6 py-3">Rate / Instalment</th>
                    <th className="px-6 py-3">Instalments Count</th>
                    <th className="px-6 py-3 font-semibold text-slate-900">Total Demand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fs.lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3.5 font-medium text-slate-900">{line.feeHead.name}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {line.frequency}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono">{formatCurrency(line.amount)}</td>
                      <td className="px-6 py-3.5 font-mono">{line.instalmentNumber} charges</td>
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                        {formatCurrency(parseFloat(line.amount) * (line.instalmentNumber || 1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Fee Structure Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStructureId ? "Edit Fee Structure Master" : "Create New Fee Structure Master"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Structure Name *</label>
                <input
                  type="text"
                  value={structureName}
                  onChange={(e) => setStructureName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Wing / Section</label>
                  <select
                    value={selectedSectionTab}
                    onChange={(e) => setSelectedSectionTab(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold"
                  >
                    <option value="PRE-PRIMARY">Pre-Primary (Nursery, Jr/Sr KG)</option>
                    <option value="PRIMARY">Primary (Grades 1 to 4)</option>
                    <option value="SECONDARY">Secondary (Grades 5 to 10)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold"
                  >
                    <option value="EXISTING">Existing Student</option>
                    <option value="NEW_ADMISSION">New Admission</option>
                  </select>
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Structure Fee Heads & Lines</h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Fee Line
                  </button>
                </div>

                {lines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex-1">
                      <label className="block text-[11px] font-medium text-slate-500">Fee Head</label>
                      <input
                        type="text"
                        value={line.feeHeadName}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].feeHeadName = e.target.value;
                          setLines(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-[11px] font-medium text-slate-500">Frequency</label>
                      <select
                        value={line.frequency}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].frequency = e.target.value;
                          setLines(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800"
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="ANNUAL">Annual</option>
                        <option value="BI_ANNUAL">Bi-Annual</option>
                        <option value="ONE_TIME">One Time</option>
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="block text-[11px] font-medium text-slate-500">Rate (₹)</label>
                      <input
                        type="number"
                        value={line.amount}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].amount = parseFloat(e.target.value) || 0;
                          setLines(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-[11px] font-medium text-slate-500">Instalments</label>
                      <input
                        type="number"
                        value={line.instalmentNumber}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].instalmentNumber = parseInt(e.target.value) || 1;
                          setLines(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="text-red-500 hover:text-red-700 p-1 mt-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStructure}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-sm flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Fee Structure"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
