import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import NetInfo from "@react-native-community/netinfo";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BoothScreen } from "./screens/BoothScreen";
import { EventsScreen } from "./screens/EventsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import {
  admitOfficer,
  setPendingCount,
  signOutOfficer,
  type Admission,
} from "./lib/officerStore";
import { useOfficerStore } from "./lib/useOfficerStore";
import { flushQueue, stopQueueRetries } from "./lib/syncScans";
import { BoothQueryProvider } from "./lib/queryClient";
import { ThemeProvider, useTheme } from "./lib/theme-context";
import type { ThemeColors } from "./lib/theme";

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Scanner: "⛶",
  Events: "📅",
  Settings: "⚙",
};

function TabIcon({ route, color }: { route: string; color: string }) {
  const icon = TAB_ICONS[route] ?? "•";
  return <Text style={{ fontSize: 20, color, lineHeight: 22 }}>{icon}</Text>;
}


function AuthenticatedApp() {
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
      <Tab.Screen name="Scanner" component={BoothScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}


export default function App() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <ThemeProvider>
            <BoothQueryProvider>
              <BoothApp />
            </BoothQueryProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}

function BoothApp() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { identity, admission, pendingCount } = useOfficerStore();
  const [admissionAttempt, setAdmissionAttempt] = useState(0);

  useEffect(() => {
    void admitOfficer({ isLoaded, isSignedIn, userId });
  }, [admissionAttempt, isLoaded, isSignedIn, userId]);

  const officerId = identity?.authUserId;

  useEffect(() => {
    if (!officerId || !admission?.allowed) return;
    flushQueue(officerId, setPendingCount).catch(() => {});
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushQueue(officerId, setPendingCount).catch(() => {});
        setAdmissionAttempt((attempt) => attempt + 1);
      }
    });
    return () => {
      unsubscribe();
      stopQueueRetries(officerId);
    };
  }, [admission?.allowed, officerId]);

  return (
    <AppShell
      identityResolved={identity !== undefined}
      officerId={officerId}
      admission={admission}
      pendingCount={pendingCount}
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
}: {
  identityResolved: boolean;
  officerId: string | undefined;
  admission: Admission;
  pendingCount: number;
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
          <AuthenticatedApp />
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
            onPress={() => void signOutOfficer(signOut)}
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
