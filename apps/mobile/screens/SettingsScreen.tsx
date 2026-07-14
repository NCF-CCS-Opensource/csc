import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../lib/api";
import { colorOf, initialsOf } from "../lib/avatar";
import { supabase } from "../lib/supabase";

type Me = { name: string; email: string };

function SettingsRow({
  label,
  onPress,
  disabled,
  destructive,
  badge,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  badge?: string;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={disabled || !onPress}>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive, disabled && styles.rowLabelDisabled]}>
        {label}
      </Text>
      {badge ? (
        <Text style={styles.rowBadge}>{badge}</Text>
      ) : (
        <Text style={[styles.rowChevron, disabled && styles.rowLabelDisabled]}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const [me, setMe] = useState<Me | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    apiFetch<{ student: Me }>("/api/me")
      .then((data) => setMe(data.student))
      .catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.profileRow}>
        {me ? (
          <View style={[styles.avatar, { backgroundColor: colorOf(me.name) }]}>
            <Text style={styles.avatarText}>{initialsOf(me.name)}</Text>
          </View>
        ) : (
          <View style={styles.avatar} />
        )}
        <View>
          <Text style={styles.profileName}>{me?.name ?? "—"}</Text>
          <Text style={styles.profileEmail}>{me?.email ?? ""}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>GENERAL</Text>
      <View style={styles.section}>
        <SettingsRow label="Change theme" disabled badge="Coming soon" />
        <SettingsRow label="Notifications" disabled badge="Coming soon" />
        <SettingsRow label="Language" disabled badge="Coming soon" />
      </View>

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.section}>
        <SettingsRow label="Change password" onPress={() => setPasswordModalOpen(true)} />
        <SettingsRow
          label="Log out"
          destructive
          onPress={() => supabase.auth.signOut()}
        />
      </View>

      <Text style={styles.version}>AttendKita v1.0.0</Text>

      <ChangePasswordModal visible={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </ScrollView>
  );
}

function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setPassword("");
    setConfirm("");
    setError(null);
    setSuccess(false);
  }

  async function submit() {
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Change password</Text>

          {success ? (
            <>
              <Text style={styles.successText}>Password updated.</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  reset();
                  onClose();
                }}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="New password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    reset();
                    onClose();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  disabled={pending || !password || !confirm}
                  onPress={submit}
                >
                  {pending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, gap: 8 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700" },
  profileName: { fontSize: 15, fontWeight: "600" },
  profileEmail: { fontSize: 12, color: "#888" },
  sectionLabel: { fontSize: 11, color: "#999", fontWeight: "600", marginTop: 12, marginBottom: 6 },
  section: { borderWidth: 1, borderColor: "#eee", borderRadius: 12, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  rowLabel: { fontSize: 14 },
  rowLabelDisabled: { color: "#bbb" },
  rowLabelDestructive: { color: "#dc2626" },
  rowChevron: { color: "#ccc", fontSize: 16 },
  rowBadge: { fontSize: 11, color: "#999" },
  version: { textAlign: "center", fontSize: 12, color: "#bbb", marginTop: 24 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 10 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ddd", alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  input: { backgroundColor: "#f5f5f5", borderRadius: 8, padding: 12, fontSize: 14 },
  error: { fontSize: 13, color: "#c00" },
  successText: { fontSize: 14, color: "#15803d" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  button: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: "center", backgroundColor: "#000" },
  buttonText: { color: "#fff", fontWeight: "600" },
  cancelButton: { backgroundColor: "#f1f1f1" },
  cancelButtonText: { fontWeight: "600", color: "#333" },
});
