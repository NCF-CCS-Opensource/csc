import NetInfo from "@react-native-community/netinfo";
import { RefreshCw, RotateCcw, Trash2, Wifi, WifiOff } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { networkStatus, type NetworkStatus } from "../lib/pendingTab";
import {
  deliveredScans,
  discardLegacyScans,
  discardScan,
  legacyScans,
  needsReviewScans,
  pendingScans,
  retryScan,
  type QueuedScan,
  type RecentScan,
} from "../lib/scanQueue";
import { flushQueue } from "../lib/syncScans";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";

type Styles = ReturnType<typeof makeStyles>;

function formatMeta(mode: string, isoDate: string): string {
  return `${mode} · ${new Date(isoDate).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function PendingScreen({
  officerId,
  queueRevision,
  onQueueChanged,
}: {
  officerId: string;
  queueRevision: number;
  onQueueChanged: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [needsReview, setNeedsReview] = useState<QueuedScan[]>([]);
  const [pending, setPending] = useState<QueuedScan[]>([]);
  const [delivered, setDelivered] = useState<RecentScan[]>([]);
  const [legacy, setLegacy] = useState<QueuedScan[]>([]);
  const [status, setStatus] = useState<NetworkStatus>("unknown");
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(() => {
    needsReviewScans(officerId).then(setNeedsReview);
    pendingScans(officerId).then(setPending);
    deliveredScans(officerId).then(setDelivered);
    legacyScans().then(setLegacy);
  }, [officerId]);

  useEffect(() => {
    load();
  }, [load, queueRevision]);

  useEffect(() => {
    NetInfo.fetch().then((state) => setStatus(networkStatus(state.isConnected)));
    return NetInfo.addEventListener((state) =>
      setStatus(networkStatus(state.isConnected)),
    );
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      await flushQueue(officerId, onQueueChanged);
    } finally {
      setSyncing(false);
      load();
    }
  }, [officerId, onQueueChanged, load]);

  const retry = useCallback(
    async (id: string) => {
      await retryScan(officerId, id);
      onQueueChanged();
      load();
    },
    [officerId, onQueueChanged, load],
  );

  const discard = useCallback(
    async (id: string) => {
      await discardScan(officerId, id);
      onQueueChanged();
      load();
    },
    [officerId, onQueueChanged, load],
  );

  const discardLegacy = useCallback(() => {
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
            load();
          },
        },
      ],
    );
  }, [onQueueChanged, load]);

  const online = status === "online";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pending</Text>

      <View
        style={[
          styles.banner,
          { backgroundColor: online ? colors.successBg : colors.warningBg },
        ]}
      >
        {online ? (
          <Wifi size={18} color={colors.success} strokeWidth={2} />
        ) : (
          <WifiOff size={18} color={colors.warning} strokeWidth={2} />
        )}
        <Text
          style={[
            styles.bannerText,
            { color: online ? colors.success : colors.warning },
          ]}
        >
          {status === "unknown"
            ? "Checking connection…"
            : online
              ? "Online"
              : "Offline — scans stay queued"}
        </Text>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.syncButton, syncing && styles.syncButtonBusy]}
        onPress={syncNow}
        disabled={syncing}
      >
        {syncing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <RefreshCw size={16} color="#ffffff" strokeWidth={2} />
            <Text style={styles.syncButtonText}>Sync now</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Needs Review</Text>
      {needsReview.length === 0 ? (
        <Text style={styles.empty}>Nothing needs review.</Text>
      ) : (
        <View style={styles.list}>
          {needsReview.map((scan, index) => (
            <View key={scan.id} style={index > 0 ? styles.separator : undefined}>
              <NeedsReviewCard
                scan={scan}
                styles={styles}
                colors={colors}
                onRetry={retry}
                onDiscard={discard}
              />
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Pending</Text>
      {pending.length === 0 ? (
        <Text style={styles.empty}>No scans waiting to sync.</Text>
      ) : (
        <View style={styles.list}>
          {pending.map((scan, index) => (
            <View key={scan.id} style={index > 0 ? styles.separator : undefined}>
              <PendingCard scan={scan} styles={styles} />
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Recently Delivered</Text>
      {delivered.length === 0 ? (
        <Text style={styles.empty}>No deliveries yet.</Text>
      ) : (
        <View style={styles.list}>
          {delivered.map((scan, index) => (
            <View key={scan.id} style={index > 0 ? styles.separator : undefined}>
              <DeliveredCard scan={scan} styles={styles} colors={colors} />
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Legacy</Text>
      {legacy.length === 0 ? (
        <Text style={styles.empty}>No older scans to clean up.</Text>
      ) : (
        <View style={styles.list}>
          <Text style={styles.legacyCopy}>
            {legacy.length} scan{legacy.length === 1 ? "" : "s"} from the
            previous storage format cannot be safely attributed or delivered.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.discardLegacyButton}
            onPress={discardLegacy}
          >
            <Trash2 size={14} color={colors.danger} strokeWidth={2} />
            <Text style={styles.discardButtonText}>Discard older scans</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function NeedsReviewCard({
  scan,
  styles,
  colors,
  onRetry,
  onDiscard,
}: {
  scan: QueuedScan;
  styles: Styles;
  colors: ThemeColors;
  onRetry: (id: string) => void;
  onDiscard: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {scan.type === "approve" ? "Approve" : "Reject"} scan
      </Text>
      <Text style={styles.cardMeta}>{formatMeta(scan.mode, scan.decisionAt)}</Text>
      {scan.error ? <Text style={styles.cardError}>{scan.error}</Text> : null}
      <View style={styles.cardActions}>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.retryButton}
          onPress={() => onRetry(scan.id)}
        >
          <RotateCcw size={14} color={colors.text} strokeWidth={2} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.discardButton}
          onPress={() => onDiscard(scan.id)}
        >
          <Trash2 size={14} color={colors.danger} strokeWidth={2} />
          <Text style={styles.discardButtonText}>Discard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PendingCard({ scan, styles }: { scan: QueuedScan; styles: Styles }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {scan.type === "approve" ? "Approve" : "Reject"} scan
      </Text>
      <Text style={styles.cardMeta}>{formatMeta(scan.mode, scan.decisionAt)}</Text>
      <Text style={styles.cardStatus}>Waiting to sync</Text>
    </View>
  );
}

function DeliveredCard({
  scan,
  styles,
  colors,
}: {
  scan: RecentScan;
  styles: Styles;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{scan.studentName}</Text>
      <Text style={styles.cardMeta}>
        {scan.eventName} · {formatMeta(scan.mode, scan.decisionAt)}
      </Text>
      <Text style={[styles.cardStatus, { color: colors.success }]}>Delivered</Text>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  const shadowColor = c.mode === "dark" ? "#000000" : "#111111";
  const hardShadow = (offset: number, elevation: number) => ({
    shadowColor,
    shadowOffset: { width: offset, height: offset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation,
  });
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.neoBgPage },
    content: { paddingTop: 16, paddingBottom: 32 },
    title: {
      fontSize: 26,
      fontFamily: "DMSans_800ExtraBold",
      color: c.text,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 12,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 10,
      ...hardShadow(3, 3),
    },
    bannerText: { fontFamily: "DMSans_700Bold", fontSize: 14 },
    syncButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginHorizontal: 20,
      marginBottom: 20,
      paddingVertical: 14,
      backgroundColor: c.neoPrimary,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 10,
      ...hardShadow(4, 4),
    },
    syncButtonBusy: { opacity: 0.7 },
    syncButtonText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15 },
    sectionTitle: {
      fontFamily: "DMSans_700Bold",
      fontSize: 16,
      color: c.text,
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    empty: {
      fontSize: 14,
      color: c.textMuted,
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    list: { paddingHorizontal: 20, marginBottom: 20 },
    separator: { marginTop: 12 },
    legacyCopy: { fontSize: 13, color: c.textMuted, marginBottom: 12 },
    card: {
      backgroundColor: c.neoBgSurface,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 10,
      padding: 14,
      ...hardShadow(4, 4),
    },
    cardTitle: { fontFamily: "DMSans_700Bold", fontSize: 15, color: c.text },
    cardMeta: { fontSize: 12, color: c.textMuted, marginTop: 4 },
    cardStatus: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 8,
      fontFamily: "DMSans_500Medium",
    },
    cardError: {
      fontSize: 12,
      color: c.danger,
      marginTop: 8,
      fontFamily: "DMSans_500Medium",
    },
    cardActions: { flexDirection: "row", gap: 10, marginTop: 12 },
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    retryButtonText: { fontFamily: "DMSans_500Medium", fontSize: 13, color: c.text },
    discardButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 2,
      borderColor: c.dangerBorder,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: c.dangerBg,
    },
    discardButtonText: { fontFamily: "DMSans_500Medium", fontSize: 13, color: c.danger },
    discardLegacyButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 2,
      borderColor: c.dangerBorder,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: c.dangerBg,
    },
  });
}
