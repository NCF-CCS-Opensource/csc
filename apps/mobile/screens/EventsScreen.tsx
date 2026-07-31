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
  totalCapacity?: number;
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
        <ActivityIndicator color={colors.text} />
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
          const capacity = item.totalCapacity || 360;
          const ratio = Math.min(1, Math.max(0, item.attendeeCount / capacity));
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

              <View style={styles.attendeeRow}>
                <Text style={styles.attendeeIcon}>👤</Text>
                <Text style={styles.attendeeText}>
                  {item.attendeeCount} / {capacity} Attendees
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
              </View>

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
                  <Text style={styles.deleteButtonText}>🗑 Delete</Text>
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
    <Modal visible={!!event} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.deleteModalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />

          <View style={styles.deleteIconBadge}>
            <Text style={styles.deleteIconText}>🗑</Text>
          </View>

          <Text style={styles.deleteModalTitle}>Delete event?</Text>
          <Text style={styles.deleteModalSubtitle}>
            "{event?.name}" will be permanently deleted. This action cannot be undone.
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteConfirmButton]}
              disabled={submitting}
              onPress={confirmDelete}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
  const [penalty, setPenalty] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(event?.name ?? "");
    setVenue(event?.venue ?? "");
    setDate(event?.date ?? "2026-06-10");
    setType(event?.type ?? "whole_day");
    setPenalty(event?.halfDayPenaltyAmount ?? "0");
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{mode === "create" ? "New event" : "Edit event"}</Text>
          <Text style={styles.modalSubtitle}>
            {mode === "create" ? "Fill in the details below." : `Editing: "${event?.name}"`}
          </Text>

          <Text style={styles.fieldLabel}>Event name</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>📅</Text>
            <TextInput
              style={styles.inputWithIcon}
              placeholder="e.g. Foundation Day Ceremony"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={styles.fieldLabel}>Venue / Location</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>📍</Text>
            <TextInput
              style={styles.inputWithIcon}
              placeholder="e.g. ST Quad"
              placeholderTextColor={colors.textMuted}
              value={venue}
              onChangeText={setVenue}
            />
          </View>

          <Text style={styles.fieldLabel}>Event date</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>📅</Text>
            <Text style={styles.datePickerValueText}>
              {date ? formatDate(date) : "Select date"}
            </Text>
            <Text style={styles.dropdownChevron}>⌄</Text>
          </View>

          <View style={styles.calendarContainer}>
            <CalendarGrid value={date} onChange={setDate} />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              disabled={submitting || !name || !date}
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
        </TouchableOpacity>
      </TouchableOpacity>
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
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: { fontSize: 26, fontWeight: "700", color: c.text, letterSpacing: -0.5 },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: { color: c.primaryText, fontSize: 22, fontWeight: "500", marginTop: -2 },
    list: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
    hint: { fontSize: 14, color: c.textMuted, textAlign: "center", marginTop: 24 },
    error: { fontSize: 13, color: c.danger, textAlign: "center", marginVertical: 4 },
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      gap: 4,
      backgroundColor: c.card,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    cardTitle: { fontSize: 16, fontWeight: "700", flexShrink: 1, color: c.text },
    cardMeta: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontWeight: "600" },
    attendeeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
    attendeeIcon: { fontSize: 13, color: c.textMuted },
    attendeeText: { fontSize: 13, color: c.textMuted },
    progressTrack: {
      height: 5,
      backgroundColor: c.borderSubtle,
      borderRadius: 2.5,
      marginVertical: 10,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: c.text,
      borderRadius: 2.5,
    },
    cardActions: { flexDirection: "row", gap: 10, marginTop: 4 },
    cardActionButton: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    editButton: { borderWidth: 1, borderColor: c.border, backgroundColor: c.card },
    editButtonText: { fontSize: 13, fontWeight: "600", color: c.text },
    deleteButton: { backgroundColor: c.dangerBg },
    deleteButtonText: { fontSize: 13, fontWeight: "600", color: c.danger },
    modalBackdrop: {
      flex: 1,
      backgroundColor: c.backdrop,
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: c.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 8,
      maxHeight: "90%",
    },
    deleteModalCard: {
      backgroundColor: c.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
      alignItems: "center",
      gap: 8,
    },
    deleteIconBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.dangerBg,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 8,
    },
    deleteIconText: { fontSize: 22 },
    deleteModalTitle: { fontSize: 18, fontWeight: "700", color: c.text },
    deleteModalSubtitle: { fontSize: 13, color: c.textMuted, textAlign: "center", paddingHorizontal: 12, marginBottom: 8 },
    deleteConfirmButton: { backgroundColor: c.primary },
    deleteConfirmButtonText: { color: c.primaryText, fontWeight: "600" },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.handle,
      alignSelf: "center",
      marginBottom: 8,
    },
    modalTitle: { fontSize: 20, fontWeight: "700", color: c.text },
    modalSubtitle: { fontSize: 13, color: c.textMuted, marginBottom: 4 },
    fieldLabel: { fontSize: 12, color: c.textMuted, marginTop: 8 },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 4,
    },
    inputIcon: { fontSize: 14, marginRight: 8, color: c.textMuted },
    inputWithIcon: {
      flex: 1,
      fontSize: 14,
      color: c.text,
      padding: 0,
    },
    datePickerValueText: {
      flex: 1,
      fontSize: 14,
      color: c.text,
    },
    dropdownChevron: { fontSize: 14, color: c.textMuted, marginLeft: 6 },
    calendarContainer: {
      marginTop: 8,
      padding: 12,
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 16, width: "100%" },
    button: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    cancelButton: { backgroundColor: c.cancelBackground, borderWidth: 1, borderColor: c.border },
    cancelButtonText: { fontWeight: "600", color: c.cancelText },
    submitButton: { backgroundColor: c.primary },
    submitButtonText: { color: c.primaryText, fontWeight: "600" },
  });
}
