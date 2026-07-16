import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CalendarGrid({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (date: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goPrevMonth} hitSlop={8}>
          <Text style={styles.nav}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={goNextMonth} hitSlop={8}>
          <Text style={styles.nav}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;
          const dateStr = toDateString(viewYear, viewMonth, day);
          const selected = dateStr === value;
          return (
            <TouchableOpacity key={i} style={styles.cell} onPress={() => onChange(dateStr)}>
              <View style={[styles.dayCircle, selected && styles.daySelected]}>
                <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%` as const;

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { gap: 8 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    nav: { fontSize: 20, paddingHorizontal: 8, color: c.text },
    monthLabel: { fontSize: 14, fontWeight: "600", color: c.text },
    weekRow: { flexDirection: "row" },
    weekday: { width: CELL_SIZE, textAlign: "center", fontSize: 12, color: c.textFaint },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    cell: { width: CELL_SIZE, alignItems: "center", justifyContent: "center", paddingVertical: 4 },
    dayCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    daySelected: { backgroundColor: c.primary },
    dayText: { fontSize: 13, color: c.text },
    dayTextSelected: { color: c.primaryText, fontWeight: "600" },
  });
}
