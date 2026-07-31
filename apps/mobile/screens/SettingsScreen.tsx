import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../lib/api";
import { colorOf, initialsOf } from "../lib/avatar";
import {
  blockingScanCount,
  discardScan,
  discardLegacyScans,
  failedScans,
  legacyScans,
  retryScan,
  type QueuedScan,
} from "../lib/scanQueue";
import { supabase } from "../lib/supabase";
import { flushQueue } from "../lib/syncScans";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors, ThemePreference } from "../lib/theme";

type Me = { name: string; email: string };
type Styles = ReturnType<typeof makeStyles>;

const THEME_CYCLE: ThemePreference[] = ["light", "dark", "system"];
const THEME_LABEL: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

function SettingsRow({
  label,
  value,
  onPress,
  disabled,
  destructive,
  styles,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  styles: Styles;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={disabled || !onPress}>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive, disabled && styles.rowLabelDisabled]}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : (
        <Text style={[styles.rowChevron, disabled && styles.rowLabelDisabled]}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export function SettingsScreen({
  officerId,
  onQueueChanged,
}: {
  officerId: string;
  onQueueChanged: () => void;
}) {
  const { colors, preference, setPreference } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [me, setMe] = useState<Me | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    apiFetch<{ student: Me }>("/api/me")
      .then((data) => setMe(data.student))
      .catch(() => {});
  }, []);

  function cycleTheme() {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(preference) + 1) % THEME_CYCLE.length];
    setPreference(next);
  }

  function confirmDiscardLegacy() {
    Alert.alert(
      "Discard older scans?",
      "These scans cannot be safely attributed after the storage upgrade. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            await discardLegacyScans();
            onQueueChanged();
          },
        },
      ],
    );
  }

  function reviewFailedScan(scan: QueuedScan, total: number) {
    Alert.alert(
      `Failed scan${total > 1 ? ` (1 of ${total})` : ""}`,
      `${scan.error ?? "Delivery was rejected."}\nCaptured ${new Date(scan.scannedAt).toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard scan",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Discard failed scan?",
              "This removes only this queued delivery. This cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Discard",
                  style: "destructive",
                  onPress: async () => {
                    await discardScan(officerId, scan.id);
                    onQueueChanged();
                  },
                },
              ],
            ),
        },
        {
          text: "Retry",
          onPress: async () => {
            await retryScan(officerId, scan.id);
            onQueueChanged();
            flushQueue(officerId, onQueueChanged).catch(() => {});
          },
        },
      ],
    );
  }

  async function logout() {
    const [count, legacy, failed] = await Promise.all([
      blockingScanCount(officerId),
      legacyScans(),
      failedScans(officerId),
    ]);
    if (count === 0 && legacy.length === 0) {
      await supabase.auth.signOut();
      return;
    }

    if (count === 0) {
      Alert.alert(
        "Older scans quarantined",
        `${legacy.length} scan${legacy.length === 1 ? "" : "s"} from the previous storage format cannot be safely attributed or delivered. You may log out without inheriting them.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Discard older scans", style: "destructive", onPress: confirmDiscardLegacy },
          { text: "Log out", onPress: () => supabase.auth.signOut() },
        ],
      );
      return;
    }

    Alert.alert(
      "Can’t log out yet",
      `${count} scan${count === 1 ? "" : "s"} remain unresolved. Reconnect to retry Pending scans, or return to Scanner and review Failed rows.`,
      [
        ...(failed[0]
          ? [{ text: "Review Failed", onPress: () => reviewFailedScan(failed[0], failed.length) }]
          : []),
        { text: "OK" },
      ],
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.profileRow}>
        {me ? (
          <View style={[styles.avatar, { backgroundColor: colorOf(me.name) }]}>
            <Text style={styles.avatarText}>{initialsOf(me.name)}</Text>
          </View>
        ) : (
          <View style={styles.avatar} />
        )}
        <View>
          <Text style={styles.profileName}>{me?.name ?? "—"}</Text>
          <Text style={styles.profileEmail}>{me?.email ?? ""}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>GENERAL</Text>
      <View style={styles.section}>
        <SettingsRow label="Change theme" value={THEME_LABEL[preference]} onPress={cycleTheme} styles={styles} />
      </View>

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.section}>
        <SettingsRow label="Change password" onPress={() => setPasswordModalOpen(true)} styles={styles} />
        <SettingsRow label="Log out" destructive onPress={logout} styles={styles} />
      </View>

      <Text style={styles.version}>AttendKita v1.0.0</Text>

      <ChangePasswordModal
        visible={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        colors={colors}
        styles={styles}
      />
    </ScrollView>
  );
}

function ChangePasswordModal({
  visible,
  onClose,
  colors,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
  styles: Styles;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setPassword("");
    setConfirm("");
    setError(null);
    setSuccess(false);
  }

  async function submit() {
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Change password</Text>

          {success ? (
            <>
              <Text style={styles.successText}>Password updated.</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  reset();
                  onClose();
                }}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={colors.textFaint}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={colors.textFaint}
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    reset();
                    onClose();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  disabled={pending || !password || !confirm}
                  onPress={submit}
                >
                  {pending ? (
                    <ActivityIndicator color={colors.primaryText} />
                  ) : (
                    <Text style={styles.buttonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 20, gap: 8 },
    title: { fontSize: 24, fontWeight: "700", marginBottom: 12, color: c.text },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      marginBottom: 20,
    },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#fff", fontWeight: "700" },
    profileName: { fontSize: 15, fontWeight: "600", color: c.text },
    profileEmail: { fontSize: 12, color: c.textMuted },
    sectionLabel: { fontSize: 11, color: c.textFaint, fontWeight: "600", marginTop: 12, marginBottom: 6 },
    section: { borderWidth: 1, borderColor: c.border, borderRadius: 12, overflow: "hidden" },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      backgroundColor: c.card,
    },
    rowLabel: { fontSize: 14, color: c.text },
    rowLabelDisabled: { color: c.textDisabled },
    rowLabelDestructive: { color: c.danger },
    rowChevron: { color: c.chevron, fontSize: 16 },
    rowValue: { fontSize: 13, color: c.textFaint },
    version: { textAlign: "center", fontSize: 12, color: c.textDisabled, marginTop: 24 },
    modalBackdrop: { flex: 1, backgroundColor: c.backdrop, justifyContent: "flex-end" },
    modalCard: { backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 10 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.handle, alignSelf: "center", marginBottom: 4 },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4, color: c.text },
    input: { backgroundColor: c.inputBackground, borderRadius: 8, padding: 12, fontSize: 14, color: c.text },
    error: { fontSize: 13, color: c.danger },
    successText: { fontSize: 14, color: c.success },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
    button: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: "center", backgroundColor: c.primary },
    buttonText: { color: c.primaryText, fontWeight: "600" },
    cancelButton: { backgroundColor: c.cancelBackground },
    cancelButtonText: { fontWeight: "600", color: c.cancelText },
  });
}
