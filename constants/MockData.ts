export type ProductStatus =
  | "Approved"
  | "Caution"
  | "FDA Advisory"
  | "Unverified";

export type DemoProduct = {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  status: ProductStatus;
  fdaStatusLabel: string;
  registrationNumber: string;
  healthScore: number | null;
  servingSize: string;
  warningMessage: string;
  imageUrl?: string | null;
  verificationUrl?: string | null;
  nutrition: {
    calories: string;
    protein: string;
    carbohydrates: string;
    totalFat: string;
    sodium: string;
  };
  ingredients: {
    name: string;
    isAllergen: boolean;
  }[];
  allergens: string[];
  alternatives: string[];
};

export const recentScans = [
  {
    id: "1",
    name: "Dove Body Wash",
    status: "Approved",
    time: "2 mins ago",
    color: "#22C55E",
  },
  {
    id: "2",
    name: "Vitamin C Plus",
    status: "Registered",
    time: "1 hour ago",
    color: "#F59E0B",
  },
  {
    id: "3",
    name: "Slim Coffee",
    status: "Alert",
    time: "Yesterday",
    color: "#EF4444",
  },
];

export const demoProducts: DemoProduct[] = [
  {
    id: "milk-chocolate-bar",
    barcode: "4800011234567",
    name: "Milk Chocolate Bar",
    brand: "Sweet Delights",
    category: "Confectionery",
    status: "Approved",
    fdaStatusLabel: "FDA Approved",
    registrationNumber: "FR-4000011234567",
    healthScore: 65,
    servingSize: "40g (4 pieces)",
    warningMessage: "This product contains: Milk",
    nutrition: {
      calories: "210",
      protein: "3g",
      carbohydrates: "24g",
      totalFat: "12g",
      sodium: "35mg",
    },
    ingredients: [
      { name: "Sugar", isAllergen: false },
      { name: "Cocoa Mass", isAllergen: false },
      { name: "Milk Powder", isAllergen: true },
      { name: "Cocoa Butter", isAllergen: false },
      { name: "Soy Lecithin", isAllergen: true },
      { name: "Vanilla Extract", isAllergen: false },
    ],
    allergens: ["Milk", "Soy"],
    alternatives: ["Dark Chocolate Bar (85% Cocoa)", "Organic Milk Chocolate"],
  },
  {
    id: "pureglow-facial-care",
    barcode: "4800017654321",
    name: "PureGlow Facial Care",
    brand: "PureGlow",
    category: "Cosmetics",
    status: "Caution",
    fdaStatusLabel: "FDA Caution",
    registrationNumber: "FR-4000017654321",
    healthScore: 48,
    servingSize: "External use only",
    warningMessage:
      "This product may contain fragrance ingredients. Check for skin sensitivity.",
    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },
    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Glycerin", isAllergen: false },
      { name: "Fragrance", isAllergen: true },
      { name: "Alcohol", isAllergen: false },
      { name: "Preservatives", isAllergen: false },
    ],
    allergens: ["Fragrance"],
    alternatives: ["Fragrance-Free Facial Wash", "Sensitive Skin Cleanser"],
  },
  {
    id: "nescafe-tradicao-forte-200g",
    barcode: "7891000304808",
    name: "Nescafé Tradição Forte 200g",
    brand: "Nescafé",
    category: "Instant Coffee",
    status: "FDA Advisory",
    fdaStatusLabel: "FDA Advisory No. 2026-0463",
    registrationNumber: "No Certificate of Product Registration issued",
    healthScore: null,
    servingSize: "N/A",
    warningMessage:
      "The Philippine FDA warns the public not to purchase or consume this unregistered product.",
    imageUrl:
      "https://www.fda.gov.ph/wp-content/uploads/2026/05/FDA-ADVISORY-No.2026-0463.png",
    verificationUrl:
      "https://www.fda.gov.ph/fda-advisory-no-2026-0463-public-health-warning-against-the-purchase-and-consumption-of-the-unregistered-food-product-nescafe-tradicao-forte-100-cafe/",
    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },
    ingredients: [],
    allergens: [],
    alternatives: [
      "FDA-registered instant coffee with matching Philippine-market packaging",
    ],
  },
  {
    id: "nescafe-classic-190g-brazil-algeria",
    barcode: "7891000361917",
    name: "Nescafé Classic 190g",
    brand: "Nescafé",
    category: "Instant Coffee",
    status: "Unverified",
    fdaStatusLabel: "Exact Variant Not Verified",
    registrationNumber: "No matching Philippine FDA record",
    healthScore: null,
    servingSize: "1 tsp with 180ml hot water",
    warningMessage:
      "No exact Philippine FDA record was found for this barcode. The label identifies it as produced in Brazil for the Algerian market, so verify this exact imported variant before purchase or use.",
    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },
    ingredients: [
      {
        name: "100% Soluble Robusta Coffee",
        isAllergen: false,
      },
    ],
    allergens: [],
    alternatives: [
      "Philippine-market Nescafé Classic with a matching FDA registration and local label",
    ],
  },
];

export function findProductByBarcode(barcode: string) {
  return demoProducts.find((product) => product.barcode === barcode);
}
