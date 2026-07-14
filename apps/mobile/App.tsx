import { NavigationContainer } from "@react-navigation/native";
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
import { loadQueue } from "./lib/scanQueue";
import { supabase } from "./lib/supabase";
import { flushQueue } from "./lib/syncScans";

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
  pendingCount,
  refreshPendingCount,
}: {
  pendingCount: number;
  refreshPendingCount: () => void;
}) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#999",
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
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    const queue = await loadQueue();
    setPendingCount(queue.length);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

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
        <View style={styles.container}>
          {session === undefined ? null : !session ? (
            <LoginScreen />
          ) : (
            <NavigationContainer>
              <AuthenticatedApp
                pendingCount={pendingCount}
                refreshPendingCount={refreshPendingCount}
              />
            </NavigationContainer>
          )}
          <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
