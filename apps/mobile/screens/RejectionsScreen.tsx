import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRejectedScans, type RejectedScanRow } from "../lib/rejections";
import { colorOf, initialsOf } from "../lib/avatar";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";

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
        <Text style={styles.avatarText}>
          {row.student ? initialsOf(row.student.name) : "!"}
        </Text>
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

      <Text style={styles.rowReason}>{row.reason}</Text>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, paddingTop: 16 },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: c.text,
      letterSpacing: -0.5,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
    message: { fontSize: 14, color: c.textMuted, textAlign: "center" },
    retry: { fontSize: 14, color: c.primary, fontWeight: "600" },
    empty: { fontSize: 14, color: c.textMuted, paddingHorizontal: 20, marginTop: 8 },
    list: { paddingHorizontal: 20, paddingBottom: 24 },
    separator: { height: 1, backgroundColor: c.borderSubtle },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    avatarText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },
    rowMain: { flex: 1 },
    rowName: { fontSize: 15, fontWeight: "600", color: c.text },
    rowStudentId: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    rowMeta: { fontSize: 12, color: c.textFaint, marginTop: 2 },
    rowReason: { fontSize: 12, fontWeight: "600", color: c.danger, alignSelf: "flex-start" },
  });
}
