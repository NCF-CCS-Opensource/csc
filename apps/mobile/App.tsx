import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import type { Session } from "@supabase/supabase-js";
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
import { ApiError, apiFetch } from "./lib/api";
import { BoothScreen } from "./screens/BoothScreen";
import { EventsScreen } from "./screens/EventsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { loadQueue } from "./lib/scanQueue";
import { supabase } from "./lib/supabase";
import { flushQueue } from "./lib/syncScans";
import { ThemeProvider, useTheme } from "./lib/theme-context";
import type { ThemeColors } from "./lib/theme";

const Tab = createBottomTabNavigator();
const MOBILE_ADMISSION_OWNER_KEY = "attendance:mobile-admission-owner";
type MobileAdmission =
  | { allowed: true }
  | { allowed: false; message: string }
  | undefined;

const TAB_ICONS: Record<string, string> = {
  Scanner: "▦",
  Events: "▤",
  Settings: "⚙",
};

function TabIcon({ route, color }: { route: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{TAB_ICONS[route]}</Text>;
}

function AuthenticatedApp({
  pendingCount,
  refreshPendingCount,
}: {
  pendingCount: number;
  refreshPendingCount: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarIcon: ({ color }) => <TabIcon route={route.name} color={color} />,
      })}
    >
      <Tab.Screen name="Scanner">
        {() => <BoothScreen pendingCount={pendingCount} onScanQueued={refreshPendingCount} />}
      </Tab.Screen>
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [admission, setAdmission] = useState<MobileAdmission>(undefined);
  const [admissionAttempt, setAdmissionAttempt] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    const queue = await loadQueue();
    setPendingCount(queue.length);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAdmission(undefined);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    let current = true;
    const userId = session.user.id;
    void (async () => {
      const cachedOwner = await AsyncStorage.getItem(
        MOBILE_ADMISSION_OWNER_KEY,
      ).catch(() => null);
      if (current && cachedOwner === userId) setAdmission({ allowed: true });

      try {
        await apiFetch("/api/me");
        await AsyncStorage.setItem(MOBILE_ADMISSION_OWNER_KEY, userId).catch(
          () => {},
        );
        if (current) setAdmission({ allowed: true });
      } catch (error: unknown) {
        const denied =
          error instanceof ApiError && (error.status === 401 || error.status === 403);
        if (denied) {
          await AsyncStorage.removeItem(MOBILE_ADMISSION_OWNER_KEY).catch(
            () => {},
          );
        }
        if (current && (denied || cachedOwner !== userId)) {
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
  }, [admissionAttempt, session]);

  useEffect(() => {
    refreshPendingCount();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushQueue(setPendingCount).catch(() => {});
        setAdmissionAttempt((attempt) => attempt + 1);
      }
    });
    return () => unsubscribe();
  }, [refreshPendingCount]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell
            session={session}
            admission={admission}
            pendingCount={pendingCount}
            refreshPendingCount={refreshPendingCount}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
  session,
  admission,
  pendingCount,
  refreshPendingCount,
}: {
  session: Session | null | undefined;
  admission: MobileAdmission;
  pendingCount: number;
  refreshPendingCount: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {session === undefined ? null : !session ? (
        <LoginScreen />
      ) : admission?.allowed ? (
        <NavigationContainer theme={navTheme(colors)}>
          <AuthenticatedApp
            pendingCount={pendingCount}
            refreshPendingCount={refreshPendingCount}
          />
        </NavigationContainer>
      ) : admission === undefined ? (
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
            onPress={() => supabase.auth.signOut()}
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
