import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";

function LogoMark({ styles }: { styles: Styles }) {
  return (
    <View style={styles.logo}>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
      <View style={styles.centerLine} />
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
            placeholder="GBOX"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}

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
      paddingHorizontal: 28,
      paddingVertical: 24,
      justifyContent: "space-between",
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    logo: {
      width: 76,
      height: 76,
      borderRadius: 22,
      backgroundColor: c.primary,
      marginBottom: 20,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    },
    corner: { position: "absolute", width: 14, height: 14, borderColor: c.primaryText },
    cornerTL: { top: 21, left: 21, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 4 },
    cornerTR: { top: 21, right: 21, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 4 },
    cornerBL: { bottom: 21, left: 21, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 4 },
    cornerBR: { bottom: 21, right: 21, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 4 },
    centerLine: { width: 30, height: 2.5, backgroundColor: c.primaryText, borderRadius: 1.5 },
    title: { fontSize: 24, fontWeight: "700", marginTop: 4, color: c.text, letterSpacing: -0.3 },
    tagline: { fontSize: 13, color: c.textMuted, marginTop: 4, marginBottom: 32 },
    form: { width: "100%", gap: 14 },
    error: { fontSize: 13, color: c.danger, textAlign: "center" },
    input: {
      width: "100%",
      backgroundColor: c.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: c.text,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
      width: "100%",
      marginTop: 6,
    },
    buttonText: { color: c.primaryText, fontWeight: "600", fontSize: 15 },
    version: { textAlign: "center", fontSize: 13, color: c.textFaint, paddingBottom: 8 },
  });
}
