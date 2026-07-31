import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import NetInfo from "@react-native-community/netinfo";
import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BoothScreen } from "./screens/BoothScreen";
import { EventsScreen } from "./screens/EventsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { blockingScanCount } from "./lib/scanQueue";
import { supabase } from "./lib/supabase";
import { flushQueue } from "./lib/syncScans";
import { ThemeProvider, useTheme } from "./lib/theme-context";
import type { ThemeColors } from "./lib/theme";

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Scanner: "▦",
  Events: "▤",
  Settings: "⚙",
};

function TabIcon({ route, color }: { route: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{TAB_ICONS[route]}</Text>;
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
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
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
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [pendingCount, setPendingCount] = useState(0);
  const [queueRevision, setQueueRevision] = useState(0);

  const refreshQueue = useCallback(async (officerId: string) => {
    setPendingCount(await blockingScanCount(officerId));
    setQueueRevision((revision) => revision + 1);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const officerId = session?.user.id;
    if (!officerId) {
      setPendingCount(0);
      return;
    }
    refreshQueue(officerId);
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushQueue(officerId, () => refreshQueue(officerId)).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, [refreshQueue, session?.user.id]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell
            session={session}
            pendingCount={pendingCount}
            queueRevision={queueRevision}
            refreshQueue={refreshQueue}
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
  pendingCount,
  queueRevision,
  refreshQueue,
}: {
  session: Session | null | undefined;
  pendingCount: number;
  queueRevision: number;
  refreshQueue: (officerId: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {session === undefined ? null : !session ? (
        <LoginScreen />
      ) : (
        <NavigationContainer theme={navTheme(colors)}>
          <AuthenticatedApp
            officerId={session.user.id}
            pendingCount={pendingCount}
            queueRevision={queueRevision}
            refreshQueue={() => refreshQueue(session.user.id)}
          />
        </NavigationContainer>
      )}
      <StatusBar style={colors.mode === "dark" ? "light" : "dark"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
