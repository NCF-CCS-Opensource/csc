import { Picker } from "@react-native-picker/picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../lib/api";
import type { EventRow } from "./EventsScreen";

const BOOTH_MODES = [
  { value: "time_in_am", label: "Time-in AM" },
  { value: "time_out_am", label: "Time-out AM" },
  { value: "time_in_pm", label: "Time-in PM" },
  { value: "time_out_pm", label: "Time-out PM" },
] as const;
type BoothMode = (typeof BOOTH_MODES)[number]["value"];

type ScannedStudent = { name: string; studentId: string; program: string };

export function BoothScreen({ event, onBack }: { event: EventRow; onBack: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<BoothMode>("time_in_am");
  const [scanned, setScanned] = useState<{ raw: string; student: ScannedStudent } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function onBarcodeScanned(result: { data: string }) {
    if (scanned) return; // modal already open — ignore repeat scans
    try {
      const parsed = JSON.parse(result.data);
      if (
        typeof parsed?.name === "string" &&
        typeof parsed?.studentId === "string" &&
        typeof parsed?.program === "string"
      ) {
        setScanned({ raw: result.data, student: parsed });
        return;
      }
    } catch {
      // fall through to the error message below
    }
    setMessage("Unreadable QR code");
  }

  async function approve() {
    if (!scanned) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/scan/approve", {
        method: "POST",
        body: JSON.stringify({
          eventId: event.id,
          mode,
          qrPayload: scanned.raw,
          scannedAt: new Date().toISOString(),
        }),
      });
      setMessage(`Recorded ${scanned.student.name}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to record scan");
    } finally {
      setSubmitting(false);
      setScanned(null);
    }
  }

  async function reject() {
    if (!scanned) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/scan/reject", {
        method: "POST",
        body: JSON.stringify({
          eventId: event.id,
          qrPayload: scanned.raw,
          scannedAt: new Date().toISOString(),
        }),
      });
      setMessage(`Rejected ${scanned.student.name}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to log rejection");
    } finally {
      setSubmitting(false);
      setScanned(null);
    }
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
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>{"< " + event.name}</Text>
      </TouchableOpacity>

      <Picker selectedValue={mode} onValueChange={(value) => setMode(value)}>
        {BOOTH_MODES.map((m) => (
          <Picker.Item key={m.value} label={m.label} value={m.value} />
        ))}
      </Picker>

      {message && <Text style={styles.hint}>{message}</Text>}

      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={onBarcodeScanned}
      />

      <Modal visible={!!scanned} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{scanned?.student.name}</Text>
            <Text>Student ID: {scanned?.student.studentId}</Text>
            <Text>Program: {scanned?.student.program}</Text>
            {submitting ? (
              <ActivityIndicator style={{ marginTop: 12 }} />
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.button, styles.reject]} onPress={reject}>
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={approve}>
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16, gap: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  back: { fontSize: 14, marginBottom: 4 },
  hint: { fontSize: 13, color: "#666" },
  camera: { flex: 1, borderRadius: 8, overflow: "hidden" },
  button: {
    backgroundColor: "#000",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  reject: { backgroundColor: "#c00" },
  buttonText: { color: "#fff", fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    gap: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
});
