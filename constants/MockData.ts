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
    id: "green-cross-total-defense-hand-spray-40ml",
    barcode: "4800047865152",
    name: "Green Cross Total Defense Antibacterial Hand Spray 40mL",
    brand: "Green Cross",
    category: "Hand Sanitizer",
    status: "Approved",
    fdaStatusLabel: "FDA Notified",
    registrationNumber: "NN-1000011397349",
    healthScore: null,
    servingSize: "40mL spray bottle",
    warningMessage:
      "Philippine FDA cosmetic notification NN-1000011397349 is valid through November 28, 2026. For external use only. Do not swallow or use near the eyes. Keep tightly closed and away from flame or heat; children should use it under adult supervision.",
    verificationUrl: "https://verification.fda.gov.ph/",
    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },
    ingredients: [
      { name: "Ethyl Alcohol", isAllergen: false },
      { name: "Purified Water", isAllergen: false },
      { name: "Polyhexamethylene Biguanide", isAllergen: false },
      { name: "Benzalkonium Chloride", isAllergen: false },
      { name: "Propylene Glycol", isAllergen: false },
      { name: "Aloe Barbadensis Leaf Extract", isAllergen: false },
      { name: "Glycerin", isAllergen: false },
      { name: "Fragrance", isAllergen: false },
    ],
    allergens: [],
    alternatives: [
      "Wash hands with soap and water when available",
      "Another FDA-notified hand sanitizer suitable for the user",
    ],
  },
  {
    id: "super-delights-brownie-bites-14g",
    barcode: "4800365881315",
    name: "Super Delights Brownie Bites 14g",
    brand: "Super Delights",
    category: "Baked Snack",
    status: "Approved",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000010589283",
    healthScore: null,
    servingSize: "14g (1 pack)",
    warningMessage:
      "FDA registration FR-4000010589283 is valid through February 1, 2028. The FDA portal does not publish retail barcodes; this match uses the product name, brand, manufacturer, address, and packaging. Contains wheat/gluten, eggs, milk, and soy. The label also states that it is manufactured on equipment and/or in facilities that use nut ingredients.",
    verificationUrl: "https://verification.fda.gov.ph/",
    nutrition: {
      calories: "60",
      protein: "Less than 1g",
      carbohydrates: "9g",
      totalFat: "2g",
      sodium: "40mg",
    },
    ingredients: [
      { name: "Sugar", isAllergen: false },
      { name: "Wheat Flour", isAllergen: true },
      { name: "Eggs", isAllergen: true },
      { name: "Glucose", isAllergen: false },
      { name: "Vegetable Oil (Palm Olein)", isAllergen: false },
      { name: "Cocoa Powder", isAllergen: false },
      {
        name: "Milk Chocolate Chips (Sugar, Cocoa Mass, Cocoa Butter, Milk Solids, Anhydrous Milk Fat, Soya Lecithin, Vanillin)",
        isAllergen: true,
      },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Baking Powder (Leavening Agent)", isAllergen: false },
      { name: "Modified Starch", isAllergen: false },
      { name: "Potassium Sorbate (Preservative)", isAllergen: false },
    ],
    allergens: ["Wheat / Gluten", "Eggs", "Milk", "Soy"],
    alternatives: [
      "Fresh fruit with no added sugar",
      "A lower-sugar snack checked against your allergen preferences",
    ],
  },
  {
    id: "athlene-active-creatine-monohydrate-300g",
    barcode: "0745125547008",
    name: "Athlene Active Creatine Monohydrate 300g",
    brand: "Athlene",
    category: "Food Supplement",
    status: "Caution",
    fdaStatusLabel: "FDA Registered — No Approved Therapeutic Claims",
    registrationNumber: "FR-4000009873654",
    healthScore: null,
    servingSize: "5g (1 scoop)",
    warningMessage:
      "For healthy adults only. Consult a physician before use if taking medication or if you have a medical condition. Do not use if under 18, pregnant, trying to become pregnant, or breastfeeding. Follow the recommended dosage and stay hydrated.",
    verificationUrl: "https://verification.fda.gov.ph/",
    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },
    ingredients: [
      { name: "Creatine Monohydrate (Micronized)", isAllergen: false },
    ],
    allergens: [],
    alternatives: [
      "Creatine-rich foods such as meat or fish",
      "Professional nutrition guidance before another supplement",
    ],
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
