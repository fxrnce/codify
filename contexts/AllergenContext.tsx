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

const ALLERGEN_STORAGE_KEY_PREFIX = "codify_allergen_preferences_user";
const ALLERGEN_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

type StoredAllergenPreferences = {
  allergenIds: string[];
  pendingSync: boolean;
};

type AllergenPreferencesApiResponse = {
  success?: boolean;
  message?: string;
  allergenIds?: string[];
};

type AllergenContextValue = {
  selectedAllergens: string[];
  toggleAllergen: (id: string) => void;
  isAllergenSelected: (id: string) => boolean;
};

const AllergenContext = createContext<AllergenContextValue | undefined>(
  undefined,
);

function getStorageKey(userId?: string | null) {
  if (!userId) {
    return `${ALLERGEN_STORAGE_KEY_PREFIX}_guest`;
  }

  return `${ALLERGEN_STORAGE_KEY_PREFIX}_${userId}`;
}

function normalizeAllergenIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter(
        (allergenId): allergenId is string =>
          typeof allergenId === "string" &&
          allergenId.length <= 80 &&
          ALLERGEN_ID_PATTERN.test(allergenId),
      ),
    ),
  ];
}

function haveSameAllergenIds(firstIds: string[], secondIds: string[]) {
  return (
    firstIds.length === secondIds.length &&
    firstIds.every((allergenId, index) => allergenId === secondIds[index])
  );
}

async function readStoredPreferences(storageKey: string) {
  try {
    const savedPreferences = await AsyncStorage.getItem(storageKey);

    if (!savedPreferences) {
      return {
        allergenIds: [],
        pendingSync: false,
      } satisfies StoredAllergenPreferences;
    }

    const parsedPreferences = JSON.parse(savedPreferences) as unknown;

    if (Array.isArray(parsedPreferences)) {
      return {
        allergenIds: normalizeAllergenIds(parsedPreferences),
        pendingSync: false,
      } satisfies StoredAllergenPreferences;
    }

    if (
      typeof parsedPreferences === "object" &&
      parsedPreferences !== null &&
      "allergenIds" in parsedPreferences
    ) {
      return {
        allergenIds: normalizeAllergenIds(parsedPreferences.allergenIds),
        pendingSync:
          "pendingSync" in parsedPreferences &&
          parsedPreferences.pendingSync === true,
      } satisfies StoredAllergenPreferences;
    }
  } catch (error) {
    console.log("Failed to load allergen preferences:", error);
  }

  return {
    allergenIds: [],
    pendingSync: false,
  } satisfies StoredAllergenPreferences;
}

async function saveStoredPreferences(
  storageKey: string,
  preferences: StoredAllergenPreferences,
) {
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch (error) {
    console.log("Failed to save allergen preferences:", error);
  }
}

async function updateBackendPreferences(token: string, allergenIds: string[]) {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is missing.");
  }

  const response = await fetch(`${API_URL}/api/allergen-preferences`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      allergenIds,
    }),
  });

  const responseBody = (await response
    .json()
    .catch(() => ({}))) as AllergenPreferencesApiResponse;

  if (!response.ok || !Array.isArray(responseBody.allergenIds)) {
    throw new Error(
      responseBody.message ||
        `Failed to update allergen preferences (${response.status}).`,
    );
  }

  return normalizeAllergenIds(responseBody.allergenIds);
}

export function AllergenProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  const selectedAllergensRef = useRef<string[]>([]);
  const localMutationVersionRef = useRef(0);
  const localPersistenceQueueRef = useRef(Promise.resolve());
  const syncQueueRef = useRef(Promise.resolve());

  const authRef = useRef({
    getToken,
    isLoaded,
    isSignedIn,
    userId,
  });

  selectedAllergensRef.current = selectedAllergens;
  authRef.current = {
    getToken,
    isLoaded,
    isSignedIn,
    userId,
  };

  const queuePreferencesSync = useCallback(
    (syncUserId: string, storageKey: string, allergenIds: string[]) => {
      syncQueueRef.current = syncQueueRef.current
        .then(async () => {
          const currentAuth = authRef.current;

          if (
            !currentAuth.isLoaded ||
            !currentAuth.isSignedIn ||
            currentAuth.userId !== syncUserId ||
            !API_URL
          ) {
            return;
          }

          const token = await currentAuth.getToken({
            skipCache: true,
          });

          if (!token) {
            throw new Error("Clerk did not return a session token.");
          }

          const savedAllergenIds = await updateBackendPreferences(
            token,
            allergenIds,
          );

          if (
            authRef.current.userId === syncUserId &&
            haveSameAllergenIds(selectedAllergensRef.current, allergenIds)
          ) {
            selectedAllergensRef.current = savedAllergenIds;
            setSelectedAllergens(savedAllergenIds);

            await saveStoredPreferences(storageKey, {
              allergenIds: savedAllergenIds,
              pendingSync: false,
            });
          }
        })
        .catch((error) => {
          console.log("Failed to sync allergen preferences:", error);
        });
    },
    [],
  );

  const refreshPreferences = useCallback(async () => {
    const currentAuth = authRef.current;

    if (!currentAuth.isLoaded) {
      return;
    }

    const refreshUserId = currentAuth.userId;
    const refreshMutationVersion = localMutationVersionRef.current;
    const currentStorageKey = getStorageKey(refreshUserId);
    const cachedPreferences = await readStoredPreferences(currentStorageKey);

    if (
      authRef.current.userId !== refreshUserId ||
      localMutationVersionRef.current !== refreshMutationVersion
    ) {
      return;
    }

    selectedAllergensRef.current = cachedPreferences.allergenIds;
    setSelectedAllergens(cachedPreferences.allergenIds);

    if (!currentAuth.isSignedIn || !refreshUserId || !API_URL) {
      return;
    }

    if (cachedPreferences.pendingSync) {
      queuePreferencesSync(
        refreshUserId,
        currentStorageKey,
        cachedPreferences.allergenIds,
      );
      return;
    }

    try {
      const token = await currentAuth.getToken({
        skipCache: true,
      });

      if (!token) {
        throw new Error("Clerk did not return a session token.");
      }

      const response = await fetch(`${API_URL}/api/allergen-preferences`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseBody = (await response
        .json()
        .catch(() => ({}))) as AllergenPreferencesApiResponse;

      if (!response.ok || !Array.isArray(responseBody.allergenIds)) {
        throw new Error(
          responseBody.message ||
            `Failed to load allergen preferences (${response.status}).`,
        );
      }

      if (
        authRef.current.userId !== refreshUserId ||
        localMutationVersionRef.current !== refreshMutationVersion
      ) {
        return;
      }

      const serverAllergenIds = normalizeAllergenIds(
        responseBody.allergenIds,
      );

      selectedAllergensRef.current = serverAllergenIds;
      setSelectedAllergens(serverAllergenIds);

      await saveStoredPreferences(currentStorageKey, {
        allergenIds: serverAllergenIds,
        pendingSync: false,
      });
    } catch (error) {
      console.log("Failed to load allergen preferences from backend:", error);
    }
  }, [queuePreferencesSync]);

  useEffect(() => {
    void refreshPreferences();
  }, [isLoaded, isSignedIn, refreshPreferences, userId]);

  const toggleAllergen = useCallback(
    (id: string) => {
      const currentAuth = authRef.current;
      const currentAllergenIds = selectedAllergensRef.current;
      const nextAllergenIds = currentAllergenIds.includes(id)
        ? currentAllergenIds.filter((allergenId) => allergenId !== id)
        : [...currentAllergenIds, id];

      localMutationVersionRef.current += 1;
      selectedAllergensRef.current = nextAllergenIds;
      setSelectedAllergens(nextAllergenIds);

      const currentStorageKey = getStorageKey(currentAuth.userId);
      const shouldSync = Boolean(
        currentAuth.isSignedIn && currentAuth.userId,
      );

      localPersistenceQueueRef.current = localPersistenceQueueRef.current
        .then(async () => {
          await saveStoredPreferences(currentStorageKey, {
            allergenIds: nextAllergenIds,
            pendingSync: shouldSync,
          });

          if (shouldSync && currentAuth.userId && API_URL) {
            queuePreferencesSync(
              currentAuth.userId,
              currentStorageKey,
              nextAllergenIds,
            );
          }
        })
        .catch((error) => {
          console.log("Failed to cache allergen preferences:", error);
        });
    },
    [queuePreferencesSync],
  );

  const isAllergenSelected = useCallback(
    (id: string) => selectedAllergens.includes(id),
    [selectedAllergens],
  );

  const value = useMemo(
    () => ({
      selectedAllergens,
      toggleAllergen,
      isAllergenSelected,
    }),
    [selectedAllergens, toggleAllergen, isAllergenSelected],
  );

  return (
    <AllergenContext.Provider value={value}>
      {children}
    </AllergenContext.Provider>
  );
}

export function useAllergenAlerts() {
  const context = useContext(AllergenContext);

  if (!context) {
    throw new Error("useAllergenAlerts must be used inside AllergenProvider");
  }

  return context;
}
