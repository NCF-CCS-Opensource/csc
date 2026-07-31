import { useMemo, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";

export function Dropdown<T extends string>({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: T | null;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
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
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.card} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dialogTitle}>Select {label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
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
                  {item.value === value && <Text style={styles.checkMark}>✓</Text>}
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
    label: { fontSize: 12, color: c.textMuted, marginBottom: 6 },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    triggerText: { fontSize: 14, color: c.text, flexShrink: 1, fontWeight: "400" },
    chevron: { fontSize: 14, color: c.textMuted, marginLeft: 6 },
    backdrop: {
      flex: 1,
      backgroundColor: c.backdrop,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    card: {
      width: "100%",
      backgroundColor: c.card,
      borderRadius: 20,
      maxHeight: "60%",
      paddingVertical: 16,
      paddingHorizontal: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    dialogTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: c.text,
      paddingHorizontal: 16,
      paddingBottom: 10,
      marginBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginVertical: 2,
    },
    optionSelected: {
      backgroundColor: c.inputBackground,
    },
    optionText: { fontSize: 15, color: c.text, fontWeight: "500" },
    optionTextSelected: { fontWeight: "700", color: c.text },
    checkMark: { fontSize: 15, color: c.text, fontWeight: "700" },
    empty: { padding: 20, color: c.textFaint, textAlign: "center" },
  });
}
