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
  Eye,
  Megaphone,
} from "lucide-react";
import { ALL_SCHOOL_GRADES, getStoredStudents } from "@/lib/school-store";

interface Notice {
  id: string;
  title: string;
  description: string;
  type: "TEXT" | "PDF";
  pdfName?: string;
  pdfUrl?: string;
  targetScope: "ALL" | "WING" | "GRADE";
  targetWing?: string;
  targetGrade?: string;
  targetSection?: string;
  recipientCount: number;
  createdAt: string;
  status: "DRAFT" | "SENT";
  broadcastCount: number;
}

const SECTIONS = ["All Sections", "A", "B", "C", "D"];

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
  const [targetScope, setTargetScope] = useState<"ALL" | "WING" | "GRADE">("ALL");
  const [targetWing, setTargetWing] = useState("PRE-PRIMARY");
  const [targetGrade, setTargetGrade] = useState("Grade 1");
  const [targetSection, setTargetSection] = useState("All Sections");
  const [isPublishing, setIsPublishing] = useState(false);
  const [broadcastIndex, setBroadcastIndex] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

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
    // Store as data URL for sharing via WhatsApp link
    const reader = new FileReader();
    reader.onload = (ev) => setPdfDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Calculate how many students match the target
  const calcRecipients = (): number => {
    const students = getStoredStudents();
    if (targetScope === "ALL") return students.length;
    if (targetScope === "WING") return students.filter((s) => s.wing === targetWing).length;
    return students.filter((s) => {
      const gradeMatch = s.grade === targetGrade;
      const sectionMatch = targetSection === "All Sections" || s.section === targetSection;
      return gradeMatch && sectionMatch;
    }).length;
  };

  // Get matching students for broadcast
  const getTargetStudents = (notice: Notice) => {
    const students = getStoredStudents();
    if (notice.targetScope === "ALL") return students;
    if (notice.targetScope === "WING") return students.filter((s) => s.wing === notice.targetWing);
    return students.filter((s) => {
      const gradeMatch = s.grade === notice.targetGrade;
      const sectionMatch = notice.targetSection === "All Sections" || s.section === notice.targetSection;
      return gradeMatch && sectionMatch;
    });
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
        targetWing: targetScope === "WING" ? targetWing : undefined,
        targetGrade: targetScope === "GRADE" ? targetGrade : undefined,
        targetSection: targetScope === "GRADE" ? targetSection : undefined,
        recipientCount: calcRecipients(),
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
    setTargetWing("PRE-PRIMARY");
    setTargetGrade("Grade 1");
    setTargetSection("All Sections");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteNotice = (id: string) => {
    saveNotices(notices.filter((n) => n.id !== id));
  };

  // Open broadcast modal
  const openBroadcast = (notice: Notice) => {
    setBroadcastModal(notice);
    setBroadcastIndex(0);
    setIsBroadcasting(false);
  };

  // Send to one parent via WhatsApp and advance
  const sendNext = (notice: Notice, students: ReturnType<typeof getTargetStudents>) => {
    const student = students[broadcastIndex];
    if (!student) return;

    const rawPhone = student.guardianMobile.replace(/[^0-9]/g, "");
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    const pdfLine = notice.pdfName
      ? `\n📎 Circular: ${notice.pdfName} (Please check the school notice board or app for the PDF attachment.)`
      : "";

    const msg =
      `📢 *${notice.title}*\n\n` +
      `Dear Parent of *${student.fullName}* (${student.grNumber}, ${student.grade} - Sec ${student.section}),\n\n` +
      `${notice.description}` +
      pdfLine +
      `\n\n— Marwari Vidyalaya High School Administration`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");

    // Advance index
    const nextIndex = broadcastIndex + 1;
    setBroadcastIndex(nextIndex);

    // Mark as SENT when all done
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
    if (n.targetScope === "WING") return `${n.targetWing} Wing`;
    return `${n.targetGrade}${n.targetSection && n.targetSection !== "All Sections" ? ` - Sec ${n.targetSection}` : ""}`;
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
            Publish school announcements and send WhatsApp notifications to parents by grade &amp; section
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
          <p className="text-xs font-semibold text-slate-500">Total Notices</p>
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
            <p className="font-bold text-slate-700">No Notices Yet</p>
            <p className="text-sm text-slate-400 mt-1">Click "Create New Notice / Circular" to publish your first notice.</p>
          </div>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Type Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    n.type === "PDF" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-violet-50 text-violet-600 border border-violet-100"
                  }`}>
                    {n.type === "PDF" ? <FileText className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        n.status === "SENT"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
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
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> Target: {targetLabel(n)} ({n.recipientCount} Students)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      {n.broadcastCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> {n.broadcastCount} WhatsApp sent
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
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
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-600" />
                Create New Notice / Circular
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
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
                    <MessageSquare className={`w-5 h-5 ${noticeType === "TEXT" ? "text-violet-600" : "text-slate-400"}`} />
                    <div>
                      <p className="font-bold text-sm text-slate-900">Text Announcement</p>
                      <p className="text-xs text-slate-400">Write a notice message directly</p>
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
                    <FileText className={`w-5 h-5 ${noticeType === "PDF" ? "text-rose-600" : "text-slate-400"}`} />
                    <div>
                      <p className="font-bold text-sm text-slate-900">PDF Circular Upload</p>
                      <p className="text-xs text-slate-400">Upload a PDF circular (.pdf)</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Details */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  2. Notice Details
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Title *</label>
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
                      {noticeType === "PDF" ? "Description / Summary (Optional)" : "Notice Message *"}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder={noticeType === "PDF"
                        ? "Write a brief summary of the circular..."
                        : "Write the full notice message here. This will be sent as a WhatsApp message to parents..."}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 placeholder:text-slate-400 resize-none"
                    />
                  </div>

                  {/* PDF Upload */}
                  {noticeType === "PDF" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Upload PDF Circular *</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                          pdfFile
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50"
                        }`}
                      >
                        {pdfFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-700">{pdfFile.name}</span>
                            <span className="text-xs text-emerald-500">({(pdfFile.size / 1024).toFixed(0)} KB)</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                            <p className="text-sm font-semibold text-slate-600">Click to upload PDF</p>
                            <p className="text-xs text-slate-400 mt-1">Supports .pdf files up to 10MB</p>
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

              {/* Step 3: Target Audience */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  3. Select Target Audience
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {(["ALL", "WING", "GRADE"] as const).map((scope) => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setTargetScope(scope)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border-2 transition-all ${
                          targetScope === scope
                            ? "border-violet-500 bg-violet-50 text-violet-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {scope === "ALL" ? "🏫 All School" : scope === "WING" ? "🏢 By Wing" : "📚 By Grade"}
                      </button>
                    ))}
                  </div>

                  {targetScope === "WING" && (
                    <select
                      value={targetWing}
                      onChange={(e) => setTargetWing(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none"
                    >
                      <option value="PRE-PRIMARY">Pre-Primary Wing (Nursery, Jr KG, Sr KG)</option>
                      <option value="PRIMARY">Primary Wing (Grade 1–4)</option>
                      <option value="SECONDARY">Secondary Wing (Grade 5–10)</option>
                    </select>
                  )}

                  {targetScope === "GRADE" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Grade / Standard</label>
                        <select
                          value={targetGrade}
                          onChange={(e) => setTargetGrade(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none"
                        >
                          {ALL_SCHOOL_GRADES.filter((g) => !g.name.includes("Graduated")).map((g) => (
                            <option key={g.id} value={g.name}>{g.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Section</label>
                        <select
                          value={targetSection}
                          onChange={(e) => setTargetSection(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none"
                        >
                          {SECTIONS.map((s) => (
                            <option key={s} value={s}>{s === "All Sections" ? "All Sections" : `Section ${s}`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Recipient Preview */}
                  <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-600" />
                    <span className="text-xs font-bold text-violet-800">
                      This notice will be sent to <span className="text-lg font-black">{calcRecipients()}</span> students' parents
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl"
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
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isPublishing ? "Publishing..." : "Publish Notice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── BROADCAST MODAL ─────────────── */}
      {broadcastModal && (() => {
        const students = getTargetStudents(broadcastModal);
        const total = students.length;
        const done = broadcastIndex;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        const allDone = done >= total;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  WhatsApp Broadcast
                </h2>
                <button onClick={() => setBroadcastModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Notice Preview */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notice</p>
                  <p className="font-bold text-slate-900 text-sm">{broadcastModal.title}</p>
                  {broadcastModal.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{broadcastModal.description}</p>
                  )}
                  {broadcastModal.pdfName && (
                    <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {broadcastModal.pdfName}
                    </p>
                  )}
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>{done} of {total} parents notified</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Current Student */}
                {!allDone && students[broadcastIndex] && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Next to Send:</p>
                    <p className="font-bold text-slate-900 text-sm">
                      {students[broadcastIndex].fullName}
                      <span className="ml-2 text-xs font-normal text-slate-500">({students[broadcastIndex].grNumber})</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      📱 {students[broadcastIndex].guardianMobile} — {students[broadcastIndex].grade} Sec {students[broadcastIndex].section}
                    </p>
                  </div>
                )}

                {/* All Done */}
                {allDone && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                    <p className="font-bold text-emerald-800">All {total} parents have been notified!</p>
                    <p className="text-xs text-emerald-600 mt-1">WhatsApp broadcast completed successfully.</p>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-medium">
                    Make sure <strong>WhatsApp Web is open</strong> on this computer. Each click opens a pre-filled WhatsApp message — just press Send in WhatsApp, then come back and click "Send Next".
                  </p>
                </div>

                {/* Action */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setBroadcastModal(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl"
                  >
                    {allDone ? "Close" : "Pause"}
                  </button>
                  {!allDone && (
                    <button
                      onClick={() => sendNext(broadcastModal, students)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {done === 0 ? "Start Broadcast" : "Send Next →"}
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
