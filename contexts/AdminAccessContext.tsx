import { useAuth } from "@clerk/expo";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useNetworkStatus } from "@/contexts/NetworkContext";
import {
  authenticatedRequest,
  type AdminRole,
  type GetToken,
} from "@/services/admin-api";

type AdminAccess = {
  role: AdminRole | null;
  isAdmin: boolean;
  isChecking: boolean;
  isOnline: boolean;
  error: string;
  getToken: GetToken;
  refresh: () => Promise<void>;
};

const AdminAccessContext = createContext<AdminAccess | undefined>(undefined);

export function AdminAccessProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { isBackendReachable } = useNetworkStatus();
  const getTokenRef = useRef(getToken);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const getStableToken = useCallback<GetToken>(
    (options) => getTokenRef.current(options),
    [],
  );

  const refresh = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !userId) {
      setRole(null);
      setError("");
      return;
    }

    if (!isBackendReachable) {
      setRole(null);
      setIsChecking(false);
      setError("Administrator tools require an online connection.");
      return;
    }

    setIsChecking(true);
    setError("");

    try {
      const response = await authenticatedRequest<{ user: { role: AdminRole } }>(
        getStableToken,
        "/api/me",
      );
      setRole(response.user.role);
    } catch (caughtError) {
      // Fail closed: a failed check must not leave a stale admin state active.
      setRole(null);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to check administrator access.",
      );
    } finally {
      setIsChecking(false);
    }
  }, [getStableToken, isBackendReachable, isLoaded, isSignedIn, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminAccessContext.Provider
      value={{
        role,
        isAdmin: role === "ADMIN",
        isChecking,
        isOnline: isBackendReachable,
        error,
        getToken: getStableToken,
        refresh,
      }}
    >
      {children}
    </AdminAccessContext.Provider>
  );
}

export function useAdminAccess() {
  const context = useContext(AdminAccessContext);
  if (!context) {
    throw new Error("useAdminAccess must be used inside AdminAccessProvider.");
  }
  return context;
}
