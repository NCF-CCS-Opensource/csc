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
import { Calendar, MapPin, Pencil, Plus, Trash2 } from "lucide-react-native";
import { CalendarGrid } from "../components/CalendarGrid";
import { apiFetch } from "../lib/api";
import { useTheme } from "../lib/theme-context";
import { neoShadow, type ThemeColors } from "../lib/theme";

import type { EventRow, EventType } from "../lib/events";

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
    apiFetch<EventRow[]>("/v1/api/event/list", { method: "POST" })
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function onUpdated(updated: EventRow) {
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
          <Plus size={20} color="#ffffff" strokeWidth={2.5} />
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

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.cardActionButton, styles.editButton]}
                  onPress={() => setEditing(item)}
                >
                  <Pencil size={14} color={colors.text} strokeWidth={2.5} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cardActionButton, styles.deleteButton]}
                  onPress={() => setDeleting(item)}
                >
                  <Trash2 size={14} color={colors.danger} strokeWidth={2.5} />
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
      await apiFetch("/v1/api/event/delete", {
        method: "POST",
        body: JSON.stringify({ id: event.id }),
      });
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
            <Trash2 size={22} color={colors.danger} strokeWidth={2.5} />
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
      const result = await apiFetch<EventRow>(
        mode === "create" ? "/v1/api/event/create" : "/v1/api/event/update",
        {
          method: "POST",
          body: JSON.stringify({
            ...(mode === "edit" ? { id: event!.id } : {}),
            name,
            venue,
            date,
            type,
            halfDayPenaltyAmount: penalty,
          }),
        },
      );
      onSaved(result);
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
            <Calendar size={14} color={colors.textMuted} strokeWidth={2.5} />
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
            <MapPin size={14} color={colors.textMuted} strokeWidth={2.5} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="e.g. ST Quad"
              placeholderTextColor={colors.textMuted}
              value={venue}
              onChangeText={setVenue}
            />
          </View>

          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.typeRow}>
            {(["whole_day", "half_day"] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.typeOption, type === option && styles.typeOptionSelected]}
                onPress={() => setType(option)}
              >
                <Text style={[styles.typeOptionText, type === option && styles.typeOptionTextSelected]}>
                  {option === "whole_day" ? "Whole day" : "Half day"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Half-day penalty amount</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>₱</Text>
            <TextInput
              style={styles.inputWithIcon}
              placeholder="e.g. 50.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={penalty}
              onChangeText={setPenalty}
            />
          </View>

          <Text style={styles.fieldLabel}>Event date</Text>
          <View style={styles.inputWrap}>
            <Calendar size={14} color={colors.textMuted} strokeWidth={2.5} />
            <Text style={styles.datePickerValueText}>
              {date ? formatDate(date) : "Select date"}
            </Text>
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
              disabled={
                submitting || !name || !date || !(Number(penalty) > 0)
              }
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
    container: { flex: 1, backgroundColor: c.neoBgPage },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: { fontSize: 26, color: c.text, letterSpacing: -0.5, fontFamily: "DMSans_800ExtraBold" },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.neoPrimary,
      borderWidth: 2,
      borderColor: c.neoBorder,
      alignItems: "center",
      justifyContent: "center",
      ...neoShadow(c.mode, "sm"),
    },
    list: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
    hint: { fontSize: 14, color: c.textMuted, textAlign: "center", marginTop: 24, fontFamily: "DMSans_400Regular" },
    error: { fontSize: 13, color: c.danger, textAlign: "center", marginVertical: 4, fontFamily: "DMSans_500Medium" },
    card: {
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 14,
      padding: 16,
      gap: 4,
      backgroundColor: c.neoBgSurface,
      ...neoShadow(c.mode, "md"),
    },
    cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    cardTitle: { fontSize: 16, flexShrink: 1, color: c.text, fontFamily: "DMSans_700Bold" },
    cardMeta: { fontSize: 13, color: c.textMuted, marginTop: 2, fontFamily: "DMSans_500Medium" },
    badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 2, borderColor: c.neoBorder },
    badgeText: { fontSize: 12, fontFamily: "DMSans_700Bold" },
    cardActions: { flexDirection: "row", gap: 10, marginTop: 4 },
    cardActionButton: {
      flex: 1,
      flexDirection: "row",
      gap: 6,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: c.neoBorder,
    },
    editButton: { backgroundColor: c.neoBgSurface },
    editButtonText: { fontSize: 13, color: c.text, fontFamily: "DMSans_700Bold" },
    deleteButton: { backgroundColor: c.dangerBg },
    deleteButtonText: { fontSize: 13, color: c.danger, fontFamily: "DMSans_700Bold" },
    modalBackdrop: {
      flex: 1,
      backgroundColor: c.backdrop,
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: c.neoBgSurface,
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderRightWidth: 2,
      borderColor: c.neoBorder,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 8,
      maxHeight: "90%",
    },
    deleteModalCard: {
      backgroundColor: c.neoBgSurface,
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderRightWidth: 2,
      borderColor: c.neoBorder,
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
      borderWidth: 2,
      borderColor: c.neoBorder,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 8,
    },
    deleteModalTitle: { fontSize: 18, color: c.text, fontFamily: "DMSans_800ExtraBold" },
    deleteModalSubtitle: { fontSize: 13, color: c.textMuted, textAlign: "center", paddingHorizontal: 12, marginBottom: 8, fontFamily: "DMSans_500Medium" },
    deleteConfirmButton: { backgroundColor: c.danger, borderColor: c.neoBorder },
    deleteConfirmButtonText: { color: "#ffffff", fontFamily: "DMSans_700Bold" },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.handle,
      alignSelf: "center",
      marginBottom: 8,
    },
    modalTitle: { fontSize: 20, color: c.text, fontFamily: "DMSans_800ExtraBold" },
    modalSubtitle: { fontSize: 13, color: c.textMuted, marginBottom: 4, fontFamily: "DMSans_500Medium" },
    fieldLabel: { fontSize: 12, color: c.textMuted, marginTop: 8, fontFamily: "DMSans_700Bold" },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.neoBgSurface,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 4,
    },
    inputIcon: { fontSize: 14, color: c.textMuted },
    inputWithIcon: {
      flex: 1,
      fontSize: 14,
      color: c.text,
      padding: 0,
      fontFamily: "DMSans_500Medium",
    },
    typeRow: { flexDirection: "row", gap: 8, marginTop: 4 },
    typeOption: {
      flex: 1,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: c.neoBgSurface,
    },
    typeOptionSelected: { backgroundColor: c.neoYellow },
    typeOptionText: { fontSize: 13, color: c.text, fontFamily: "DMSans_500Medium" },
    typeOptionTextSelected: { color: c.text, fontFamily: "DMSans_800ExtraBold" },
    datePickerValueText: {
      flex: 1,
      fontSize: 14,
      color: c.text,
      fontFamily: "DMSans_500Medium",
    },
    calendarContainer: {
      marginTop: 8,
    },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 16, width: "100%" },
    button: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: "center", borderWidth: 2, borderColor: c.neoBorder },
    cancelButton: { backgroundColor: c.neoBgSurface },
    cancelButtonText: { fontFamily: "DMSans_700Bold", color: c.text },
    submitButton: { backgroundColor: c.neoPrimary },
    submitButtonText: { color: "#ffffff", fontFamily: "DMSans_700Bold" },
  });
}
