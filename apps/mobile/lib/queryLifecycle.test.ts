import { focusManager, onlineManager } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { AppStateLike, NetInfoLike } from "./queryLifecycle";
import { wireQueryLifecycle } from "./queryLifecycle";

// These mock the app's own AppState/NetInfo signals, never the underlying OS
// event system — the point is to prove wireQueryLifecycle hands React Query
// the right setup function, not to re-test AppState or NetInfo themselves.
function fakeAppState() {
  let changeHandler: ((status: string) => void) | undefined;
  const appState: AppStateLike = {
    addEventListener: vi.fn((_event, handler) => {
      changeHandler = handler;
      return { remove: vi.fn() };
    }),
  };
  return { appState, fireChange: (status: string) => changeHandler?.(status) };
}

function fakeNetInfo() {
  let connectivityHandler: ((state: { isConnected: boolean | null }) => void) | undefined;
  const netInfo: NetInfoLike = {
    addEventListener: vi.fn((handler) => {
      connectivityHandler = handler;
      return () => {};
    }),
  };
  return {
    netInfo,
    fireConnectivity: (isConnected: boolean | null) =>
      connectivityHandler?.({ isConnected }),
  };
}

describe("wireQueryLifecycle", () => {
  it("routes AppState foreground/background into focusManager's setEventListener", () => {
    const { appState, fireChange } = fakeAppState();
    const { netInfo } = fakeNetInfo();
    const setEventListener = vi.spyOn(focusManager, "setEventListener");

    wireQueryLifecycle(appState, netInfo);

    expect(setEventListener).toHaveBeenCalledTimes(1);
    const handleFocus = vi.fn();
    setEventListener.mock.calls[0][0](handleFocus);

    fireChange("active");
    expect(handleFocus).toHaveBeenCalledWith(true);

    fireChange("background");
    expect(handleFocus).toHaveBeenCalledWith(false);
  });

  it("routes NetInfo connectivity changes into onlineManager's setEventListener", () => {
    const { appState } = fakeAppState();
    const { netInfo, fireConnectivity } = fakeNetInfo();
    const setEventListener = vi.spyOn(onlineManager, "setEventListener");

    wireQueryLifecycle(appState, netInfo);

    expect(setEventListener).toHaveBeenCalledTimes(1);
    const setOnline = vi.fn();
    setEventListener.mock.calls[0][0](setOnline);

    fireConnectivity(true);
    expect(setOnline).toHaveBeenCalledWith(true);

    fireConnectivity(false);
    expect(setOnline).toHaveBeenCalledWith(false);

    fireConnectivity(null);
    expect(setOnline).toHaveBeenCalledWith(false);
  });
});
