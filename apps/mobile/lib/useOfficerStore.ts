import { useSyncExternalStore } from "react";
import { getOfficerState, subscribeToOfficer, type OfficerState } from "./officerStore";

// The store itself stays free of React so it can be tested as a plain module.
export function useOfficerStore(): OfficerState {
  return useSyncExternalStore(subscribeToOfficer, getOfficerState);
}
