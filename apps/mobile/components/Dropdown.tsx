import { useMemo, useState } from "react";
import { FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { useTheme } from "../lib/theme-context";
import { neoShadow, type ThemeColors } from "../lib/theme";

export function Dropdown<T extends string>({
  label,
  placeholder,
  value,
  options,
  onChange,
  refreshing,
  onRefresh,
}: {
  label: string;
  placeholder: string;
  value: T | null;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
  // Optional: lets a caller whose options come from a query (e.g. the shared
  // Events query) offer pull-to-refresh on the option list itself.
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={16} color={colors.text} strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.card} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dialogTitle}>Select {label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              refreshControl={
                onRefresh ? (
                  <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
                ) : undefined
              }
              ListEmptyComponent={<Text style={styles.empty}>No options</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.value === value && styles.optionSelected]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                  {item.value === value && <Check size={16} color={colors.text} strokeWidth={2.5} />}
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    label: { fontSize: 12, color: c.textMuted, marginBottom: 6, fontFamily: "DMSans_700Bold" },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.neoBgSurface,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      ...neoShadow(c.mode, "sm"),
    },
    triggerText: { fontSize: 14, color: c.text, flexShrink: 1, fontFamily: "DMSans_500Medium" },
    backdrop: {
      flex: 1,
      backgroundColor: c.backdrop,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    card: {
      width: "100%",
      backgroundColor: c.neoBgSurface,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 14,
      maxHeight: "60%",
      paddingVertical: 16,
      paddingHorizontal: 8,
      ...neoShadow(c.mode, "lg"),
    },
    dialogTitle: {
      fontSize: 15,
      color: c.text,
      paddingHorizontal: 16,
      paddingBottom: 10,
      marginBottom: 4,
      borderBottomWidth: 2,
      borderBottomColor: c.neoBorder,
      fontFamily: "DMSans_800ExtraBold",
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginVertical: 2,
    },
    optionSelected: {
      backgroundColor: c.neoYellow,
      borderWidth: 2,
      borderColor: c.neoBorder,
    },
    optionText: { fontSize: 15, color: c.text, fontFamily: "DMSans_500Medium" },
    optionTextSelected: { color: c.text, fontFamily: "DMSans_700Bold" },
    empty: { padding: 20, color: c.textFaint, textAlign: "center", fontFamily: "DMSans_400Regular" },
  });
}
