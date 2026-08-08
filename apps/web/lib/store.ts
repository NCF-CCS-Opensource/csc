import { create } from "zustand";

// The web application's client-only state: what an Officer has picked or typed
// that no server read derives (ADR 0013). Server-derived data lives in the
// Query cache, never here.
//
// Note for review: neither slice below has a second consumer today, and filter
// state of this shape would sit more naturally in the URL search parameters if
// it ever needs to be shareable or bookmarkable.
type ReportSelections = {
  reportType: string;
  semesterId: string;
  eventId: string;
  studentId: string;
};

type WebStore = {
  reportSelections: ReportSelections;
  setReportSelections: (patch: Partial<ReportSelections>) => void;

  // Keyed by Event so two Events' grids don't share one search box.
  attendanceSearch: Record<string, string>;
  setAttendanceSearch: (eventId: string, query: string) => void;
};

export const useWebStore = create<WebStore>((set) => ({
  reportSelections: {
    reportType: "per-event",
    semesterId: "",
    eventId: "",
    studentId: "",
  },
  setReportSelections: (patch) =>
    set((state) => ({ reportSelections: { ...state.reportSelections, ...patch } })),

  attendanceSearch: {},
  setAttendanceSearch: (eventId, query) =>
    set((state) => ({ attendanceSearch: { ...state.attendanceSearch, [eventId]: query } })),
}));
