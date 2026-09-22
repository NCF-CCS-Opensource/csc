import { focusManager, onlineManager } from "@tanstack/react-query";

// Structurally typed against react-native's AppState and NetInfo's default
// export rather than importing them: react-native's entry point is
// Flow-typed and Vitest can't parse it (see ssoRedirect.ts's LinkingLike for
// the same reasoning), even though the app itself builds fine via Metro.
export type AppStateLike = {
  addEventListener: (
    event: "change",
    handler: (status: string) => void,
  ) => { remove: () => void };
};

export type NetInfoLike = {
  addEventListener: (
    handler: (state: { isConnected: boolean | null }) => void,
  ) => () => void;
};

// React Query's refetch-on-focus and refetch-on-reconnect both assume a
// browser (`visibilitychange`, `online`/`offline`), neither of which React
// Native ever fires — so without this wiring, backgrounding/foregrounding
// the app or recovering from an offline stretch never refetches anything,
// including the shared Events query. Routing the app's own AppState/NetInfo
// signals into React Query's managers once, at startup, is the safety net.
export function wireQueryLifecycle(appState: AppStateLike, netInfo: NetInfoLike) {
  focusManager.setEventListener((handleFocus) => {
    const subscription = appState.addEventListener("change", (status) => {
      handleFocus(status === "active");
    });
    return () => subscription.remove();
  });

  onlineManager.setEventListener((setOnline) => {
    return netInfo.addEventListener((state) => {
      setOnline(state.isConnected === true);
    });
  });
}
