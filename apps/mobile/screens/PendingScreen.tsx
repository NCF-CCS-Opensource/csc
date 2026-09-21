import NetInfo from "@react-native-community/netinfo";
import { RefreshCw, RotateCcw, Trash2, Wifi, WifiOff } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { networkStatus, type NetworkStatus } from "../lib/pendingTab";
import {
  discardScan,
  needsReviewScans,
  retryScan,
  type QueuedScan,
} from "../lib/scanQueue";
import { flushQueue } from "../lib/syncScans";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";

type Styles = ReturnType<typeof makeStyles>;

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
  const [items, setItems] = useState<QueuedScan[]>([]);
  const [status, setStatus] = useState<NetworkStatus>("unknown");
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(() => {
    needsReviewScans(officerId).then(setItems);
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

  const online = status === "online";

  return (
    <View style={styles.container}>
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

      {items.length === 0 ? (
        <Text style={styles.empty}>Nothing needs review.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(scan) => scan.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <NeedsReviewCard
              scan={item}
              styles={styles}
              colors={colors}
              onRetry={retry}
              onDiscard={discard}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
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
      <Text style={styles.cardMeta}>
        {scan.mode} ·{" "}
        {new Date(scan.decisionAt).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </Text>
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
    container: { flex: 1, backgroundColor: c.neoBgPage, paddingTop: 16 },
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
    empty: { fontSize: 14, color: c.textMuted, paddingHorizontal: 20 },
    list: { paddingHorizontal: 20, paddingBottom: 24 },
    separator: { height: 12 },
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
  });
}
