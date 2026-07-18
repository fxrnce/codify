import { useAuth } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

import type { DemoProduct, ProductStatus } from "@/constants/MockData";

const LEGACY_SCAN_HISTORY_STORAGE_KEY = "codify_scan_history";
const SCAN_HISTORY_STORAGE_KEY_PREFIX = "codify_scan_history_user";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ScanHistoryItem = {
  id: string;
  clientScanId?: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  status: ProductStatus;
  fdaStatusLabel: string;
  scannedAt: string;
  pendingSync?: boolean;
};

type ScanHistoryApiResponse = {
  success?: boolean;
  message?: string;
  scans?: ScanHistoryItem[];
  scan?: ScanHistoryItem;
  deletedCount?: number;
};

type ScanHistoryContextValue = {
  scanHistory: ScanHistoryItem[];
  refreshScanHistory: () => Promise<void>;
  addScanToHistory: (product: DemoProduct) => void;
  addUnknownScanToHistory: (barcode: string) => void;
  clearScanHistory: () => Promise<boolean>;
};

class AsyncOperationQueue {
  private tail: Promise<unknown> = Promise.resolve();

  run<T>(operation: () => Promise<T>) {
    const result = this.tail.then(operation, operation);

    this.tail = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }
}

const ScanHistoryContext = createContext<ScanHistoryContextValue | undefined>(
  undefined,
);

function getStorageKey(userId?: string | null) {
  if (!userId) {
    return `${SCAN_HISTORY_STORAGE_KEY_PREFIX}_guest`;
  }

  return `${SCAN_HISTORY_STORAGE_KEY_PREFIX}_${userId}`;
}

function createClientScanId() {
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function getClientScanId(scan: Pick<ScanHistoryItem, "clientScanId" | "id">) {
  return scan.clientScanId?.trim() || scan.id;
}

function needsBackendSync(scan: ScanHistoryItem) {
  return scan.pendingSync === true || !UUID_PATTERN.test(scan.id);
}

function normalizeStoredScan(value: unknown): ScanHistoryItem | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const scan = value as Partial<ScanHistoryItem>;
  const status = scan.status;
  const validStatus =
    status === "Approved" ||
    status === "Caution" ||
    status === "FDA Advisory" ||
    status === "Unverified";

  if (
    typeof scan.id !== "string" ||
    typeof scan.barcode !== "string" ||
    typeof scan.name !== "string" ||
    typeof scan.brand !== "string" ||
    typeof scan.category !== "string" ||
    !validStatus ||
    typeof scan.fdaStatusLabel !== "string" ||
    typeof scan.scannedAt !== "string" ||
    Number.isNaN(new Date(scan.scannedAt).getTime())
  ) {
    return null;
  }

  return {
    id: scan.id,
    clientScanId:
      typeof scan.clientScanId === "string" && scan.clientScanId.length > 0
        ? scan.clientScanId
        : scan.id,
    barcode: scan.barcode,
    name: scan.name,
    brand: scan.brand,
    category: scan.category,
    status,
    fdaStatusLabel: scan.fdaStatusLabel,
    scannedAt: scan.scannedAt,
    pendingSync: scan.pendingSync === true || !UUID_PATTERN.test(scan.id),
  };
}

function sortScanHistory(history: ScanHistoryItem[]) {
  return [...history].sort(
    (firstScan, secondScan) =>
      new Date(secondScan.scannedAt).getTime() -
      new Date(firstScan.scannedAt).getTime(),
  );
}

function mergeLatestScan(
  scan: ScanHistoryItem,
  currentHistory: ScanHistoryItem[],
) {
  return sortScanHistory([
    scan,
    ...currentHistory.filter(
      (currentScan) =>
        currentScan.barcode !== scan.barcode &&
        getClientScanId(currentScan) !== getClientScanId(scan),
    ),
  ]);
}

async function readStoredHistory(storageKey: string) {
  try {
    const savedHistory = await AsyncStorage.getItem(storageKey);

    if (!savedHistory) {
      return [];
    }

    const parsedHistory = JSON.parse(savedHistory) as unknown;

    if (!Array.isArray(parsedHistory)) {
      return [];
    }

    const normalizedHistory = parsedHistory
      .map(normalizeStoredScan)
      .filter((scan): scan is ScanHistoryItem => scan !== null);

    return normalizedHistory.reduce<ScanHistoryItem[]>(
      (history, scan) => mergeLatestScan(scan, history),
      [],
    );
  } catch (error) {
    console.log("Failed to load scan history:", error);
    return [];
  }
}

async function saveStoredHistory(
  storageKey: string,
  history: ScanHistoryItem[],
) {
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(history));
  } catch (error) {
    console.log("Failed to save scan history:", error);
  }
}

async function postScanToBackend(token: string, scan: ScanHistoryItem) {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is missing.");
  }

  const response = await fetch(`${API_URL}/api/scans`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      barcode: scan.barcode,
      clientScanId: getClientScanId(scan),
      scannedAt: scan.scannedAt,
    }),
  });

  const responseBody = (await response
    .json()
    .catch(() => ({}))) as ScanHistoryApiResponse;

  if (!response.ok || !responseBody.scan) {
    throw new Error(
      responseBody.message || `Failed to save scan (${response.status}).`,
    );
  }

  const savedScan = normalizeStoredScan(responseBody.scan);

  if (!savedScan) {
    throw new Error("The backend returned an invalid scan.");
  }

  return {
    ...savedScan,
    pendingSync: false,
  };
}

export function ScanHistoryProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  const scanHistoryRef = useRef<ScanHistoryItem[]>([]);
  const localMutationVersionRef = useRef(0);
  const clearVersionRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const refreshUserKeyRef = useRef<string | null>(null);
  const localStorageQueueRef = useRef(new AsyncOperationQueue());
  const backendMutationQueueRef = useRef(new AsyncOperationQueue());

  const authRef = useRef({
    getToken,
    isLoaded,
    isSignedIn,
    userId,
  });

  scanHistoryRef.current = scanHistory;
  authRef.current = {
    getToken,
    isLoaded,
    isSignedIn,
    userId,
  };

  const replaceScanHistory = useCallback(
    async (storageKey: string, nextHistory: ScanHistoryItem[]) => {
      const sortedHistory = sortScanHistory(nextHistory);

      scanHistoryRef.current = sortedHistory;
      setScanHistory(sortedHistory);

      await localStorageQueueRef.current.run(() =>
        saveStoredHistory(storageKey, sortedHistory),
      );
    },
    [],
  );

  const refreshScanHistory = useCallback(async () => {
    if (refreshPromiseRef.current) {
      const requestedUserKey = authRef.current.userId ?? "guest";
      const activeUserKey = refreshUserKeyRef.current;

      await refreshPromiseRef.current;

      if (activeUserKey === requestedUserKey) {
        return;
      }
    }

    const refreshUserKey = authRef.current.userId ?? "guest";
    const refreshPromise = (async () => {
      const currentAuth = authRef.current;
      const refreshMutationVersion = localMutationVersionRef.current;

      if (!currentAuth.isLoaded) {
        return;
      }

      const currentStorageKey = getStorageKey(currentAuth.userId);
      let cachedHistory = await localStorageQueueRef.current.run(() =>
        readStoredHistory(currentStorageKey),
      );

      if (
        authRef.current.userId !== currentAuth.userId ||
        localMutationVersionRef.current !== refreshMutationVersion
      ) {
        return;
      }

      if (currentAuth.userId && cachedHistory.length === 0) {
        const legacyHistory = await localStorageQueueRef.current.run(() =>
          readStoredHistory(LEGACY_SCAN_HISTORY_STORAGE_KEY),
        );

        if (legacyHistory.length > 0) {
          cachedHistory = legacyHistory;

          await localStorageQueueRef.current.run(async () => {
            await saveStoredHistory(currentStorageKey, legacyHistory);
            await AsyncStorage.removeItem(LEGACY_SCAN_HISTORY_STORAGE_KEY);
          });
        }
      }

      if (
        authRef.current.userId !== currentAuth.userId ||
        localMutationVersionRef.current !== refreshMutationVersion
      ) {
        return;
      }

      scanHistoryRef.current = cachedHistory;
      setScanHistory(cachedHistory);

      if (
        !currentAuth.isSignedIn ||
        !currentAuth.userId ||
        !API_URL
      ) {
        return;
      }

      try {
        const token = await currentAuth.getToken({
          skipCache: true,
        });

        if (!token) {
          throw new Error("Clerk did not return a session token.");
        }

        const response = await fetch(`${API_URL}/api/scans`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const responseBody = (await response
          .json()
          .catch(() => ({}))) as ScanHistoryApiResponse;

        if (!response.ok) {
          throw new Error(
            responseBody.message ||
              `Failed to load scan history (${response.status}).`,
          );
        }

        let synchronizedHistory: ScanHistoryItem[] = Array.isArray(
          responseBody.scans,
        )
          ? responseBody.scans
              .map(normalizeStoredScan)
              .filter((scan): scan is ScanHistoryItem => scan !== null)
              .map((scan) => ({
                ...scan,
                pendingSync: false,
              }))
          : [];

        for (const cachedScan of cachedHistory) {
          if (
            authRef.current.userId !== currentAuth.userId ||
            localMutationVersionRef.current !== refreshMutationVersion
          ) {
            return;
          }

          if (!needsBackendSync(cachedScan)) {
            continue;
          }

          const matchingServerScan = synchronizedHistory.find(
            (serverScan) =>
              getClientScanId(serverScan) === getClientScanId(cachedScan),
          );

          if (matchingServerScan) {
            synchronizedHistory = mergeLatestScan(
              matchingServerScan,
              synchronizedHistory,
            );
            continue;
          }

          const latestServerScan = synchronizedHistory.find(
            (serverScan) => serverScan.barcode === cachedScan.barcode,
          );
          const cachedScanIsNewer =
            !latestServerScan ||
            new Date(cachedScan.scannedAt).getTime() >
              new Date(latestServerScan.scannedAt).getTime();

          if (!cachedScanIsNewer) {
            continue;
          }

          try {
            const synchronizedScan =
              await backendMutationQueueRef.current.run(async () => {
                const pendingAuth = authRef.current;

                if (
                  !pendingAuth.isSignedIn ||
                  pendingAuth.userId !== currentAuth.userId
                ) {
                  throw new Error("The signed-in account changed.");
                }

                const pendingToken = await pendingAuth.getToken({
                  skipCache: true,
                });

                if (!pendingToken) {
                  throw new Error("Clerk did not return a session token.");
                }

                return postScanToBackend(pendingToken, cachedScan);
              });

            synchronizedHistory = mergeLatestScan(
              synchronizedScan,
              synchronizedHistory,
            );
          } catch (error) {
            console.log("Failed to synchronize cached scan:", error);

            synchronizedHistory = mergeLatestScan(
              cachedScan,
              synchronizedHistory,
            );
          }
        }

        if (
          authRef.current.userId !== currentAuth.userId ||
          localMutationVersionRef.current !== refreshMutationVersion
        ) {
          return;
        }

        await replaceScanHistory(currentStorageKey, synchronizedHistory);
      } catch (error) {
        console.log("Failed to load scan history from backend:", error);
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    refreshUserKeyRef.current = refreshUserKey;

    try {
      await refreshPromise;
    } finally {
      if (refreshPromiseRef.current === refreshPromise) {
        refreshPromiseRef.current = null;
        refreshUserKeyRef.current = null;
      }
    }
  }, [replaceScanHistory]);

  useEffect(() => {
    scanHistoryRef.current = [];
    setScanHistory([]);

    void refreshScanHistory();
  }, [isLoaded, isSignedIn, refreshScanHistory, userId]);

  const synchronizeLocalScan = useCallback(
    async (
      localScan: ScanHistoryItem,
      scanUserId: string,
      storageKey: string,
      scanClearVersion: number,
    ) => {
      try {
        const savedScan = await backendMutationQueueRef.current.run(
          async () => {
            const currentAuth = authRef.current;

            if (
              !currentAuth.isLoaded ||
              !currentAuth.isSignedIn ||
              currentAuth.userId !== scanUserId ||
              clearVersionRef.current !== scanClearVersion ||
              !API_URL
            ) {
              return null;
            }

            const token = await currentAuth.getToken({
              skipCache: true,
            });

            if (!token) {
              throw new Error("Clerk did not return a session token.");
            }

            return postScanToBackend(token, localScan);
          },
        );

        if (
          !savedScan ||
          authRef.current.userId !== scanUserId ||
          clearVersionRef.current !== scanClearVersion
        ) {
          return;
        }

        const currentScan = scanHistoryRef.current.find(
          (scan) => scan.barcode === localScan.barcode,
        );

        if (
          !currentScan ||
          getClientScanId(currentScan) !== getClientScanId(localScan)
        ) {
          return;
        }

        await replaceScanHistory(
          storageKey,
          mergeLatestScan(savedScan, scanHistoryRef.current),
        );
      } catch (error) {
        console.log("Failed to save scan to backend:", error);
      }
    },
    [replaceScanHistory],
  );

  const addLocalScan = useCallback(
    (
      barcode: string,
      productDetails: Omit<
        ScanHistoryItem,
        "barcode" | "clientScanId" | "id" | "pendingSync" | "scannedAt"
      >,
    ) => {
      const currentAuth = authRef.current;
      const currentStorageKey = getStorageKey(currentAuth.userId);
      const clientScanId = createClientScanId();
      const scanClearVersion = clearVersionRef.current;

      localMutationVersionRef.current += 1;

      const localScan: ScanHistoryItem = {
        ...productDetails,
        id: clientScanId,
        clientScanId,
        barcode,
        scannedAt: new Date().toISOString(),
        pendingSync: Boolean(currentAuth.isSignedIn && currentAuth.userId),
      };

      const nextHistory = mergeLatestScan(
        localScan,
        scanHistoryRef.current,
      );

      scanHistoryRef.current = nextHistory;
      setScanHistory(nextHistory);

      void (async () => {
        await localStorageQueueRef.current.run(() =>
          saveStoredHistory(currentStorageKey, nextHistory),
        );

        if (
          currentAuth.userId &&
          clearVersionRef.current === scanClearVersion
        ) {
          await synchronizeLocalScan(
            localScan,
            currentAuth.userId,
            currentStorageKey,
            scanClearVersion,
          );
        }
      })();
    },
    [synchronizeLocalScan],
  );

  const addScanToHistory = useCallback(
    (product: DemoProduct) => {
      addLocalScan(product.barcode, {
        name: product.name,
        brand: product.brand,
        category: product.category,
        status: product.status,
        fdaStatusLabel: product.fdaStatusLabel,
      });
    },
    [addLocalScan],
  );

  const addUnknownScanToHistory = useCallback(
    (barcode: string) => {
      const cleanedBarcode = barcode.trim();

      if (!cleanedBarcode) {
        return;
      }

      addLocalScan(cleanedBarcode, {
        name: "Unknown Product",
        brand: "No FDA record found",
        category: "Unverified Product",
        status: "Unverified",
        fdaStatusLabel: "Not Listed / Unverified",
      });
    },
    [addLocalScan],
  );

  const clearScanHistory = useCallback(async () => {
    const currentAuth = authRef.current;
    const currentStorageKey = getStorageKey(currentAuth.userId);
    const previousHistory = scanHistoryRef.current;
    const clearMutationVersion = localMutationVersionRef.current + 1;

    localMutationVersionRef.current = clearMutationVersion;
    clearVersionRef.current += 1;
    scanHistoryRef.current = [];
    setScanHistory([]);

    try {
      await localStorageQueueRef.current.run(() =>
        AsyncStorage.removeItem(currentStorageKey),
      );
    } catch (error) {
      console.log("Failed to clear cached scan history:", error);

      await replaceScanHistory(currentStorageKey, previousHistory);
      return false;
    }

    if (!currentAuth.isLoaded) {
      await replaceScanHistory(currentStorageKey, previousHistory);
      return false;
    }

    if (!currentAuth.isSignedIn || !currentAuth.userId) {
      return true;
    }

    if (!API_URL) {
      await replaceScanHistory(currentStorageKey, previousHistory);
      return false;
    }

    try {
      await backendMutationQueueRef.current.run(async () => {
        const deleteAuth = authRef.current;

        if (
          !deleteAuth.isSignedIn ||
          deleteAuth.userId !== currentAuth.userId
        ) {
          throw new Error("The signed-in account changed.");
        }

        const token = await deleteAuth.getToken({
          skipCache: true,
        });

        if (!token) {
          throw new Error("Clerk did not return a session token.");
        }

        const response = await fetch(`${API_URL}/api/scans`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const responseBody = (await response
          .json()
          .catch(() => ({}))) as ScanHistoryApiResponse;

        if (!response.ok) {
          throw new Error(
            responseBody.message ||
              `Failed to clear scan history (${response.status}).`,
          );
        }
      });

      return true;
    } catch (error) {
      console.log("Failed to clear backend scan history:", error);

      if (
        authRef.current.userId === currentAuth.userId &&
        localMutationVersionRef.current === clearMutationVersion
      ) {
        await replaceScanHistory(currentStorageKey, previousHistory);
      }

      return false;
    }
  }, [replaceScanHistory]);

  const value = useMemo(
    () => ({
      scanHistory,
      refreshScanHistory,
      addScanToHistory,
      addUnknownScanToHistory,
      clearScanHistory,
    }),
    [
      scanHistory,
      refreshScanHistory,
      addScanToHistory,
      addUnknownScanToHistory,
      clearScanHistory,
    ],
  );

  return (
    <ScanHistoryContext.Provider value={value}>
      {children}
    </ScanHistoryContext.Provider>
  );
}

export function useScanHistory() {
  const context = useContext(ScanHistoryContext);

  if (!context) {
    throw new Error("useScanHistory must be used inside ScanHistoryProvider");
  }

  return context;
}
