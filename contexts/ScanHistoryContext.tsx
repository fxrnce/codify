import type { DemoProduct, ProductStatus } from "@/constants/MockData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const SCAN_HISTORY_STORAGE_KEY = "codify_scan_history";

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

type ScanHistoryContextValue = {
  scanHistory: ScanHistoryItem[];
  addScanToHistory: (product: DemoProduct) => void;
  addUnknownScanToHistory: (barcode: string) => void;
  clearScanHistory: () => void;
};

const ScanHistoryContext = createContext<ScanHistoryContextValue | undefined>(
  undefined,
);

export function ScanHistoryProvider({ children }: { children: ReactNode }) {
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    const loadScanHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem(
          SCAN_HISTORY_STORAGE_KEY,
        );

        if (savedHistory) {
          setScanHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.log("Failed to load scan history:", error);
      }
    };

    loadScanHistory();
  }, []);

  const saveScanHistory = async (updatedHistory: ScanHistoryItem[]) => {
    try {
      await AsyncStorage.setItem(
        SCAN_HISTORY_STORAGE_KEY,
        JSON.stringify(updatedHistory),
      );
    } catch (error) {
      console.log("Failed to save scan history:", error);
    }
  };

  const addScanToHistory = useCallback((product: DemoProduct) => {
    setScanHistory((currentHistory) => {
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

      const historyWithoutSameProduct = currentHistory.filter(
        (item) => item.barcode !== product.barcode,
      );

      const updatedHistory = [newHistoryItem, ...historyWithoutSameProduct];

      saveScanHistory(updatedHistory);

      return updatedHistory;
    });
  }, []);

  const addUnknownScanToHistory = useCallback((barcode: string) => {
    const cleanedBarcode = barcode.trim();

    if (!cleanedBarcode) {
      return;
    }

    setScanHistory((currentHistory) => {
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

      const historyWithoutSameProduct = currentHistory.filter(
        (item) => item.barcode !== cleanedBarcode,
      );

      const updatedHistory = [newHistoryItem, ...historyWithoutSameProduct];

      saveScanHistory(updatedHistory);

      return updatedHistory;
    });
  }, []);

  const clearScanHistory = useCallback(() => {
    setScanHistory([]);

    AsyncStorage.removeItem(SCAN_HISTORY_STORAGE_KEY).catch((error) => {
      console.log("Failed to clear scan history:", error);
    });
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
