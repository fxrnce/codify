export const PRODUCT_TYPES = [
  "FOOD",
  "DRINK",
  "MEDICINE",
  "PERSONAL_CARE",
  "HOUSEHOLD",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  FOOD: "Food",
  DRINK: "Drinks",
  MEDICINE: "Medicines",
  PERSONAL_CARE: "Personal Care",
  HOUSEHOLD: "Household",
};
