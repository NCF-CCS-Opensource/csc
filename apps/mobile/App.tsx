import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BoothScreen } from "./screens/BoothScreen";
import { EventsScreen, type EventRow } from "./screens/EventsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { supabase } from "./lib/supabase";

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [activeEvent, setActiveEvent] = useState<EventRow | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      {session === undefined ? null : !session ? (
        <LoginScreen />
      ) : activeEvent ? (
        <BoothScreen event={activeEvent} onBack={() => setActiveEvent(null)} />
      ) : (
        <EventsScreen onSelect={setActiveEvent} />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
