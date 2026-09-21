import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import NetInfo from "@react-native-community/netinfo";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from "@expo-google-fonts/dm-sans";
import { Calendar, Circle, Inbox, ScanLine, Settings as SettingsIcon, X, type LucideIcon } from "lucide-react-native";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  ApiError,
  apiFetch,
  endOfficerSession,
  rememberOfficerIdentity,
  rememberedOfficerIdentity,
  type OfficerIdentity,
} from "./lib/api";
import { clerk } from "./lib/clerk";
import { BoothScreen } from "./screens/BoothScreen";
import { EventsScreen } from "./screens/EventsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { PendingScreen } from "./screens/PendingScreen";
import { RejectionsScreen } from "./screens/RejectionsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { blockingScanCount, claimLegacyScans, queueSummary } from "./lib/scanQueue";
import { unresolvedCount } from "./lib/pendingTab";
import { flushQueue, stopQueueRetries } from "./lib/syncScans";
import { BoothQueryProvider } from "./lib/queryClient";
import { ThemeProvider, useTheme } from "./lib/theme-context";
import type { ThemeColors } from "./lib/theme";

const Tab = createBottomTabNavigator();
type MobileAdmission =
  | { allowed: true }
  | { allowed: false; message: string }
  | undefined;

const TAB_ICONS: Record<string, LucideIcon> = {
  Scanner: ScanLine,
  Pending: Inbox,
  Events: Calendar,
  Rejections: X,
  Settings: SettingsIcon,
};

function TabIcon({ route, color }: { route: string; color: string }) {
  const Icon = TAB_ICONS[route] ?? Circle;
  return <Icon size={22} color={color} strokeWidth={2} />;
}


function AuthenticatedApp({
  officerId,
  pendingCount,
  unresolvedQueueCount,
  queueRevision,
  refreshQueue,
}: {
  officerId: string;
  pendingCount: number;
  unresolvedQueueCount: number;
  queueRevision: number;
  refreshQueue: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.neoPrimary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.neoBgSurface,
          borderTopColor: colors.neoBorder,
          borderTopWidth: 2,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 2,
          fontFamily: "DMSans_500Medium",
        },
        tabBarIcon: ({ color }) => <TabIcon route={route.name} color={color} />,
      })}
    >
      <Tab.Screen name="Scanner">
        {({ navigation }) => (
          <BoothScreen
            officerId={officerId}
            pendingCount={pendingCount}
            queueRevision={queueRevision}
            onQueueChanged={refreshQueue}
            onNavigateToPending={() => navigation.navigate("Pending")}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Pending"
        options={{
          tabBarBadge: unresolvedQueueCount > 0 ? unresolvedQueueCount : undefined,
        }}
      >
        {() => (
          <PendingScreen
            officerId={officerId}
            queueRevision={queueRevision}
            onQueueChanged={refreshQueue}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Rejections" component={RejectionsScreen} />
      <Tab.Screen name="Settings">
        {({ navigation }) => (
          <SettingsScreen
            officerId={officerId}
            onQueueChanged={refreshQueue}
            onNavigateToPending={() => navigation.navigate("Pending")}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}


// The publishable key must be passed explicitly. Expo only inlines
// EXPO_PUBLIC_* in our own source, never inside node_modules, so
// ClerkProvider's internal `process.env` fallback reads empty in a release
// bundle — Clerk then never starts loading at all (infinite spinner, zero
// network calls), while dev builds work because the dev server injects a real
// runtime `process.env`.
// Gates the auth/identity flow behind DM Sans loading so no screen ever
// flashes the system fallback font before the neobrutalist type ramps in.
function FontGate({ children }: Readonly<{ children: ReactNode }>) {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  });
  const { colors } = useTheme();
  if (!fontsLoaded) {
    return (
      <View style={[styles.accessState, { backgroundColor: colors.neoBgPage }]}>
        <ActivityIndicator color={colors.neoPrimary} />
      </View>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <ThemeProvider>
            <FontGate>
              <BoothQueryProvider>
                <BoothApp />
              </BoothQueryProvider>
            </FontGate>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}

function BoothApp() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  // The Officer the queue is stamped with comes from our own secure storage,
  // never from Clerk at capture time (ADR-0012).
  const [identity, setIdentity] = useState<OfficerIdentity | null | undefined>(
    undefined,
  );
  const [admission, setAdmission] = useState<MobileAdmission>(undefined);
  const [admissionAttempt, setAdmissionAttempt] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [unresolvedQueueCount, setUnresolvedQueueCount] = useState(0);
  const [queueRevision, setQueueRevision] = useState(0);
  // A booth on a bad connection must never be stuck on a bare spinner with no
  // way out, so bound the wait on sign-in state and offer a retry.
  const [retryTick, setRetryTick] = useState(0);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  const refreshQueue = useCallback(async (officerId: string) => {
    setPendingCount(await blockingScanCount(officerId));
    setUnresolvedQueueCount(unresolvedCount(await queueSummary(officerId)));
    setQueueRevision((revision) => revision + 1);
  }, []);

  useEffect(() => {
    let current = true;
    void (async () => {
      // Read our own stamp before consulting Clerk at all: a booth relaunched
      // in a dead spot must still know whose Offline Scan Queue it holds, and
      // only an explicit log out clears the stamp (ADR-0012).
      const remembered = await rememberedOfficerIdentity();
      if (current && remembered) {
        setIdentity(remembered);
        setAdmission({ allowed: true });
      }

      if (!isLoaded) return;
      if (!isSignedIn || !userId) {
        if (current && !remembered) {
          setIdentity(null);
          setAdmission(undefined);
        }
        return;
      }

      try {
        const student = await apiFetch<{
          studentId: string;
          authUserId: string;
          role: "student" | "officer" | "governor";
        }>("/v1/api/student/identity", { method: "POST" });
        if (student.role === "student") {
          throw new ApiError("Mobile booth access is limited to Officers and Governors", 403);
        }
        // The server found this row by the Clerk user id on the Bearer token,
        // so `authUserId` is that id — one identity, not a second source.
        const fresh: OfficerIdentity = {
          authUserId: student.authUserId,
          studentId: student.studentId,
        };
        await rememberOfficerIdentity(fresh);
        await claimLegacyScans(fresh.authUserId);
        await refreshQueue(fresh.authUserId);
        if (current) {
          setIdentity(fresh);
          setAdmission({ allowed: true });
        }
      } catch (error: unknown) {
        const denied =
          error instanceof ApiError && (error.status === 401 || error.status === 403);
        if (denied) await rememberOfficerIdentity(null);
        if (current && denied) setIdentity(null);
        if (current && (denied || !remembered)) {
          setAdmission({
            allowed: false,
            message:
              error instanceof Error
                ? error.message
                : "Unable to verify mobile booth access",
          });
        }
      }
    })();
    return () => {
      current = false;
    };
  }, [admissionAttempt, isLoaded, isSignedIn, refreshQueue, userId]);

  useEffect(() => {
    if (identity !== undefined) {
      setAuthTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setAuthTimedOut(true), 10000);
    return () => clearTimeout(timer);
  }, [identity, retryTick]);

  const retryAuth = useCallback(() => {
    setAuthTimedOut(false);
    setRetryTick((tick) => tick + 1);
    clerk.load().catch(() => {});
  }, []);

  const retryAdmission = useCallback(() => {
    setAdmissionAttempt((attempt) => attempt + 1);
  }, []);

  const officerId = identity?.authUserId;

  useEffect(() => {
    if (!officerId) {
      setPendingCount(0);
      setUnresolvedQueueCount(0);
      return;
    }
    refreshQueue(officerId);
    if (!admission?.allowed) return;
    flushQueue(officerId, () => refreshQueue(officerId)).catch(() => {});
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushQueue(officerId, () => refreshQueue(officerId)).catch(() => {});
        setAdmissionAttempt((attempt) => attempt + 1);
      }
    });
    return () => {
      unsubscribe();
      stopQueueRetries(officerId);
    };
  }, [admission?.allowed, officerId, refreshQueue]);

  return (
    <AppShell
      identityResolved={identity !== undefined}
      authTimedOut={authTimedOut}
      onRetryAuth={retryAuth}
      onRetryAdmission={retryAdmission}
      officerId={officerId}
      admission={admission}
      pendingCount={pendingCount}
      unresolvedQueueCount={unresolvedQueueCount}
      queueRevision={queueRevision}
      refreshQueue={refreshQueue}
    />
  );
}

function navTheme(colors: ThemeColors): Theme {
  const base = colors.mode === "dark" ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.neoBgPage,
      card: colors.neoBgSurface,
      text: colors.text,
      border: colors.neoBorder,
      primary: colors.neoPrimary,
    },
  };
}

function AppShell({
  identityResolved,
  authTimedOut,
  onRetryAuth,
  onRetryAdmission,
  officerId,
  admission,
  pendingCount,
  unresolvedQueueCount,
  queueRevision,
  refreshQueue,
}: Readonly<{
  identityResolved: boolean;
  authTimedOut: boolean;
  onRetryAuth: () => void;
  onRetryAdmission: () => void;
  officerId: string | undefined;
  admission: MobileAdmission;
  pendingCount: number;
  unresolvedQueueCount: number;
  queueRevision: number;
  refreshQueue: (officerId: string) => void;
}>) {
  const { colors } = useTheme();
  const { isLoaded, isSignedIn, signOut } = useAuth();

  // 1. Not loaded yet
  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.neoBgPage }]}>
        <ActivityIndicator style={styles.accessState} color={colors.primary} />
      </View>
    );
  }

  // 2. Not signed in to Clerk: always show LoginScreen
  if (!isSignedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.neoBgPage }]}>
        <LoginScreen />
        <StatusBar style={colors.mode === "dark" ? "light" : "dark"} />
      </View>
    );
  }

  // 3. Authenticated Officer: show app
  if (admission?.allowed && Boolean(officerId)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.neoBgPage }]}>
        <NavigationContainer theme={navTheme(colors)}>
          <AuthenticatedApp
            officerId={officerId!}
            pendingCount={pendingCount}
            unresolvedQueueCount={unresolvedQueueCount}
            queueRevision={queueRevision}
            refreshQueue={() => refreshQueue(officerId!)}
          />
        </NavigationContainer>
        <StatusBar style={colors.mode === "dark" ? "light" : "dark"} />
      </View>
    );
  }

  // 4. Admission denied or connection failure: offer retry and sign out
  if (admission && !admission.allowed) {
    return (
      <View style={[styles.container, { backgroundColor: colors.neoBgPage }]}>
        <View style={styles.accessState}>
          <Text style={[styles.accessTitle, { color: colors.text }]}>
            Mobile access unavailable
          </Text>
          <Text style={[styles.accessMessage, { color: colors.textMuted }]}>
            {pendingCount > 0
              ? `${admission.message}. Connect to deliver ${pendingCount} queued decision${pendingCount === 1 ? "" : "s"} before signing out.`
              : admission.message}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.signOutButton, { backgroundColor: colors.neoPrimary, marginBottom: 12 }]}
            onPress={onRetryAdmission}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Retry verification</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={pendingCount > 0}
            style={[
              styles.signOutButton,
              {
                backgroundColor: colors.primary,
                opacity: pendingCount > 0 ? 0.5 : 1,
              },
            ]}
            onPress={() => endOfficerSession(signOut)}
          >
            <Text style={{ color: colors.primaryText, fontWeight: "600" }}>
              Sign out
            </Text>
          </TouchableOpacity>
        </View>
        <StatusBar style={colors.mode === "dark" ? "light" : "dark"} />
      </View>
    );
  }

  // 5. Resolving identity in progress or timeout fallback
  return (
    <View style={[styles.container, { backgroundColor: colors.neoBgPage }]}>
      {!identityResolved && authTimedOut ? (
        <View style={styles.accessState}>
          <Text style={[styles.accessTitle, { color: colors.text }]}>
            Taking longer than expected
          </Text>
          <Text style={[styles.accessMessage, { color: colors.textMuted }]}>
            Check your connection, then try again.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.signOutButton, { backgroundColor: colors.primary, marginBottom: 12 }]}
            onPress={onRetryAuth}
          >
            <Text style={{ color: colors.primaryText, fontWeight: "600" }}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.signOutButton, { backgroundColor: colors.mode === "dark" ? "#222" : "#eee" }]}
            onPress={() => endOfficerSession(signOut)}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>Sign out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.accessState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.accessMessage, { color: colors.textMuted, marginTop: 14 }]}>
            Verifying booth access...
          </Text>
        </View>
      )}
      <StatusBar style={colors.mode === "dark" ? "light" : "dark"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  accessState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  accessTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  accessMessage: { textAlign: "center", marginBottom: 20 },
  signOutButton: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
});
