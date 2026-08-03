"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

type ReportsClientProps = {
  semesters: Semester[];
  events: Event[];
  currentCampusDate: string;
};

export function ReportsClient({ semesters, events, currentCampusDate }: ReportsClientProps) {
  const [reportType, setReportType] = useState<string>("per-event");
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(
    semesters[0]?.id ?? "",
  );
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredEvents = events.filter(
    (e) => e.semesterId === selectedSemesterId,
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const handleGeneratePdf = () => {
    if (!selectedEventId) return;
    setIsGenerating(true);

    // Trigger download via route
    const link = document.createElement("a");
    link.href = `/api/reports/per-event/${selectedEventId}/pdf`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

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
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per-event">Per-Event Report</SelectItem>
                <SelectItem value="per-student">Per-Student Report (Coming soon)</SelectItem>
                <SelectItem value="per-semester">Per-Semester Report (Coming soon)</SelectItem>
                <SelectItem value="financial">Financial Report (Coming soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === "per-event" ? (
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
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
              This report type is coming soon.
            </div>
          )}

          {reportType === "per-event" && selectedEvent && (
            <div className="flex flex-col gap-3 pt-2">
              {!selectedEvent.isPast ? (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                  Reports can only be generated for events whose calendar date has passed in Asia/Manila time. (Event date: {selectedEvent.date}, Campus date: {currentCampusDate})
                </div>
              ) : (
                <div>
                  <Button onClick={handleGeneratePdf} disabled={isGenerating}>
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
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
