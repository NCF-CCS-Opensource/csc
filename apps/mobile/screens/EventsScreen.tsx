import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarGrid } from "../components/CalendarGrid";
import { apiFetch } from "../lib/api";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";

export type EventType = "whole_day" | "half_day";

export type EventRow = {
  id: string;
  name: string;
  type: EventType;
  halfDayPenaltyAmount: string;
  date: string;
  venue: string | null;
  attendeeCount: number;
};

type EventStatus = "Active" | "Upcoming" | "Completed";

function deriveStatus(date: string): EventStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return "Completed";
  if (date === today) return "Active";
  return "Upcoming";
}

type Styles = ReturnType<typeof makeStyles>;

function statusColors(status: EventStatus, c: ThemeColors): { bg: string; text: string } {
  switch (status) {
    case "Active":
      return { bg: c.successBg, text: c.success };
    case "Upcoming":
      return { bg: c.warningBg, text: c.warning };
    case "Completed":
      return { bg: c.neutralBg, text: c.neutral };
  }
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function EventsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [deleting, setDeleting] = useState<EventRow | null>(null);

  function load() {
    setLoading(true);
    apiFetch<{ events: EventRow[] }>("/api/events/mine")
      .then((data) => setEvents(data.events))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function onUpdated(updated: Omit<EventRow, "attendeeCount">) {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
  }

  function onDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddOpen(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.hint}>No Events yet.</Text>}
        renderItem={({ item }) => {
          const status = deriveStatus(item.date);
          const statusStyle = statusColors(status, colors);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.badgeText, { color: statusStyle.text }]}>{status}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {formatDate(item.date)}
                {item.venue ? ` | ${item.venue}` : ""}
              </Text>
              <Text style={styles.cardMeta}>
                {item.attendeeCount} Attendee{item.attendeeCount === 1 ? "" : "s"}
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.cardActionButton, styles.editButton]}
                  onPress={() => setEditing(item)}
                >
                  <Text style={styles.editButtonText}>✎ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cardActionButton, styles.deleteButton]}
                  onPress={() => setDeleting(item)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <EventFormModal
        visible={addOpen}
        mode="create"
        onClose={() => setAddOpen(false)}
        onSaved={load}
        colors={colors}
        styles={styles}
      />
      <EventFormModal
        visible={!!editing}
        mode="edit"
        event={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) => onUpdated(updated)}
        colors={colors}
        styles={styles}
      />
      <DeleteEventModal
        event={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          if (deleting) onDeleted(deleting.id);
        }}
        colors={colors}
        styles={styles}
      />
    </View>
  );
}

function DeleteEventModal({
  event,
  onClose,
  onDeleted,
  colors,
  styles,
}: {
  event: EventRow | null;
  onClose: () => void;
  onDeleted: () => void;
  colors: ThemeColors;
  styles: Styles;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!event) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/events/${event.id}`, { method: "DELETE" });
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={!!event} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Delete event?</Text>
          <Text style={styles.modalSubtitle}>
            "{event?.name}" will be permanently deleted. This action cannot be undone.
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.destructiveButton]}
              disabled={submitting}
              onPress={confirmDelete}
            >
              {submitting ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.submitButtonText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EventFormModal({
  visible,
  mode,
  event,
  onClose,
  onSaved,
  colors,
  styles,
}: {
  visible: boolean;
  mode: "create" | "edit";
  event?: EventRow | null;
  onClose: () => void;
  onSaved: (event: EventRow) => void;
  colors: ThemeColors;
  styles: Styles;
}) {
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [type, setType] = useState<EventType>("whole_day");
  const [penalty, setPenalty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(event?.name ?? "");
    setVenue(event?.venue ?? "");
    setDate(event?.date ?? null);
    setType(event?.type ?? "whole_day");
    setPenalty(event?.halfDayPenaltyAmount ?? "");
    setError(null);
  }, [visible, event]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const path = mode === "create" ? "/api/events" : `/api/events/${event!.id}`;
      const result = await apiFetch<{ event: EventRow }>(path, {
        method: mode === "create" ? "POST" : "PATCH",
        body: JSON.stringify({
          name,
          venue,
          date,
          type,
          halfDayPenaltyAmount: penalty,
        }),
      });
      onSaved(result.event);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{mode === "create" ? "New event" : "Edit event"}</Text>
          <Text style={styles.modalSubtitle}>
            {mode === "create" ? "Fill in the details below." : `Editing: "${event?.name}"`}
          </Text>

          <Text style={styles.fieldLabel}>Event name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Foundation Day Ceremony"
            placeholderTextColor={colors.textFaint}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.fieldLabel}>Venue / Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ST Quad"
            placeholderTextColor={colors.textFaint}
            value={venue}
            onChangeText={setVenue}
          />

          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.typeRow}>
            {(["whole_day", "half_day"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeOption, type === t && styles.typeOptionSelected]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeOptionText, type === t && styles.typeOptionTextSelected]}>
                  {t === "whole_day" ? "Whole day" : "Half day"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Half-day penalty amount</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 50.00"
            placeholderTextColor={colors.textFaint}
            keyboardType="decimal-pad"
            value={penalty}
            onChangeText={setPenalty}
          />

          <Text style={styles.fieldLabel}>Event date</Text>
          <CalendarGrid value={date} onChange={setDate} />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              disabled={submitting || !name || !date || !penalty}
              onPress={submit}
            >
              {submitting ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === "create" ? "+ Add event" : "Save edit"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 20,
      paddingBottom: 12,
    },
    title: { fontSize: 24, fontWeight: "700", color: c.text },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: { color: c.primaryText, fontSize: 20, lineHeight: 22 },
    list: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
    hint: { fontSize: 13, color: c.textMuted },
    error: { fontSize: 13, color: c.danger },
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 16,
      gap: 4,
      backgroundColor: c.card,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    cardTitle: { fontSize: 16, fontWeight: "600", flexShrink: 1, color: c.text },
    cardMeta: { fontSize: 13, color: c.textMuted },
    badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontWeight: "600" },
    cardActions: { flexDirection: "row", gap: 10, marginTop: 8 },
    cardActionButton: {
      flex: 1,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: "center",
      borderWidth: 1,
    },
    editButton: { borderColor: c.border, backgroundColor: c.card },
    editButtonText: { fontSize: 13, fontWeight: "600", color: c.text },
    deleteButton: { borderColor: c.dangerBorder, backgroundColor: c.dangerBg },
    deleteButtonText: { fontSize: 13, fontWeight: "600", color: c.danger },
    modalBackdrop: {
      flex: 1,
      backgroundColor: c.backdrop,
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: c.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      gap: 8,
      maxHeight: "90%",
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.handle,
      alignSelf: "center",
      marginBottom: 8,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", color: c.text },
    modalSubtitle: { fontSize: 13, color: c.textMuted, marginBottom: 8 },
    fieldLabel: { fontSize: 12, color: c.textMuted, marginTop: 8 },
    input: {
      backgroundColor: c.inputBackground,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      marginTop: 4,
      color: c.text,
    },
    typeRow: { flexDirection: "row", gap: 8, marginTop: 4 },
    typeOption: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: "center",
    },
    typeOptionSelected: { backgroundColor: c.primary, borderColor: c.primary },
    typeOptionText: { fontSize: 13, color: c.text },
    typeOptionTextSelected: { color: c.primaryText, fontWeight: "600" },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
    button: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
    cancelButton: { backgroundColor: c.cancelBackground },
    cancelButtonText: { fontWeight: "600", color: c.cancelText },
    submitButton: { backgroundColor: c.primary },
    submitButtonText: { color: c.primaryText, fontWeight: "600" },
    destructiveButton: { backgroundColor: c.danger },
  });
}
