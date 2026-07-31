import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
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
import { apiFetch } from "./lib/api";
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
    apiFetch("/api/me")
      .then(() => current && setAdmission({ allowed: true }))
      .catch((error: unknown) => {
        if (current) {
          setAdmission({
            allowed: false,
            message:
              error instanceof Error
                ? error.message
                : "Unable to verify mobile booth access",
          });
        }
      });
    return () => {
      current = false;
    };
  }, [session]);

  useEffect(() => {
    refreshPendingCount();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushQueue(setPendingCount).catch(() => {});
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
            {admission.message}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.signOutButton, { backgroundColor: colors.primary }]}
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
