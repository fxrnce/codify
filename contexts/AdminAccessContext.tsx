import { useAuth } from "@clerk/expo";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState } from "react-native";

import {
  authenticatedRequest,
  checkApiReachability,
  type AdminRole,
} from "@/services/admin-api";

type AdminAccess = {
  role: AdminRole | null;
  isAdmin: boolean;
  isChecking: boolean;
  isOnline: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const AdminAccessContext = createContext<AdminAccess | undefined>(undefined);

export function AdminAccessProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const [role, setRole] = useState<AdminRole | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const checkConnection = async () => {
      const reachable = await checkApiReachability();
      if (active) setIsOnline(reachable);
    };

    void checkConnection();
    const interval = setInterval(() => void checkConnection(), 20_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkConnection();
    });

    return () => {
      active = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !userId) {
      setRole(null);
      setError("");
      return;
    }

    setIsChecking(true);
    setError("");

    try {
      const response = await authenticatedRequest<{ user: { role: AdminRole } }>(
        getToken,
        "/api/me",
      );
      setRole(response.user.role);
      setIsOnline(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to check administrator access.",
      );
    } finally {
      setIsChecking(false);
    }
  }, [getToken, isLoaded, isSignedIn, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminAccessContext.Provider
      value={{
        role,
        isAdmin: role === "ADMIN",
        isChecking,
        isOnline,
        error,
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
