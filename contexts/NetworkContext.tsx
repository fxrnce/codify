import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { getOfflineCacheStatus } from "@/services/offline-catalog";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export type ConnectionStatus = "checking" | "online" | "offline";

type NetworkContextValue = {
  connectionStatus: ConnectionStatus;
  isBackendReachable: boolean;
  isSyncing: boolean;
  lastCatalogSyncAt: string | null;
  refreshConnection: () => Promise<void>;
  refreshLastCatalogSync: () => Promise<void>;
  setSyncing: (isSyncing: boolean) => void;
};

const NetworkContext = createContext<NetworkContextValue | undefined>(
  undefined,
);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("checking");
  const [isSyncing, setSyncing] = useState(false);
  const [lastCatalogSyncAt, setLastCatalogSyncAt] = useState<string | null>(
    null,
  );
  const reachabilityPromiseRef = useRef<Promise<boolean> | null>(null);

  const refreshLastCatalogSync = useCallback(async () => {
    const cacheStatus = await getOfflineCacheStatus();
    setLastCatalogSyncAt(cacheStatus.lastSyncedAt);
  }, []);

  const checkBackendReachability = useCallback(async () => {
    if (!API_URL) return false;
    if (reachabilityPromiseRef.current) return reachabilityPromiseRef.current;

    const request = (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5_000);
      try {
        const response = await fetch(`${API_URL}/health`, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    reachabilityPromiseRef.current = request;
    try {
      return await request;
    } finally {
      if (reachabilityPromiseRef.current === request) {
        reachabilityPromiseRef.current = null;
      }
    }
  }, []);

  const updateConnection = useCallback(
    async (state: NetInfoState) => {
      if (state.isConnected === false) {
        setConnectionStatus("offline");
        return;
      }

      const isReachable = await checkBackendReachability();
      setConnectionStatus(isReachable ? "online" : "offline");
    },
    [checkBackendReachability],
  );

  const refreshConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    await updateConnection(state);
  }, [updateConnection]);

  useEffect(() => {
    void refreshLastCatalogSync();

    const unsubscribe = NetInfo.addEventListener((state) => {
      void updateConnection(state);
    });
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refreshConnection();
      }
    });

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [refreshConnection, refreshLastCatalogSync, updateConnection]);

  useEffect(() => {
    const intervalId = setInterval(
      () => void refreshConnection(),
      connectionStatus === "offline" ? 5_000 : 30_000,
    );

    return () => clearInterval(intervalId);
  }, [connectionStatus, refreshConnection]);

  const value = useMemo(
    () => ({
      connectionStatus,
      isBackendReachable: connectionStatus === "online",
      isSyncing,
      lastCatalogSyncAt,
      refreshConnection,
      refreshLastCatalogSync,
      setSyncing,
    }),
    [
      connectionStatus,
      isSyncing,
      lastCatalogSyncAt,
      refreshConnection,
      refreshLastCatalogSync,
    ],
  );

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetworkStatus() {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error("useNetworkStatus must be used inside NetworkProvider.");
  }

  return context;
}
