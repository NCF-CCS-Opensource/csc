import { CameraView, useCameraPermissions } from "expo-camera";
import * as Crypto from "expo-crypto";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "../components/Dropdown";
import { apiFetch } from "../lib/api";
import { colorOf, initialsOf } from "../lib/avatar";
import { enqueue } from "../lib/scanQueue";
import { flushQueue } from "../lib/syncScans";
import type { EventRow } from "./EventsScreen";

const BOOTH_MODES = [
  { value: "time_in_am", label: "Time-in AM" },
  { value: "time_out_am", label: "Time-out AM" },
  { value: "time_in_pm", label: "Time-in PM" },
  { value: "time_out_pm", label: "Time-out PM" },
] as const;
type BoothMode = (typeof BOOTH_MODES)[number]["value"];

type ScannedStudent = { name: string; studentId: string; program: string };

export function BoothScreen({
  pendingCount,
  onScanQueued,
}: {
  pendingCount: number;
  onScanQueued: () => void;
}) {
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

  useEffect(() => {
    apiFetch<{ events: EventRow[] }>("/api/events/mine")
      .then((data) => setEvents(data.events))
      .catch(() => {});
  }, []);

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

  // Approve/reject always queue locally first, then attempt an immediate
  // sync — so the flow works the same whether online or offline, and a scan
  // is never lost to a dropped connection mid-request. Each scan is tagged
  // with a client UUID so a retried sync upserts instead of duplicating.
  async function approve() {
    if (!scanned || !activeEvent || !mode) return;
    setSubmitting(true);
    await enqueue({
      id: Crypto.randomUUID(),
      type: "approve",
      eventId: activeEvent.id,
      mode,
      qrPayload: scanned.raw,
      scannedAt: scanned.scannedAt,
    });
    onScanQueued();
    setMessage(`Queued ${scanned.student.name}`);
    setSubmitting(false);
    setScanned(null);
    flushQueue(onScanQueued).catch(() => {});
  }

  async function reject() {
    if (!scanned || !activeEvent) return;
    setSubmitting(true);
    await enqueue({
      id: Crypto.randomUUID(),
      type: "reject",
      eventId: activeEvent.id,
      qrPayload: scanned.raw,
      scannedAt: scanned.scannedAt,
    });
    onScanQueued();
    setMessage(`Queued rejection of ${scanned.student.name}`);
    setSubmitting(false);
    setScanned(null);
    flushQueue(onScanQueued).catch(() => {});
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
        <View style={[styles.statusDot, { backgroundColor: ready ? "#16a34a" : "#d97706" }]} />
        <Text style={styles.statusText}>{ready ? "Ready to scan" : "Select event & time"}</Text>
        <Text style={styles.statusHint}>Tap QR to begin</Text>
      </View>

      {pendingCount > 0 && (
        <Text style={styles.pending}>
          {pendingCount} scan{pendingCount === 1 ? "" : "s"} pending sync
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
                  <DetailRow label="Student ID" value={scanned.student.studentId} />
                  <DetailRow label="Event" value={activeEvent?.name ?? "—"} />
                  <DetailRow
                    label="Log type"
                    value={BOOTH_MODES.find((m) => m.value === mode)?.label ?? "—"}
                  />
                  <DetailRow
                    label="Scanned at"
                    value={new Date(scanned.scannedAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  />
                </View>

                {submitting ? (
                  <ActivityIndicator style={{ marginTop: 12 }} />
                ) : (
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.actionButton, styles.reject]} onPress={reject}>
                      <Text style={styles.rejectText}>✕ Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.accept]} onPress={approve}>
                      <Text style={styles.acceptText}>✓ Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  hint: { fontSize: 13, color: "#666", paddingHorizontal: 16 },
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
  statusReady: { backgroundColor: "#dcfce7" },
  statusNotReady: { backgroundColor: "#fef3c7" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: "600", color: "#166534" },
  statusHint: { fontSize: 12, color: "#666", marginLeft: "auto" },
  pending: { fontSize: 13, color: "#b45309", fontWeight: "600", paddingHorizontal: 16, marginTop: 8 },
  dropdownRow: { flexDirection: "row", gap: 12, padding: 16 },
  button: {
    backgroundColor: "#000",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  modalHeaderText: { flex: 1 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalSubtitle: { fontSize: 12, color: "#888" },
  validBadge: { backgroundColor: "#dcfce7", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  validBadgeText: { fontSize: 12, fontWeight: "600", color: "#15803d" },
  detailRows: { gap: 8 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 13, color: "#888" },
  detailValue: { fontSize: 13, fontWeight: "600" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  actionButton: { flex: 1, borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  reject: { backgroundColor: "#fee2e2" },
  rejectText: { color: "#dc2626", fontWeight: "600" },
  accept: { backgroundColor: "#000" },
  acceptText: { color: "#fff", fontWeight: "600" },
});
