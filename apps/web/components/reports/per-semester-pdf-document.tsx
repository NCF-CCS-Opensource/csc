import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { PerSemesterReportData } from "@/lib/reports";

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
  timestamp: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
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

export function PerSemesterPdfDocument({ data }: { data: PerSemesterReportData }) {
  const { semester, asOfTimestamp, overall, programBreakdown, eventSummary, clearanceReadiness, aiNarrative } = data;

  return (
    <Document title={`Per-Semester Report - ${semester.name}`} author="CCS Attendance System">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.institutionName}>Naga College Foundation, Inc.</Text>
          <Text style={styles.collegeName}>College of Computer Studies</Text>
          <Text style={styles.departmentName}>Computer Studies Student Council</Text>
          <Text style={styles.reportTitle}>Semester Attendance & Summary Report</Text>
          <Text style={styles.timestamp}>as of {asOfTimestamp}</Text>
        </View>

        {/* 1. Semester Details & Overall Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Semester Overview</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Semester Name:</Text>
              <Text style={styles.value}>{semester.name}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{semester.closedAt ? "Closed" : "Open"}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Date Range:</Text>
              <Text style={styles.value}>{semester.startDate} to {semester.endDate}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Registered Students:</Text>
              <Text style={styles.value}>{overall.totalRegisteredStudents}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Total Events:</Text>
              <Text style={styles.value}>{overall.totalEvents}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Overall Attendance Rate:</Text>
              <Text style={styles.value}>{overall.overallAttendanceRate.toFixed(1)}%</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Penalties Charged:</Text>
              <Text style={styles.value}>₱{overall.totalPenaltiesCharged.toFixed(2)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Payments Collected:</Text>
              <Text style={styles.value}>₱{overall.totalCollected.toFixed(2)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Outstanding Balance:</Text>
              <Text style={[styles.value, { fontFamily: "Helvetica-Bold", color: overall.totalOutstanding > 0 ? "#b91c1c" : "#15803d" }]}>
                ₱{overall.totalOutstanding.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Attendance by Program */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Attendance & Financials by Program</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCellHeader, { width: "16%" }]}>Program</Text>
              <Text style={[styles.tableCellHeader, { width: "14%", textAlign: "right" }]}>Students</Text>
              <Text style={[styles.tableCellHeader, { width: "18%", textAlign: "right" }]}>Attendance Rate</Text>
              <Text style={[styles.tableCellHeader, { width: "18%", textAlign: "right" }]}>Total Penalties</Text>
              <Text style={[styles.tableCellHeader, { width: "17%", textAlign: "right" }]}>Total Paid</Text>
              <Text style={[styles.tableCellHeader, { width: "17%", textAlign: "right" }]}>Outstanding</Text>
            </View>
            {programBreakdown.map((pb) => (
              <View key={pb.program} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "16%", fontFamily: "Helvetica-Bold" }]}>{pb.program}</Text>
                <Text style={[styles.tableCell, { width: "14%", textAlign: "right" }]}>{pb.studentCount}</Text>
                <Text style={[styles.tableCell, { width: "18%", textAlign: "right" }]}>{pb.attendanceRate.toFixed(1)}%</Text>
                <Text style={[styles.tableCell, { width: "18%", textAlign: "right" }]}>₱{pb.totalPenalties.toFixed(2)}</Text>
                <Text style={[styles.tableCell, { width: "17%", textAlign: "right" }]}>₱{pb.totalPaid.toFixed(2)}</Text>
                <Text style={[styles.tableCell, { width: "17%", textAlign: "right" }]}>₱{pb.outstanding.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. Event Summary Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Events Summary</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCellHeader, { width: "15%" }]}>Date</Text>
              <Text style={[styles.tableCellHeader, { width: "45%" }]}>Event Name</Text>
              <Text style={[styles.tableCellHeader, { width: "20%", textAlign: "right" }]}>Attendance Rate</Text>
              <Text style={[styles.tableCellHeader, { width: "20%", textAlign: "right" }]}>Penalties</Text>
            </View>
            {eventSummary.map((ev) => (
              <View key={ev.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "15%" }]}>{ev.date}</Text>
                <Text style={[styles.tableCell, { width: "45%", fontFamily: "Helvetica-Bold" }]}>{ev.name}</Text>
                <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>{ev.attendanceRate.toFixed(1)}%</Text>
                <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>₱{ev.penaltiesGenerated.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. AI-Generated Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. AI-Generated Analysis</Text>
          <Text style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>
            Analysis generated by AI from aggregate attendance data.
          </Text>
          <View style={{ backgroundColor: "#f8fafc", padding: 8, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4 }}>
            <Text style={{ fontSize: 8.5, color: "#334155", lineHeight: 1.4 }}>
              {aiNarrative ? aiNarrative : "AI analysis unavailable."}
            </Text>
          </View>
        </View>

        {/* 5. Clearance Readiness Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Clearance Readiness Overview</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCellHeader, { width: "40%" }]}>Program</Text>
              <Text style={[styles.tableCellHeader, { width: "30%", textAlign: "right" }]}>Cleared Students</Text>
              <Text style={[styles.tableCellHeader, { width: "30%", textAlign: "right" }]}>Not Cleared Students</Text>
            </View>
            {clearanceReadiness.map((cr) => (
              <View key={cr.program} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "40%", fontFamily: "Helvetica-Bold" }]}>{cr.program}</Text>
                <Text style={[styles.tableCell, { width: "30%", textAlign: "right", color: "#15803d" }]}>{cr.clearedCount}</Text>
                <Text style={[styles.tableCell, { width: "30%", textAlign: "right", color: cr.notClearedCount > 0 ? "#b91c1c" : "#334155" }]}>{cr.notClearedCount}</Text>
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
