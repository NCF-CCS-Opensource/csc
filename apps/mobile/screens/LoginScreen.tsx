import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const WEB_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

function LogoMark() {
  return (
    <View style={styles.logo}>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
    </View>
  );
}

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setPending(false);
    if (error) setError(error.message);
    // On success the client's session updates; App.tsx's auth listener
    // swaps this screen out automatically.
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <LogoMark />
        <Text style={styles.title}>AttendKita</Text>
        <Text style={styles.tagline}>CCS Attendance System</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => Linking.openURL(`${WEB_BASE_URL}/forgot-password`)}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            disabled={pending || !email || !password}
            onPress={signIn}
          >
            {pending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "space-between",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#000",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  corner: { position: "absolute", width: 12, height: 12, borderColor: "#fff" },
  cornerTL: { top: 20, left: 20, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 20, right: 20, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 20, left: 20, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 20, right: 20, borderBottomWidth: 2, borderRightWidth: 2 },
  title: { fontSize: 22, fontWeight: "700", marginTop: 4 },
  tagline: { fontSize: 13, color: "#888", marginBottom: 28 },
  form: { width: "100%", gap: 12 },
  error: { fontSize: 13, color: "#c00" },
  input: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
  },
  forgotLink: { alignItems: "flex-end" },
  forgotText: { fontSize: 13, color: "#666" },
  button: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    marginTop: 4,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  version: { textAlign: "center", fontSize: 12, color: "#bbb", paddingBottom: 8 },
});
