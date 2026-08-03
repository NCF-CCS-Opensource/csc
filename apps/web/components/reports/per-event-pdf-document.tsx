import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { PerEventReportData } from "@/lib/reports";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    lineHeight: 1.4,
  },
  header: {
    textAlign: "center",
    marginBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f172a",
    paddingBottom: 8,
  },
  institutionName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  collegeName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    marginTop: 2,
  },
  departmentName: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#0f172a",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  gridItem: {
    width: "50%",
    marginBottom: 4,
    flexDirection: "row",
  },
  label: {
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    marginRight: 4,
  },
  value: {
    color: "#0f172a",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    minHeight: 18,
    alignItems: "center",
  },
  tableHeaderRow: {
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1.5,
    borderBottomColor: "#cbd5e1",
  },
  tableCellHeader: {
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    fontSize: 8,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 8,
    paddingHorizontal: 4,
  },
  signaturesContainer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    width: "30%",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#0f172a",
    marginTop: 35,
    paddingTop: 4,
    textAlign: "center",
  },
  signatureRole: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: "#334155",
  },
  signatureSubtext: {
    fontSize: 7,
    textAlign: "center",
    color: "#64748b",
  },
});

export function PerEventPdfDocument({ data }: { data: PerEventReportData }) {
  const { event, summary, programBreakdowns, studentDetails, totalPenalties } = data;

  return (
    <Document title={`Per-Event Report - ${event.name}`} author="CCS Attendance System">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.institutionName}>Naga College Foundation, Inc.</Text>
          <Text style={styles.collegeName}>College of Computer Studies</Text>
          <Text style={styles.departmentName}>Computer Studies Student Council</Text>
          <Text style={styles.reportTitle}>Event Attendance & Penalty Report</Text>
        </View>

        {/* 1. Event Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Event Details</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Event Name:</Text>
              <Text style={styles.value}>{event.name}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Semester:</Text>
              <Text style={styles.value}>{event.semesterName}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{event.date}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Event Type:</Text>
              <Text style={styles.value}>
                {event.type === "whole_day" ? "Whole Day" : "Half Day"}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Venue:</Text>
              <Text style={styles.value}>{event.venue || "N/A"}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Half-Day Penalty:</Text>
              <Text style={styles.value}>₱{Number(event.halfDayPenaltyAmount).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* 2. Attendance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Attendance Summary</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCellHeader, { width: "25%" }]}>Session</Text>
              <Text style={[styles.tableCellHeader, { width: "25%", textAlign: "right" }]}>
                Present
              </Text>
              <Text style={[styles.tableCellHeader, { width: "25%", textAlign: "right" }]}>
                Incomplete
              </Text>
              <Text style={[styles.tableCellHeader, { width: "25%", textAlign: "right" }]}>
                Absent
              </Text>
            </View>
            {event.type === "whole_day" && summary.amBreakdown && summary.pmBreakdown ? (
              <>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: "25%" }]}>Morning (AM)</Text>
                  <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                    {summary.amBreakdown.present}
                  </Text>
                  <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                    {summary.amBreakdown.incomplete}
                  </Text>
                  <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                    {summary.amBreakdown.absent}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: "25%" }]}>Afternoon (PM)</Text>
                  <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                    {summary.pmBreakdown.present}
                  </Text>
                  <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                    {summary.pmBreakdown.incomplete}
                  </Text>
                  <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                    {summary.pmBreakdown.absent}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "25%" }]}>Event Session</Text>
                <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                  {summary.presentHalves}
                </Text>
                <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                  {summary.incompleteHalves}
                </Text>
                <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                  {summary.absentHalves}
                </Text>
              </View>
            )}
            <View style={[styles.tableRow, { backgroundColor: "#f8fafc" }]}>
              <Text style={[styles.tableCellHeader, { width: "25%" }]}>Total Halves</Text>
              <Text style={[styles.tableCellHeader, { width: "25%", textAlign: "right" }]}>
                {summary.presentHalves}
              </Text>
              <Text style={[styles.tableCellHeader, { width: "25%", textAlign: "right" }]}>
                {summary.incompleteHalves}
              </Text>
              <Text style={[styles.tableCellHeader, { width: "25%", textAlign: "right" }]}>
                {summary.absentHalves}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 4, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 9 }}>
              Total Students: <Text style={{ fontFamily: "Helvetica-Bold" }}>{summary.totalStudents}</Text>
            </Text>
            <Text style={{ fontSize: 9 }}>
              Overall Attendance Rate:{" "}
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{summary.attendanceRate.toFixed(1)}%</Text>
            </Text>
          </View>
        </View>

        {/* 3. Program Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Program Breakdown</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCellHeader, { width: "20%" }]}>Program</Text>
              <Text style={[styles.tableCellHeader, { width: "20%", textAlign: "right" }]}>
                Students
              </Text>
              <Text style={[styles.tableCellHeader, { width: "20%", textAlign: "right" }]}>
                Present Halves
              </Text>
              <Text style={[styles.tableCellHeader, { width: "20%", textAlign: "right" }]}>
                Absent Halves
              </Text>
              <Text style={[styles.tableCellHeader, { width: "20%", textAlign: "right" }]}>
                Attendance Rate
              </Text>
            </View>
            {programBreakdowns.map((pb) => (
              <View key={pb.program} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "20%", fontFamily: "Helvetica-Bold" }]}>
                  {pb.program}
                </Text>
                <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
                  {pb.totalStudents}
                </Text>
                <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
                  {pb.presentHalves}
                </Text>
                <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
                  {pb.absentHalves}
                </Text>
                <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
                  {pb.rate.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. AI-Generated Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. AI-Generated Analysis</Text>
          <Text style={{ fontSize: 7, color: "#64748b", marginBottom: 4, italic: true } as any}>
            Analysis generated by AI from aggregate attendance data.
          </Text>
          <View style={{ backgroundColor: "#f8fafc", padding: 8, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4 }}>
            <Text style={{ fontSize: 8.5, color: "#334155", lineHeight: 1.4 }}>
              {data.aiNarrative ? data.aiNarrative : "AI analysis unavailable."}
            </Text>
          </View>
        </View>

        {/* 5. Financial & Penalty Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Financial & Penalty Summary</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6 }}>
            <Text style={{ fontSize: 9 }}>
              Total Penalties Generated:{" "}
              <Text style={{ fontFamily: "Helvetica-Bold", color: "#b91c1c" }}>
                ₱{totalPenalties.toFixed(2)}
              </Text>
            </Text>
          </View>
        </View>

        {/* 6. Detailed Attendance List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Detailed Attendance List</Text>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCellHeader, { width: "15%" }]}>Student ID</Text>
              <Text style={[styles.tableCellHeader, { width: "35%" }]}>Name</Text>
              <Text style={[styles.tableCellHeader, { width: "12%" }]}>Program</Text>
              <Text style={[styles.tableCellHeader, { width: "12%", textAlign: "center" }]}>
                AM
              </Text>
              <Text style={[styles.tableCellHeader, { width: "12%", textAlign: "center" }]}>
                PM
              </Text>
              <Text style={[styles.tableCellHeader, { width: "14%", textAlign: "right" }]}>
                Penalty
              </Text>
            </View>
            {studentDetails.map((student) => (
              <View key={student.studentId} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "15%" }]}>{student.studentId}</Text>
                <Text style={[styles.tableCell, { width: "35%", fontFamily: "Helvetica-Bold" }]}>
                  {student.name}
                </Text>
                <Text style={[styles.tableCell, { width: "12%" }]}>{student.program}</Text>
                <Text style={[styles.tableCell, { width: "12%", textAlign: "center" }]}>
                  {student.amStatus[0].toUpperCase() + student.amStatus.slice(1)}
                </Text>
                <Text style={[styles.tableCell, { width: "12%", textAlign: "center" }]}>
                  {event.type === "whole_day"
                    ? student.pmStatus[0].toUpperCase() + student.pmStatus.slice(1)
                    : "N/A"}
                </Text>
                <Text style={[styles.tableCell, { width: "14%", textAlign: "right" }]}>
                  {student.penaltyAmount > 0 ? `₱${student.penaltyAmount.toFixed(2)}` : "-"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Signature Lines */}
        <View style={styles.signaturesContainer} wrap={false}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureRole}>Prepared by:</Text>
              <Text style={styles.signatureSubtext}>CCS Student Council Officer</Text>
            </View>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureRole}>Noted by:</Text>
              <Text style={styles.signatureSubtext}>Governor, CCS Student Council</Text>
            </View>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureRole}>Approved by:</Text>
              <Text style={styles.signatureSubtext}>Dean, College of Computer Studies</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
