import { useAuth } from "@clerk/clerk-expo";
import { LogOut, Palette, type LucideIcon } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch, endOfficerSession } from "../lib/api";
import { colorOf, initialsOf } from "../lib/avatar";
import {
  blockingScanCount,
  discardScan,
  discardLegacyScans,
  legacyScans,
  needsReviewScans,
  retryScan,
  type QueuedScan,
} from "../lib/scanQueue";
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
  icon,
  iconBg,
  iconColor,
  label,
  value,
  onPress,
  disabled,
  destructive,
  styles,
}: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  styles: Styles;
}) {
  const Icon = icon;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={disabled || !onPress}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </View>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive, disabled && styles.rowLabelDisabled]}>
          {label}
        </Text>
      </View>
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
  const { signOut } = useAuth();

  const endSession = () => endOfficerSession(signOut);

  useEffect(() => {
    apiFetch<Me>("/v1/api/student/identity", { method: "POST" })
      .then(setMe)
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

  function reviewNeedsReviewScan(scan: QueuedScan, total: number) {
    Alert.alert(
      `Needs Review${total > 1 ? ` (1 of ${total})` : ""}`,
      `${scan.error ?? "Delivery was rejected."}\nCaptured ${new Date(scan.scannedAt).toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard scan",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Discard Needs Review scan?",
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
    const [count, legacy, needsReview] = await Promise.all([
      blockingScanCount(officerId),
      legacyScans(),
      needsReviewScans(officerId),
    ]);
    if (count === 0 && legacy.length === 0) {
      await endSession();
      return;
    }

    if (count === 0) {
      Alert.alert(
        "Older scans quarantined",
        `${legacy.length} scan${legacy.length === 1 ? "" : "s"} from the previous storage format cannot be safely attributed or delivered. You may log out without inheriting them.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Discard older scans", style: "destructive", onPress: confirmDiscardLegacy },
          { text: "Log out", onPress: () => void endSession() },
        ],
      );
      return;
    }

    Alert.alert(
      "Can’t log out yet",
      `${count} scan${count === 1 ? "" : "s"} remain unresolved. Reconnect to retry Pending scans, or return to Scanner and review Needs Review rows.`,
      [
        ...(needsReview[0]
          ? [{
              text: "Review Needs Review",
              onPress: () =>
                reviewNeedsReviewScan(needsReview[0], needsReview.length),
            }]
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
        <View style={styles.profileMeta}>
          <Text style={styles.profileName}>{me?.name ?? "—"}</Text>
          <Text style={styles.profileEmail}>{me?.email ?? ""}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>GENERAL</Text>
      <View style={styles.section}>
        <SettingsRow
          icon={Palette}
          iconBg={colors.iconPurpleBg}
          iconColor={colors.iconPurple}
          label="Change theme"
          value={THEME_LABEL[preference]}
          onPress={cycleTheme}
          styles={styles}
        />
      </View>

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.section}>
        <SettingsRow
          icon={LogOut}
          iconBg={colors.iconPinkBg}
          iconColor={colors.iconPink}
          label="Log out"
          destructive
          onPress={logout}
          styles={styles}
        />
      </View>

      <Text style={styles.version}>AttendKita v1.0.0</Text>

    </ScrollView>
  );
}

// Zero-blur hard offset shadow per apps/mobile/DESIGN.md — dark mode keeps a
// black shadow even though the border flips to white.
function hardShadow(c: ThemeColors, size: 3 | 4 | 6) {
  return {
    shadowColor: c.mode === "dark" ? "#000000" : "#111111",
    shadowOffset: { width: size, height: size },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: size,
  } as const;
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.neoBgPage },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
    title: { fontSize: 28, fontFamily: "DMSans_800ExtraBold", marginBottom: 16, color: c.text, letterSpacing: -0.5 },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: c.neoBgSurface,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      ...hardShadow(c, 4),
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.neoBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
    profileMeta: { flex: 1 },
    profileName: { fontSize: 16, fontFamily: "DMSans_700Bold", color: c.text },
    profileEmail: { fontSize: 13, fontFamily: "DMSans_400Regular", color: c.textMuted, marginTop: 2 },
    sectionLabel: {
      fontSize: 12,
      color: c.textMuted,
      fontFamily: "DMSans_700Bold",
      marginTop: 18,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    section: {
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: c.neoBgSurface,
      ...hardShadow(c, 4),
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      backgroundColor: c.neoBgSurface,
    },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.neoBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: { fontSize: 15, color: c.text, fontFamily: "DMSans_500Medium" },
    rowLabelDisabled: { color: c.textDisabled },
    rowLabelDestructive: { color: c.danger, fontFamily: "DMSans_500Medium" },
    rowChevron: { color: c.chevron, fontSize: 18 },
    rowValue: { fontSize: 14, fontFamily: "DMSans_500Medium", color: c.textMuted },
    version: { textAlign: "center", fontSize: 13, fontFamily: "DMSans_400Regular", color: c.textFaint, marginTop: 32, marginBottom: 12 },
    modalBackdrop: { flex: 1, backgroundColor: c.backdrop, justifyContent: "flex-end" },
    modalCard: { backgroundColor: c.neoBgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.handle, alignSelf: "center", marginBottom: 4 },
    modalTitle: { fontSize: 20, fontFamily: "DMSans_700Bold", marginBottom: 4, color: c.text },
    input: { backgroundColor: c.inputBackground, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: "DMSans_400Regular", color: c.text },
    error: { fontSize: 13, fontFamily: "DMSans_500Medium", color: c.danger },
    successText: { fontSize: 14, fontFamily: "DMSans_500Medium", color: c.success },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 8, width: "100%" },
    button: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: c.neoPrimary,
      borderWidth: 2,
      borderColor: c.neoBorder,
      ...hardShadow(c, 3),
    },
    buttonText: { color: "#FFFFFF", fontFamily: "DMSans_700Bold" },
    cancelButton: { backgroundColor: c.cancelBackground, borderWidth: 2, borderColor: c.neoBorder },
    cancelButtonText: { fontFamily: "DMSans_700Bold", color: c.cancelText },
  });
}
