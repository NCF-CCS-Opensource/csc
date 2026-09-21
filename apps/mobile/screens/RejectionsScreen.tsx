import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { useRejectedScans, type RejectedScanRow } from "../lib/rejections";
import { colorOf, initialsOf } from "../lib/avatar";
import { useTheme } from "../lib/theme-context";
import { neoShadow, type ThemeColors } from "../lib/theme";

type Styles = ReturnType<typeof makeStyles>;

export function RejectionsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { data = [], isLoading, isError, refetch } = useRejectedScans();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rejected scans</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.text} style={styles.center} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.message}>Could not load rejected scans.</Text>
          <Text style={styles.retry} onPress={() => refetch()}>
            Tap to retry
          </Text>
        </View>
      ) : data.length === 0 ? (
        <Text style={styles.empty}>No rejected scans.</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(row) => row.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <RejectionRow row={item} styles={styles} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

function RejectionRow({ row, styles }: { row: RejectedScanRow; styles: Styles }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: row.student ? colorOf(row.student.name) : colors.dangerBg },
        ]}
      >
        {row.student ? (
          <Text style={styles.avatarText}>{initialsOf(row.student.name)}</Text>
        ) : (
          <AlertTriangle size={16} color={colors.danger} strokeWidth={2.5} />
        )}
      </View>

      <View style={styles.rowMain}>
        <Text style={styles.rowName} numberOfLines={1}>
          {row.student ? row.student.name : "Untrusted QR"}
        </Text>
        <Text style={styles.rowStudentId} numberOfLines={1}>
          {row.student ? `${row.student.studentId} · ${row.student.program}` : "No Student details"}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {row.eventName} ·{" "}
          {new Date(row.scannedAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
      </View>

      <View style={styles.reasonBadge}>
        <Text style={styles.rowReason}>{row.reason}</Text>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.neoBgPage, paddingTop: 16 },
    title: {
      fontSize: 26,
      color: c.text,
      letterSpacing: -0.5,
      paddingHorizontal: 20,
      marginBottom: 12,
      fontFamily: "DMSans_800ExtraBold",
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
    message: { fontSize: 14, color: c.textMuted, textAlign: "center", fontFamily: "DMSans_500Medium" },
    retry: { fontSize: 14, color: c.neoPrimary, fontFamily: "DMSans_700Bold" },
    empty: { fontSize: 14, color: c.textMuted, paddingHorizontal: 20, marginTop: 8, fontFamily: "DMSans_500Medium" },
    list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
    separator: { height: 0 },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      padding: 14,
      backgroundColor: c.neoBgSurface,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 14,
      ...neoShadow(c.mode, "sm"),
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
      borderWidth: 2,
      borderColor: c.neoBorder,
    },
    avatarText: { color: "#ffffff", fontSize: 14, fontFamily: "DMSans_700Bold" },
    rowMain: { flex: 1 },
    rowName: { fontSize: 15, color: c.text, fontFamily: "DMSans_700Bold" },
    rowStudentId: { fontSize: 13, color: c.textMuted, marginTop: 2, fontFamily: "DMSans_500Medium" },
    rowMeta: { fontSize: 12, color: c.textFaint, marginTop: 2, fontFamily: "DMSans_500Medium" },
    reasonBadge: {
      alignSelf: "flex-start",
      borderWidth: 2,
      borderColor: c.neoBorder,
      backgroundColor: c.dangerBg,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    rowReason: { fontSize: 11, color: c.danger, fontFamily: "DMSans_700Bold" },
  });
}
