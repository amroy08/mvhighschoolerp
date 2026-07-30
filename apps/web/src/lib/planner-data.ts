"use client";

// Event categories matching the school's Excel planner color coding
export type EventCategory =
  | "HOLIDAY"
  | "WEEKLY_TEST"
  | "CWS"
  | "HWS"
  | "ACTIVITY"
  | "ASSEMBLY"
  | "EXAM"
  | "PTA"
  | "ADMIN";

export interface PlannerEvent {
  id: string;
  date: string; // "YYYY-MM-DD"
  title: string;
  category: EventCategory;
  targetGrades?: string;
  description?: string;
}

// Color map for each category (matching the Excel planner colors)
export const CATEGORY_COLORS: Record<EventCategory, { bg: string; text: string; label: string; emoji: string }> = {
  HOLIDAY:     { bg: "bg-red-500",     text: "text-white",      label: "Holiday",          emoji: "🔴" },
  WEEKLY_TEST: { bg: "bg-yellow-400",  text: "text-slate-900",  label: "Weekly Test",       emoji: "📝" },
  CWS:         { bg: "bg-orange-400",  text: "text-white",      label: "CWS (Classwork)",   emoji: "📋" },
  HWS:         { bg: "bg-green-600",   text: "text-white",      label: "HWS (Homework)",    emoji: "📚" },
  ACTIVITY:    { bg: "bg-violet-400",  text: "text-white",      label: "Activity",          emoji: "🎭" },
  ASSEMBLY:    { bg: "bg-emerald-500", text: "text-white",      label: "Assembly",          emoji: "🏫" },
  EXAM:        { bg: "bg-blue-700",    text: "text-white",      label: "Exam Period",       emoji: "📐" },
  PTA:         { bg: "bg-pink-500",    text: "text-white",      label: "PTA / Parents",     emoji: "👨‍👩‍👧" },
  ADMIN:       { bg: "bg-amber-600",   text: "text-white",      label: "Teacher / Admin",   emoji: "👩‍🏫" },
};

// All pre-loaded events from the school's Excel planner (June 2026 – March 2027)
export const DEFAULT_PLANNER_EVENTS: PlannerEvent[] = [
  // ═══════════════════════ JUNE 2026 ═══════════════════════
  { id: "jun01", date: "2026-06-08", title: "Welcome the teachers, handing over class teachership & making charts for classroom", category: "ADMIN" },
  { id: "jun02", date: "2026-06-09", title: "Workshop for teachers on lesson planning. Teachers of Std 10th to prepare lesson plans 5 each subject", category: "ADMIN" },
  { id: "jun03", date: "2026-06-10", title: "Curriculum making to be continued. Lesson planning to be continued. Syllabus to be made", category: "ADMIN" },
  { id: "jun04", date: "2026-06-11", title: "Making of attendance register. Class decoration. Special assembly for the students", category: "ADMIN" },
  { id: "jun05", date: "2026-06-12", title: "Class decoration and making of attendance register to be continued. Workshop for teachers", category: "ADMIN" },
  { id: "jun06", date: "2026-06-15", title: "School re-opens. Introduction and games to be played. ACADEMIC SYLLABUS TO BE STARTED", category: "ADMIN" },
  { id: "jun07", date: "2026-06-19", title: "World Environment Day - activities to be conducted", category: "ACTIVITY" },
  { id: "jun08", date: "2026-06-22", title: "1) Election Voting format sheet to be kept ready. 2) International Yoga Day Celebration", category: "ACTIVITY" },
  { id: "jun09", date: "2026-06-23", title: "Declaration forms to be collected and calendar stamping to be done", category: "ADMIN" },
  { id: "jun10", date: "2026-06-25", title: "Weekly test - Eng lang 5th to 10th", category: "WEEKLY_TEST", targetGrades: "5th to 10th" },
  { id: "jun11", date: "2026-06-26", title: "CWS - 8th to 10th Math/Algebra", category: "CWS", targetGrades: "8th to 10th" },
  { id: "jun12", date: "2026-06-29", title: "PTA meeting to be conducted", category: "PTA" },
  { id: "jun13", date: "2026-06-30", title: "Moharam", category: "HOLIDAY" },

  // ═══════════════════════ JULY 2026 ═══════════════════════
  { id: "jul01", date: "2026-07-01", title: "Elections for Investiture Ceremony", category: "ACTIVITY" },
  { id: "jul02", date: "2026-07-02", title: "Weekly test - Hindi Grade 5th to 10th", category: "WEEKLY_TEST", targetGrades: "5th to 10th" },
  { id: "jul03", date: "2026-07-03", title: "CWS - 8th to 10th English", category: "CWS", targetGrades: "8th to 10th" },
  { id: "jul04", date: "2026-07-06", title: "1) 1st Unit Test papers to be submitted. 2) Special Assembly by Std 10th", category: "ADMIN" },
  { id: "jul05", date: "2026-07-08", title: "Maths (revision) Base Line", category: "EXAM" },
  { id: "jul06", date: "2026-07-09", title: "1) CWS - 8th to 10th Sci/Sci 1. 2) Weekly test - Math/Alg 5th to 10th", category: "CWS", targetGrades: "8th to 10th" },
  { id: "jul07", date: "2026-07-10", title: "1) Investiture Ceremony", category: "ACTIVITY" },
  { id: "jul08", date: "2026-07-13", title: "1) HWS - 8th to 10th Sci/Sci 1/Sci 2", category: "HWS", targetGrades: "8th to 10th" },
  { id: "jul09", date: "2026-07-16", title: "Portion Completion Status (For 1st Unit Test)", category: "ADMIN" },
  { id: "jul10", date: "2026-07-17", title: "Nature Trail", category: "ACTIVITY" },
  { id: "jul11", date: "2026-07-18", title: "Nature Trail", category: "ACTIVITY" },
  { id: "jul12", date: "2026-07-20", title: "1) HWS - 8th to 10th History", category: "HWS", targetGrades: "8th to 10th" },
  { id: "jul13", date: "2026-07-22", title: "English Base Line", category: "EXAM" },
  { id: "jul14", date: "2026-07-23", title: "Weekly test - Hindi 5th to 10th", category: "WEEKLY_TEST", targetGrades: "5th to 10th" },
  { id: "jul15", date: "2026-07-24", title: "1) Parents Day to be celebration", category: "PTA" },
  { id: "jul16", date: "2026-07-26", title: "Parents Day", category: "PTA" },
  { id: "jul17", date: "2026-07-27", title: "1st Unit test Begins", category: "EXAM" },
  { id: "jul18", date: "2026-07-29", title: "Guru Purnima (Activity)", category: "ACTIVITY" },
  { id: "jul19", date: "2026-07-30", title: "Weekly test - Marathi 5th to 10th", category: "WEEKLY_TEST", targetGrades: "5th to 10th" },
  { id: "jul20", date: "2026-07-31", title: "1st Unit test Ends", category: "EXAM" },

  // ═══════════════════════ AUGUST 2026 ═══════════════════════
  { id: "aug01", date: "2026-08-07", title: "CWS - 8th to 10th Hindi", category: "CWS", targetGrades: "8th to 10th" },
  { id: "aug02", date: "2026-08-10", title: "1) Assembly by Std 9th. 2) HWS - 8th to 10th Hindi", category: "HWS", targetGrades: "8th to 10th" },
  { id: "aug03", date: "2026-08-11", title: "Open day - 1st Unit test", category: "PTA" },
  { id: "aug04", date: "2026-08-14", title: "1) Independence Day Activity. 2) CWS - 8th to 10th - History", category: "ACTIVITY" },
  { id: "aug05", date: "2026-08-15", title: "Independence Day / Parsi New Year's Day", category: "HOLIDAY" },
  { id: "aug06", date: "2026-08-19", title: "Raksha Bandhan Activity", category: "ACTIVITY" },
  { id: "aug07", date: "2026-08-20", title: "CWS - 8th to 10th Geography", category: "CWS", targetGrades: "8th to 10th" },
  { id: "aug08", date: "2026-08-21", title: "Inter school Sports Competition", category: "ACTIVITY" },
  { id: "aug09", date: "2026-08-24", title: "1) HWS - 8th to 10th Math/Alg/Geom", category: "HWS", targetGrades: "8th to 10th" },
  { id: "aug10", date: "2026-08-25", title: "1) Teacher's Day Activity", category: "ADMIN" },
  { id: "aug11", date: "2026-08-27", title: "Weekly test - Geometry Grade 9th and 10th", category: "WEEKLY_TEST", targetGrades: "9th & 10th" },
  { id: "aug12", date: "2026-08-28", title: "Raksha Bandhan (Holiday)", category: "HOLIDAY" },
  { id: "aug13", date: "2026-08-31", title: "PTA Meeting", category: "PTA" },

  // ═══════════════════════ SEPTEMBER 2026 ═══════════════════════
  { id: "sep01", date: "2026-09-03", title: "1) CWS - 8th to 10th Math/Alg/Geometry. 2) Weekly test - Geom Std 9th and 10th", category: "CWS", targetGrades: "8th to 10th" },
  { id: "sep02", date: "2026-09-04", title: "Teacher's Day Celebration", category: "ADMIN" },
  { id: "sep03", date: "2026-09-07", title: "1) Special Assembly by 8th. 2) 1st Term Question Papers Submission. 3) HWS - 8th to 10th - Geography", category: "HWS", targetGrades: "8th to 10th" },
  { id: "sep04", date: "2026-09-09", title: "Ganesh Chaturthi Activity", category: "ACTIVITY" },
  { id: "sep05", date: "2026-09-10", title: "Weekly test - Geog 5th to 10th", category: "WEEKLY_TEST", targetGrades: "5th to 10th" },
  { id: "sep06", date: "2026-09-11", title: "1) English Class test. 2) CWS - 8th to 10th Sci/Sci 1/Sci 2t. 3) Hindi Diwas Celebration", category: "ACTIVITY" },
  { id: "sep07", date: "2026-09-14", title: "1) Hindi Diwas. 2) Ganesh Chaturthi", category: "HOLIDAY" },
  { id: "sep08", date: "2026-09-21", title: "HWS - 8th to 10th - English", category: "HWS", targetGrades: "8th to 10th" },
  { id: "sep09", date: "2026-09-24", title: "Weekly test - History 5th to 10th. Quiz competition for class 5th to 10th", category: "WEEKLY_TEST", targetGrades: "5th to 10th" },
  { id: "sep10", date: "2026-09-25", title: "Anant Chaturthi", category: "HOLIDAY" },
  { id: "sep11", date: "2026-09-28", title: "HWS - 8th to 10th - Marathi", category: "HWS", targetGrades: "8th to 10th" },
  { id: "sep12", date: "2026-09-30", title: "Weekly test - Science/Sci 1 5th to 10th", category: "WEEKLY_TEST", targetGrades: "5th to 10th" },

  // ═══════════════════════ OCTOBER 2026 ═══════════════════════
  { id: "oct01", date: "2026-10-01", title: "Gandhi Jayanti Activity. CWS - 8th to 10th English", category: "CWS", targetGrades: "8th to 10th" },
  { id: "oct02", date: "2026-10-02", title: "Gandhi Jayanti", category: "HOLIDAY" },
  { id: "oct03", date: "2026-10-05", title: "Choral Recitation", category: "ACTIVITY" },
  { id: "oct04", date: "2026-10-06", title: "1st Term Begins", category: "EXAM" },
  { id: "oct05", date: "2026-10-07", title: "CWS - 8th to 10th Hindi", category: "CWS", targetGrades: "8th to 10th" },
  { id: "oct06", date: "2026-10-08", title: "Weekly test - English Language Grade 5th to 9th", category: "WEEKLY_TEST", targetGrades: "5th to 9th" },
  { id: "oct07", date: "2026-10-09", title: "Pre-Prelims paper to be submitted on 2 Nov", category: "ADMIN" },
  { id: "oct08", date: "2026-10-11", title: "Navratri", category: "HOLIDAY" },
  { id: "oct09", date: "2026-10-12", title: "CWS - 8th to 10th Math/Alg", category: "CWS", targetGrades: "8th to 10th" },
  { id: "oct10", date: "2026-10-14", title: "HWS - 8th & 9th - English", category: "HWS", targetGrades: "8th & 9th" },
  { id: "oct11", date: "2026-10-15", title: "Weekly test - Hindi Grade 5th to 9th", category: "WEEKLY_TEST", targetGrades: "5th to 9th" },
  { id: "oct12", date: "2026-10-16", title: "1st Term Ends", category: "EXAM" },
  { id: "oct13", date: "2026-10-19", title: "Dussehra", category: "HOLIDAY" },
  { id: "oct14", date: "2026-10-20", title: "2nd Term Syllabus Begins", category: "ADMIN" },
  { id: "oct15", date: "2026-10-21", title: "Weekly test - Math/Alg Grade 5th to 9th", category: "WEEKLY_TEST", targetGrades: "5th to 9th" },
  { id: "oct16", date: "2026-10-22", title: "Navratri Celebration", category: "ACTIVITY" },
  { id: "oct17", date: "2026-10-23", title: "Sports Day", category: "ACTIVITY" },
  { id: "oct18", date: "2026-10-26", title: "HWS - 8th & 9th Geography", category: "HWS", targetGrades: "8th & 9th" },
  { id: "oct19", date: "2026-10-29", title: "CWS - 8th to 10th Marathi", category: "CWS", targetGrades: "8th to 10th" },
  { id: "oct20", date: "2026-10-30", title: "Open day for 1st term", category: "PTA" },

  // ═══════════════════════ NOVEMBER 2026 ═══════════════════════
  { id: "nov01", date: "2026-11-02", title: "Pre-Prelims paper to be submitted on 2 Nov", category: "ADMIN" },
  { id: "nov02", date: "2026-11-03", title: "2nd UT paper to be submitted on 1st Dec", category: "ADMIN" },
  { id: "nov03", date: "2026-11-04", title: "CWS - 8th to 10th Hindi", category: "CWS", targetGrades: "8th to 10th" },
  { id: "nov04", date: "2026-11-06", title: "Diwali Holiday Begins", category: "HOLIDAY" },
  { id: "nov05", date: "2026-11-13", title: "Education Day", category: "ADMIN" },
  { id: "nov06", date: "2026-11-18", title: "1) School re-opens after Diwali. 2) Special Assembly and Children's Day Celebration", category: "ACTIVITY" },
  { id: "nov07", date: "2026-11-20", title: "School Picnic", category: "ACTIVITY" },
  { id: "nov08", date: "2026-11-24", title: "Guru Nanak Jayanti", category: "HOLIDAY" },

  // ═══════════════════════ DECEMBER 2026 ═══════════════════════
  { id: "dec01", date: "2026-12-01", title: "2nd UT paper to be submitted on 1st Dec", category: "ADMIN" },
  { id: "dec02", date: "2026-12-03", title: "Weekly test - Marathi Grade 5th to 9th. HWS - 8th & 9th Hindi", category: "WEEKLY_TEST", targetGrades: "5th to 9th" },
  { id: "dec03", date: "2026-12-04", title: "Annual Day", category: "ACTIVITY" },
  { id: "dec04", date: "2026-12-05", title: "Assembly by Std 7th", category: "ASSEMBLY" },
  { id: "dec05", date: "2026-12-07", title: "Pre-Prelims Begins", category: "EXAM" },
  { id: "dec06", date: "2026-12-10", title: "Weekly test - Science/Sci 1 Grade 5th to 9th", category: "WEEKLY_TEST", targetGrades: "5th to 9th" },
  { id: "dec07", date: "2026-12-11", title: "CWS - 8th & 9th History", category: "CWS", targetGrades: "8th & 9th" },
  { id: "dec08", date: "2026-12-12", title: "Debate", category: "ACTIVITY" },
  { id: "dec09", date: "2026-12-14", title: "HWS - 8th & 9th Hindi", category: "HWS", targetGrades: "8th & 9th" },
  { id: "dec10", date: "2026-12-16", title: "CWS - 8th & 9th - Science/Sci 1", category: "CWS", targetGrades: "8th & 9th" },
  { id: "dec11", date: "2026-12-17", title: "Weekly test - History/EVS 2 Grade 5th to 9th. Pre-prelims ends", category: "WEEKLY_TEST", targetGrades: "5th to 9th" },
  { id: "dec12", date: "2026-12-18", title: "CWS - 8th & 9th - Geography", category: "CWS", targetGrades: "8th & 9th" },
  { id: "dec13", date: "2026-12-19", title: "Christmas Party", category: "ACTIVITY" },
  { id: "dec14", date: "2026-12-25", title: "Christmas", category: "HOLIDAY" },

  // ═══════════════════════ JANUARY 2027 ═══════════════════════
  { id: "jan01", date: "2027-01-01", title: "New Year's Day", category: "HOLIDAY" },
  { id: "jan02", date: "2027-01-04", title: "School re-opens", category: "ADMIN" },
  { id: "jan03", date: "2027-01-05", title: "Open day for Pre-prelims", category: "PTA" },
  { id: "jan04", date: "2027-01-06", title: "9 Std Exam Papers to be submitted on 2 Feb", category: "ADMIN" },
  { id: "jan05", date: "2027-01-08", title: "Assembly by 6th", category: "ASSEMBLY" },
  { id: "jan06", date: "2027-01-11", title: "2nd UT and Prelims Begins", category: "EXAM" },
  { id: "jan07", date: "2027-01-14", title: "Makar Sankranti", category: "HOLIDAY" },
  { id: "jan08", date: "2027-01-15", title: "UT Ends", category: "EXAM" },
  { id: "jan09", date: "2027-01-18", title: "National Girl Child Activity", category: "ACTIVITY" },
  { id: "jan10", date: "2027-01-21", title: "Prelims Ends", category: "EXAM" },
  { id: "jan11", date: "2027-01-22", title: "Open House For Unit Test", category: "PTA" },
  { id: "jan12", date: "2027-01-24", title: "National Girl Child Day", category: "HOLIDAY" },
  { id: "jan13", date: "2027-01-26", title: "Republic Day", category: "HOLIDAY" },
  { id: "jan14", date: "2027-01-29", title: "CWS - 9th - Geometry. Prelims Open Day", category: "CWS", targetGrades: "9th" },

  // ═══════════════════════ FEBRUARY 2027 ═══════════════════════
  { id: "feb01", date: "2027-02-01", title: "Assembly for 5th Std", category: "ASSEMBLY" },
  { id: "feb02", date: "2027-02-02", title: "9 Std Exam Papers to be submitted on 2 Feb", category: "ADMIN" },
  { id: "feb03", date: "2027-02-04", title: "Weekly test - 5th to 9th Geography", category: "WEEKLY_TEST", targetGrades: "5th to 9th" },
  { id: "feb04", date: "2027-02-05", title: "Assembly by Std 6th", category: "ASSEMBLY" },
  { id: "feb05", date: "2027-02-08", title: "HWS - 8th & 9th Math/Alg/Geom", category: "HWS", targetGrades: "8th & 9th" },
  { id: "feb06", date: "2027-02-11", title: "Weekly test - 9th Geometry", category: "WEEKLY_TEST", targetGrades: "9th" },
  { id: "feb07", date: "2027-02-15", title: "Mahashivratri", category: "HOLIDAY" },
  { id: "feb08", date: "2027-02-18", title: "Weekly test - 5th to 9th English Lang. 2) National Science Day Activity", category: "WEEKLY_TEST", targetGrades: "5th to 9th" },
  { id: "feb09", date: "2027-02-19", title: "Chhatrapati Shivaji Maharaj Jayanti", category: "HOLIDAY" },
  { id: "feb10", date: "2027-02-22", title: "HWS - 8th & 9th - Marathi", category: "HWS", targetGrades: "8th & 9th" },
  { id: "feb11", date: "2027-02-25", title: "Marathi Diwas Celebrations", category: "ACTIVITY" },
  { id: "feb12", date: "2027-02-28", title: "Marathi Diwas / National Science Day", category: "ACTIVITY" },

  // ═══════════════════════ MARCH 2027 ═══════════════════════
  { id: "mar01", date: "2027-03-04", title: "Holi", category: "HOLIDAY" },
  { id: "mar02", date: "2027-03-05", title: "Final Exams for Std 9th Begins", category: "EXAM" },
  { id: "mar03", date: "2027-03-08", title: "HWS - 8th & 9th - Science/Sci 1/Sci 2", category: "HWS", targetGrades: "8th & 9th" },
  { id: "mar04", date: "2027-03-10", title: "9th STD Final Exams", category: "EXAM" },
  { id: "mar05", date: "2027-03-12", title: "CWS - 9th - Sci 2", category: "CWS", targetGrades: "9th" },
  { id: "mar06", date: "2027-03-13", title: "Story Telling", category: "ACTIVITY" },
  { id: "mar07", date: "2027-03-15", title: "HWS - 8th & 9th - History", category: "HWS", targetGrades: "8th & 9th" },
  { id: "mar08", date: "2027-03-18", title: "Final Exams for Std 9th Ends", category: "EXAM" },
  { id: "mar09", date: "2027-03-19", title: "Gudi Padwa", category: "HOLIDAY" },
  { id: "mar10", date: "2027-03-23", title: "9th STD Exams ENDS", category: "EXAM" },
  { id: "mar11", date: "2027-03-26", title: "Assembly by Std 5th", category: "ASSEMBLY" },
  { id: "mar12", date: "2027-03-30", title: "Open day for Std 9th", category: "PTA" },
];

// Helper to get events for a specific date
export function getEventsForDate(events: PlannerEvent[], dateStr: string): PlannerEvent[] {
  return events.filter((e) => e.date === dateStr);
}

// Storage key
export const PLANNER_STORAGE_KEY = "mvhs_planner_events";

// Load events from localStorage or use defaults
export function loadPlannerEvents(): PlannerEvent[] {
  if (typeof window === "undefined") return DEFAULT_PLANNER_EVENTS;
  const stored = localStorage.getItem(PLANNER_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_PLANNER_EVENTS;
    }
  }
  // First time: seed defaults
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(DEFAULT_PLANNER_EVENTS));
  return DEFAULT_PLANNER_EVENTS;
}

// Save events to localStorage
export function savePlannerEvents(events: PlannerEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(events));
}
