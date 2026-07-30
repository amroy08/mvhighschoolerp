"use client";

import { useState, useEffect, useRef } from "react";
import {
  BellRing,
  Plus,
  X,
  Upload,
  FileText,
  MessageSquare,
  Send,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  ChevronDown,
  AlertCircle,
  Megaphone,
  CheckSquare,
  Square,
  Filter,
} from "lucide-react";
import { ALL_SCHOOL_GRADES, getStoredStudents } from "@/lib/school-store";

interface Notice {
  id: string;
  title: string;
  description: string;
  type: "TEXT" | "PDF";
  pdfName?: string;
  pdfUrl?: string;
  targetScope: "ALL" | "WINGS" | "GRADES" | "CUSTOM";
  selectedWings?: string[];
  selectedGrades?: string[];
  selectedStudentIds?: string[];
  recipientCount: number;
  createdAt: string;
  status: "DRAFT" | "SENT";
  broadcastCount: number;
}

const WINGS = [
  { id: "PRE-PRIMARY", label: "Pre-Primary (Nursery, Jr KG, Sr KG)" },
  { id: "PRIMARY", label: "Primary (Grades 1–4)" },
  { id: "SECONDARY", label: "Secondary (Grades 5–10)" },
];

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [broadcastModal, setBroadcastModal] = useState<Notice | null>(null);

  // Form state
  const [noticeType, setNoticeType] = useState<"TEXT" | "PDF">("TEXT");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string>("");

  // Target scope & selection state
  const [targetScope, setTargetScope] = useState<"ALL" | "WINGS" | "GRADES" | "CUSTOM">("ALL");
  const [selectedWings, setSelectedWings] = useState<string[]>(["PRIMARY", "SECONDARY"]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>(["Grade 1"]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const [isPublishing, setIsPublishing] = useState(false);
  const [broadcastIndex, setBroadcastIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load notices from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("mvhs_notices");
    if (stored) {
      setNotices(JSON.parse(stored));
    }
  }, []);

  const saveNotices = (list: Notice[]) => {
    setNotices(list);
    localStorage.setItem("mvhs_notices", JSON.stringify(list));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPdfDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Multi-select Wing Toggles
  const toggleWing = (wingId: string) => {
    if (selectedWings.includes(wingId)) {
      if (selectedWings.length > 1) {
        setSelectedWings(selectedWings.filter((w) => w !== wingId));
      }
    } else {
      setSelectedWings([...selectedWings, wingId]);
    }
  };

  // Multi-select Grade Toggles
  const toggleGrade = (gradeName: string) => {
    if (selectedGrades.includes(gradeName)) {
      if (selectedGrades.length > 1) {
        setSelectedGrades(selectedGrades.filter((g) => g !== gradeName));
      }
    } else {
      setSelectedGrades([...selectedGrades, gradeName]);
    }
  };

  // Calculate matching students for target
  const getMatchingStudents = () => {
    const all = getStoredStudents();
    if (targetScope === "ALL") return all;
    if (targetScope === "WINGS") {
      return all.filter((s) => selectedWings.includes(s.wing));
    }
    if (targetScope === "GRADES") {
      return all.filter((s) => selectedGrades.includes(s.grade));
    }
    // CUSTOM
    if (selectedStudentIds.length === 0) return all;
    return all.filter((s) => selectedStudentIds.includes(s.id));
  };

  const matchingStudents = getMatchingStudents();

  // Get matching students for a saved notice
  const getNoticeStudents = (notice: Notice) => {
    const all = getStoredStudents();
    if (notice.targetScope === "ALL") return all;
    if (notice.targetScope === "WINGS" && notice.selectedWings) {
      return all.filter((s) => notice.selectedWings?.includes(s.wing));
    }
    if (notice.targetScope === "GRADES" && notice.selectedGrades) {
      return all.filter((s) => notice.selectedGrades?.includes(s.grade));
    }
    if (notice.targetScope === "CUSTOM" && notice.selectedStudentIds) {
      return all.filter((s) => notice.selectedStudentIds?.includes(s.id));
    }
    return all;
  };

  const handlePublish = () => {
    if (!title.trim()) return;
    if (noticeType === "PDF" && !pdfFile) return;

    setIsPublishing(true);
    setTimeout(() => {
      const newNotice: Notice = {
        id: `notice_${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        type: noticeType,
        pdfName: pdfFile?.name,
        pdfUrl: pdfDataUrl || undefined,
        targetScope,
        selectedWings: targetScope === "WINGS" ? selectedWings : undefined,
        selectedGrades: targetScope === "GRADES" ? selectedGrades : undefined,
        selectedStudentIds: targetScope === "CUSTOM" ? selectedStudentIds : undefined,
        recipientCount: matchingStudents.length,
        createdAt: new Date().toISOString(),
        status: "DRAFT",
        broadcastCount: 0,
      };
      const updated = [newNotice, ...notices];
      saveNotices(updated);
      setIsPublishing(false);
      setShowModal(false);
      resetForm();
    }, 800);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPdfFile(null);
    setPdfDataUrl("");
    setNoticeType("TEXT");
    setTargetScope("ALL");
    setSelectedWings(["PRIMARY", "SECONDARY"]);
    setSelectedGrades(["Grade 1"]);
    setSelectedStudentIds([]);
    setStudentSearch("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteNotice = (id: string) => {
    saveNotices(notices.filter((n) => n.id !== id));
  };

  // Open broadcast modal
  const openBroadcast = (notice: Notice) => {
    setBroadcastModal(notice);
    setBroadcastIndex(0);
  };

  // Send next student in WhatsApp broadcast
  const sendNextWhatsApp = (notice: Notice, students: ReturnType<typeof getNoticeStudents>) => {
    const student = students[broadcastIndex];
    if (!student) return;

    const guardianMobileStr =
      student.guardianMobile ||
      (student as any).primaryGuardian?.mobile ||
      (student as any).guardians?.[0]?.guardian?.mobile ||
      (student as any).contactNumber ||
      (student as any).mobile ||
      (student as any).phone ||
      "";
    const rawPhone = guardianMobileStr.replace(/[^0-9]/g, "");
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    const pdfLine = notice.pdfName
      ? `\n📎 Circular Attachment: ${notice.pdfName}`
      : "";

    const msg =
      `📢 *${notice.title}*\n\n` +
      `Dear Parent of *${student.fullName}* (${student.grNumber}, ${student.grade} - Sec ${student.section}),\n\n` +
      `${notice.description}` +
      pdfLine +
      `\n\n— Marwari Vidyalaya High School Administration`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");

    const nextIndex = broadcastIndex + 1;
    setBroadcastIndex(nextIndex);

    if (nextIndex >= students.length) {
      const updated = notices.map((n) =>
        n.id === notice.id
          ? { ...n, status: "SENT" as const, broadcastCount: students.length }
          : n
      );
      saveNotices(updated);
    }
  };

  const targetLabel = (n: Notice) => {
    if (n.targetScope === "ALL") return "All Students";
    if (n.targetScope === "WINGS" && n.selectedWings) return n.selectedWings.join(" & ") + " Wings";
    if (n.targetScope === "GRADES" && n.selectedGrades) return n.selectedGrades.join(", ");
    return "Selected Students";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-violet-600" />
            Notices &amp; Circulars
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Publish school announcements &amp; circulars with multi-wing/grade selection and WhatsApp broadcast
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New Notice / Circular
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Published Notices</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{notices.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Sent &amp; Broadcast</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {notices.filter((n) => n.status === "SENT").length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Drafts Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {notices.filter((n) => n.status === "DRAFT").length}
          </p>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {notices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-700">No Notices Published Yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Click "Create New Notice / Circular" to publish an announcement.
            </p>
          </div>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      n.type === "PDF"
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : "bg-violet-50 text-violet-600 border border-violet-100"
                    }`}
                  >
                    {n.type === "PDF" ? <FileText className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          n.status === "SENT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {n.status === "SENT" ? "✓ SENT" : "⏳ DRAFT"}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        {n.type === "PDF" ? "📎 PDF Circular" : "📝 Text Notice"}
                      </span>
                    </div>

                    {n.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.description}</p>
                    )}
                    {n.pdfName && (
                      <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {n.pdfName}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Users className="w-3 h-3 text-violet-500" /> Target: {targetLabel(n)} ({n.recipientCount} Students)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      {n.broadcastCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> {n.broadcastCount} WhatsApp sent
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openBroadcast(n)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Broadcast WhatsApp
                  </button>
                  <button
                    onClick={() => deleteNotice(n.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─────────────── CREATE NOTICE MODAL ─────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4.5 h-4.5 text-violet-600" />
                Create New Notice / Circular
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Step 1: Notice Type */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  1. Choose Notice Type
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNoticeType("TEXT")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      noticeType === "TEXT"
                        ? "border-violet-500 bg-violet-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <MessageSquare
                      className={`w-5 h-5 ${noticeType === "TEXT" ? "text-violet-600" : "text-slate-400"}`}
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-900">Text Announcement</p>
                      <p className="text-xs text-slate-400">Write text message directly</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoticeType("PDF")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      noticeType === "PDF"
                        ? "border-rose-500 bg-rose-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <FileText
                      className={`w-5 h-5 ${noticeType === "PDF" ? "text-rose-600" : "text-slate-400"}`}
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-900">PDF Circular Upload</p>
                      <p className="text-xs text-slate-400">Upload PDF document (.pdf)</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Notice Content */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  2. Notice Details
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Notice Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Diwali Vacation Circular 2026-27"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {noticeType === "PDF" ? "Description / Circular Notes (Optional)" : "Notice Message *"}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder={
                        noticeType === "PDF"
                          ? "Write brief notes regarding this circular..."
                          : "Write full notice message to send to parents..."
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 placeholder:text-slate-400 resize-none"
                    />
                  </div>

                  {noticeType === "PDF" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Upload PDF Document *
                      </label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                          pdfFile
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50"
                        }`}
                      >
                        {pdfFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-700">{pdfFile.name}</span>
                            <span className="text-xs text-emerald-500">
                              ({(pdfFile.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-7 h-7 mx-auto text-slate-400 mb-1" />
                            <p className="text-sm font-semibold text-slate-600">Click to upload PDF</p>
                            <p className="text-xs text-slate-400">Supports PDF files up to 10MB</p>
                          </>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Target Audience Multi-Selection */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  3. Select Target Audience (Multi-Select Available)
                </p>

                {/* Scope Selection Tabs */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {(["ALL", "WINGS", "GRADES", "CUSTOM"] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setTargetScope(scope)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all text-center ${
                        targetScope === scope
                          ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                          : "border-slate-200 text-slate-700 bg-white hover:border-slate-300"
                      }`}
                    >
                      {scope === "ALL" && "🏫 All School"}
                      {scope === "WINGS" && "🏢 Multi Wings"}
                      {scope === "GRADES" && "📚 Multi Grades"}
                      {scope === "CUSTOM" && "👤 Custom"}
                    </button>
                  ))}
                </div>

                {/* Scope A: WINGS Multi-select Pills */}
                {targetScope === "WINGS" && (
                  <div className="space-y-2 bg-violet-50/50 p-4 rounded-xl border border-violet-100">
                    <p className="text-xs font-bold text-violet-900">
                      Select Wings (Click to toggle multiple):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {WINGS.map((w) => {
                        const isSelected = selectedWings.includes(w.id);
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => toggleWing(w.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                              isSelected
                                ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                            }`}
                          >
                            <span>{isSelected ? "✓" : "+"}</span>
                            <span>{w.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Scope B: GRADES Multi-select Pills */}
                {targetScope === "GRADES" && (
                  <div className="space-y-2 bg-violet-50/50 p-4 rounded-xl border border-violet-100">
                    <p className="text-xs font-bold text-violet-900">
                      Select Grades/Standards (Click to toggle multiple):
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                      {ALL_SCHOOL_GRADES.filter((g) => !g.name.includes("Graduated")).map((g) => {
                        const isSelected = selectedGrades.includes(g.name);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => toggleGrade(g.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                            }`}
                          >
                            <span>{isSelected ? "✓" : "+"}</span>
                            <span>{g.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Scope C: CUSTOM Student Checkboxes */}
                {targetScope === "CUSTOM" && (
                  <div className="space-y-2 bg-violet-50/50 p-3 rounded-xl border border-violet-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-violet-900">
                        Select Individual Students:
                      </p>
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border border-slate-200 text-xs">
                      {getStoredStudents()
                        .filter(
                          (s) =>
                            s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
                            s.grNumber.toLowerCase().includes(studentSearch.toLowerCase())
                        )
                        .map((s) => {
                          const isChecked = selectedStudentIds.includes(s.id);
                          return (
                            <label
                              key={s.id}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedStudentIds(
                                      selectedStudentIds.filter((id) => id !== s.id)
                                    );
                                  } else {
                                    setSelectedStudentIds([...selectedStudentIds, s.id]);
                                  }
                                }}
                                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                              />
                              <span className="font-bold text-slate-900">{s.fullName}</span>
                              <span className="font-mono text-[10px] text-blue-600 font-bold">
                                ({s.grNumber})
                              </span>
                              <span className="text-slate-500 text-[11px] ml-auto">
                                {s.grade} - Sec {s.section}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Recipient Count Indicator */}
                <div className="bg-violet-100 border border-violet-200 rounded-xl px-4 py-3 flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-900">
                    <Users className="w-4 h-4 text-violet-700" />
                    <span>Target Recipients:</span>
                  </div>
                  <span className="text-base font-black text-violet-900">
                    {matchingStudents.length} Parents Selected
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={
                    isPublishing ||
                    !title.trim() ||
                    (noticeType === "TEXT" && !description.trim()) ||
                    (noticeType === "PDF" && !pdfFile)
                  }
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isPublishing ? "Publishing..." : "Publish &amp; Prepare Broadcast"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── BROADCAST MODAL ─────────────── */}
      {broadcastModal && (() => {
        const students = getNoticeStudents(broadcastModal);
        const total = students.length;
        const done = broadcastIndex;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        const allDone = done >= total;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-4.5 h-4.5 text-emerald-600" />
                  WhatsApp Broadcast Queue
                </h2>
                <button
                  onClick={() => setBroadcastModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Notice Title
                  </p>
                  <p className="font-bold text-slate-900 text-sm">{broadcastModal.title}</p>
                  {broadcastModal.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {broadcastModal.description}
                    </p>
                  )}
                  {broadcastModal.pdfName && (
                    <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {broadcastModal.pdfName}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>
                      {done} of {total} parents notified
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {!allDone && students[broadcastIndex] && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                      Target {broadcastIndex + 1} of {total}:
                    </p>
                    <p className="font-bold text-slate-900 text-sm">
                      {students[broadcastIndex].fullName}
                      <span className="ml-2 text-xs font-mono font-bold text-blue-600">
                        ({students[broadcastIndex].grNumber})
                      </span>
                    </p>
                    <p className="text-xs text-slate-600">
                      📱 {students[broadcastIndex].guardianMobile} — {students[broadcastIndex].grade} Sec{" "}
                      {students[broadcastIndex].section}
                    </p>
                  </div>
                )}

                {allDone && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                    <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-600 mb-2" />
                    <p className="font-bold text-emerald-900 text-base">
                      All {total} Parents Notified!
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      WhatsApp circular broadcast completed successfully.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setBroadcastModal(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl"
                  >
                    {allDone ? "Done" : "Pause / Close"}
                  </button>
                  {!allDone && (
                    <button
                      onClick={() => sendNextWhatsApp(broadcastModal, students)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      {done === 0 ? "Start WhatsApp Broadcast" : "Send Next →"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
