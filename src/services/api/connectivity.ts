import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";

let configured = false;
let onlineState = true;

function ensureConfigured() {
  if (configured) return;
  configured = true;
  try {
    // Web browsers block NetInfo's default HEAD probe to clients3.google.com via CORS.
    NetInfo.configure({
      reachabilityShouldRun: () => Platform.OS !== "web",
    });
  } catch {
    /* Non-DOM test environments continue with default reachability fallback. */
  }
}

export function isNetInfoStateOnline(
  state: Pick<NetInfoState, "isConnected" | "isInternetReachable"> | null | undefined,
): boolean {
  if (!state) return true;
  if (state.isConnected === false) return false;
  if (Platform.OS !== "web" && state.isInternetReachable === false) {
    return false;
  }
  return true;
}

export async function checkIsOnline(): Promise<boolean> {
  ensureConfigured();
  try {
    const state = await NetInfo.fetch();
    onlineState = isNetInfoStateOnline(state);
    return onlineState;
  } catch {
    return onlineState;
  }
}

function subscribeOnline(listener: () => void) {
  ensureConfigured();
  try {
    return NetInfo.addEventListener((state) => {
      const next = isNetInfoStateOnline(state);
      if (next !== onlineState) {
        onlineState = next;
        listener();
      }
    });
  } catch {
    return () => {};
  }
}

function getOnlineSnapshot() {
  return onlineState;
}

function getServerOnlineSnapshot() {
  return true;
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );
}
