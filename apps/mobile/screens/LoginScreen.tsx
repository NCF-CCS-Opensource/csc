import { useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";
import { AppLogo } from "../components/AppLogo";
import { matchesRedirectScheme, watchForRedirectUrl } from "../lib/ssoRedirect";

// Google refuses OAuth inside an embedded WebView, so the flow runs in the
// system browser and returns to the app through the deep link below.
WebBrowser.maybeCompleteAuthSession();

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
    // Started before startSSOFlow so we catch the redirect via our own "url"
    // listener too — expo-web-browser's Android path races an AppState
    // "resumed" listener against its own Linking "url" listener and keeps
    // whichever settles first, and on a warm resume (app backgrounded while
    // the browser was open, not cold-launched) Linking.getInitialURL() alone
    // never sees the redirect at all. See watchForRedirectUrl for the detail.
    const redirectWatcher = watchForRedirectUrl(Linking);
    try {
      const { createdSessionId, setActive, authSessionResult, signIn, signUp } =
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl: AuthSession.makeRedirectUri(),
        });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        return;
      }
      // ponytail: duplicates the tail of Clerk's own startSSOFlow (useSSO.js)
      // instead of a real fix, because that race lives inside expo-web-browser's
      // node_modules with no patch-package in this repo to pin a fix to.
      if (authSessionResult?.type === "dismiss" && signIn) {
        const redirectedUrl = await redirectWatcher.resolve();
        const expectedPrefix = AuthSession.makeRedirectUri();
        if (redirectedUrl && matchesRedirectScheme(redirectedUrl, expectedPrefix)) {
          const nonce =
            new URL(redirectedUrl).searchParams.get("rotating_token_nonce") ?? "";
          await signIn.reload({ rotatingTokenNonce: nonce });
          if (signIn.firstFactorVerification.status === "transferable" && signUp) {
            await signUp.create({ transfer: true });
          }
          const recoveredSessionId = signUp?.createdSessionId ?? signIn.createdSessionId;
          if (recoveredSessionId && setActive) {
            await setActive({ session: recoveredSessionId });
            return;
          }
        }
      }
      // Cancelled in the browser, or Clerk needs more steps than a booth
      // sign-in should ever require (the school domain is the only gate).
      // ponytail: dumps the raw SDK status instead of a friendly per-case
      // message — narrow this once we know which cases actually show up.
      console.warn("SSO did not produce a session", {
        authSessionResultType: authSessionResult?.type,
        signInStatus: signIn?.status,
        signUpStatus: signUp?.status,
        signUpErrors: signUp?.unverifiedFields,
      });
      setError(
        `Sign-in was not completed (${authSessionResult?.type ?? "no result"}${
          signIn?.status ? `, signIn: ${signIn.status}` : ""
        }${signUp?.status ? `, signUp: ${signUp.status}` : ""})`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to sign in",
      );
    } finally {
      redirectWatcher.stop();
      setPending(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <AppLogo size="xl" title="AttendKita" subtitle="CCS Attendance System" />
        <View style={styles.brandSpacer} />

        <View style={styles.form}>
          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={styles.button}
            accessibilityRole="button"
            disabled={pending}
            onPress={signIn}
          >
            {pending ? (
              <ActivityIndicator color="#FFFFFF" />
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

// Zero-blur hard offset shadow per apps/mobile/DESIGN.md — dark mode keeps a
// black shadow even though the border flips to white.
function hardShadow(c: ThemeColors, size: 3 | 4 | 6) {
  return {
    shadowColor: c.mode === "dark" ? "#000000" : "#111111",
    shadowOffset: { width: size, height: size },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: size,
  } as const;
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.neoBgPage,
      paddingHorizontal: 28,
      paddingVertical: 24,
      justifyContent: "space-between",
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    brandSpacer: { height: 28 },
    form: {
      width: "100%",
      gap: 14,
      backgroundColor: c.neoBgSurface,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 14,
      padding: 20,
      ...hardShadow(c, 4),
    },
    error: { fontSize: 13, fontFamily: "DMSans_500Medium", color: c.danger, textAlign: "center" },
    hint: { fontSize: 13, fontFamily: "DMSans_400Regular", color: c.textMuted, textAlign: "center" },
    button: {
      backgroundColor: c.neoPrimary,
      borderWidth: 2,
      borderColor: c.neoBorder,
      borderRadius: 10,
      paddingVertical: 15,
      alignItems: "center",
      width: "100%",
      marginTop: 6,
      ...hardShadow(c, 3),
    },
    buttonText: { color: "#FFFFFF", fontFamily: "DMSans_700Bold", fontSize: 15 },
    version: { textAlign: "center", fontSize: 13, fontFamily: "DMSans_400Regular", color: c.textFaint, paddingBottom: 8 },
  });
}
