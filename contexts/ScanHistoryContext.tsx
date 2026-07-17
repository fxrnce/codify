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

export type ScanHistoryItem = {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  status: ProductStatus;
  fdaStatusLabel: string;
  scannedAt: string;
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
  addScanToHistory: (product: DemoProduct) => void;
  addUnknownScanToHistory: (barcode: string) => void;
  clearScanHistory: () => void;
};

const ScanHistoryContext = createContext<ScanHistoryContextValue | undefined>(
  undefined,
);

function getStorageKey(userId?: string | null) {
  if (!userId) {
    return `${SCAN_HISTORY_STORAGE_KEY_PREFIX}_guest`;
  }

  return `${SCAN_HISTORY_STORAGE_KEY_PREFIX}_${userId}`;
}

async function readStoredHistory(storageKey: string) {
  try {
    const savedHistory = await AsyncStorage.getItem(storageKey);

    if (!savedHistory) {
      return [];
    }

    return JSON.parse(savedHistory) as ScanHistoryItem[];
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

export function ScanHistoryProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  const scanHistoryRef = useRef<ScanHistoryItem[]>([]);
  const storageKeyRef = useRef(getStorageKey(userId));

  const authRef = useRef({
    getToken,
    isLoaded,
    isSignedIn,
    userId,
  });

  scanHistoryRef.current = scanHistory;
  storageKeyRef.current = getStorageKey(userId);

  authRef.current = {
    getToken,
    isLoaded,
    isSignedIn,
    userId,
  };

  const updateLocalHistory = useCallback(
    (
      updateFunction: (currentHistory: ScanHistoryItem[]) => ScanHistoryItem[],
    ) => {
      setScanHistory((currentHistory) => {
        const updatedHistory = updateFunction(currentHistory);

        scanHistoryRef.current = updatedHistory;

        void saveStoredHistory(storageKeyRef.current, updatedHistory);

        return updatedHistory;
      });
    },
    [],
  );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let isCancelled = false;

    const loadScanHistory = async () => {
      const currentStorageKey = getStorageKey(userId);

      let cachedHistory = await readStoredHistory(currentStorageKey);

      /*
       * Move the old shared AsyncStorage history into the signed-in
       * user's cache the first time this backend version is opened.
       */
      if (userId && cachedHistory.length === 0) {
        const legacyHistory = await readStoredHistory(
          LEGACY_SCAN_HISTORY_STORAGE_KEY,
        );

        if (legacyHistory.length > 0) {
          cachedHistory = legacyHistory;

          await saveStoredHistory(currentStorageKey, legacyHistory);

          await AsyncStorage.removeItem(LEGACY_SCAN_HISTORY_STORAGE_KEY);
        }
      }

      if (!isCancelled) {
        scanHistoryRef.current = cachedHistory;
        setScanHistory(cachedHistory);
      }

      if (!isSignedIn || !userId || !API_URL) {
        return;
      }

      try {
        /*
         * Read getToken from the ref so changes to the function reference
         * do not repeatedly trigger this loading effect.
         */
        const token = await authRef.current.getToken({
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

        const serverHistory = Array.isArray(responseBody.scans)
          ? responseBody.scans
          : [];

        if (!isCancelled) {
          scanHistoryRef.current = serverHistory;
          setScanHistory(serverHistory);

          await saveStoredHistory(currentStorageKey, serverHistory);
        }
      } catch (error) {
        /*
         * The cached AsyncStorage history remains visible when
         * the backend cannot be reached.
         */
        console.log("Failed to load scan history from backend:", error);
      }
    };

    void loadScanHistory();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  const saveScanToBackend = useCallback(
    async (barcode: string) => {
      const currentAuth = authRef.current;

      if (
        !currentAuth.isLoaded ||
        !currentAuth.isSignedIn ||
        !currentAuth.userId ||
        !API_URL
      ) {
        return;
      }

      try {
        const token = await currentAuth.getToken();

        if (!token) {
          throw new Error("Clerk did not return a session token.");
        }

        const response = await fetch(`${API_URL}/api/scans`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            barcode,
          }),
        });

        const responseBody = (await response
          .json()
          .catch(() => ({}))) as ScanHistoryApiResponse;

        if (!response.ok) {
          throw new Error(
            responseBody.message || `Failed to save scan (${response.status}).`,
          );
        }

        if (responseBody.scan) {
          const savedScan = responseBody.scan;

          updateLocalHistory((currentHistory) => [
            savedScan,
            ...currentHistory.filter(
              (item) => item.barcode !== savedScan.barcode,
            ),
          ]);
        }
      } catch (error) {
        /*
         * The optimistic local scan remains in AsyncStorage when
         * the backend is temporarily unavailable.
         */
        console.log("Failed to save scan to backend:", error);
      }
    },
    [updateLocalHistory],
  );

  const addScanToHistory = useCallback(
    (product: DemoProduct) => {
      const newHistoryItem: ScanHistoryItem = {
        id: `${product.barcode}-${Date.now()}`,
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: product.category,
        status: product.status,
        fdaStatusLabel: product.fdaStatusLabel,
        scannedAt: new Date().toISOString(),
      };

      updateLocalHistory((currentHistory) => [
        newHistoryItem,
        ...currentHistory.filter((item) => item.barcode !== product.barcode),
      ]);

      void saveScanToBackend(product.barcode);
    },
    [saveScanToBackend, updateLocalHistory],
  );

  const addUnknownScanToHistory = useCallback(
    (barcode: string) => {
      const cleanedBarcode = barcode.trim();

      if (!cleanedBarcode) {
        return;
      }

      const newHistoryItem: ScanHistoryItem = {
        id: `${cleanedBarcode}-${Date.now()}`,
        barcode: cleanedBarcode,
        name: "Unknown Product",
        brand: "No FDA record found",
        category: "Unverified Product",
        status: "Not Approved",
        fdaStatusLabel: "Not Listed / Unverified",
        scannedAt: new Date().toISOString(),
      };

      updateLocalHistory((currentHistory) => [
        newHistoryItem,
        ...currentHistory.filter((item) => item.barcode !== cleanedBarcode),
      ]);

      void saveScanToBackend(cleanedBarcode);
    },
    [saveScanToBackend, updateLocalHistory],
  );

  const clearScanHistory = useCallback(() => {
    const previousHistory = scanHistoryRef.current;
    const currentStorageKey = storageKeyRef.current;

    scanHistoryRef.current = [];
    setScanHistory([]);

    void AsyncStorage.removeItem(currentStorageKey);

    const clearBackendHistory = async () => {
      const currentAuth = authRef.current;

      if (
        !currentAuth.isLoaded ||
        !currentAuth.isSignedIn ||
        !currentAuth.userId
      ) {
        return;
      }

      if (!API_URL) {
        scanHistoryRef.current = previousHistory;
        setScanHistory(previousHistory);

        await saveStoredHistory(currentStorageKey, previousHistory);

        return;
      }

      try {
        const token = await currentAuth.getToken();

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
      } catch (error) {
        console.log("Failed to clear backend scan history:", error);

        scanHistoryRef.current = previousHistory;
        setScanHistory(previousHistory);

        await saveStoredHistory(currentStorageKey, previousHistory);
      }
    };

    void clearBackendHistory();
  }, []);

  const value = useMemo(
    () => ({
      scanHistory,
      addScanToHistory,
      addUnknownScanToHistory,
      clearScanHistory,
    }),
    [scanHistory, addScanToHistory, addUnknownScanToHistory, clearScanHistory],
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
