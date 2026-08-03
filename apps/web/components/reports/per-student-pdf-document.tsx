import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { PerStudentReportData } from "@/lib/reports";

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

export function PerStudentPdfDocument({ data }: { data: PerStudentReportData }) {
  const { student, semesterName, asOfTimestamp, standing, clearanceStatus, eventsBreakdown, aiNarrative } = data;

  return (
    <Document title={`Per-Student Report - ${student.name}`} author="CCS Attendance System">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.institutionName}>Naga College Foundation, Inc.</Text>
          <Text style={styles.collegeName}>College of Computer Studies</Text>
          <Text style={styles.departmentName}>Computer Studies Student Council</Text>
          <Text style={styles.reportTitle}>Student Attendance & Clearance Standing Report</Text>
          <Text style={styles.timestamp}>as of {asOfTimestamp}</Text>
        </View>

        {/* 1. Student Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Student Details</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Student Name:</Text>
              <Text style={styles.value}>{student.name}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Student ID:</Text>
              <Text style={styles.value}>{student.studentId}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Program:</Text>
              <Text style={styles.value}>{student.program}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Semester:</Text>
              <Text style={styles.value}>{semesterName}</Text>
            </View>
          </View>
        </View>

        {/* 2. Standing & Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Semester Standing Summary</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Total Events:</Text>
              <Text style={styles.value}>{standing.totalEvents}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Attendance Rate:</Text>
              <Text style={styles.value}>{standing.attendanceRate.toFixed(1)}%</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Sessions Attended:</Text>
              <Text style={styles.value}>{standing.sessionsAttended}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Sessions Absent:</Text>
              <Text style={styles.value}>{standing.sessionsAbsent}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Penalties Charged:</Text>
              <Text style={styles.value}>₱{standing.totalPenaltiesCharged.toFixed(2)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Payments Made:</Text>
              <Text style={styles.value}>₱{standing.totalPaymentsMade.toFixed(2)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Outstanding Balance:</Text>
              <Text style={[styles.value, { fontFamily: "Helvetica-Bold", color: standing.outstandingBalance > 0 ? "#b91c1c" : "#15803d" }]}>
                ₱{standing.outstandingBalance.toFixed(2)}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Clearance Standing:</Text>
              <Text style={[styles.value, { fontFamily: "Helvetica-Bold", color: standing.outstandingBalance > 0 ? "#b91c1c" : "#15803d" }]}>
                {clearanceStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. AI-Generated Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. AI-Generated Analysis</Text>
          <Text style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>
            Analysis generated by AI from aggregate attendance data.
          </Text>
          <View style={{ backgroundColor: "#f8fafc", padding: 8, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4 }}>
            <Text style={{ fontSize: 8.5, color: "#334155", lineHeight: 1.4 }}>
              {aiNarrative ? aiNarrative : "AI analysis unavailable."}
            </Text>
          </View>
        </View>

        {/* 4. Per-Event Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Per-Event Attendance Breakdown</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCellHeader, { width: "15%" }]}>Date</Text>
              <Text style={[styles.tableCellHeader, { width: "35%" }]}>Event Name</Text>
              <Text style={[styles.tableCellHeader, { width: "15%", textAlign: "center" }]}>AM</Text>
              <Text style={[styles.tableCellHeader, { width: "15%", textAlign: "center" }]}>PM</Text>
              <Text style={[styles.tableCellHeader, { width: "20%", textAlign: "right" }]}>Penalty</Text>
            </View>
            {eventsBreakdown.map((ev) => (
              <View key={ev.eventId} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "15%" }]}>{ev.date}</Text>
                <Text style={[styles.tableCell, { width: "35%", fontFamily: "Helvetica-Bold" }]}>
                  {ev.eventName}
                </Text>
                <Text style={[styles.tableCell, { width: "15%", textAlign: "center" }]}>
                  {ev.amStatus[0].toUpperCase() + ev.amStatus.slice(1)}
                </Text>
                <Text style={[styles.tableCell, { width: "15%", textAlign: "center" }]}>
                  {ev.pmStatus[0].toUpperCase() + ev.pmStatus.slice(1)}
                </Text>
                <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
                  {ev.penaltyAmount > 0 ? `₱${ev.penaltyAmount.toFixed(2)}` : "-"}
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
