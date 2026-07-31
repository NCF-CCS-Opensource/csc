import { CameraView, useCameraPermissions } from "expo-camera";
import * as Crypto from "expo-crypto";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";
import type { EventRow } from "./EventsScreen";

type Styles = ReturnType<typeof makeStyles>;

const BOOTH_MODES = [
  { value: "time_in_am", label: "Time in AM" },
  { value: "time_out_am", label: "Time out AM" },
  { value: "time_in_pm", label: "Time in PM" },
  { value: "time_out_pm", label: "Time out PM" },
] as const;
type BoothMode = (typeof BOOTH_MODES)[number]["value"];

type ScannedStudent = { name: string; studentId: string; program: string; avatarUrl?: string };

const CAT_AVATAR_URI = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=80";

export function BoothScreen({
  pendingCount,
  onScanQueued,
}: {
  pendingCount: number;
  onScanQueued: () => void;
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

  useEffect(() => {
    apiFetch<{ events: EventRow[] }>("/api/events/mine")
      .then((data) => setEvents(data.events))
      .catch(() => {});
  }, []);

  const activeEvent = events.find((e) => e.id === eventId) ?? null;
  const ready = !!activeEvent && !!mode;

  function onBarcodeScanned(result: { data: string }) {
    if (scanned) return;
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
      // fall through
    }
    // Fallback demo object if raw payload is not JSON
    setScanned({
      raw: result.data,
      student: {
        name: "Jaiho Francis Empanada",
        studentId: "24 - 06453",
        program: "BSCS - 3A",
        avatarUrl: CAT_AVATAR_URI,
      },
      scannedAt: new Date().toISOString(),
    });
  }

  function triggerDemoScan() {
    onBarcodeScanned({
      data: JSON.stringify({
        name: "Jaiho Francis Empanada",
        studentId: "24 - 06453",
        program: "BSCS - 3A",
        avatarUrl: CAT_AVATAR_URI,
      }),
    });
  }

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

        {/* Dark overlay header & scanner frame matching mockup */}
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraHint}>Align QR code within the frame</Text>

          <TouchableOpacity style={styles.scanFrame} activeOpacity={0.9} onPress={triggerDemoScan}>
            <View style={[styles.cornerBracket, styles.cornerBracketTL]} />
            <View style={[styles.cornerBracket, styles.cornerBracketTR]} />
            <View style={[styles.cornerBracket, styles.cornerBracketBL]} />
            <View style={[styles.cornerBracket, styles.cornerBracketBR]} />

            {/* Center laser line */}
            <View style={styles.laserLine} />

            {/* QR Icon outline in background */}
            <View style={styles.qrWatermark}>
              <View style={styles.qrCornerBlock} />
              <View style={styles.qrCornerBlock} />
              <View style={styles.qrCornerBlock} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.torchButton} onPress={() => setTorch((t) => !t)}>
            <Text style={styles.torchIcon}>⚡</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Control panel & status bar */}
      <View style={styles.controlPanel}>
        <View style={[styles.statusBar, ready ? styles.statusReady : styles.statusNotReady]}>
          <View style={[styles.statusDot, { backgroundColor: ready ? colors.success : colors.warning }]} />
          <Text style={[styles.statusText, { color: ready ? colors.success : colors.warning }]}>
            {ready ? "Ready to scan" : "Select event & time"}
          </Text>
          <Text style={styles.statusHint}>Tap QR to begin</Text>
        </View>

        {pendingCount > 0 && (
          <Text style={styles.pending}>
            {pendingCount} scan{pendingCount === 1 ? "" : "s"} pending sync
          </Text>
        )}
        {message && <Text style={styles.messageHint}>{message}</Text>}

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
      </View>

      {/* After-scan popup modal matching mockup 3 */}
      <Modal visible={!!scanned} transparent animationType="slide" onRequestClose={() => setScanned(null)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setScanned(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            {scanned && (
              <>
                <View style={styles.modalHeader}>
                  <Image
                    source={{ uri: scanned.student.avatarUrl || CAT_AVATAR_URI }}
                    style={styles.avatarImage}
                  />
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>{scanned.student.name}</Text>
                    <Text style={styles.modalSubtitle}>Student | {scanned.student.program}</Text>
                  </View>
                  <View style={styles.validBadge}>
                    <Text style={styles.validBadgeText}>Valid</Text>
                  </View>
                </View>

                {/* Light gray details table container matching mockup 3 */}
                <View style={styles.detailsContainer}>
                  <DetailRow label="Student ID" value={scanned.student.studentId} styles={styles} />
                  <View style={styles.divider} />
                  <DetailRow label="Event" value={activeEvent?.name ?? "Foundation Day"} styles={styles} />
                  <View style={styles.divider} />
                  <DetailRow
                    label="Log type"
                    value={BOOTH_MODES.find((m) => m.value === mode)?.label ?? "Time in AM"}
                    styles={styles}
                  />
                  <View style={styles.divider} />
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
                  <ActivityIndicator color={colors.text} style={{ marginTop: 12 }} />
                ) : (
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={reject}>
                      <Text style={styles.rejectText}>✕ Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={approve}>
                      <Text style={styles.acceptText}>✓ Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
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
    hint: { fontSize: 13, color: c.textMuted },
    messageHint: { fontSize: 13, color: c.textMuted, paddingHorizontal: 16, marginTop: 4 },
    cameraWrap: { flex: 0.85, maxHeight: 310, backgroundColor: "#000000" },
    camera: { flex: 1 },
    cameraOverlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    cameraHint: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "500",
      marginTop: 4,
    },
    scanFrame: {
      width: 170,
      height: 170,
      borderRadius: 20,
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    cornerBracket: {
      position: "absolute",
      width: 26,
      height: 26,
      borderColor: "#00d2ff",
    },
    cornerBracketTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
    cornerBracketTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
    cornerBracketBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
    cornerBracketBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 },
    laserLine: {
      width: 145,
      height: 2,
      backgroundColor: "#00d2ff",
      shadowColor: "#00d2ff",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 6,
    },
    qrWatermark: {
      position: "absolute",
      width: 60,
      height: 60,
      opacity: 0.15,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    qrCornerBlock: {
      width: 22,
      height: 22,
      borderWidth: 3,
      borderColor: "#ffffff",
      borderRadius: 4,
    },
    torchButton: {
      alignSelf: "flex-end",
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
    },

    torchIcon: { color: "#ffffff", fontSize: 18 },
    controlPanel: {
      backgroundColor: c.background,
      paddingVertical: 12,
    },
    statusBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      marginTop: 4,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    statusReady: { backgroundColor: c.successBg },
    statusNotReady: { backgroundColor: c.warningBg },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 14, fontWeight: "600" },
    statusHint: { fontSize: 13, color: c.textMuted, marginLeft: "auto" },
    pending: { fontSize: 13, color: c.warning, fontWeight: "600", paddingHorizontal: 16, marginTop: 8 },
    dropdownRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 12 },
    button: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 12,
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
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 28,
      gap: 16,
    },
    modalHandle: {
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.handle,
      alignSelf: "center",
      marginBottom: 4,
    },
    modalHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatarImage: { width: 46, height: 46, borderRadius: 12 },
    modalHeaderText: { flex: 1 },
    modalTitle: { fontSize: 16, fontWeight: "700", color: c.text },
    modalSubtitle: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    validBadge: { backgroundColor: c.successBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    validBadgeText: { fontSize: 12, fontWeight: "600", color: c.success },
    detailsContainer: {
      backgroundColor: c.inputBackground,
      borderRadius: 16,
      padding: 16,
      gap: 10,
    },
    detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    detailLabel: { fontSize: 13, color: c.textMuted },
    detailValue: { fontSize: 13, fontWeight: "600", color: c.text },
    divider: { height: 1, backgroundColor: c.borderSubtle },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
    actionButton: { flex: 1, borderRadius: 12, paddingVertical: 15, alignItems: "center" },
    rejectButton: { backgroundColor: c.dangerBg },
    rejectText: { color: c.danger, fontWeight: "600", fontSize: 15 },
    acceptButton: { backgroundColor: c.primary },
    acceptText: { color: c.primaryText, fontWeight: "600", fontSize: 15 },
  });
}
