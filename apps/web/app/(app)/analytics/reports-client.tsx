"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useWebStore } from "@/lib/store";

type Semester = {
  id: string;
  startDate: string;
  endDate: string;
  closedAt: Date | null;
};

type Event = {
  id: string;
  name: string;
  date: string;
  semesterId: string;
  isPast: boolean;
};

type Student = {
  id: string;
  name: string;
  studentId: string;
  program: string;
};

type ReportsClientProps = {
  semesters: Semester[];
  events: Event[];
  students?: Student[];
  currentCampusDate: string;
};

export function ReportsClient({ semesters, events, students = [], currentCampusDate }: ReportsClientProps) {
  // The Officer's picks are client-only state — nothing on the server derives
  // them — so they live in the web store rather than in this component, and
  // survive a trip away from Analytics and back (ADR 0013).
  const selections = useWebStore((s) => s.reportSelections);
  const setSelections = useWebStore((s) => s.setReportSelections);
  const { reportType, eventId: selectedEventId, studentId: selectedStudentId } = selections;
  const selectedSemesterId = selections.semesterId || (semesters[0]?.id ?? "");

  const setReportType = (reportType: string) => setSelections({ reportType });
  const setSelectedSemesterId = (semesterId: string) => setSelections({ semesterId });
  const setSelectedEventId = (eventId: string) => setSelections({ eventId });
  const setSelectedStudentId = (studentId: string) => setSelections({ studentId });

  const [notice, setNotice] = useState<string | null>(null);

  const filteredEvents = events.filter(
    (e) => e.semesterId === selectedSemesterId,
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // The picks a report needs before it can be asked for. Previously these were
  // early returns inside the click handler; as a mutation the click always
  // fires, so an incomplete selection has to disable the button instead — a
  // request built from a missing id would 404 and read as a broken report.
  const isSelectionComplete =
    reportType === "per-event"
      ? !!selectedEventId
      : reportType === "per-student"
        ? !!selectedStudentId && !!selectedSemesterId
        : !!selectedSemesterId;

  // A PDF is a slow write-shaped request: pending is a real state to show, and
  // a failure has to say so rather than looking like it is still generating.
  const generate = useMutation({
    mutationFn: generatePdf,
    onMutate: () => setNotice(null),
  });
  const isGenerating = generate.isPending;

  async function generatePdf() {
    const url =
      reportType === "per-event"
        ? `/api/reports/per-event/${selectedEventId}/pdf`
        : reportType === "per-student"
        ? `/api/reports/per-student/${selectedStudentId}/pdf?semesterId=${selectedSemesterId}`
        : reportType === "per-semester"
        ? `/api/reports/per-semester/${selectedSemesterId}/pdf`
        : `/api/reports/financial/${selectedSemesterId}/pdf`;

    const selectedSem = semesters.find((s) => s.id === selectedSemesterId);
    const filename =
      reportType === "per-event"
        ? `${selectedEvent?.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.pdf`
        : reportType === "per-student"
        ? `${selectedStudent?.studentId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-per-student-report.pdf`
        : reportType === "per-semester"
        ? `per-semester-report-${selectedSem?.startDate}-to-${selectedSem?.endDate}.pdf`
        : `financial-report-${selectedSem?.startDate}-to-${selectedSem?.endDate}.pdf`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to generate PDF");

    const aiStatus = res.headers.get("X-AI-Narrative-Status");
    if (aiStatus === "unavailable") {
      setNotice("AI analysis was unavailable. The PDF was generated without the narrative section.");
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Report Configuration</CardTitle>
          <CardDescription>
            Select the type of report and parameters to generate institutional PDF reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 max-w-sm">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={(val) => {
              setReportType(val);
              setNotice(null);
            }}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per-event">Per-Event Report</SelectItem>
                <SelectItem value="per-student">Per-Student Report</SelectItem>
                <SelectItem value="per-semester">Per-Semester Report</SelectItem>
                <SelectItem value="financial">Financial Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === "per-event" && (
            <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
              <div className="flex flex-col gap-2">
                <Label htmlFor="semester-select">Semester</Label>
                <Select
                  value={selectedSemesterId}
                  onValueChange={(val) => {
                    setSelectedSemesterId(val);
                    setSelectedEventId("");
                  }}
                >
                  <SelectTrigger id="semester-select">
                    <SelectValue placeholder="Select a semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem.id} value={sem.id}>
                        {sem.startDate} to {sem.endDate}
                        {sem.closedAt ? " (Closed)" : " (Open)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="event-select">Event</Label>
                <Select
                  value={selectedEventId}
                  onValueChange={setSelectedEventId}
                  disabled={!selectedSemesterId || filteredEvents.length === 0}
                >
                  <SelectTrigger id="event-select">
                    <SelectValue
                      placeholder={
                        filteredEvents.length === 0
                          ? "No events in semester"
                          : "Select an event"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEvents.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.name} ({ev.date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {reportType === "per-student" && (
            <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
              <div className="flex flex-col gap-2">
                <Label htmlFor="semester-select">Semester</Label>
                <Select
                  value={selectedSemesterId}
                  onValueChange={setSelectedSemesterId}
                >
                  <SelectTrigger id="semester-select">
                    <SelectValue placeholder="Select a semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem.id} value={sem.id}>
                        {sem.startDate} to {sem.endDate}
                        {sem.closedAt ? " (Closed)" : " (Open)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="student-select">Student</Label>
                <Select
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                  disabled={students.length === 0}
                >
                  <SelectTrigger id="student-select">
                    <SelectValue
                      placeholder={
                        students.length === 0 ? "No students found" : "Select a student"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.name} ({st.studentId} - {st.program})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {(reportType === "per-semester" || reportType === "financial") && (
            <div className="flex flex-col gap-2 max-w-sm">
              <Label htmlFor="semester-select">Semester</Label>
              <Select
                value={selectedSemesterId}
                onValueChange={setSelectedSemesterId}
              >
                <SelectTrigger id="semester-select">
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id}>
                      {sem.startDate} to {sem.endDate}
                      {sem.closedAt ? " (Closed)" : " (Open)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {((reportType === "per-event" && selectedEvent?.isPast) ||
            (reportType === "per-student" && selectedStudentId && selectedSemesterId) ||
            (reportType === "per-semester" && selectedSemesterId) ||
            (reportType === "financial" && selectedSemesterId)) && (


            <div className="flex flex-col gap-3 pt-2">
              <div>
                <Button
                  onClick={() => generate.mutate()}
                  disabled={isGenerating || !isSelectionComplete}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 size-4" />
                      Generate PDF Report
                    </>
                  )}
                </Button>
                {generate.isError && (
                  <div
                    role="alert"
                    className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300"
                  >
                    Failed to generate the PDF report. Try again.
                  </div>
                )}
                {notice && (
                  <div className="mt-3 rounded-md bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                    {notice}
                  </div>
                )}
              </div>
            </div>
          )}

          {reportType === "per-event" && selectedEvent && !selectedEvent.isPast && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
              Reports can only be generated for events whose calendar date has passed in Asia/Manila time. (Event date: {selectedEvent.date}, Campus date: {currentCampusDate})
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
