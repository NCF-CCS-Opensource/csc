import { useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";

// Google refuses OAuth inside an embedded WebView, so the flow runs in the
// system browser and returns to the app through the deep link below.
WebBrowser.maybeCompleteAuthSession();

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
  const { startSSOFlow } = useSSO();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Warming the browser makes the hand-off feel instant on Android.
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  async function signIn() {
    setPending(true);
    setError(null);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        return;
      }
      // Cancelled in the browser, or Clerk needs more steps than a booth
      // sign-in should ever require (the school domain is the only gate).
      setError("Sign-in was not completed");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to sign in",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <LogoMark styles={styles} />
        <Text style={styles.title}>AttendKita</Text>
        <Text style={styles.tagline}>CCS Attendance System</Text>

        <View style={styles.form}>
          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={styles.button}
            accessibilityRole="button"
            disabled={pending}
            onPress={signIn}
          >
            {pending ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.buttonText}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            Use your @gbox.ncf.edu.ph school account.
          </Text>
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
    hint: { fontSize: 13, color: c.textMuted, textAlign: "center" },
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
