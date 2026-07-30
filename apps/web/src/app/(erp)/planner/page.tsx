"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Save,
  Calendar as CalendarIcon,
  Megaphone,
  Edit3,
} from "lucide-react";
import {
  PlannerEvent,
  EventCategory,
  CATEGORY_COLORS,
  loadPlannerEvents,
  savePlannerEvents,
  getEventsForDate,
} from "@/lib/planner-data";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORIES: EventCategory[] = [
  "HOLIDAY", "WEEKLY_TEST", "CWS", "HWS", "ACTIVITY", "ASSEMBLY", "EXAM", "PTA", "ADMIN",
];

// Calendar helpers
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PlannerPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<PlannerEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add/Edit form
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<EventCategory>("ADMIN");
  const [formGrades, setFormGrades] = useState("");
  const [formDesc, setFormDesc] = useState("");

  useEffect(() => {
    setEvents(loadPlannerEvents());
  }, []);

  const saveAll = (updated: PlannerEvent[]) => {
    setEvents(updated);
    savePlannerEvents(updated);
  };

  // Navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Open add modal for a specific date
  const openAdd = (dateStr: string) => {
    setSelectedDate(dateStr);
    setEditEvent(null);
    setFormTitle("");
    setFormCategory("ADMIN");
    setFormGrades("");
    setFormDesc("");
    setShowAddModal(true);
  };

  // Open edit modal
  const openEdit = (evt: PlannerEvent) => {
    setSelectedDate(evt.date);
    setEditEvent(evt);
    setFormTitle(evt.title);
    setFormCategory(evt.category);
    setFormGrades(evt.targetGrades || "");
    setFormDesc(evt.description || "");
    setShowAddModal(true);
  };

  // Save event (add or edit)
  const handleSave = () => {
    if (!formTitle.trim() || !selectedDate) return;

    if (editEvent) {
      const updated = events.map((e) =>
        e.id === editEvent.id
          ? { ...e, title: formTitle.trim(), category: formCategory, targetGrades: formGrades || undefined, description: formDesc || undefined }
          : e
      );
      saveAll(updated);
    } else {
      const newEvt: PlannerEvent = {
        id: `evt_${Date.now()}`,
        date: selectedDate,
        title: formTitle.trim(),
        category: formCategory,
        targetGrades: formGrades || undefined,
        description: formDesc || undefined,
      };
      saveAll([...events, newEvt]);
    }
    setShowAddModal(false);
  };

  // Delete event
  const handleDelete = (id: string) => {
    saveAll(events.filter((e) => e.id !== id));
    setShowAddModal(false);
  };

  // Today's events
  const todayEvents = getEventsForDate(events, todayStr);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-indigo-600" />
            Academic Planner
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Interactive school calendar — click any date to add, edit, or delete events
          </p>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
          {CATEGORIES.map((cat) => (
            <span key={cat} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${CATEGORY_COLORS[cat].bg} ${CATEGORY_COLORS[cat].text}`}>
              {CATEGORY_COLORS[cat].emoji} {CATEGORY_COLORS[cat].label}
            </span>
          ))}
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {DAY_NAMES.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[11px] font-extrabold uppercase tracking-wider py-2 ${
                i === 0 || i === 6 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="border-r border-b border-slate-100 bg-slate-50/30 min-h-[100px]" />;
            }

            const dateStr = formatDateStr(currentYear, currentMonth, day);
            const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;
            const isToday = dateStr === todayStr;
            const dayEvents = getEventsForDate(events, dateStr);
            const hasHoliday = dayEvents.some((e) => e.category === "HOLIDAY");

            return (
              <div
                key={dateStr}
                onClick={() => openAdd(dateStr)}
                className={`border-r border-b border-slate-100 min-h-[100px] p-1 cursor-pointer transition-all hover:bg-indigo-50/40 group relative ${
                  isSunday ? "bg-red-50/60" : hasHoliday ? "bg-red-50/40" : ""
                } ${isToday ? "ring-2 ring-inset ring-indigo-500 bg-indigo-50/30" : ""}`}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-0.5 px-0.5">
                  <span
                    className={`text-xs font-extrabold ${
                      isToday
                        ? "bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
                        : isSunday || isSaturday
                        ? "text-red-500"
                        : "text-slate-700"
                    }`}
                  >
                    {day}
                  </span>
                  <Plus className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Event Pills */}
                <div className="space-y-[2px]">
                  {dayEvents.slice(0, 3).map((evt) => (
                    <button
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(evt);
                      }}
                      className={`w-full text-left text-[9px] leading-tight font-bold px-1 py-[2px] rounded truncate ${CATEGORY_COLORS[evt.category].bg} ${CATEGORY_COLORS[evt.category].text} hover:opacity-80 transition-opacity`}
                      title={evt.title}
                    >
                      {evt.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="block text-[9px] font-bold text-indigo-600 px-1">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Events Summary Bar */}
      {todayEvents.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider mb-2">
            📅 Today&apos;s Schedule — {todayStr}
          </p>
          <div className="flex flex-wrap gap-2">
            {todayEvents.map((evt) => (
              <span
                key={evt.id}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${CATEGORY_COLORS[evt.category].bg} ${CATEGORY_COLORS[evt.category].text}`}
              >
                {CATEGORY_COLORS[evt.category].emoji} {evt.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────── ADD / EDIT EVENT MODAL ─────────────── */}
      {showAddModal && selectedDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {editEvent ? <Edit3 className="w-4 h-4 text-indigo-600" /> : <Plus className="w-4 h-4 text-indigo-600" />}
                {editEvent ? "Edit Event" : "Add Event"} — {selectedDate}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Weekly test - Hindi 5th to 10th"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-slate-400"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border-2 transition-all ${
                        formCategory === cat
                          ? `${CATEGORY_COLORS[cat].bg} ${CATEGORY_COLORS[cat].text} border-transparent shadow-sm`
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {CATEGORY_COLORS[cat].emoji} {CATEGORY_COLORS[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Grades */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Grades (Optional)</label>
                <input
                  type="text"
                  value={formGrades}
                  onChange={(e) => setFormGrades(e.target.value)}
                  placeholder="e.g. 8th to 10th, or 5th to 9th"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Description (Optional)</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  {editEvent && (
                    <button
                      onClick={() => handleDelete(editEvent.id)}
                      className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formTitle.trim()}
                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {editEvent ? "Update" : "Add Event"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
