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

const LEGACY_REPORTS_STORAGE_KEY = "codify_product_reports";
const REPORTS_STORAGE_KEY_PREFIX = "codify_product_reports_user";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export const PRODUCT_REPORT_REASONS = [
  "No FDA record found",
  "Wrong product information",
  "Suspicious product",
  "Possible counterfeit",
  "Other concern",
] as const;

export type ProductReportReason = (typeof PRODUCT_REPORT_REASONS)[number];

export type ProductReport = {
  id: string;
  barcode: string;
  productName: string;
  brand: string;
  category: string;
  reason: ProductReportReason;
  notes: string;
  submittedAt: string;
  pendingSync?: boolean;
};

export type ProductReportDraft = Omit<
  ProductReport,
  "id" | "pendingSync" | "submittedAt"
>;

type ProductReportApiResponse = {
  success?: boolean;
  message?: string;
  reports?: ProductReport[];
  report?: ProductReport;
  deletedCount?: number;
};

type SubmitReportResult = {
  report: ProductReport;
  savedToBackend: boolean;
};

type ProductReportsContextValue = {
  reports: ProductReport[];
  refreshReports: () => Promise<void>;
  submitReport: (draft: ProductReportDraft) => Promise<SubmitReportResult>;
  clearReports: () => Promise<boolean>;
};

const ProductReportsContext = createContext<
  ProductReportsContextValue | undefined
>(undefined);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getStorageKey(userId?: string | null) {
  if (!userId) {
    return `${REPORTS_STORAGE_KEY_PREFIX}_guest`;
  }

  return `${REPORTS_STORAGE_KEY_PREFIX}_${userId}`;
}

function normalizeBarcode(value: string) {
  const cleanedBarcode = value.trim();

  return /^\d{8,14}$/.test(cleanedBarcode) ? cleanedBarcode : "";
}

function getReportKey(report: Pick<ProductReport, "barcode">) {
  return normalizeBarcode(report.barcode) || "no-barcode";
}

function needsBackendSync(report: ProductReport) {
  return report.pendingSync === true || !UUID_PATTERN.test(report.id);
}

function mergeLatestReport(
  report: ProductReport,
  currentReports: ProductReport[],
) {
  const reportKey = getReportKey(report);

  return [
    report,
    ...currentReports.filter(
      (currentReport) =>
        currentReport.id !== report.id &&
        getReportKey(currentReport) !== reportKey,
    ),
  ];
}

function sortReports(reports: ProductReport[]) {
  return [...reports].sort(
    (firstReport, secondReport) =>
      new Date(secondReport.submittedAt).getTime() -
      new Date(firstReport.submittedAt).getTime(),
  );
}

async function readStoredReports(storageKey: string) {
  try {
    const savedReports = await AsyncStorage.getItem(storageKey);

    if (!savedReports) {
      return [];
    }

    const parsedReports = JSON.parse(savedReports) as unknown;

    return Array.isArray(parsedReports)
      ? (parsedReports as ProductReport[])
      : [];
  } catch (error) {
    console.log("Failed to load product reports:", error);
    return [];
  }
}

async function saveStoredReports(
  storageKey: string,
  reports: ProductReport[],
) {
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(reports));
  } catch (error) {
    console.log("Failed to save product reports:", error);
  }
}

async function postReportToBackend(
  token: string,
  draft: ProductReportDraft,
) {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is missing.");
  }

  const response = await fetch(`${API_URL}/api/reports`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      barcode: normalizeBarcode(draft.barcode) || null,
      productName: draft.productName,
      brand: draft.brand,
      category: draft.category,
      reason: draft.reason,
      notes: draft.notes,
    }),
  });

  const responseBody = (await response
    .json()
    .catch(() => ({}))) as ProductReportApiResponse;

  if (!response.ok || !responseBody.report) {
    throw new Error(
      responseBody.message || `Failed to submit report (${response.status}).`,
    );
  }

  return responseBody.report;
}

export function ProductReportsProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  const [reports, setReports] = useState<ProductReport[]>([]);

  const reportsRef = useRef<ProductReport[]>([]);
  const localMutationVersionRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const refreshUserKeyRef = useRef<string | null>(null);

  const authRef = useRef({
    getToken,
    isLoaded,
    isSignedIn,
    userId,
  });

  reportsRef.current = reports;
  authRef.current = {
    getToken,
    isLoaded,
    isSignedIn,
    userId,
  };

  const replaceReports = useCallback(
    async (storageKey: string, nextReports: ProductReport[]) => {
      const sortedReports = sortReports(nextReports);

      reportsRef.current = sortedReports;
      setReports(sortedReports);

      await saveStoredReports(storageKey, sortedReports);
    },
    [],
  );

  const refreshReports = useCallback(async () => {
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
      let cachedReports = await readStoredReports(currentStorageKey);

      if (
        authRef.current.userId !== currentAuth.userId ||
        localMutationVersionRef.current !== refreshMutationVersion
      ) {
        return;
      }

      if (currentAuth.userId && cachedReports.length === 0) {
        const legacyReports = await readStoredReports(
          LEGACY_REPORTS_STORAGE_KEY,
        );

        if (legacyReports.length > 0) {
          if (
            authRef.current.userId !== currentAuth.userId ||
            localMutationVersionRef.current !== refreshMutationVersion
          ) {
            return;
          }

          cachedReports = legacyReports;

          await saveStoredReports(currentStorageKey, legacyReports);
          await AsyncStorage.removeItem(LEGACY_REPORTS_STORAGE_KEY);
        }
      }

      if (
        authRef.current.userId !== currentAuth.userId ||
        localMutationVersionRef.current !== refreshMutationVersion
      ) {
        return;
      }

      await replaceReports(currentStorageKey, cachedReports);

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

        if (
          authRef.current.userId !== currentAuth.userId ||
          localMutationVersionRef.current !== refreshMutationVersion
        ) {
          return;
        }

        const response = await fetch(`${API_URL}/api/reports`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const responseBody = (await response
          .json()
          .catch(() => ({}))) as ProductReportApiResponse;

        if (!response.ok) {
          throw new Error(
            responseBody.message ||
              `Failed to load product reports (${response.status}).`,
          );
        }

        let synchronizedReports = Array.isArray(responseBody.reports)
          ? responseBody.reports
          : [];

        for (const cachedReport of cachedReports) {
          if (
            authRef.current.userId !== currentAuth.userId ||
            localMutationVersionRef.current !== refreshMutationVersion
          ) {
            return;
          }

          const reportKey = getReportKey(cachedReport);
          const currentServerReport = synchronizedReports.find(
            (serverReport) => getReportKey(serverReport) === reportKey,
          );
          const cachedReportIsNewer =
            !currentServerReport ||
            new Date(cachedReport.submittedAt).getTime() >
              new Date(currentServerReport.submittedAt).getTime();

          if (!needsBackendSync(cachedReport) || !cachedReportIsNewer) {
            continue;
          }

          try {
            const synchronizedReport = await postReportToBackend(
              token,
              cachedReport,
            );

            synchronizedReports = mergeLatestReport(
              synchronizedReport,
              synchronizedReports,
            );
          } catch (error) {
            console.log("Failed to synchronize cached product report:", error);

            synchronizedReports = mergeLatestReport(
              cachedReport,
              synchronizedReports,
            );
          }
        }

        if (
          authRef.current.userId !== currentAuth.userId ||
          localMutationVersionRef.current !== refreshMutationVersion
        ) {
          return;
        }

        await replaceReports(currentStorageKey, synchronizedReports);
      } catch (error) {
        console.log("Failed to load product reports from backend:", error);
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
  }, [replaceReports]);

  useEffect(() => {
    reportsRef.current = [];
    setReports([]);

    void refreshReports();
  }, [isLoaded, isSignedIn, refreshReports, userId]);

  const submitReport = useCallback(
    async (draft: ProductReportDraft): Promise<SubmitReportResult> => {
      const currentAuth = authRef.current;
      const currentStorageKey = getStorageKey(currentAuth.userId);

      localMutationVersionRef.current += 1;

      const localReport: ProductReport = {
        ...draft,
        id: `${normalizeBarcode(draft.barcode) || "no-barcode"}-${Date.now()}`,
        barcode: normalizeBarcode(draft.barcode),
        submittedAt: new Date().toISOString(),
        pendingSync: true,
      };

      await replaceReports(
        currentStorageKey,
        mergeLatestReport(localReport, reportsRef.current),
      );

      if (
        !currentAuth.isLoaded ||
        !currentAuth.isSignedIn ||
        !currentAuth.userId ||
        !API_URL
      ) {
        return {
          report: localReport,
          savedToBackend: false,
        };
      }

      try {
        const token = await currentAuth.getToken({
          skipCache: true,
        });

        if (!token) {
          throw new Error("Clerk did not return a session token.");
        }

        const savedReport = await postReportToBackend(token, draft);

        await replaceReports(
          currentStorageKey,
          mergeLatestReport(savedReport, reportsRef.current),
        );

        return {
          report: savedReport,
          savedToBackend: true,
        };
      } catch (error) {
        console.log("Failed to submit product report to backend:", error);

        return {
          report: localReport,
          savedToBackend: false,
        };
      }
    },
    [replaceReports],
  );

  const clearReports = useCallback(async () => {
    const currentAuth = authRef.current;
    const currentStorageKey = getStorageKey(currentAuth.userId);
    const previousReports = reportsRef.current;

    localMutationVersionRef.current += 1;
    reportsRef.current = [];
    setReports([]);

    try {
      await AsyncStorage.removeItem(currentStorageKey);
    } catch (error) {
      console.log("Failed to clear cached product reports:", error);

      await replaceReports(currentStorageKey, previousReports);
      return false;
    }

    if (!currentAuth.isLoaded) {
      await replaceReports(currentStorageKey, previousReports);
      return false;
    }

    if (!currentAuth.isSignedIn || !currentAuth.userId) {
      return true;
    }

    if (!API_URL) {
      await replaceReports(currentStorageKey, previousReports);
      return false;
    }

    try {
      const token = await currentAuth.getToken({
        skipCache: true,
      });

      if (!token) {
        throw new Error("Clerk did not return a session token.");
      }

      const response = await fetch(`${API_URL}/api/reports`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseBody = (await response
        .json()
        .catch(() => ({}))) as ProductReportApiResponse;

      if (!response.ok) {
        throw new Error(
          responseBody.message ||
            `Failed to clear product reports (${response.status}).`,
        );
      }

      return true;
    } catch (error) {
      console.log("Failed to clear product reports from backend:", error);

      await replaceReports(currentStorageKey, previousReports);
      return false;
    }
  }, [replaceReports]);

  const value = useMemo(
    () => ({
      reports,
      refreshReports,
      submitReport,
      clearReports,
    }),
    [reports, refreshReports, submitReport, clearReports],
  );

  return (
    <ProductReportsContext.Provider value={value}>
      {children}
    </ProductReportsContext.Provider>
  );
}

export function useProductReports() {
  const context = useContext(ProductReportsContext);

  if (!context) {
    throw new Error(
      "useProductReports must be used inside ProductReportsProvider",
    );
  }

  return context;
}
