import { CameraView, useCameraPermissions } from "expo-camera";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "../components/Dropdown";
import { apiFetch } from "../lib/api";
import { colorOf, initialsOf } from "../lib/avatar";
import {
  addRecentScan,
  discardScan,
  enqueue,
  loadRecentScans,
  retryScan,
  type QueuedScan,
  type RecentScan,
} from "../lib/scanQueue";
import { flushQueue } from "../lib/syncScans";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";
import type { EventRow } from "./EventsScreen";

type Styles = ReturnType<typeof makeStyles>;

const BOOTH_MODES = [
  { value: "time_in_am", label: "Time-in AM" },
  { value: "time_out_am", label: "Time-out AM" },
  { value: "time_in_pm", label: "Time-in PM" },
  { value: "time_out_pm", label: "Time-out PM" },
] as const;
type BoothMode = (typeof BOOTH_MODES)[number]["value"];

type ScannedStudent = { name: string; studentId: string; program: string };

export function BoothScreen({
  officerId,
  pendingCount,
  queueRevision,
  onQueueChanged,
}: {
  officerId: string;
  pendingCount: number;
  queueRevision: number;
  onQueueChanged: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [mode, setMode] = useState<BoothMode | null>(null);
  const [scanned, setScanned] = useState<
    { raw: string; student: ScannedStudent; scannedAt: string } | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [selectedFailed, setSelectedFailed] = useState<RecentScan | null>(null);

  const refreshRecent = useCallback(() => {
    loadRecentScans(officerId).then(setRecentScans);
  }, [officerId]);

  useEffect(() => {
    apiFetch<{ events: EventRow[] }>("/api/events/mine")
      .then((data) => setEvents(data.events))
      .catch(() => {});
  }, []);

  useEffect(refreshRecent, [queueRevision, refreshRecent]);

  const activeEvent = events.find((e) => e.id === eventId) ?? null;
  const ready = !!activeEvent && !!mode;

  function onBarcodeScanned(result: { data: string }) {
    if (scanned) return; // modal already open — ignore repeat scans
    if (!ready) {
      setMessage("Select an event and time first");
      return;
    }
    try {
      const parsed = JSON.parse(result.data);
      if (
        typeof parsed?.name === "string" &&
        typeof parsed?.studentId === "string" &&
        typeof parsed?.program === "string"
      ) {
        setScanned({ raw: result.data, student: parsed, scannedAt: new Date().toISOString() });
        return;
      }
    } catch {
      // fall through to the error message below
    }
    setMessage("Unreadable QR code");
  }

  async function decide(decision: "accepted" | "rejected") {
    if (!scanned || !activeEvent || !mode) return;
    setSubmitting(true);
    const id = Crypto.randomUUID();
    const decisionAt = new Date().toISOString();
    const queued: QueuedScan = {
      id,
      officerId,
      type: decision === "accepted" ? "approve" : "reject",
      eventId: activeEvent.id,
      mode,
      qrPayload: scanned.raw,
      scannedAt: scanned.scannedAt,
      decisionAt,
      deliveryState: "pending",
    };
    try {
      await enqueue(queued);
      await addRecentScan({
        id,
        officerId,
        studentName: scanned.student.name,
        studentId: scanned.student.studentId,
        eventName: activeEvent.name,
        mode,
        scannedAt: scanned.scannedAt,
        decisionAt,
        decision,
        deliveryState: "pending",
      });
      refreshRecent();
      onQueueChanged();
      setMessage(
        decision === "accepted"
          ? `Queued ${scanned.student.name}`
          : `Queued rejection of ${scanned.student.name}`,
      );
      setScanned(null);
      flushQueue(officerId, onQueueChanged)
        .then(refreshRecent)
        .catch(() => {});
    } finally {
      setSubmitting(false);
    }
  }

  async function retrySelected() {
    if (!selectedFailed) return;
    await retryScan(officerId, selectedFailed.id);
    setSelectedFailed(null);
    refreshRecent();
    onQueueChanged();
    flushQueue(officerId, onQueueChanged)
      .then(refreshRecent)
      .catch(() => {});
  }

  function confirmDiscard() {
    if (!selectedFailed) return;
    const scan = selectedFailed;
    Alert.alert(
      "Discard failed scan?",
      "This removes only its queued delivery. The Recent scan stays visible until normal five-item eviction.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            await discardScan(officerId, scan.id);
            setSelectedFailed(null);
            refreshRecent();
            onQueueChanged();
          },
        },
      ],
    );
  }

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Camera access is needed to scan QR codes.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrap}>
        <CameraView
          style={styles.camera}
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={onBarcodeScanned}
        />
        <Text style={styles.cameraHint}>Align QR code within the frame</Text>
        <TouchableOpacity style={styles.torchButton} onPress={() => setTorch((t) => !t)}>
          <Text style={styles.torchIcon}>{torch ? "●" : "○"}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statusBar, ready ? styles.statusReady : styles.statusNotReady]}>
        <View style={[styles.statusDot, { backgroundColor: ready ? colors.success : colors.warning }]} />
        <Text style={styles.statusText}>{ready ? "Ready to scan" : "Select event & time"}</Text>
        <Text style={styles.statusHint}>Tap QR to begin</Text>
      </View>

      {pendingCount > 0 && (
        <Text style={styles.pending}>
          {pendingCount} scan{pendingCount === 1 ? "" : "s"} awaiting resolution
        </Text>
      )}
      {message && <Text style={styles.hint}>{message}</Text>}

      <View style={styles.dropdownRow}>
        <Dropdown
          label="Event"
          placeholder="Select event"
          value={eventId}
          options={events.map((e) => ({ label: e.name, value: e.id }))}
          onChange={setEventId}
        />
        <Dropdown
          label="Time"
          placeholder="Select options"
          value={mode}
          options={BOOTH_MODES.map((m) => ({ label: m.label, value: m.value }))}
          onChange={setMode}
        />
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>Recent scans</Text>
        {recentScans.length === 0 ? (
          <Text style={styles.emptyRecent}>No scans yet</Text>
        ) : (
          <ScrollView style={styles.recentList} nestedScrollEnabled>
            {recentScans.map((scan) => (
              <RecentScanRow
                key={scan.id}
                scan={scan}
                styles={styles}
                onPress={() =>
                  scan.deliveryState === "failed" && !scan.discarded && setSelectedFailed(scan)
                }
              />
            ))}
          </ScrollView>
        )}
      </View>

      <Modal visible={!!scanned} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            {scanned && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.avatar, { backgroundColor: colorOf(scanned.student.name) }]}>
                    <Text style={styles.avatarText}>{initialsOf(scanned.student.name)}</Text>
                  </View>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>{scanned.student.name}</Text>
                    <Text style={styles.modalSubtitle}>Student | {scanned.student.program}</Text>
                  </View>
                  <View style={styles.validBadge}>
                    <Text style={styles.validBadgeText}>Valid</Text>
                  </View>
                </View>

                <View style={styles.detailRows}>
                  <DetailRow label="Student ID" value={scanned.student.studentId} styles={styles} />
                  <DetailRow label="Event" value={activeEvent?.name ?? "—"} styles={styles} />
                  <DetailRow
                    label="Log type"
                    value={BOOTH_MODES.find((m) => m.value === mode)?.label ?? "—"}
                    styles={styles}
                  />
                  <DetailRow
                    label="Scanned at"
                    value={new Date(scanned.scannedAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    styles={styles}
                  />
                </View>

                {submitting ? (
                  <ActivityIndicator style={{ marginTop: 12 }} />
                ) : (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.reject]}
                      onPress={() => decide("rejected")}
                    >
                      <Text style={styles.rejectText}>✕ Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.accept]}
                      onPress={() => decide("accepted")}
                    >
                      <Text style={styles.acceptText}>✓ Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedFailed}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFailed(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.failedCard}>
            <Text style={styles.modalTitle}>Failed scan</Text>
            <Text style={styles.failedError}>{selectedFailed?.error ?? "Delivery was rejected."}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.reject]}
                onPress={confirmDiscard}
              >
                <Text style={styles.rejectText}>Discard scan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.accept]}
                onPress={retrySelected}
              >
                <Text style={styles.acceptText}>Retry</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setSelectedFailed(null)}>
              <Text style={styles.closeFailed}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RecentScanRow({
  scan,
  styles,
  onPress,
}: {
  scan: RecentScan;
  styles: Styles;
  onPress: () => void;
}) {
  const decision = scan.decision === "accepted" ? "✓ Accepted" : "✕ Rejected";
  const status = scan.discarded
    ? "! Failed · Discarded"
    : {
        pending: "◷ Pending",
        synced: "✓ Synced",
        failed: "! Failed",
      }[scan.deliveryState];
  const mode = BOOTH_MODES.find(({ value }) => value === scan.mode)?.label ?? scan.mode;

  return (
    <TouchableOpacity
      style={styles.recentRow}
      onPress={onPress}
      disabled={scan.deliveryState !== "failed" || scan.discarded}
      accessibilityHint={
        scan.deliveryState === "failed" && !scan.discarded
          ? "Opens delivery error and actions"
          : undefined
      }
    >
      <View style={styles.recentMain}>
        <Text style={styles.recentName} numberOfLines={1}>
          {scan.studentName} · {scan.studentId}
        </Text>
        <Text style={styles.recentMeta} numberOfLines={1}>
          {scan.eventName} · {mode} ·{" "}
          {new Date(scan.scannedAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
      </View>
      <View style={styles.recentState}>
        <Text
          style={scan.decision === "accepted" ? styles.acceptedLabel : styles.rejectedLabel}
        >
          {decision}
        </Text>
        <Text
          style={
            scan.deliveryState === "synced"
              ? styles.syncedLabel
              : scan.deliveryState === "failed"
                ? styles.failedLabel
                : styles.pendingLabel
          }
        >
          {status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function DetailRow({ label, value, styles }: { label: string; value: string; styles: Styles }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
    hint: { fontSize: 13, color: c.textMuted, paddingHorizontal: 16 },
    // Camera viewport stays black in both themes so framing reads over any scene.
    cameraWrap: { flex: 1, backgroundColor: "#000" },
    camera: { flex: 1 },
    cameraHint: {
      position: "absolute",
      top: 16,
      alignSelf: "center",
      color: "#fff",
      fontSize: 13,
      backgroundColor: "rgba(0,0,0,0.4)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    torchButton: {
      position: "absolute",
      bottom: 16,
      right: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    torchIcon: { color: "#fff", fontSize: 16 },
    statusBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
    },
    statusReady: { backgroundColor: c.successBg },
    statusNotReady: { backgroundColor: c.warningBg },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 13, fontWeight: "600", color: c.success },
    statusHint: { fontSize: 12, color: c.textMuted, marginLeft: "auto" },
    pending: { fontSize: 13, color: c.warning, fontWeight: "600", paddingHorizontal: 16, marginTop: 8 },
    dropdownRow: { flexDirection: "row", gap: 12, padding: 16 },
    recentSection: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    recentTitle: { fontSize: 14, fontWeight: "700", color: c.text, paddingVertical: 8 },
    emptyRecent: { fontSize: 13, color: c.textMuted, paddingBottom: 8 },
    recentList: { maxHeight: 210 },
    recentRow: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
    },
    recentMain: { flex: 1 },
    recentName: { fontSize: 12, fontWeight: "600", color: c.text },
    recentMeta: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    recentState: { alignItems: "flex-end", gap: 2 },
    acceptedLabel: { fontSize: 11, color: c.success, fontWeight: "600" },
    rejectedLabel: { fontSize: 11, color: c.danger, fontWeight: "600" },
    pendingLabel: { fontSize: 11, color: c.warning, fontWeight: "600" },
    syncedLabel: { fontSize: 11, color: c.success, fontWeight: "600" },
    failedLabel: { fontSize: 11, color: c.danger, fontWeight: "600" },
    button: {
      backgroundColor: c.primary,
      borderRadius: 6,
      paddingVertical: 10,
      paddingHorizontal: 20,
      alignItems: "center",
    },
    buttonText: { color: c.primaryText, fontWeight: "600" },
    modalBackdrop: {
      flex: 1,
      backgroundColor: c.backdrop,
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: c.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      gap: 12,
    },
    failedCard: {
      backgroundColor: c.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      gap: 12,
    },
    failedError: { fontSize: 13, color: c.danger },
    closeFailed: { color: c.textMuted, textAlign: "center", paddingVertical: 6 },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.handle,
      alignSelf: "center",
      marginBottom: 4,
    },
    modalHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    modalHeaderText: { flex: 1 },
    modalTitle: { fontSize: 16, fontWeight: "700", color: c.text },
    modalSubtitle: { fontSize: 12, color: c.textMuted },
    validBadge: { backgroundColor: c.successBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    validBadgeText: { fontSize: 12, fontWeight: "600", color: c.success },
    detailRows: { gap: 8 },
    detailRow: { flexDirection: "row", justifyContent: "space-between" },
    detailLabel: { fontSize: 13, color: c.textMuted },
    detailValue: { fontSize: 13, fontWeight: "600", color: c.text },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
    actionButton: { flex: 1, borderRadius: 8, paddingVertical: 14, alignItems: "center" },
    reject: { backgroundColor: c.dangerBg },
    rejectText: { color: c.danger, fontWeight: "600" },
    accept: { backgroundColor: c.primary },
    acceptText: { color: c.primaryText, fontWeight: "600" },
  });
}
