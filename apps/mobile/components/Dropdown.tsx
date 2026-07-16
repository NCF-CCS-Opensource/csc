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
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              ListEmptyComponent={<Text style={styles.empty}>No options</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    label: { fontSize: 12, color: c.textMuted, marginBottom: 4 },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.inputBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    triggerText: { fontSize: 13, color: c.text, flexShrink: 1 },
    chevron: { fontSize: 14, color: c.textMuted, marginLeft: 6 },
    backdrop: { flex: 1, backgroundColor: c.backdrop, justifyContent: "flex-end" },
    sheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: "60%",
      paddingVertical: 8,
    },
    option: { paddingVertical: 14, paddingHorizontal: 20 },
    optionText: { fontSize: 15, color: c.text },
    empty: { padding: 20, color: c.textFaint, textAlign: "center" },
  });
}
