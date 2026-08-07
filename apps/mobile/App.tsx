import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import NetInfo from "@react-native-community/netinfo";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
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
import { BoothScreen } from "./screens/BoothScreen";
import { EventsScreen } from "./screens/EventsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { blockingScanCount, claimLegacyScans } from "./lib/scanQueue";
import { flushQueue, stopQueueRetries } from "./lib/syncScans";
import { ThemeProvider, useTheme } from "./lib/theme-context";
import type { ThemeColors } from "./lib/theme";

const Tab = createBottomTabNavigator();
type MobileAdmission =
  | { allowed: true }
  | { allowed: false; message: string }
  | undefined;

const TAB_ICONS: Record<string, string> = {
  Scanner: "⛶",
  Events: "📅",
  Settings: "⚙",
};

function TabIcon({ route, color }: { route: string; color: string }) {
  const icon = TAB_ICONS[route] ?? "•";
  return <Text style={{ fontSize: 20, color, lineHeight: 22 }}>{icon}</Text>;
}


function AuthenticatedApp({
  officerId,
  pendingCount,
  queueRevision,
  refreshQueue,
}: {
  officerId: string;
  pendingCount: number;
  queueRevision: number;
  refreshQueue: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 2,
        },
        tabBarIcon: ({ color }) => <TabIcon route={route.name} color={color} />,
      })}
    >
      <Tab.Screen name="Scanner">
        {() => (
          <BoothScreen
            officerId={officerId}
            pendingCount={pendingCount}
            queueRevision={queueRevision}
            onQueueChanged={refreshQueue}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Settings">
        {() => <SettingsScreen officerId={officerId} onQueueChanged={refreshQueue} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}


export default function App() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <ThemeProvider>
            <BoothApp />
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
  const [queueRevision, setQueueRevision] = useState(0);

  const refreshQueue = useCallback(async (officerId: string) => {
    setPendingCount(await blockingScanCount(officerId));
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
        const { student } = await apiFetch<{
          student: { id: string; authUserId: string };
        }>("/api/me");
        // The server found this row by the Clerk user id on the Bearer token,
        // so `authUserId` is that id — one identity, not a second source.
        const fresh: OfficerIdentity = {
          authUserId: student.authUserId,
          studentId: student.id,
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

  const officerId = identity?.authUserId;

  useEffect(() => {
    if (!officerId) {
      setPendingCount(0);
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
      officerId={officerId}
      admission={admission}
      pendingCount={pendingCount}
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
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };
}

function AppShell({
  identityResolved,
  officerId,
  admission,
  pendingCount,
  queueRevision,
  refreshQueue,
}: {
  identityResolved: boolean;
  officerId: string | undefined;
  admission: MobileAdmission;
  pendingCount: number;
  queueRevision: number;
  refreshQueue: (officerId: string) => void;
}) {
  const { colors } = useTheme();
  const { signOut } = useAuth();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!identityResolved ? (
        <ActivityIndicator style={styles.accessState} color={colors.primary} />
      ) : !officerId && !admission ? (
        <LoginScreen />
      ) : admission?.allowed && officerId ? (
        <NavigationContainer theme={navTheme(colors)}>
          <AuthenticatedApp
            officerId={officerId}
            pendingCount={pendingCount}
            queueRevision={queueRevision}
            refreshQueue={() => refreshQueue(officerId)}
          />
        </NavigationContainer>
      ) : !admission || admission.allowed ? (
        // Admitted but the offline Officer stamp has not loaded yet.
        <ActivityIndicator style={styles.accessState} color={colors.primary} />
      ) : (
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
