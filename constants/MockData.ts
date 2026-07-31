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
    saturatedFat?: string;
    totalSugars?: string;
    dietaryFiber?: string;
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
    id: "safeguard-pure-white-bar-soap-90g",
    barcode: "4987176026750",
    name: "Safeguard Pure White Bar Soap 90g",
    brand: "Safeguard",
    category: "Bar Soap",
    status: "Approved",
    fdaStatusLabel: "FDA Notified",
    registrationNumber: "NN-1000011604555",
    healthScore: null,
    servingSize: "90g bar",
    warningMessage:
      "Philippine FDA cosmetic notification NN-1000011604555 for Safeguard Pure White Bar Soap is valid through August 13, 2027. The FDA record does not list pack weight, while the Philippine DTI identifies a 90g retail variant. For external body cleansing only. Avoid contact with eyes and discontinue use if irritation occurs.",
    verificationUrl: "https://verification.fda.gov.ph/",
    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },
    ingredients: [
      { name: "Sodium Palmate", isAllergen: false },
      { name: "Tapioca Starch", isAllergen: false },
      { name: "Water", isAllergen: false },
      { name: "Sodium Palm Kernelate", isAllergen: false },
      { name: "Glycerin", isAllergen: false },
      { name: "Fragrance", isAllergen: false },
      { name: "Talc", isAllergen: false },
      { name: "Palm Kernel Acid", isAllergen: false },
      { name: "Sodium Chloride", isAllergen: false },
      { name: "Titanium Dioxide", isAllergen: false },
      { name: "Zinc Pyrithione", isAllergen: false },
      { name: "Tetrasodium Etidronate", isAllergen: false },
      { name: "Zinc Sulfate", isAllergen: false },
      {
        name: "Pentaerythrityl Tetra-Di-T-Butyl Hydroxyhydrocinnamate",
        isAllergen: false,
      },
      {
        name: "Disodium Distyrylbiphenyl Disulfonate",
        isAllergen: false,
      },
      { name: "Citric Acid", isAllergen: false },
    ],
    allergens: [],
    alternatives: [
      "A fragrance-free cleansing bar for sensitive skin",
      "Another FDA-notified mild body cleanser",
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
    healthScore: 10,
    servingSize: "14g (1 pack)",
    warningMessage:
      "FDA registration FR-4000010589283 is valid through February 1, 2028. The FDA portal does not publish retail barcodes; this match uses the product name, brand, manufacturer, address, and packaging. Contains wheat/gluten, eggs, milk, and soy. The label also states that it is manufactured on equipment and/or in facilities that use nut ingredients.",
    verificationUrl: "https://verification.fda.gov.ph/",
    nutrition: {
      calories: "60",
      protein: "Less than 1g",
      carbohydrates: "9g",
      totalFat: "2g",
      saturatedFat: "1g",
      totalSugars: "6g",
      dietaryFiber: "Less than 1g",
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
    id: "coca-cola-original-taste-can-320ml",
    barcode: "4801981110001",
    name: "Coca-Cola Original Taste 320mL Can",
    brand: "Coca-Cola",
    category: "Carbonated Soft Drink",
    status: "Caution",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000008139975",
    healthScore: 10,
    servingSize: "320mL (1 can)",
    warningMessage:
      "Philippine FDA registration FR-4000008139975 covers Coca-Cola in cans and is valid through May 10, 2027. One 320mL can contains 33.5g total sugar and 134 calories, so enjoy it in moderation.",
    verificationUrl: "https://verification.fda.gov.ph/",
    nutrition: {
      calories: "134",
      protein: "0g",
      carbohydrates: "33.5g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "33.5g",
      dietaryFiber: "0g",
      sodium: "16mg",
    },
    ingredients: [
      { name: "Carbonated Water", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Caramel Color", isAllergen: false },
      {
        name: "Acidity Regulator (Phosphoric Acid)",
        isAllergen: false,
      },
      { name: "Natural Flavors", isAllergen: false },
      { name: "Caffeine", isAllergen: false },
    ],
    allergens: [],
    alternatives: [
      "Water",
      "Unsweetened sparkling water",
    ],
  },
  {
    id: "century-tuna-flakes-in-oil-155g",
    barcode: "748485100401",
    name: "Century Tuna Flakes in Oil 155g",
    brand: "Century",
    category: "Canned Tuna",
    status: "Approved",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000008019521",
    healthScore: 40,
    servingSize: "56g (about 3 servings per 155g can)",
    warningMessage:
      "Philippine FDA registration FR-4000008019521 covers Century Tuna Flakes in Oil and is valid through November 8, 2027. The FDA record does not list net weight, while Century's official product catalog confirms that this variant is sold in 155g cans. Contains fish and soy. One 56g serving contains 380mg sodium.",
    verificationUrl: "https://verification.fda.gov.ph/",
    nutrition: {
      calories: "100",
      protein: "7g",
      carbohydrates: "2g",
      totalFat: "7g",
      saturatedFat: "3g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "380mg",
    },
    ingredients: [
      { name: "Tuna Flakes", isAllergen: true },
      { name: "Water", isAllergen: false },
      { name: "Soya Oil", isAllergen: true },
      { name: "Soy Protein Concentrate", isAllergen: true },
      { name: "Seasonings", isAllergen: false },
      { name: "Spices", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
    ],
    allergens: ["Fish", "Soy"],
    alternatives: [
      "Lower-sodium tuna in water after comparing labels",
      "Fresh or frozen fish prepared with less added salt",
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
    id: "atc-fish-oil-1000mg-30-softgels",
    barcode: "4806518900247",
    name: "ATC Fish Oil 1000mg 30 Softgel Capsules",
    brand: "ATC Healthcare",
    category: "Food Supplement",
    status: "Caution",
    fdaStatusLabel: "FDA Registered — No Approved Therapeutic Claims",
    registrationNumber: "FR-4000009275304",
    healthScore: null,
    servingSize: "1 softgel capsule",
    warningMessage:
      "Philippine FDA registration FR-4000009275304 is approved, active, and valid through June 2, 2027, but this food supplement has no approved therapeutic claims. For adult use only. Consult a physician or healthcare professional before use if taking prescription medicine. Not recommended for children or for pregnant or lactating women. Contains fish.",
    verificationUrl: "https://verification.fda.gov.ph/",
    nutrition: {
      calories: "0",
      protein: "0g",
      carbohydrates: "0g",
      totalFat: "0g",
      sodium: "0mg",
    },
    ingredients: [
      { name: "Fish Oil (1000mg)", isAllergen: true },
      { name: "EPA / Eicosapentaenoic Acid (360mg)", isAllergen: false },
      { name: "DHA / Docosahexaenoic Acid (240mg)", isAllergen: false },
      { name: "Natural Vitamin E (1mg)", isAllergen: false },
      {
        name: "Soft Gelatin Capsule (Bovine Gelatin Powder, Glycerin)",
        isAllergen: false,
      },
    ],
    allergens: ["Fish"],
    alternatives: [
      "Plant-based omega-3 foods such as chia seeds or flaxseed, if appropriate",
      "An omega-3 option recommended by a physician or pharmacist",
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
