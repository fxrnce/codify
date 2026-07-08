import { ReactNode, createContext, useContext, useMemo, useState } from "react";

type AllergenContextValue = {
  selectedAllergens: string[];
  toggleAllergen: (id: string) => void;
  isAllergenSelected: (id: string) => boolean;
};

const AllergenContext = createContext<AllergenContextValue | undefined>(
  undefined,
);

export function AllergenProvider({ children }: { children: ReactNode }) {
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  const toggleAllergen = (id: string) => {
    setSelectedAllergens((currentAllergens) => {
      if (currentAllergens.includes(id)) {
        return currentAllergens.filter((allergenId) => allergenId !== id);
      }

      return [...currentAllergens, id];
    });
  };

  const isAllergenSelected = (id: string) => {
    return selectedAllergens.includes(id);
  };

  const value = useMemo(
    () => ({
      selectedAllergens,
      toggleAllergen,
      isAllergenSelected,
    }),
    [selectedAllergens],
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
