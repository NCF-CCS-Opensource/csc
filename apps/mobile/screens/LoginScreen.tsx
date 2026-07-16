import { useMemo, useState } from "react";
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
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";

const WEB_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

function LogoMark({ styles }: { styles: Styles }) {
  return (
    <View style={styles.logo}>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

export function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
        <LogoMark styles={styles} />
        <Text style={styles.title}>AttendKita</Text>
        <Text style={styles.tagline}>CCS Attendance System</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textFaint}
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
              <ActivityIndicator color={colors.primaryText} />
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

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      padding: 24,
      justifyContent: "space-between",
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
    logo: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: c.primary,
      marginBottom: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    corner: { position: "absolute", width: 12, height: 12, borderColor: c.primaryText },
    cornerTL: { top: 20, left: 20, borderTopWidth: 2, borderLeftWidth: 2 },
    cornerTR: { top: 20, right: 20, borderTopWidth: 2, borderRightWidth: 2 },
    cornerBL: { bottom: 20, left: 20, borderBottomWidth: 2, borderLeftWidth: 2 },
    cornerBR: { bottom: 20, right: 20, borderBottomWidth: 2, borderRightWidth: 2 },
    title: { fontSize: 22, fontWeight: "700", marginTop: 4, color: c.text },
    tagline: { fontSize: 13, color: c.textMuted, marginBottom: 28 },
    form: { width: "100%", gap: 12 },
    error: { fontSize: 13, color: c.danger },
    input: {
      width: "100%",
      backgroundColor: c.inputBackground,
      borderRadius: 8,
      padding: 14,
      fontSize: 15,
      color: c.text,
    },
    forgotLink: { alignItems: "flex-end" },
    forgotText: { fontSize: 13, color: c.textMuted },
    button: {
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: "center",
      width: "100%",
      marginTop: 4,
    },
    buttonText: { color: c.primaryText, fontWeight: "600", fontSize: 15 },
    version: { textAlign: "center", fontSize: 12, color: c.textDisabled, paddingBottom: 8 },
  });
}
