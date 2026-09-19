import { readFile } from "node:fs/promises";

import { z } from "zod";

import { prisma } from "../src/lib/prisma.js";
import {
  buildNutritionRatingData,
  type HsrCalculationInput,
} from "../src/lib/nutrition-score.js";

type SeedProductStatus =
  | "APPROVED"
  | "CAUTION"
  | "FDA_ADVISORY"
  | "UNVERIFIED";

type SeedProduct = {
  slug: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  status: SeedProductStatus;
  fdaStatusLabel: string;
  registrationNumber: string;
  // Omit entirely for cosmetics/medicines (no nutrition rating at all).
  // Provide a category and whatever verified numeric fields are known for
  // eligible food/drink products; calculateHealthStarRating() decides
  // whether that is enough for a COMPLETE, CONSERVATIVE, or
  // INSUFFICIENT_DATA result. Never invent a value here.
  nutritionRating?: HsrCalculationInput;
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


const seedAdvisorySchema = z.object({
  advisoryNumber: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["FOOD", "DRUG", "COSMETIC"]),
  type: z.enum([
    "PUBLIC_HEALTH_WARNING",
    "RECALL",
    "QUALITY_HOLD",
    "SAFETY_ALERT",
    "LIFTING",
  ]),
  status: z.enum(["NOT_APPROVED", "CAUTION", "LIFTED"]),
  publishedAt: z.iso.date(),
  sourceUrl: z.url(),
  filipinoSourceUrl: z.url().nullable(),
  isActive: z.boolean(),
});

const seedAdvisoryCatalogSchema = z.array(seedAdvisorySchema);

async function loadSeedAdvisories() {
  const catalogUrl = new URL(
    "./data/fda-advisories-2026-jan-aug7.json",
    import.meta.url,
  );
  const contents = await readFile(catalogUrl, "utf8");

  return seedAdvisoryCatalogSchema.parse(JSON.parse(contents));
}

const products: SeedProduct[] = [
  // Package data: six user-supplied front/back photos. Reviewed September 10, 2026.
  // FDA product-name references checked via the current portal API on September 11, 2026.
  // Sweet and Spicy calories, sugar, and sodium are too blurred to transcribe.
  {
    slug: "mccormick-taco-seasoning-mix-40g",
    barcode: "052100079301",
    name: "McCormick Taco Seasoning Mix 40g",
    brand: "McCormick",
    category: "Seasoning Mix",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000009056295",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "8g dry mix (5 servings per 40g pack)",
    warningMessage:
      "Philippine FDA product registration FR-4000009056295 lists McCORMICK TACO SEASONING MIX, valid through 31 March 2027. This is a product-name match; the portal does not specify individual package sizes. Contains milk, soybean, and wheat. Nutrition values apply to the dry seasoning mix, not the prepared taco recipe. The label lists 621mg sodium per 8g serving.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "23",
      protein: "Less than 1g",
      carbohydrates: "4g",
      totalFat: "Less than 1g",
      saturatedFat: "0g",
      totalSugars: "2g",
      dietaryFiber: "1g",
      sodium: "621mg",
    },

    ingredients: [
      { name: "Spices (including Red Pepper)", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Corn Maltodextrin", isAllergen: false },
      { name: "Onion", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Potato Starch", isAllergen: false },
      { name: "Garlic", isAllergen: false },
      { name: "Tomato Powder", isAllergen: false },
      { name: "Whey (Milk)", isAllergen: true },
      { name: "Soy Sauce Powder (Soybean, Wheat)", isAllergen: true },
      { name: "Citric Acid (Acidulant)", isAllergen: false },
      { name: "Calcium Stearate (Anti-Caking Agent)", isAllergen: false },
      { name: "Soybean Oil", isAllergen: true },
      { name: "Extractives of Paprika", isAllergen: false },
    ],

    allergens: ["Milk", "Soybean", "Wheat"],
    alternatives: [],
  },
  {
    slug: "ufc-oppa-mixes-soy-garlic-80g",
    barcode: "4801668609187",
    name: "UFC OPPA! Mixes Soy Garlic All Purpose Korean Style Meat Sauce 80g",
    brand: "UFC",
    category: "Sauce",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000012924055",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "1 tbsp (20g; 4 servings per 80g pack)",
    warningMessage:
      "Philippine FDA product registration FR-4000012924055 lists UFC OPPA! MIXES SOY GARLIC ALL PURPOSE KOREAN STYLE MEAT SAUCE, valid through 25 July 2029. This is a product-name match; the portal does not specify individual package sizes. The label declares soybean, wheat, corn, and oyster allergens. Nutrition values apply to the sauce alone, not the prepared meat dishes. Each 20g serving contains 7g total sugar, including 4g added sugar, and 320mg sodium.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "35",
      protein: "0g",
      carbohydrates: "8g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "7g",
      dietaryFiber: "0g",
      sodium: "320mg",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Mirin (Glucose Syrup, Cane Alcohol, Glutinous Rice, Rice, Water)", isAllergen: false },
      { name: "Garlic", isAllergen: false },
      { name: "Fermented Soybean Extract", isAllergen: true },
      { name: "Oyster Sauce", isAllergen: true },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Vinegar", isAllergen: false },
      { name: "Starch (Thickener)", isAllergen: false },
      { name: "Monosodium Glutamate, Disodium Inosinate, and Disodium Guanylate (Flavor Enhancers)", isAllergen: false },
      { name: "Potassium Sorbate (Preservative)", isAllergen: false },
      { name: "Citric Acid (Acidulant)", isAllergen: false },
    ],

    allergens: ["Soybean", "Wheat", "Corn", "Oyster"],
    alternatives: [],
  },
  {
    slug: "ufc-oppa-mixes-sweet-and-spicy-80g",
    barcode: "4801668609552",
    name: "UFC OPPA! Mixes Sweet and Spicy All Purpose Korean Style Meat Sauce 80g",
    brand: "UFC",
    category: "Sauce",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000012923153",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "1 tbsp (20g; 4 servings per 80g pack)",
    warningMessage:
      "Philippine FDA product registration FR-4000012923153 lists UFC OPPA! MIXES SWEET AND SPICY ALL PURPOSE KOREAN STYLE MEAT SAUCE, valid through 05 June 2029. This is a product-name match; the portal does not specify individual package sizes. The label declares soybean, wheat, corn, and sesame allergens. Nutrition values apply to the sauce alone, not the prepared meat dishes. Calories, total sugar, and sodium could not be read reliably from the supplied photo and remain unavailable; a clearer nutrition-label photo is needed.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "Less than 1g",
      carbohydrates: "12g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "N/A",
      dietaryFiber: "0g",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Gochujang Paste (Corn Syrup, Wheat Flour, Water, Hot Pepper Powder, Soybean Powder, Wheat, Rice Powder, Distilled Alcohol, Koji)", isAllergen: true },
      { name: "Sugar", isAllergen: false },
      { name: "Water", isAllergen: false },
      { name: "Honey", isAllergen: false },
      { name: "Fermented Soybean Extract", isAllergen: true },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Spices", isAllergen: false },
      { name: "Natural and Artificial Flavors", isAllergen: false },
      { name: "Sesame Seeds", isAllergen: true },
      { name: "Modified Starch (Stabilizer)", isAllergen: false },
      { name: "Potassium Sorbate (Preservative)", isAllergen: false },
      { name: "Monosodium Glutamate (Flavor Enhancer)", isAllergen: false },
      { name: "Citric Acid (Acidulant)", isAllergen: false },
      { name: "Disodium Inosinate and Disodium Guanylate (Flavor Enhancers)", isAllergen: false },
    ],

    allergens: ["Soybean", "Wheat", "Corn", "Sesame"],
    alternatives: [],
  },
  // Package data: Products 2 (8).pdf. Reviewed September 9, 2026.
  // Gatorade/C2/Mogu Mogu references checked in the new FDA portal September 11, 2026.
  // Gatorade uses the newest listed issuance among the supplied BLUE BOLT FLAVOR records;
  // C2 uses the newest listed issuance among the supplied COOL & CLEAN records.
  // Package sizes come from the labels; the FDA search records do not list individual sizes.
  {
    slug: "gatorade-blue-bolt-350ml",
    barcode: "4803925350054",
    name: "Gatorade Blue Bolt Sports Drink 350mL",
    brand: "Gatorade",
    category: "Sports Drink",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000012331192",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "350mL (1 bottle)",
    warningMessage:
      "Philippine FDA product registration FR-4000012331192 lists GATORADE SPORTS DRINK - BLUE BOLT FLAVOR, valid through 09 December 2030. This is a product-name match; the portal does not specify individual package sizes. The photographed 350mL bottle is the regular sugar-containing Blue Bolt variant made for or by Pepsi-Cola Products Philippines, Inc. A full bottle contains 21g total sugar based on its nutrition label. Contains sugar, dextrose, and brilliant blue coloring.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "88",
      protein: "0g",
      carbohydrates: "21g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "21g",
      dietaryFiber: "0g",
      sodium: "158mg",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Dextrose", isAllergen: false },
      { name: "Acidity Regulators (Citric Acid, Sodium Citrate)", isAllergen: false },
      { name: "Sodium Chloride", isAllergen: false },
      { name: "Monopotassium Phosphate", isAllergen: false },
      { name: "Gum Arabic (Emulsifier)", isAllergen: false },
      { name: "Nature-Identical Flavor", isAllergen: false },
      { name: "Sucrose Acetate Isobutyrate (Stabilizer)", isAllergen: false },
      { name: "Brilliant Blue (Artificial Color)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Plain drinking water",
      "A lower-sugar electrolyte drink after comparing labels",
    ],
  },

  {
    slug: "gatorade-blue-bolt-500ml",
    barcode: "4803925061141",
    name: "Gatorade Blue Bolt Sports Drink 500mL",
    brand: "Gatorade",
    category: "Sports Drink",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000012331192",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "200mL (2.5 servings per 500mL bottle)",
    warningMessage:
      "Philippine FDA product registration FR-4000012331192 lists GATORADE SPORTS DRINK - BLUE BOLT FLAVOR, valid through 09 December 2030. This is a product-name match; the portal does not specify individual package sizes. The photographed 500mL bottle is the regular sugar-containing Blue Bolt variant made for or by Pepsi-Cola Products Philippines, Inc. A full bottle contains 30g total sugar based on its nutrition label. Contains sugar, dextrose, and brilliant blue coloring.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "50",
      protein: "0g",
      carbohydrates: "12g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "12g",
      dietaryFiber: "0g",
      sodium: "90mg",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Dextrose", isAllergen: false },
      { name: "Acidity Regulators (Citric Acid, Sodium Citrate)", isAllergen: false },
      { name: "Sodium Chloride", isAllergen: false },
      { name: "Monopotassium Phosphate", isAllergen: false },
      { name: "Gum Arabic (Emulsifier)", isAllergen: false },
      { name: "Nature-Identical Flavor", isAllergen: false },
      { name: "Sucrose Acetate Isobutyrate (Stabilizer)", isAllergen: false },
      { name: "Brilliant Blue (Artificial Color)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Plain drinking water",
      "A lower-sugar electrolyte drink after comparing labels",
    ],
  },

  {
    slug: "gatorade-blue-bolt-900ml",
    barcode: "4803925241161",
    name: "Gatorade Blue Bolt Sports Drink 900mL",
    brand: "Gatorade",
    category: "Sports Drink",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000012331192",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "200mL (4.5 servings per 900mL bottle)",
    warningMessage:
      "Philippine FDA product registration FR-4000012331192 lists GATORADE SPORTS DRINK - BLUE BOLT FLAVOR, valid through 09 December 2030. This is a product-name match; the portal does not specify individual package sizes. The photographed 900mL bottle is the regular sugar-containing Blue Bolt variant made for or by Pepsi-Cola Products Philippines, Inc. A full bottle contains 54g total sugar based on its nutrition label. Contains sugar, dextrose, and brilliant blue coloring.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "50",
      protein: "0g",
      carbohydrates: "12g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "12g",
      dietaryFiber: "0g",
      sodium: "90mg",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Dextrose", isAllergen: false },
      { name: "Acidity Regulators (Citric Acid, Sodium Citrate)", isAllergen: false },
      { name: "Sodium Chloride", isAllergen: false },
      { name: "Monopotassium Phosphate", isAllergen: false },
      { name: "Gum Arabic (Emulsifier)", isAllergen: false },
      { name: "Nature-Identical Flavor", isAllergen: false },
      { name: "Sucrose Acetate Isobutyrate (Stabilizer)", isAllergen: false },
      { name: "Brilliant Blue (Artificial Color)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Plain drinking water",
      "A lower-sugar electrolyte drink after comparing labels",
    ],
  },

  {
    slug: "gatorade-blue-bolt-1-5l",
    barcode: "4803925241130",
    name: "Gatorade Blue Bolt Sports Drink 1.5L",
    brand: "Gatorade",
    category: "Sports Drink",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000012331192",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "200mL (7.5 servings per 1.5L bottle)",
    warningMessage:
      "Philippine FDA product registration FR-4000012331192 lists GATORADE SPORTS DRINK - BLUE BOLT FLAVOR, valid through 09 December 2030. This is a product-name match; the portal does not specify individual package sizes. The photographed 1.5L bottle is the regular sugar-containing Blue Bolt variant made for or by Pepsi-Cola Products Philippines, Inc. A full bottle contains 90g total sugar based on its nutrition label. Contains sugar, dextrose, and brilliant blue coloring.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "50",
      protein: "0g",
      carbohydrates: "12g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "12g",
      dietaryFiber: "0g",
      sodium: "90mg",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Dextrose", isAllergen: false },
      { name: "Acidity Regulators (Citric Acid, Sodium Citrate)", isAllergen: false },
      { name: "Sodium Chloride", isAllergen: false },
      { name: "Monopotassium Phosphate", isAllergen: false },
      { name: "Gum Arabic (Emulsifier)", isAllergen: false },
      { name: "Nature-Identical Flavor", isAllergen: false },
      { name: "Sucrose Acetate Isobutyrate (Stabilizer)", isAllergen: false },
      { name: "Brilliant Blue (Artificial Color)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Plain drinking water",
      "A lower-sugar electrolyte drink after comparing labels",
    ],
  },

  {
    slug: "c2-apple-green-tea-335ml",
    barcode: "4800016052040",
    name: "C2 Cool & Clean Apple Green Tea 335mL",
    brand: "C2",
    category: "Apple-Flavored Green Tea",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000011017606",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "1 glass (200mL); label states about 2 servings per 335mL bottle",
    warningMessage:
      "Philippine FDA product registration FR-4000011017606 lists C2 COOL & CLEAN APPLE FLAVORED GREEN TEA, valid through 08 May 2028. This is a product-name match; the portal does not specify individual package sizes. Manufactured by Universal Robina Corporation in the Philippines. Each 200mL serving contains 70 calories, 17g total sugar (including 16g added sugar), and 55mg sodium. The 335mL bottle contains approximately 28.5g total sugar when calculated from its volume. Contains sugar and sucralose. Shake well before drinking and refrigerate after opening.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "70",
      protein: "0g",
      carbohydrates: "18g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "17g",
      dietaryFiber: "0g",
      sodium: "55mg",
    },

    ingredients: [
      { name: "Purified Water", isAllergen: false },
      { name: "Fresh Brew from Green Tea Leaves", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Acidity Regulators (Citric Acid, Sodium Citrate, Malic Acid)", isAllergen: false },
      { name: "Ascorbic Acid (Antioxidant)", isAllergen: false },
      { name: "Artificial Flavor", isAllergen: false },
      { name: "Caramel Color", isAllergen: false },
      { name: "Sucralose (Sweetener)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Unsweetened green tea",
      "Plain drinking water",
    ],
  },

  {
    slug: "c2-apple-green-tea-455ml",
    barcode: "4800016052132",
    name: "C2 Cool & Clean Apple Green Tea 455mL",
    brand: "C2",
    category: "Apple-Flavored Green Tea",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000011017606",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "1 glass (200mL); label states about 2.5 servings per 455mL bottle",
    warningMessage:
      "Philippine FDA product registration FR-4000011017606 lists C2 COOL & CLEAN APPLE FLAVORED GREEN TEA, valid through 08 May 2028. This is a product-name match; the portal does not specify individual package sizes. Manufactured by Universal Robina Corporation in the Philippines. Each 200mL serving contains 70 calories, 17g total sugar (including 16g added sugar), and 55mg sodium. The 455mL bottle contains approximately 38.7g total sugar when calculated from its volume. Contains sugar and sucralose. Shake well before drinking and refrigerate after opening.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "70",
      protein: "0g",
      carbohydrates: "18g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "17g",
      dietaryFiber: "0g",
      sodium: "55mg",
    },

    ingredients: [
      { name: "Purified Water", isAllergen: false },
      { name: "Fresh Brew from Green Tea Leaves", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Acidity Regulators (Citric Acid, Sodium Citrate, Malic Acid)", isAllergen: false },
      { name: "Ascorbic Acid (Antioxidant)", isAllergen: false },
      { name: "Artificial Flavor", isAllergen: false },
      { name: "Caramel Color", isAllergen: false },
      { name: "Sucralose (Sweetener)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Unsweetened green tea",
      "Plain drinking water",
    ],
  },

  {
    slug: "c2-apple-green-tea-1l",
    barcode: "4800016052774",
    name: "C2 Cool & Clean Apple Green Tea 1L",
    brand: "C2",
    category: "Apple-Flavored Green Tea",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000011017606",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "1 glass (200mL); label states 5 servings per 1L bottle",
    warningMessage:
      "Philippine FDA product registration FR-4000011017606 lists C2 COOL & CLEAN APPLE FLAVORED GREEN TEA, valid through 08 May 2028. This is a product-name match; the portal does not specify individual package sizes. Manufactured by Universal Robina Corporation in the Philippines. Each 200mL serving contains 70 calories, 17g total sugar (including 16g added sugar), and 55mg sodium. The 1L bottle contains approximately 85g total sugar when calculated from its volume. Contains sugar and sucralose. Shake well before drinking and refrigerate after opening.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "70",
      protein: "0g",
      carbohydrates: "18g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "17g",
      dietaryFiber: "0g",
      sodium: "55mg",
    },

    ingredients: [
      { name: "Purified Water", isAllergen: false },
      { name: "Fresh Brew from Green Tea Leaves", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Acidity Regulators (Citric Acid, Sodium Citrate, Malic Acid)", isAllergen: false },
      { name: "Ascorbic Acid (Antioxidant)", isAllergen: false },
      { name: "Artificial Flavor", isAllergen: false },
      { name: "Caramel Color", isAllergen: false },
      { name: "Sucralose (Sweetener)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Unsweetened green tea",
      "Plain drinking water",
    ],
  },

  {
    slug: "sola-iced-tea-peach-473ml",
    barcode: "4806506050114",
    name: "Sola Iced Tea Peach 473mL",
    brand: "Sola",
    category: "Peach-Flavored Iced Tea",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000015281764",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "240mL (about 2 servings per 473mL bottle)",
    warningMessage:
      "Philippine FDA product registration FR-4000015281764 lists SOLA ICED TEA (PEACH FLAVOR) under THE FIRST ENTERPRISES, INC., valid through 28 October 2030. This is a product-name match; the portal does not specify individual package sizes. The photographed glass bottle is peach flavored. Each 240mL serving contains 100 calories and 24g total sugar; the full 473mL bottle contains approximately 47g total sugar.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "100",
      protein: "0g",
      carbohydrates: "24g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "24g",
      dietaryFiber: "0g",
      sodium: "0mg",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Black Tea", isAllergen: false },
      { name: "Natural Peach Flavor", isAllergen: false },
      { name: "Citric Acid (Acidity Regulator)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Unsweetened iced tea",
      "Plain drinking water",
    ],
  },

  {
    slug: "sola-iced-tea-lemon-can-250ml",
    barcode: "4806506050107",
    name: "Sola Iced Tea Lemon 250mL Can",
    brand: "Sola",
    category: "Lemon-Flavored Iced Tea",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000015269203",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "250mL (1 can)",
    warningMessage:
      "Philippine FDA product registration FR-4000015269203 lists SOLA ICED TEA (LEMON FLAVOR) under THE FIRST ENTERPRISES, INC., valid through 18 November 2030. This is a product-name match; the portal does not specify individual package sizes. The photographed can is lemon flavored and contains 101 calories and 25g total sugar. Shake well and serve chilled. Store in a cool, dry place away from direct sunlight; after opening, transfer any remaining drink to a sealed container and refrigerate.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "101",
      protein: "0g",
      carbohydrates: "25g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "25g",
      dietaryFiber: "0g",
      sodium: "0mg",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Black Tea", isAllergen: false },
      { name: "Natural Lemon Flavor", isAllergen: false },
      { name: "Citric Acid (Acidity Regulator)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Unsweetened iced tea",
      "Plain drinking water",
    ],
  },

  {
    slug: "mogu-mogu-yogurt-nata-de-coco-320ml",
    barcode: "8850389109229",
    name: "Mogu Mogu Yogurt Flavored Drink with Nata de Coco 320mL",
    brand: "Mogu Mogu",
    category: "Yogurt-Flavored Drink with Nata de Coco",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000009035450",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "100mL (label: 1/3 bottle, about 3 servings per 320mL bottle)",
    warningMessage:
      "Philippine FDA product registration FR-4000009035450 lists MOGU MOGU YOGURT FLAVORED DRINK WITH NATA DE COCO, valid through 06 February 2027. This is a product-name match; the portal does not specify individual package sizes. The Sappe product label identifies a yogurt-flavored drink made in Thailand. Per 100mL, it lists 50 calories, 13g sugar, and 25mg sodium; a full 320mL bottle contains approximately 160 calories and 41.6g sugar. Milk content cannot be determined from the yogurt flavor name alone. The full ingredient and allergen panels are absent from the submitted photos. An empty allergen list does not confirm that the drink is allergen-free. Contains nata de coco pieces; chew them before swallowing. Shake before drinking and keep in a cool, dry place.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "50",
      protein: "0g",
      carbohydrates: "13g",
      totalFat: "0g",
      saturatedFat: "Not a significant source (label)",
      totalSugars: "13g",
      dietaryFiber: "Not a significant source (label)",
      sodium: "25mg",
    },

    ingredients: [],

    allergens: [],

    alternatives: [
      "Plain drinking water",
      "A lower-sugar drink with a complete ingredient and allergen label",
    ],
  },

  {
    slug: "mogu-mogu-coconut-nata-de-coco-1l",
    barcode: "8850389106990",
    name: "Mogu Mogu Coconut Flavored Drink with Nata de Coco 1L",
    brand: "Mogu Mogu",
    category: "Coconut-Flavored Drink with Nata de Coco",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000010851054",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "1 glass (200mL); 5 servings per 1L bottle",
    warningMessage:
      "Philippine FDA product registration FR-4000010851054 lists MOGU MOGU COCONUT FLAVORED DRINK WITH NATA DE COCO, valid through 01 March 2030. This is a product-name match; the portal does not specify individual package sizes. The Sappe product label identifies a coconut-flavored drink made in Thailand. Each 200mL serving contains 90 calories, 22g sugar, 45mg sodium, and less than 1g dietary fiber. The full 1L bottle contains 110g total sugar. The full ingredient and allergen panels are absent from the submitted photos. An empty allergen list does not confirm that the drink is allergen-free. Contains nata de coco pieces; chew them before swallowing. Shake before drinking and keep in a cool, dry place.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "90",
      protein: "0g",
      carbohydrates: "22g",
      totalFat: "0g",
      saturatedFat: "Not a significant source (label)",
      totalSugars: "22g",
      dietaryFiber: "Less than 1g",
      sodium: "45mg",
    },

    ingredients: [],

    allergens: [],

    alternatives: [
      "Plain drinking water",
      "An unsweetened coconut drink with a complete ingredient label",
    ],
  },

  {
    slug: "green-cross-total-defense-hand-spray-40ml",
    barcode: "4800047865152",
    name: "Green Cross Total Defense Antibacterial Hand Spray 40mL",
    brand: "Green Cross",
    category: "Hand Sanitizer",
    status: "APPROVED",
    fdaStatusLabel: "FDA Notified",
    registrationNumber: "NN-1000011397349",
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
      {
        name: "Ethyl Alcohol",
        isAllergen: false,
      },
      {
        name: "Purified Water",
        isAllergen: false,
      },
      {
        name: "Polyhexamethylene Biguanide",
        isAllergen: false,
      },
      {
        name: "Benzalkonium Chloride",
        isAllergen: false,
      },
      {
        name: "Propylene Glycol",
        isAllergen: false,
      },
      {
        name: "Aloe Barbadensis Leaf Extract",
        isAllergen: false,
      },
      {
        name: "Glycerin",
        isAllergen: false,
      },
      {
        name: "Fragrance",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "Wash hands with soap and water when available",
      "Another FDA-notified hand sanitizer suitable for the user",
    ],
  },

  {
    slug: "safeguard-pure-white-bar-soap-90g",
    barcode: "4987176026750",
    name: "Safeguard Pure White Bar Soap 90g",
    brand: "Safeguard",
    category: "Bar Soap",
    status: "APPROVED",
    fdaStatusLabel: "FDA Notified",
    registrationNumber: "NN-1000011604555",
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
      {
        name: "Sodium Palmate",
        isAllergen: false,
      },
      {
        name: "Tapioca Starch",
        isAllergen: false,
      },
      {
        name: "Water",
        isAllergen: false,
      },
      {
        name: "Sodium Palm Kernelate",
        isAllergen: false,
      },
      {
        name: "Glycerin",
        isAllergen: false,
      },
      {
        name: "Fragrance",
        isAllergen: false,
      },
      {
        name: "Talc",
        isAllergen: false,
      },
      {
        name: "Palm Kernel Acid",
        isAllergen: false,
      },
      {
        name: "Sodium Chloride",
        isAllergen: false,
      },
      {
        name: "Titanium Dioxide",
        isAllergen: false,
      },
      {
        name: "Zinc Pyrithione",
        isAllergen: false,
      },
      {
        name: "Tetrasodium Etidronate",
        isAllergen: false,
      },
      {
        name: "Zinc Sulfate",
        isAllergen: false,
      },
      {
        name: "Pentaerythrityl Tetra-Di-T-Butyl Hydroxyhydrocinnamate",
        isAllergen: false,
      },
      {
        name: "Disodium Distyrylbiphenyl Disulfonate",
        isAllergen: false,
      },
      {
        name: "Citric Acid",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "A fragrance-free cleansing bar for sensitive skin",
      "Another FDA-notified mild body cleanser",
    ],
  },

  {
    slug: "colgate-total-advanced-health-antibacterial-toothpaste-80g",
    barcode: "8901314850805",
    name: "Colgate Total Advanced Health Antibacterial Toothpaste 80g",
    brand: "Colgate",
    category: "Fluoride Toothpaste",
    status: "UNVERIFIED",
    fdaStatusLabel: "Exact Variant Not Verified",
    registrationNumber: "No matching Philippine FDA notification",
    servingSize: "80g tube",
    warningMessage:
      "No exact Philippine FDA notification was found for this 80g product and barcode. The package is labeled as made in India, so other Philippine-notified Colgate Total variants must not be treated as an exact match. Do not swallow. Children under 6 should use a pea-sized amount under adult supervision, and use should be discontinued if irritation occurs.",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Glycerin", isAllergen: false },
      { name: "Silica", isAllergen: false },
      { name: "Sodium Lauryl Sulphate", isAllergen: false },
      { name: "Arginine", isAllergen: false },
      { name: "Flavor", isAllergen: false },
      { name: "Cocamidopropyl Betaine", isAllergen: false },
      { name: "Zinc Oxide", isAllergen: false },
      { name: "Sodium Carboxymethyl Cellulose", isAllergen: false },
      { name: "Titanium Dioxide", isAllergen: false },
      { name: "Poloxamer 407", isAllergen: false },
      { name: "Zinc Citrate Trihydrate", isAllergen: false },
      { name: "Tetrasodium Pyrophosphate", isAllergen: false },
      { name: "Xanthan Gum", isAllergen: false },
      { name: "Benzyl Alcohol", isAllergen: false },
      { name: "Phosphoric Acid", isAllergen: false },
      { name: "Sodium Saccharin", isAllergen: false },
      { name: "Sodium Fluoride", isAllergen: false },
      { name: "Titanium Dioxide Coated Mica", isAllergen: false },
      { name: "Sucralose", isAllergen: false },
      { name: "CI 74260", isAllergen: false },
      { name: "CI 47005:1", isAllergen: false },
      { name: "Eugenol", isAllergen: false },
      { name: "Aqueous Base", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "A Philippine FDA-notified fluoride toothpaste with matching local packaging",
      "A dentist-recommended toothpaste suitable for the user's age and oral-health needs",
    ],
  },

  {
    slug: "johnsons-baby-powder-25g",
    barcode: "48032742",
    name: "Johnson's Baby Powder 25g",
    brand: "Johnson's Baby",
    category: "Body Powder",
    status: "CAUTION",
    fdaStatusLabel: "FDA Notified",
    registrationNumber: "NN-1000010711083",
    servingSize: "25g bottle",
    warningMessage:
      "Philippine FDA cosmetic notification NN-1000010711083 is valid through December 23, 2026. Keep powder away from children's nose and mouth because inhalation can cause breathing problems. Avoid contact with eyes, use externally only, and do not apply to broken skin.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      {
        name: "Zea Mays (Corn) Starch",
        isAllergen: false,
      },
      {
        name: "Tricalcium Phosphate",
        isAllergen: false,
      },
      {
        name: "Fragrance",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "A fragrance-free cornstarch body powder used as directed",
      "Keep skin clean and dry without using loose powder near the face",
    ],
  },

  {
    // Label data: Products 2 (6).pdf, page 1. FDA portal checked September 7, 2026.
    slug: "dove-men-care-extra-fresh-antiperspirant-stick-40g",
    barcode: "4800888195715",
    name: "Dove Men+Care Extra Fresh Antiperspirant Stick 40g",
    brand: "Dove Men+Care",
    category: "Antiperspirant Stick",
    status: "APPROVED",
    fdaStatusLabel: "FDA Notified",
    registrationNumber: "NN-1000009072915",
    servingSize: "40g stick",
    warningMessage:
      "Philippine FDA cosmetic notification NN-1000009072915 lists Dove Men+Care Antiperspirant Deodorant Stick Extra Fresh by Unilever Philippines, Inc., with the Extra Fresh stick variant and an expiry date of November 18, 2027. The portal does not list retail barcodes or pack weights; the submitted stick is labeled 40g. For external underarm use only. Apply 4-6 swipes per underarm daily as directed. Do not apply to irritated or damaged skin, discontinue use if irritation occurs, and keep out of reach of children. Contains perfume.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Aluminum Zirconium Tetrachlorohydrex GLY", isAllergen: false },
      { name: "Stearyl Alcohol", isAllergen: false },
      { name: "C12-15 Alkyl Benzoate", isAllergen: false },
      { name: "Cyclopentasiloxane", isAllergen: false },
      { name: "Isopropyl Palmitate", isAllergen: false },
      { name: "PPG-14 Butyl Ether", isAllergen: false },
      { name: "Hydrogenated Castor Oil", isAllergen: false },
      { name: "PEG-8", isAllergen: false },
      { name: "Perfume", isAllergen: false },
      { name: "Dimethicone", isAllergen: false },
      { name: "Silica", isAllergen: false },
      { name: "Polyethylene", isAllergen: false },
      { name: "Helianthus Annuus (Sunflower) Seed Oil", isAllergen: false },
      { name: "Steareth-100", isAllergen: false },
      { name: "BHT", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "A fragrance-free antiperspirant if perfume must be avoided",
      "Another FDA-notified underarm product suitable for the user's skin",
    ],
  },

  {
    // Label data: Products 2 (6).pdf, page 2. Published FDA notification retrieved September 7, 2026.
    slug: "dove-radiant-care-niacinamide-vitamin-c-e-serum-bar-90g",
    barcode: "4800888285300",
    name: "Dove Radiant+Care 50x Niacinamide + Vitamin C & E Serum Bar 90g",
    brand: "Dove Radiant+Care",
    category: "Beauty Bar",
    status: "APPROVED",
    fdaStatusLabel: "FDA Notified",
    registrationNumber: "NN-1000013870718",
    servingSize: "90g bar",
    warningMessage:
      "Published Philippine FDA cosmetic notification NN-1000013870718 lists Dove Radiant+Care Serum Bar 50x Niacinamide + Vitamin C & E by Unilever Philippines, Inc., with an expiry date of January 15, 2028. The record matches the photographed variant and Philippine importer but does not list retail barcodes or pack weights; the package states 90g when packed. Current portal status was not rechecked. For external use only. Apply to skin and rinse off. Discontinue use if skin irritation occurs; rinse immediately with water after eye contact and consult a doctor if irritation persists. Store in a cool, dry place. Contains perfume.",
    verificationUrl:
      "https://verification.fda.gov.ph/cosmetic_product_notificationview.php?ACCOUNTCODE=NN-1000013870718&export=pdf",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Sodium Lauroyl Isethionate", isAllergen: false },
      { name: "Stearic Acid", isAllergen: false },
      { name: "Lauric Acid", isAllergen: false },
      { name: "Sodium Palmate", isAllergen: false },
      { name: "Water", isAllergen: false },
      { name: "Sodium Isethionate", isAllergen: false },
      { name: "Sodium Stearate", isAllergen: false },
      { name: "Cocamidopropyl Betaine", isAllergen: false },
      { name: "Perfume", isAllergen: false },
      { name: "Sodium Palm Kernelate", isAllergen: false },
      { name: "Sodium Chloride", isAllergen: false },
      { name: "Zinc Oxide", isAllergen: false },
      { name: "Propylene Glycol", isAllergen: false },
      { name: "Niacinamide", isAllergen: false },
      { name: "Titanium Dioxide", isAllergen: false },
      { name: "Glycerin", isAllergen: false },
      { name: "Sodium Benzoate", isAllergen: false },
      { name: "Caramel", isAllergen: false },
      { name: "Tetrasodium Etidronate", isAllergen: false },
      { name: "Tetrasodium EDTA", isAllergen: false },
      { name: "Sodium Ascorbyl Phosphate", isAllergen: false },
      { name: "Tocopheryl Acetate", isAllergen: false },
      { name: "Alumina", isAllergen: false },
      { name: "Helianthus Annuus Seed Oil", isAllergen: false },
      { name: "Sh-Polypeptide-121", isAllergen: false },
      { name: "CI 14700", isAllergen: false },
      { name: "CI 15985", isAllergen: false },
      { name: "CI 17200", isAllergen: false },
      { name: "CI 61570", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "A fragrance-free cleansing bar if perfume must be avoided",
      "Another FDA-notified cleanser suitable for the user's skin",
    ],
  },

  {
    // Label data: Products 2 (6).pdf, page 2. FDA portal checked September 7, 2026.
    slug: "cream-silk-triple-keratin-ultimate-straight-serum-conditioner-170ml",
    barcode: "4800888206183",
    name: "Cream Silk Triple Keratin Ultimate Straight Serum Conditioner 170mL",
    brand: "Cream Silk",
    category: "Hair Conditioner",
    status: "APPROVED",
    fdaStatusLabel: "FDA Notified",
    registrationNumber: "NN-1000014323532",
    servingSize: "170mL tube",
    warningMessage:
      "Philippine FDA cosmetic notification NN-1000014323532 lists Cream Silk Triple Keratin Ultimate Straight Keratin Serum Conditioner by Unilever Philippines, Inc., with an expiry date of May 10, 2028. The product name, variant, and company match the submitted 170mL tube; the portal does not list retail barcodes or pack sizes. For external hair use only. After shampooing, massage through hair, especially the ends, and rinse well after one minute. Avoid contact with eyes; if contact occurs, rinse thoroughly with water. Contains perfume.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Cetearyl Alcohol", isAllergen: false },
      { name: "Dimethicone", isAllergen: false },
      { name: "Behentrimonium Chloride", isAllergen: false },
      { name: "Glycerin", isAllergen: false },
      { name: "Perfume", isAllergen: false },
      { name: "Dipropylene Glycol", isAllergen: false },
      {
        name: "Bis-(Isostearoyl/Oleoyl Isopropyl) Dimonium Methosulfate",
        isAllergen: false,
      },
      { name: "Amodimethicone", isAllergen: false },
      { name: "Lactic Acid", isAllergen: false },
      { name: "Sodium Benzoate", isAllergen: false },
      { name: "Disodium EDTA", isAllergen: false },
      { name: "Phenoxyethanol", isAllergen: false },
      { name: "PEG-7 Propylheptyl Ether", isAllergen: false },
      { name: "Cetrimonium Chloride", isAllergen: false },
      { name: "Lysine HCl", isAllergen: false },
      { name: "Argania Spinosa Kernel Oil", isAllergen: false },
      { name: "Hydrolyzed Keratin", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "A fragrance-free conditioner if perfume must be avoided",
      "Another FDA-notified rinse-out conditioner suited to the user's hair",
    ],
  },

  {
    // Label data: Products 2 (6).pdf, page 2. FDA product-name notification checked September 11, 2026.
    slug: "head-shoulders-smooth-silky-anti-dandruff-shampoo-12ml",
    barcode: "4902430698658",
    name: "Head & Shoulders Smooth & Silky Anti-Dandruff Shampoo 12mL",
    brand: "Head & Shoulders",
    category: "Anti-Dandruff Shampoo",
    status: "CAUTION",
    fdaStatusLabel: "FDA Notified Product Name",
    registrationNumber: "NN-1000014487810",
    servingSize: "12mL sachet",
    warningMessage:
      "Philippine FDA cosmetic notification NN-1000014487810 lists HEAD & SHOULDERS ANTI-DANDRUFF SHAMPOO SMOOTH & SILKY, valid through 05 May 2027. This is a product-name match; the portal does not specify individual package sizes. The submitted 12mL sachet identifies Head & Shoulders Smooth & Silky shampoo, made in Indonesia and imported by Procter & Gamble Philippines, Inc. For external hair and scalp use only. Wet hair, gently massage onto the scalp, lather, and rinse thoroughly; repeat if desired. Avoid contact with eyes and rinse well with water if contact occurs. Contains fragrance, methylchloroisothiazolinone, and methylisothiazolinone; check the ingredient list if you have known sensitivities.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sodium Laureth Sulfate", isAllergen: false },
      { name: "Sodium Lauryl Sulfate", isAllergen: false },
      { name: "Sodium Xylenesulfonate", isAllergen: false },
      { name: "Cocamidopropyl Betaine", isAllergen: false },
      { name: "Glycol Distearate", isAllergen: false },
      { name: "Fragrance", isAllergen: false },
      { name: "Dimethiconol", isAllergen: false },
      { name: "Sodium Citrate", isAllergen: false },
      { name: "Sodium Chloride", isAllergen: false },
      { name: "Dimethicone", isAllergen: false },
      { name: "Piroctone Olamine", isAllergen: false },
      { name: "Citric Acid", isAllergen: false },
      { name: "TEA-Dodecylbenzenesulfonate", isAllergen: false },
      { name: "Sodium Benzoate", isAllergen: false },
      { name: "Guar Hydroxypropyltrimonium Chloride", isAllergen: false },
      { name: "Trideceth-10", isAllergen: false },
      { name: "Tetrasodium EDTA", isAllergen: false },
      { name: "Propylene Glycol", isAllergen: false },
      { name: "Benzyl Alcohol", isAllergen: false },
      { name: "Methylchloroisothiazolinone", isAllergen: false },
      { name: "Methylisothiazolinone", isAllergen: false },
      { name: "CI 17200", isAllergen: false },
      { name: "CI 42090", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "An anti-dandruff shampoo with a matching Philippine FDA cosmetic notification",
      "A shampoo without fragrance or preservatives to which the user is sensitive",
    ],
  },

  {
    slug: "super-delights-brownie-bites-14g",
    barcode: "4800365881315",
    name: "Super Delights Brownie Bites 14g",
    brand: "Super Delights",
    category: "Baked Snack",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000010589283",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 14,
      servingUnit: "g",
      caloriesPerServing: 60,
      saturatedFatGramsPerServing: 1,
      totalSugarsGramsPerServing: 6,
      sodiumMilligramsPerServing: 40,
    },
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
      {
        name: "Sugar",
        isAllergen: false,
      },
      {
        name: "Wheat Flour",
        isAllergen: true,
      },
      {
        name: "Eggs",
        isAllergen: true,
      },
      {
        name: "Glucose",
        isAllergen: false,
      },
      {
        name: "Vegetable Oil (Palm Olein)",
        isAllergen: false,
      },
      {
        name: "Cocoa Powder",
        isAllergen: false,
      },
      {
        name: "Milk Chocolate Chips (Sugar, Cocoa Mass, Cocoa Butter, Milk Solids, Anhydrous Milk Fat, Soya Lecithin, Vanillin)",
        isAllergen: true,
      },
      {
        name: "Iodized Salt",
        isAllergen: false,
      },
      {
        name: "Baking Powder (Leavening Agent)",
        isAllergen: false,
      },
      {
        name: "Modified Starch",
        isAllergen: false,
      },
      {
        name: "Potassium Sorbate (Preservative)",
        isAllergen: false,
      },
    ],

    allergens: ["Wheat / Gluten", "Eggs", "Milk", "Soy"],

    alternatives: [
      "Fresh fruit with no added sugar",
      "A lower-sugar snack checked against your allergen preferences",
    ],
  },

  {
    slug: "sip-purified-water-500ml",
    barcode: "4806531431216",
    name: "SIP Purified Water 500mL",
    brand: "SIP",
    category: "Purified Water",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000012963838",
    nutritionRating: {
      category: "PLAIN_WATER",
    },
    servingSize: "500mL (1 bottle)",
    warningMessage:
      "Philippine FDA registration FR-4000012963838 lists SIP Purified Water as approved, active, and valid through September 30, 2029. Its High Risk Food Product classification is a regulatory category for bottled water, not an FDA warning. The 500mL bottle label lists zero calories, fat, carbohydrates, sodium, and protein.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "0",
      protein: "0g",
      carbohydrates: "0g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "0mg",
    },

    ingredients: [
      {
        name: "Purified Water",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "Safe drinking water from a tested source",
      "Filtered water in a reusable bottle",
    ],
  },

  {
    slug: "summit-natural-drinking-water-500ml",
    barcode: "4800014211081",
    name: "Summit Natural Drinking Water 500mL",
    brand: "Summit",
    category: "Natural Drinking Water",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000010780064",
    nutritionRating: {
      category: "PLAIN_WATER",
    },
    servingSize: "500mL (1 bottle)",
    warningMessage:
      "Philippine FDA registration FR-4000010780064 lists Summit Natural Drinking Water as approved, active, and valid through April 26, 2028. Its High Risk Food Product classification is a regulatory category for bottled water, not an FDA warning. The 500mL bottle label lists zero calories, fat, carbohydrates, sodium, and protein.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "0",
      protein: "0g",
      carbohydrates: "0g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "0mg",
    },

    ingredients: [
      {
        name: "Natural Drinking Water",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "Safe drinking water from a tested source",
      "Filtered water in a reusable bottle",
    ],
  },

  // Package data: Products 2 (7).pdf. FDA portal checked September 8, 2026.
  {
    slug: "wilkins-distilled-water-500ml",
    barcode: "4800602020934",
    name: "Wilkins Distilled Water 500mL",
    brand: "Wilkins",
    category: "Distilled Drinking Water",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000008213343",
    nutritionRating: {
      category: "PLAIN_WATER",
    },
    servingSize: "240mL (about 2 servings per 500mL bottle)",
    warningMessage:
      "The package CPR number FR-4000008213343 matches the Philippine FDA record for Wilkins Distilled Drinking Water, valid through January 27, 2030. The current record names Coca-Cola Europacific Aboitiz Philippines, Inc.; the photographed bottle names Coca-Cola Beverages Philippines, Inc. The label lists zero calories, fat, carbohydrates, sodium, and protein per 240mL serving.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "0",
      protein: "0g",
      carbohydrates: "0g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "0mg",
    },

    ingredients: [{ name: "Distilled Water", isAllergen: false }],

    allergens: [],

    alternatives: [
      "Safe drinking water from a tested source",
      "Filtered water in a reusable bottle",
    ],
  },

  // Products 2 (7).pdf shows a PET bottle, nutrition, and barcode; ingredient/importer panel absent.
  // FDA checked September 12, 2026: FR-4000012826276 lists Ion Supply Drink in PET.
  // FR-4000012736069 is Drink Mix in aluminum sachets and is not used for this bottle.
  {
    slug: "pocari-sweat-ion-supply-drink-350ml",
    barcode: "8997035600010",
    name: "Pocari Sweat Ion Supply Drink 350mL",
    brand: "Pocari Sweat",
    category: "Electrolyte Drink",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000012826276",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "100mL (nutrition table basis); 350mL bottle",
    warningMessage:
      "Philippine FDA product registration FR-4000012826276 lists POCARI SWEAT ION SUPPLY DRINK under OTSUKA-SOLAR PHILIPPINES INCORPORATED, valid through 04 September 2029. The published record lists PET bottles; the exact bottle size is not specified. Nutrition values follow the table's explicit 100mL basis: its separate 350mL serving-size heading conflicts with the stated 3.5 servings. A full 350mL bottle therefore provides approximately 84 calories, 20g total sugar, and 172mg sodium. The ingredient and allergen panels are not shown; an empty allergen list does not confirm that the product is allergen-free.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "24",
      protein: "0g",
      carbohydrates: "6.2g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "5.7g",
      dietaryFiber: "0g",
      sodium: "49mg",
    },

    ingredients: [],

    allergens: [],

    alternatives: [
      "Plain drinking water",
      "A lower-sugar electrolyte drink after comparing labels",
    ],
  },

  {
    slug: "del-monte-fiber-enriched-pineapple-juice-220ml",
    barcode: "4800024562616",
    name: "Del Monte Fiber Enriched 100% Pineapple Juice 220mL",
    brand: "Del Monte",
    category: "Fiber-Enriched Pineapple Juice",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000012372160",
    nutritionRating: {
      category: "NON_DAIRY_BEVERAGE",
      servingQuantity: 220,
      servingUnit: "mL",
      caloriesPerServing: 120,
      totalSugarsGramsPerServing: 22,
    },
    servingSize: "1 can (220mL)",
    warningMessage:
      "Philippine FDA registration FR-4000012372160 lists Del Monte 100% Pineapple Juice - Fiber Enriched by Del Monte Philippines, Inc., valid through March 6, 2029. The product, variant, and company match the photographed 220mL can; the portal does not list retail barcodes or pack sizes. Although labeled no sugar added, one can contains 22g total sugar and 120 calories, alongside 4g dietary fiber. The nutrition score is a conservative estimate that does not credit the fruit or added fiber.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "120",
      protein: "Less than 1g",
      carbohydrates: "29g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "22g",
      dietaryFiber: "4g",
      sodium: "16mg",
    },

    ingredients: [
      { name: "Pineapple Juice", isAllergen: false },
      {
        name: "Fiber Source (Acacia Gum, Soluble Corn Fiber)",
        isAllergen: false,
      },
      { name: "Vitamin C (Ascorbic Acid)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Whole pineapple with drinking water",
      "A smaller serving of pineapple juice",
    ],
  },

  {
    slug: "coca-cola-original-taste-can-320ml",
    barcode: "4801981110001",
    name: "Coca-Cola Original Taste 320mL Can",
    brand: "Coca-Cola",
    category: "Carbonated Soft Drink",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000008153458",
    nutritionRating: {
      category: "NON_DAIRY_BEVERAGE",
      servingQuantity: 320,
      servingUnit: "mL",
      caloriesPerServing: 134,
      totalSugarsGramsPerServing: 33.5,
    },
    servingSize: "320mL (1 can)",
    warningMessage:
      "Philippine FDA product registration FR-4000008153458 lists COCA-COLA ORIGINAL TASTE CARBONATED COLA DRINK, valid through 12 June 2031. This is a product-name match; the portal does not specify individual package sizes. One 320mL can contains 33.5g total sugar and 134 calories, so enjoy it in moderation.",
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
      {
        name: "Carbonated Water",
        isAllergen: false,
      },
      {
        name: "Sugar",
        isAllergen: false,
      },
      {
        name: "Caramel Color",
        isAllergen: false,
      },
      {
        name: "Acidity Regulator (Phosphoric Acid)",
        isAllergen: false,
      },
      {
        name: "Natural Flavors",
        isAllergen: false,
      },
      {
        name: "Caffeine",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "Water",
      "Unsweetened sparkling water",
    ],
  },

  {
    slug: "lipton-soda-iced-tea-lemon-zero-sugar-1-5l",
    barcode: "4803925370328",
    name: "Lipton Soda Iced Tea Lemon Zero Sugar 1.5L",
    brand: "Lipton",
    category: "Zero-Sugar Carbonated Tea",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000014670413",
    nutritionRating: {
      category: "NON_DAIRY_BEVERAGE",
      servingQuantity: 200,
      servingUnit: "mL",
      caloriesPerServing: 1,
      totalSugarsGramsPerServing: 0,
    },
    servingSize: "200mL (about 7.5 servings per 1.5L bottle)",
    warningMessage:
      "Philippine FDA registration FR-4000014670413 lists Lipton Soda Ice Tea Lemon Flavor - Zero Sugar as approved, active, and valid through August 17, 2028. Its Medium Risk Food Product classification is a regulatory category, not an FDA warning. It contains zero sugar and uses sucralose, steviol glycosides, and acesulfame potassium as sweeteners. One 200mL serving contains 56mg sodium.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "1",
      protein: "0g",
      carbohydrates: "0g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "56mg",
    },

    ingredients: [
      {
        name: "Carbonated Water",
        isAllergen: false,
      },
      {
        name: "Citric Acid (Acidity Regulator)",
        isAllergen: false,
      },
      {
        name: "Black Tea Extract",
        isAllergen: false,
      },
      {
        name: "Sodium Hexametaphosphate (Stabilizer)",
        isAllergen: false,
      },
      {
        name: "Sucralose, Steviol Glycosides, and Acesulfame Potassium (Sweeteners)",
        isAllergen: false,
      },
      {
        name: "Potassium Sorbate (Preservative)",
        isAllergen: false,
      },
      {
        name: "Ascorbic Acid",
        isAllergen: false,
      },
      {
        name: "Trisodium Citrate (Acidity Regulator)",
        isAllergen: false,
      },
      {
        name: "Natural Lemon Flavourings",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "Plain sparkling water with fresh lemon",
      "Unsweetened brewed tea served cold",
    ],
  },

  {
    slug: "tang-orange-instant-drink-mix-19g",
    barcode: "7622300559991",
    name: "Tang Orange Instant Drink Mix 19g",
    brand: "Tang",
    category: "Powdered Drink Mix",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000012378562",
    nutritionRating: {
      category: "NON_DAIRY_BEVERAGE",
      servingQuantity: 250,
      servingUnit: "mL",
      caloriesPerServing: 20,
      totalSugarsGramsPerServing: 3,
    },
    servingSize:
      "Approx. 5g powder prepared as directed (about 4 servings per 19g pack)",
    warningMessage:
      "Philippine FDA registration FR-4000012378562 lists Tang Orange Flavor Instant Drink Mix by Mondelez Philippines, Inc. as approved through April 4, 2029. The nutrition score assumes one prepared 250mL serving. Contains aspartame and phenylalanine; people with phenylketonuria should follow the package warning.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "20",
      protein: "0g",
      carbohydrates: "4g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "3g",
      dietaryFiber: "Less than 1g",
      sodium: "45mg",
    },

    ingredients: [
      {
        name: "Refined Cane Sugar",
        isAllergen: false,
      },
      {
        name: "Acidity Regulator (Citric Acid)",
        isAllergen: false,
      },
      {
        name: "Natural and Nature-Identical Orange Flavor",
        isAllergen: false,
      },
      {
        name: "Anti-Caking Agent (Calcium Phosphate)",
        isAllergen: false,
      },
      {
        name: "Stabilizer (Sodium Carboxymethylcellulose)",
        isAllergen: false,
      },
      {
        name: "Artificial Sweeteners (Aspartame and Acesulfame Potassium)",
        isAllergen: false,
      },
      {
        name: "Flavor Enhancers (Sodium Citrate and Sodium Chloride)",
        isAllergen: false,
      },
      {
        name: "Artificial Colors (Sunset Yellow and Tartrazine)",
        isAllergen: false,
      },
      {
        name: "Titanium Dioxide (Color)",
        isAllergen: false,
      },
      {
        name: "Vitamin C, Zinc, and Vitamin D",
        isAllergen: false,
      },
      {
        name: "Powdered Orange Extract",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "Water with fresh orange slices",
      "An unsweetened drink with no artificial sweeteners",
    ],
  },

  {
    slug: "tang-pomelo-instant-drink-mix-19g",
    barcode: "7622210706768",
    name: "Tang Pomelo Instant Drink Mix 19g",
    brand: "Tang",
    category: "Powdered Drink Mix",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "Multiple matching active Philippine FDA records",
    nutritionRating: {
      category: "NON_DAIRY_BEVERAGE",
      servingQuantity: 250,
      servingUnit: "mL",
      caloriesPerServing: 20,
      totalSugarsGramsPerServing: 3,
    },
    servingSize:
      "Approx. 5g powder prepared as directed (about 4 servings per 19g pack; one pack prepares 700mL)",
    warningMessage:
      "The Philippine FDA portal lists two active registrations matching Tang Pomelo Flavor Instant Drink Mix by Mondelez Philippines, Inc., valid through February 8, 2028 and July 1, 2029, but it does not map either record to barcode 7622210706768. The nutrition score assumes one prepared 250mL serving. Contains aspartame and phenylalanine; people with phenylketonuria should follow the package warning.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "20",
      protein: "0g",
      carbohydrates: "4g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "3g",
      dietaryFiber: "Less than 1g",
      sodium: "25mg",
    },

    ingredients: [
      { name: "Refined Cane Sugar", isAllergen: false },
      { name: "Acidity Regulator (Citric Acid)", isAllergen: false },
      { name: "Anti-Caking Agent (Calcium Phosphate)", isAllergen: false },
      {
        name: "Artificial Sweeteners (Aspartame and Acesulfame Potassium)",
        isAllergen: false,
      },
      {
        name: "Stabilizer (Sodium Carboxymethylcellulose)",
        isAllergen: false,
      },
      {
        name: "Natural and Nature-Identical Pomelo Flavor",
        isAllergen: false,
      },
      { name: "Vitamin C, Zinc, and Vitamin D", isAllergen: false },
      { name: "Salt", isAllergen: false },
      { name: "Powdered Mixed Fruit Extracts", isAllergen: false },
      { name: "Titanium Dioxide (Color)", isAllergen: false },
      {
        name: "Artificial Colors (Allura Red and Tartrazine)",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "Water with fresh pomelo or citrus slices",
      "An unsweetened drink without artificial sweeteners",
    ],
  },

  {
    slug: "gardenia-classic-white-bread-regular-slice-600g",
    barcode: "4806502720615",
    name: "Gardenia Classic White Bread 600g",
    brand: "Gardenia",
    category: "White Bread",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000015595825",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 56,
      servingUnit: "g",
      caloriesPerServing: 153,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 5,
      sodiumMilligramsPerServing: 215,
    },
    servingSize: "56g (2 slices; about 10 servings per 600g loaf)",
    warningMessage:
      "Philippine FDA registration FR-4000015595825 lists Gardenia Classic Enriched White Bread 600g as approved, active, and valid through March 5, 2031. The FDA portal does not publish retail barcodes; barcode 4806502720615 matches the Philippine 600g regular-slice pack. Contains wheat/gluten and milk and may contain soy and egg. One serving contains 215mg sodium.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "153",
      protein: "5g",
      carbohydrates: "31g",
      totalFat: "1g",
      saturatedFat: "0g",
      totalSugars: "5g",
      dietaryFiber: "1g",
      sodium: "215mg",
    },

    ingredients: [
      {
        name: "High Protein Wheat Flour",
        isAllergen: true,
      },
      {
        name: "Water",
        isAllergen: false,
      },
      {
        name: "Malted Barley Flour",
        isAllergen: true,
      },
      {
        name: "Whey",
        isAllergen: true,
      },
      {
        name: "Iodized Salt",
        isAllergen: false,
      },
      {
        name: "Skimmed Milk Powder",
        isAllergen: true,
      },
      {
        name: "Dextrose",
        isAllergen: false,
      },
      {
        name: "Pure Vegetable Shortening",
        isAllergen: false,
      },
      {
        name: "Dough Conditioners",
        isAllergen: false,
      },
      {
        name: "Soy Flour",
        isAllergen: true,
      },
      {
        name: "Mineral Yeast Food",
        isAllergen: false,
      },
      {
        name: "Vitamin B1 (Thiamine) and Folic Acid",
        isAllergen: false,
      },
    ],

    allergens: ["Wheat / Gluten", "Milk", "Soy", "Eggs"],

    alternatives: [
      "A higher-fiber whole-grain bread after comparing nutrition labels",
      "A lower-sodium bread that matches your allergen preferences",
    ],
  },

  {
    slug: "magnolia-quickmelt-processed-cheese-160g",
    barcode: "4805358323032",
    name: "Magnolia Quickmelt Processed Cheese 160g",
    brand: "Magnolia",
    category: "Processed Cheese",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000009868111",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 30,
      servingUnit: "g",
      caloriesPerServing: 110,
      saturatedFatGramsPerServing: 6,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 350,
    },
    servingSize: "30g (about 5 servings per 160g pack)",
    warningMessage:
      "Philippine FDA registration FR-4000009868111 lists Magnolia Quickmelt Pasteurized Processed Cheese Product as approved, active, and valid through January 15, 2029. Its High Risk Food Product classification is a regulatory category for the dairy product, not an FDA warning. One 30g serving contains 6g saturated fat and 350mg sodium. Contains milk and is made in a facility that also processes soy and gluten-containing cereals.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "110",
      protein: "5g",
      carbohydrates: "2g",
      totalFat: "9g",
      saturatedFat: "6g",
      totalSugars: "Not listed",
      dietaryFiber: "1g",
      sodium: "350mg",
    },

    ingredients: [
      {
        name: "Cheese",
        isAllergen: true,
      },
      {
        name: "Water",
        isAllergen: false,
      },
      {
        name: "Vegetable Oil",
        isAllergen: false,
      },
      {
        name: "Buttermilk Powder",
        isAllergen: true,
      },
      {
        name: "Milk Proteins",
        isAllergen: true,
      },
      {
        name: "Sodium Citrate and Disodium Phosphate (Emulsifying Agents)",
        isAllergen: false,
      },
      {
        name: "Iodized Salt",
        isAllergen: false,
      },
      {
        name: "Lactic Acid (Acidulant)",
        isAllergen: false,
      },
      {
        name: "Carrageenan (Stabilizer)",
        isAllergen: false,
      },
      {
        name: "Potassium Sorbate and Nisin (Preservatives)",
        isAllergen: false,
      },
      {
        name: "Flavor",
        isAllergen: false,
      },
      {
        name: "Beta-Carotene (Colorant)",
        isAllergen: false,
      },
    ],

    allergens: ["Milk", "Soy", "Wheat / Gluten"],

    alternatives: [
      "A lower-sodium cheese after comparing nutrition labels",
      "A reduced-saturated-fat cheese that matches your allergen preferences",
    ],
  },

  {
    slug: "eden-original-processed-filled-cheese-spread-160g",
    barcode: "4808647020094",
    name: "Eden Original Processed Filled Cheese Spread 160g",
    brand: "Eden",
    category: "Processed Cheese Spread",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000015357502",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 30,
      servingUnit: "g",
      caloriesPerServing: 90,
      saturatedFatGramsPerServing: 6,
      totalSugarsGramsPerServing: 1,
      sodiumMilligramsPerServing: 450,
    },
    servingSize: "30g (about 5 servings per 160g pack)",
    warningMessage:
      "Philippine FDA registration FR-4000015357502 lists Eden Original Processed Filled Cheese Spread as approved, active, and valid through November 6, 2030. Its High Risk Food Product classification is a regulatory category for the dairy product, not an FDA warning. One 30g serving contains 6g saturated fat and 450mg sodium. Contains milk.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "90",
      protein: "3g",
      carbohydrates: "4g",
      totalFat: "7g",
      saturatedFat: "6g",
      totalSugars: "1g",
      dietaryFiber: "Not listed",
      sodium: "450mg",
    },

    ingredients: [
      {
        name: "Water",
        isAllergen: false,
      },
      {
        name: "Vegetable Oil (Coconut, Palm, and Palm Olein)",
        isAllergen: false,
      },
      {
        name: "Milk Powder",
        isAllergen: true,
      },
      {
        name: "Food Starch (Corn and Tapioca)",
        isAllergen: false,
      },
      {
        name: "Cheese Powder",
        isAllergen: true,
      },
      {
        name: "Emulsifiers (E339 and E471)",
        isAllergen: false,
      },
      {
        name: "Salt",
        isAllergen: false,
      },
      {
        name: "Acidity Regulator (E260)",
        isAllergen: false,
      },
      {
        name: "Stabilizer (E341)",
        isAllergen: false,
      },
      {
        name: "Color (E101)",
        isAllergen: false,
      },
      {
        name: "Sugar",
        isAllergen: false,
      },
      {
        name: "Preservative (E202)",
        isAllergen: false,
      },
    ],

    allergens: ["Milk"],

    alternatives: [
      "A lower-sodium cheese after comparing nutrition labels",
      "A reduced-saturated-fat cheese that matches your allergen preferences",
    ],
  },

  // Caution reflects the mix's high sodium per serving and allergen notices;
  // its Philippine FDA registration remains approved and active.
  {
    slug: "knorr-sinigang-sa-sampalok-mix-original-44g",
    barcode: "4800888600806",
    name: "Knorr Sinigang sa Sampalok Mix Original 44g",
    brand: "Knorr",
    category: "Soup and Seasoning Mix",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000007690965",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 2.8,
      servingUnit: "g",
      caloriesPerServing: 6,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 476,
    },
    servingSize: "2.8g mix (makes 1/2 cup / 125mL; about 16 servings per pack)",
    warningMessage:
      "Philippine FDA registration FR-4000007690965 lists Knorr Sinigang sa Sampalok Mix Original as approved, active, and valid through September 8, 2030. Its Low Risk Food Product classification is a regulatory category, not an FDA warning. One 2.8g serving contains 476mg sodium (24% RENI). Contains milk and crustaceans, and may contain eggs, fish, soy, and wheat.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "6",
      protein: "0g",
      carbohydrates: "1g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "476mg",
    },

    ingredients: [
      {
        name: "Iodized Salt",
        isAllergen: false,
      },
      {
        name: "Citric Acid (Acidity Regulator)",
        isAllergen: false,
      },
      {
        name: "Monosodium Glutamate and Disodium 5'-Ribonucleotides (Flavor Enhancers)",
        isAllergen: false,
      },
      {
        name: "Sugar",
        isAllergen: false,
      },
      {
        name: "Tomato Powder",
        isAllergen: false,
      },
      {
        name: "Tamarind",
        isAllergen: false,
      },
      {
        name: "Xanthan Gum (Thickener)",
        isAllergen: false,
      },
      {
        name: "Spices",
        isAllergen: false,
      },
      {
        name: "Palm Oil",
        isAllergen: false,
      },
      {
        name: "Shrimp",
        isAllergen: true,
      },
      {
        name: "Yeast Extract",
        isAllergen: false,
      },
      {
        name: "Caramel and Paprika Colors",
        isAllergen: false,
      },
      {
        name: "Natural Flavor",
        isAllergen: false,
      },
      {
        name: "Vitamin C",
        isAllergen: false,
      },
    ],

    allergens: ["Milk", "Shellfish", "Eggs", "Fish", "Soy", "Wheat / Gluten"],

    alternatives: [
      "Fresh tamarind and aromatics with salt added to taste",
      "A lower-sodium soup base checked against your allergen preferences",
    ],
  },

  // Caution reflects the mix's high sodium per serving and allergen notices;
  // its Philippine FDA registration remains approved and active.
  {
    slug: "knorr-sinigang-sa-sampalok-mix-gabi-44g",
    barcode: "4800888602251",
    name: "Knorr Sinigang sa Sampalok Mix Gabi 44g",
    brand: "Knorr",
    category: "Soup and Seasoning Mix",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000009681523",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 3,
      servingUnit: "g",
      caloriesPerServing: 6,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 470,
    },
    servingSize: "3g mix (makes 1/2 cup / 125mL; about 15 servings per pack)",
    warningMessage:
      "Philippine FDA registration FR-4000009681523 lists Knorr Sinigang sa Sampalok Mix Gabi for the local and export markets as approved, active, and valid through May 9, 2028. Its Low Risk Food Product classification is a regulatory category, not an FDA warning. One 3g serving contains 470mg sodium (24% RENI). Contains milk, crustaceans, and gluten-containing cereals, and may contain eggs, fish, and soy.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "6",
      protein: "0g",
      carbohydrates: "1g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "470mg",
    },

    ingredients: [
      {
        name: "Iodized Salt",
        isAllergen: false,
      },
      {
        name: "Citric Acid (Acidity Regulator)",
        isAllergen: false,
      },
      {
        name: "Monosodium Glutamate and Ribonucleotides (Flavor Enhancers)",
        isAllergen: false,
      },
      {
        name: "Tamarind",
        isAllergen: false,
      },
      {
        name: "Wheat Flour",
        isAllergen: true,
      },
      {
        name: "Xanthan Gum (Thickener)",
        isAllergen: false,
      },
      {
        name: "Sugar",
        isAllergen: false,
      },
      {
        name: "Taro",
        isAllergen: false,
      },
      {
        name: "Tomato",
        isAllergen: false,
      },
      {
        name: "Spices",
        isAllergen: false,
      },
      {
        name: "Yeast Extract",
        isAllergen: false,
      },
      {
        name: "Shrimp",
        isAllergen: true,
      },
      {
        name: "Palm Oil",
        isAllergen: false,
      },
      {
        name: "Natural Flavor",
        isAllergen: false,
      },
      {
        name: "Caramel Color",
        isAllergen: false,
      },
    ],

    allergens: ["Milk", "Shellfish", "Wheat / Gluten", "Eggs", "Fish", "Soy"],

    alternatives: [
      "Fresh tamarind, taro, and aromatics with salt added to taste",
      "A lower-sodium soup base checked against your allergen preferences",
    ],
  },

  {
    slug: "century-tuna-flakes-in-oil-155g",
    barcode: "748485100401",
    name: "Century Tuna Flakes in Oil 155g",
    brand: "Century",
    category: "Canned Tuna",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000008019521",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 56,
      servingUnit: "g",
      caloriesPerServing: 100,
      saturatedFatGramsPerServing: 3,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 380,
    },
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
      {
        name: "Tuna Flakes",
        isAllergen: true,
      },
      {
        name: "Water",
        isAllergen: false,
      },
      {
        name: "Soya Oil",
        isAllergen: true,
      },
      {
        name: "Soy Protein Concentrate",
        isAllergen: true,
      },
      {
        name: "Seasonings",
        isAllergen: false,
      },
      {
        name: "Spices",
        isAllergen: false,
      },
      {
        name: "Sugar",
        isAllergen: false,
      },
      {
        name: "Iodized Salt",
        isAllergen: false,
      },
    ],

    allergens: ["Fish", "Soy"],

    alternatives: [
      "Lower-sodium tuna in water after comparing labels",
      "Fresh or frozen fish prepared with less added salt",
    ],
  },

  {
    slug: "uni-pak-squid-in-natural-ink-425g",
    barcode: "4800154156884",
    name: "Uni-Pak Squid in Natural Ink 425g",
    brand: "Uni-Pak",
    category: "Canned Squid",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000009631036",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 85,
      servingUnit: "g",
      caloriesPerServing: 50,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 342,
    },
    servingSize: "85g (about 5 servings per 425g can)",
    warningMessage:
      "Philippine FDA registration FR-4000009631036 lists Uni-Pak Squid in Natural Ink by Slord Development Corporation as approved, active, and valid through August 5, 2027. The product, brand, manufacturer, 425g label, and barcode match the cataloged variant. One 85g serving contains 342mg sodium. Contains squid, soy, and wheat/gluten.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "50",
      protein: "9g",
      carbohydrates: "2g",
      totalFat: "1g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "342mg",
    },

    ingredients: [
      { name: "Squid", isAllergen: true },
      { name: "Water", isAllergen: false },
      {
        name: "Soy Sauce (Soybean, Wheat Flour, and Salt)",
        isAllergen: true,
      },
      { name: "Sugar", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Spices", isAllergen: false },
      { name: "Monosodium Glutamate (Flavor Enhancer)", isAllergen: false },
    ],

    allergens: ["Shellfish", "Soy", "Wheat / Gluten"],

    alternatives: [
      "A lower-sodium canned seafood product checked against your allergens",
      "Fresh squid prepared with less added salt if suitable for you",
    ],
  },

  {
    slug: "mega-mackerel-in-natural-oil-155g",
    barcode: "4806504710232",
    name: "Mega Mackerel in Natural Oil 155g",
    brand: "Mega",
    category: "Canned Mackerel",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000015381871",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 55,
      servingUnit: "g",
      caloriesPerServing: 50,
      saturatedFatGramsPerServing: 1,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 240,
    },
    servingSize: "55g (about 3 servings per 155g can)",
    warningMessage:
      "Philippine FDA registration FR-4000015381871 lists Mega Mackerel in Natural Oil by Mega Prime Foods Incorporated as approved, active, and valid through December 26, 2030. The product name, brand, company, 155g label, and barcode match the cataloged variant. One 55g serving contains 240mg sodium and 55mg cholesterol. Contains fish and soy.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "50",
      protein: "9g",
      carbohydrates: "0g",
      totalFat: "1.5g",
      saturatedFat: "1g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "240mg",
    },

    ingredients: [
      { name: "Mackerel", isAllergen: true },
      { name: "Soya Oil", isAllergen: true },
      { name: "Water", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
    ],

    allergens: ["Fish", "Soy"],

    alternatives: [
      "A lower-sodium canned fish after comparing nutrition labels",
      "Fresh or frozen fish prepared with less added salt",
    ],
  },

  {
    slug: "nestle-gold-corn-flakes-150g",
    barcode: "4800361002844",
    name: "Nestlé Gold Corn Flakes 150g",
    brand: "Nestlé Gold",
    category: "Breakfast Cereal",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000014436411",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 30,
      servingUnit: "g",
      caloriesPerServing: 114,
      saturatedFatGramsPerServing: 0.2,
      totalSugarsGramsPerServing: 2.9,
      sodiumMilligramsPerServing: 134,
    },
    servingSize: "30g (5 servings per 150g box)",
    warningMessage:
      "Philippine FDA registration FR-4000014436411 lists Nestlé Gold Corn Flakes — Toasted Flakes of Corn Breakfast Cereal for local and export markets — as approved, active, and valid through May 9, 2028. The product description and brand match this 150g retail box. One 30g serving contains 2.9g total sugar and 134mg sodium. Contains gluten and soy; the label says it may contain milk and tree nuts.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "114",
      protein: "2g",
      carbohydrates: "24.4g",
      totalFat: "0.6g",
      saturatedFat: "0.2g",
      totalSugars: "2.9g",
      dietaryFiber: "1g",
      sodium: "134mg",
    },

    ingredients: [
      { name: "Corn Semolina (67%)", isAllergen: false },
      { name: "Wholegrain Corn (29%)", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      {
        name: "Minerals (Calcium Carbonate and Reduced Iron)",
        isAllergen: false,
      },
      { name: "Glucose Syrup", isAllergen: false },
      { name: "Malt Barley Extract (Gluten)", isAllergen: true },
      { name: "Salt", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Potassium Iodate", isAllergen: false },
      { name: "Trisodium Phosphate (INS 339(iii))", isAllergen: false },
      { name: "Monoglycerides (INS 471)", isAllergen: false },
      {
        name: "Mixed Tocopherol Concentrate (Soy)",
        isAllergen: true,
      },
      {
        name: "Vitamins (B3, B5, B6, B2, and B9)",
        isAllergen: false,
      },
    ],

    allergens: ["Wheat / Gluten", "Soy", "Milk", "Tree Nuts"],

    alternatives: [
      "Plain oats topped with fresh fruit if suitable for you",
      "A lower-sodium wholegrain cereal checked against your allergens",
    ],
  },

  {
    slug: "nestle-koko-krunch-duo-170g",
    barcode: "4800361346429",
    name: "Nestlé Koko Krunch Duo 170g",
    brand: "Nestlé Koko Krunch Duo",
    category: "Breakfast Cereal",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000012213874",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 30,
      servingUnit: "g",
      caloriesPerServing: 114,
      saturatedFatGramsPerServing: 0.3,
      totalSugarsGramsPerServing: 8,
      sodiumMilligramsPerServing: 50,
    },
    servingSize: "30g (label lists 5 servings per 170g box)",
    warningMessage:
      "Philippine FDA registration FR-4000012213874 lists Nestlé Koko Krunch Duo Chocolate and Vanilla Flavoured Wheat Curls Breakfast Cereal as approved, active, and valid through January 9, 2029. The product description and brand match this 170g retail box. One 30g serving contains 8g total sugar. Contains gluten, milk, and soy; the label says it may contain tree nuts.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "114",
      protein: "2.7g",
      carbohydrates: "24.9g",
      totalFat: "0.8g",
      saturatedFat: "0.3g",
      totalSugars: "8g",
      dietaryFiber: "1.7g",
      sodium: "50mg",
    },

    ingredients: [
      { name: "Wholegrain Wheat (Gluten, 36%)", isAllergen: true },
      { name: "Wheat Flour (Gluten)", isAllergen: true },
      { name: "Corn Semolina", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Malt Barley Extract (Gluten)", isAllergen: true },
      { name: "Starch", isAllergen: false },
      { name: "Fat-Reduced Cocoa Powder", isAllergen: false },
      {
        name: "Minerals (Calcium Carbonate and Reduced Iron)",
        isAllergen: false,
      },
      { name: "Skimmed Milk Powder", isAllergen: true },
      { name: "Palm Oil", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Sodium Chloride", isAllergen: false },
      { name: "Potassium Iodate", isAllergen: false },
      { name: "Flavourings", isAllergen: false },
      { name: "Trisodium Phosphate (INS 339(iii))", isAllergen: false },
      {
        name: "Mixed Tocopherol Concentrate (Soy)",
        isAllergen: true,
      },
      {
        name: "Vitamins (B3, B5, B6, B2, and B9)",
        isAllergen: false,
      },
    ],

    allergens: ["Wheat / Gluten", "Milk", "Soy", "Tree Nuts"],

    alternatives: [
      "A lower-sugar cereal checked against your allergen preferences",
      "Plain oats with cocoa and fresh fruit if suitable for you",
    ],
  },

  {
    slug: "quaker-quick-cook-oatmeal-400g",
    barcode: "4800274040025",
    name: "Quaker Quick Cook Oatmeal 400g",
    brand: "Quaker",
    category: "Oatmeal",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000008762278",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 35,
      servingUnit: "g",
      caloriesPerServing: 133,
      saturatedFatGramsPerServing: 0.6,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 2,
    },
    servingSize: "35g or 4 tablespoons (about 11 servings per 400g pack)",
    warningMessage:
      "Philippine FDA registration FR-4000008762278 lists Quaker Rolled Oats as approved, active, and valid through February 19, 2027. The brand and rolled-oats product description match this Quaker Quick Cook 400g retail variant. The ingredient list is 100% whole grain oats, with 0g total sugar and 2mg sodium per 35g serving. Contains oats and may contain traces of wheat.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "133",
      protein: "4.3g",
      carbohydrates: "24g",
      totalFat: "3g",
      saturatedFat: "0.6g",
      totalSugars: "0g",
      dietaryFiber: "3.4g",
      sodium: "2mg",
    },

    ingredients: [{ name: "Whole Grain Oats", isAllergen: true }],

    allergens: ["Oats", "Wheat / Gluten"],

    alternatives: [
      "Other plain unsweetened oats checked against your allergens",
      "Fresh fruit added to plain oatmeal instead of sweetened toppings",
    ],
  },

  {
    slug: "kelloggs-frosties-175g",
    barcode: "8852756303063",
    name: "Kellogg's Frosties 175g",
    brand: "Kellogg's",
    category: "Breakfast Cereal",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "4000011038021",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 30,
      servingUnit: "g",
      caloriesPerServing: 120,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 7,
      sodiumMilligramsPerServing: 85,
    },
    servingSize: "30g (about 6 servings per 175g box)",
    warningMessage:
      "Philippine FDA registration 4000011038021 lists Kellogg's Frosties Breakfast Cereal Frosted Toasted Flakes of Corn as approved, active, and valid through May 5, 2028. The FDA record explicitly includes a 175g box. One 30g serving contains 7g total sugar. The label says it may contain traces of peanuts, tree nuts, gluten, milk, and soy.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "120",
      protein: "2g",
      carbohydrates: "26g",
      totalFat: "0.5g",
      saturatedFat: "0g",
      totalSugars: "7g",
      dietaryFiber: "N/A",
      sodium: "85mg",
    },

    ingredients: [
      { name: "Corn (81.1%)", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Antioxidant (Mixed Tocopherol)", isAllergen: false },
      {
        name: "Vitamins (B3, B6, B2, B1, and Folic Acid)",
        isAllergen: false,
      },
      { name: "Minerals (Reduced Iron and Zinc Oxide)", isAllergen: false },
      { name: "Natural Flavour (Steviol Glycoside)", isAllergen: false },
    ],

    allergens: ["Peanuts", "Tree Nuts", "Wheat / Gluten", "Milk", "Soy"],

    alternatives: [
      "A lower-sugar cereal checked against your allergen preferences",
      "Plain oats topped with fresh fruit if suitable for you",
    ],
  },

  {
    slug: "heinz-seriously-good-mayonnaise-120g",
    barcode: "8850343011322",
    name: "Heinz Seriously Good Mayonnaise 120g",
    brand: "Heinz",
    category: "Mayonnaise",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000011512404",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 15,
      servingUnit: "g",
      caloriesPerServing: 98,
      saturatedFatGramsPerServing: 1.5,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 82,
    },
    servingSize: "15g (about 8 servings per 120g pouch)",
    warningMessage:
      "Philippine FDA registration FR-4000011512404 lists Heinz Seriously Good Mayonnaise as approved, active, and valid through November 4, 2030. The FDA record specifies pouch packaging and the same manufacturer address in Thailand shown on this label. One 15g serving contains 98 calories, 10g total fat, and 1.5g saturated fat, so use it in moderation. Contains egg and mustard. Refrigerate after opening.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "98",
      protein: "0g",
      carbohydrates: "1g",
      totalFat: "10g",
      saturatedFat: "1.5g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "82mg",
    },

    ingredients: [
      { name: "Soybean Oil", isAllergen: false },
      { name: "Water", isAllergen: false },
      { name: "Egg", isAllergen: true },
      { name: "Vinegar", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Salt", isAllergen: false },
      {
        name: "Modified Starch (Sodium Octenyl Succinate, INS 1450)",
        isAllergen: false,
      },
      { name: "Xanthan Gum (INS 415)", isAllergen: false },
      { name: "Mustard", isAllergen: true },
      {
        name: "Calcium Disodium EDTA (INS 385)",
        isAllergen: false,
      },
    ],

    allergens: ["Eggs", "Mustard"],

    alternatives: [
      "A lower-fat mayonnaise checked against your allergen preferences",
      "Plain Greek yogurt-based spread if milk is suitable for you",
    ],
  },

  {
    slug: "argentina-corned-beef-260g",
    barcode: "748485800035",
    name: "Argentina Corned Beef 260g",
    brand: "Argentina",
    category: "Canned Corned Beef",
    status: "UNVERIFIED",
    fdaStatusLabel: "Not Verified",
    registrationNumber: "No current matching Philippine FDA record",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "56g; about 5 servings per can",
    warningMessage:
      "No currently active Philippine FDA registration was found for this exact regular 260g retail variant and barcode as of August 11, 2026. FDA registration FR-4000008091671 covers a different Argentina Century Pacific Food Service product and expired on July 15, 2026; other active Argentina records found are for Hot and Spicy or export variants. This does not prove the product is unsafe, but this exact variant could not be verified in the current FDA registry.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "90",
      protein: "6g",
      carbohydrates: "5g",
      totalFat: "5g",
      saturatedFat: "3g",
      totalSugars: "0g",
      dietaryFiber: "1g",
      sodium: "260mg",
    },

    ingredients: [
      {
        name: "Cooked Beef",
        isAllergen: false,
      },
      {
        name: "Beef Broth",
        isAllergen: false,
      },
      {
        name: "Soy Protein",
        isAllergen: true,
      },
      {
        name: "Iodized Salt",
        isAllergen: false,
      },
      {
        name: "Sugar",
        isAllergen: false,
      },
      {
        name: "Spices",
        isAllergen: false,
      },
      {
        name: "Monosodium Glutamate (Flavor Enhancer)",
        isAllergen: false,
      },
      {
        name: "Sodium Tripolyphosphate (Water Retention Agent)",
        isAllergen: false,
      },
      {
        name: "Sodium Erythorbate (Antioxidant)",
        isAllergen: false,
      },
      {
        name: "Sodium Nitrite (Color Retention Agent)",
        isAllergen: false,
      },
      {
        name: "Zinc and Iron",
        isAllergen: false,
      },
    ],

    allergens: ["Soy"],

    alternatives: [
      "An FDA-registered corned beef with a current matching product record",
      "Fresh lean beef prepared with less added sodium",
    ],
  },

  {
    slug: "spam-lite-luncheon-meat-340g",
    barcode: "037600336161",
    name: "SPAM Lite Luncheon Meat 340g",
    brand: "SPAM",
    category: "Canned Luncheon Meat",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "Multiple matching active Philippine FDA records",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 56,
      servingUnit: "g",
      caloriesPerServing: 104,
      saturatedFatGramsPerServing: 2.8,
      totalSugarsGramsPerServing: 0.8,
      sodiumMilligramsPerServing: 415,
    },
    servingSize: "56g (6 servings per 340g / 12 oz can)",
    warningMessage:
      "The Philippine FDA portal lists multiple active registrations matching SPAM Lite Luncheon Meat, including a 12 oz record valid through February 16, 2031, but it does not map a registration to barcode 037600336161. One 56g serving contains 415mg sodium, 2.8g saturated fat, and 39.5mg cholesterol. Refrigerate unused contents promptly in a separate covered container after opening.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "104 kcal",
      protein: "7g",
      carbohydrates: "1.7g",
      totalFat: "7.7g",
      saturatedFat: "2.8g",
      totalSugars: "0.8g",
      dietaryFiber: "0g",
      sodium: "415mg",
    },

    ingredients: [
      { name: "Pork with Ham", isAllergen: false },
      { name: "Mechanically Separated Chicken", isAllergen: false },
      { name: "Water", isAllergen: false },
      { name: "Salt", isAllergen: false },
      { name: "Modified Potato Starch", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Sodium Phosphates", isAllergen: false },
      { name: "Potassium Chloride", isAllergen: false },
      { name: "Sodium Ascorbate", isAllergen: false },
      { name: "Sodium Nitrite", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "A lower-sodium luncheon meat after comparing nutrition labels",
      "Fresh lean pork or chicken prepared with less added sodium",
    ],
  },

  {
    slug: "delimondo-garlic-chili-corned-beef-175g",
    barcode: "4800005042342",
    name: "Delimondo Garlic and Chili Corned Beef 175g",
    brand: "Delimondo",
    category: "Canned Corned Beef",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000015029812",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 50,
      servingUnit: "g",
      caloriesPerServing: 101,
      saturatedFatGramsPerServing: 3,
      totalSugarsGramsPerServing: 2,
      sodiumMilligramsPerServing: 377,
    },
    servingSize: "50g (about 3 servings per 175g can)",
    warningMessage:
      "Philippine FDA registration FR-4000015029812 lists Delimondo Garlic and Chili Corned Beef by Delimondo Food Specialties Inc. as active through November 27, 2030. The official Delimondo catalog confirms the 175g variant; the FDA portal does not publish retail barcodes. One 50g serving contains 377mg sodium and 3g saturated fat. The label says it is manufactured in a facility that also processes wheat, milk, soy, fish, tree nuts, celery, and eggs.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "101 kcal",
      protein: "9g",
      carbohydrates: "2g",
      totalFat: "7g",
      saturatedFat: "3g",
      totalSugars: "2g",
      dietaryFiber: "Less than 1g",
      sodium: "377mg",
    },

    ingredients: [
      { name: "Cooked Beef", isAllergen: false },
      { name: "Beef Broth", isAllergen: false },
      { name: "Garlic", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Sodium Phosphates (Stabilizer)", isAllergen: false },
      { name: "Chili", isAllergen: false },
      { name: "Select Spices", isAllergen: false },
      {
        name: "Monosodium Glutamate (Flavor Enhancer)",
        isAllergen: false,
      },
      { name: "Sodium Erythorbate (Antioxidant)", isAllergen: false },
      { name: "Sodium Nitrite (Color Retention Agent)", isAllergen: false },
    ],

    allergens: [
      "Wheat / Gluten",
      "Milk",
      "Soy",
      "Fish",
      "Tree Nuts",
      "Celery",
      "Eggs",
    ],

    alternatives: [
      "A lower-sodium corned beef after comparing nutrition labels",
      "Fresh lean beef prepared with less added sodium",
    ],
  },

  {
    slug: "bertolli-extra-virgin-olive-oil-rich-taste-2l",
    barcode: "041790002201",
    name: "Bertolli Extra Virgin Olive Oil Rich Taste 2L",
    brand: "Bertolli",
    category: "Extra Virgin Olive Oil",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "Multiple matching active Philippine FDA records",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 13.7,
      servingUnit: "g",
      caloriesPerServing: 120,
      saturatedFatGramsPerServing: 2.2,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 0,
    },
    servingSize: "15mL (1 tablespoon; about 133 servings per 2L bottle)",
    warningMessage:
      "The Philippine FDA portal lists multiple active registrations matching Bertolli Extra Virgin Olive Oil, including records valid through April 28 and July 19, 2027, but it does not map a registration to barcode 041790002201. One 15mL serving contains 120 calories and 13.7g total fat. Store tightly capped in a cool place away from light; cloudiness below 20°C is normal and clears at room temperature.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "120 kcal",
      protein: "0g",
      carbohydrates: "0g",
      totalFat: "13.7g",
      saturatedFat: "2.2g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "0mg",
    },

    ingredients: [{ name: "Extra Virgin Olive Oil", isAllergen: false }],

    allergens: [],

    alternatives: [
      "Use a measured portion of olive oil appropriate for the meal",
      "Another FDA-registered unsaturated cooking or dressing oil",
    ],
  },

  {
    slug: "anchor-protein-plus-fortified-powdered-milk-drink-280g",
    barcode: "4806501599670",
    name: "Anchor Protein+ High-Protein Fortified Powdered Milk Drink 280g",
    brand: "Anchor",
    category: "Fortified Powdered Milk Drink",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000010035715",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 35,
      servingUnit: "g",
      caloriesPerServing: 143,
      saturatedFatGramsPerServing: 2,
      totalSugarsGramsPerServing: 2,
      sodiumMilligramsPerServing: 146,
    },
    servingSize:
      "35g powder prepared with 200mL water (about 8 servings per 280g pack)",
    warningMessage:
      "Philippine FDA registration FR-4000010035715 lists Anchor Protein+ High-Protein Fortified Powdered Milk Drink by Fonterra Brands Phils., Inc. as active through November 16, 2027. One prepared serving provides 8g protein and contains 2g saturated fat, 2g sucrose, and 146mg sodium. Contains milk and soy. The label says it is not suitable for children aged 0–3 years and is not a breastmilk substitute or suitable for infant feeding.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "143 kcal",
      protein: "8g",
      carbohydrates: "20g",
      totalFat: "3g",
      saturatedFat: "2g",
      totalSugars: "2g sucrose",
      dietaryFiber: "0g",
      sodium: "146mg",
    },

    ingredients: [
      {
        name: "Dairy Solids (Whey Powder, Skim Milk Powder, and Buttermilk Powder)",
        isAllergen: true,
      },
      { name: "Maltodextrin", isAllergen: false },
      { name: "Soy Protein Isolate Powder", isAllergen: true },
      { name: "Vegetable Oil Powder (Palm Oil)", isAllergen: false },
      { name: "Sucrose", isAllergen: false },
      { name: "Calcium Carbonate", isAllergen: false },
      {
        name: "Natural, Nature-Identical, and Artificial Flavors",
        isAllergen: false,
      },
      { name: "Soy Lecithin", isAllergen: true },
      {
        name: "Vitamins (Vitamin D3, Vitamin A Acetate, Thiamine Hydrochloride, and Riboflavin)",
        isAllergen: false,
      },
      { name: "Beta Carotene", isAllergen: false },
    ],

    allergens: ["Milk", "Soy"],

    alternatives: [
      "An FDA-registered powdered milk without soy, if soy must be avoided",
      "A lower-saturated-fat milk option that fits the user's nutrition needs",
    ],
  },

  {
    slug: "lotte-xylitol-sugar-free-gum-blueberry-mint-58g",
    barcode: "840143700401",
    name: "Lotte Xylitol Sugar Free Gum Blueberry Mint Flavor 58g",
    brand: "Lotte Xylitol",
    category: "Sugar-Free Chewing Gum",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000009339422",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 3,
      servingUnit: "g",
      caloriesPerServing: 10,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 0,
    },
    servingSize: "2 pellets (3g; about 19 servings per 58g bottle)",
    warningMessage:
      "Philippine FDA registration FR-4000009339422 lists Lotte Xylitol Gum Blueberry Mint Flavor as active through May 19, 2027. It is sugar-free but contains aspartame and phenylalanine, so people with phenylketonuria should follow the label warning. The matched 58g product information also identifies soy and bee pollen/propolis allergens.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "10 kcal",
      protein: "0g",
      carbohydrates: "3g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "N/A",
      sodium: "0mg",
    },

    ingredients: [
      {
        name: "Sweeteners (Xylitol 39%, Maltitol 34%, Maltitol Syrup 0.16%, and Aspartame 0.15%)",
        isAllergen: false,
      },
      { name: "Gum Base", isAllergen: false },
      { name: "Gum Arabic (Thickener)", isAllergen: false },
      { name: "Dicalcium Phosphate (Stabilizer)", isAllergen: false },
      {
        name: "Glazing Agents (Beeswax, Carnauba Wax, and Shellac)",
        isAllergen: false,
      },
      {
        name: "Artificial Colors (Erythrosine / FD&C Red 3 and Brilliant Blue / FD&C Blue 1)",
        isAllergen: false,
      },
      { name: "Artificial Flavor", isAllergen: false },
    ],

    allergens: ["Soy", "Bee pollen / propolis"],

    alternatives: [
      "An FDA-registered sugar-free gum without aspartame",
      "Routine brushing, flossing, and water for oral hygiene",
    ],
  },

  {
    slug: "dr-daily-vitamin-c-sodium-ascorbate-800mg-30-tablets",
    barcode: "0612477636868",
    name: "Dr. Daily Vitamin C Sodium Ascorbate 800mg 30 Tablets",
    brand: "Dr. Daily",
    category: "Food Supplement",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered — No Approved Therapeutic Claims",
    registrationNumber: "FR-4000014622661",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "1 tablet (30 tablets per bottle)",
    warningMessage:
      "Philippine FDA registration FR-4000014622661 lists Dr. Daily Vitamin C (Sodium Ascorbate) 800mg Food Supplement Tablet as active through September 2, 2027, with no approved therapeutic claims. For adults only. If pregnant, lactating, taking medication, or managing a medical condition, consult a physician before use. Do not exceed one tablet per day, and keep out of reach of children.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "0.40 kcal",
      protein: "0g",
      carbohydrates: "Less than 0.10g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "83mg",
    },

    ingredients: [
      { name: "Vitamin C (Sodium Ascorbate) 800mg", isAllergen: false },
      { name: "Microcrystalline Cellulose (Bulking Agent)", isAllergen: false },
      { name: "Starch (Bulking Agent)", isAllergen: false },
      { name: "Magnesium Stearate (Stabiliser)", isAllergen: false },
      { name: "Polyvinylpyrrolidone K-30", isAllergen: false },
      { name: "Talc (Anti-Caking Agent)", isAllergen: false },
      { name: "Silica (Anti-Caking Agent)", isAllergen: false },
      { name: "Sodium Benzoate (Preservative)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Vitamin C-rich foods such as guava, citrus fruit, and bell peppers",
      "A supplement and dose recommended by a physician or dietitian",
    ],
  },

  {
    slug: "athlene-active-creatine-monohydrate-300g",
    barcode: "0745125547008",
    name: "Athlene Active Creatine Monohydrate 300g",
    brand: "Athlene",
    category: "Food Supplement",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered — No Approved Therapeutic Claims",
    registrationNumber: "FR-4000009873654",
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
      {
        name: "Creatine Monohydrate (Micronized)",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "Creatine-rich foods such as meat or fish",
      "Professional nutrition guidance before another supplement",
    ],
  },

  // Caution reflects the stimulant, dosage, and label precautions; the
  // Philippine FDA registration remains approved and active through April 2, 2031.
  {
    slug: "athlene-active-pre-workout-lemon-lime-390g",
    barcode: "0745125547138",
    name: "Athlene Active Pre-Workout Lemon Lime 390g",
    brand: "Athlene",
    category: "Food Supplement",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered — No Approved Therapeutic Claims",
    registrationNumber: "FR-4000010114915",
    servingSize: "1 scoop (6.5g); suggested use: 2 scoops (13g)",
    warningMessage:
      "Philippine FDA registration FR-4000010114915 is approved, active, and valid through April 2, 2031, but this food supplement has no approved therapeutic claims. For healthy adults only. Do not use if under 18, pregnant, trying to become pregnant, breastfeeding, or sensitive to caffeine or beta-alanine. Consult a physician before use if taking medication or managing a medical condition. Limit other caffeine sources, do not take within four hours of alcohol, and do not exceed four scoops in 24 hours.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "23",
      protein: "0g",
      carbohydrates: "6g",
      totalFat: "0g",
      sodium: "0mg",
    },

    ingredients: [
      {
        name: "Citrulline Malate (4,000mg per 2 scoops)",
        isAllergen: false,
      },
      {
        name: "Beta-Alanine (2,000mg per 2 scoops)",
        isAllergen: false,
      },
      {
        name: "Betaine Anhydrous (2,000mg per 2 scoops)",
        isAllergen: false,
      },
      {
        name: "Taurine (1,000mg per 2 scoops)",
        isAllergen: false,
      },
      {
        name: "Agmatine Sulfate (1,000mg per 2 scoops)",
        isAllergen: false,
      },
      {
        name: "N-Acetyl-L-Tyrosine (1,000mg per 2 scoops)",
        isAllergen: false,
      },
      {
        name: "Caffeine Anhydrous (200mg per 2 scoops)",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "A caffeine-free pre-workout routine based on food, water, and adequate rest",
      "A stimulant product or dosage recommended by a physician or sports dietitian",
    ],
  },

  // Caution reflects the supplement's adult-use precautions and milk/soy
  // allergens; its Philippine FDA registration remains approved and active.
  {
    slug: "athlene-active-whey-protein-chocolate-454g",
    barcode: "0745125547022",
    name: "Athlene Active Whey Protein Chocolate 454g",
    brand: "Athlene",
    category: "Food Supplement",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered — No Approved Therapeutic Claims",
    registrationNumber: "FR-4000014471625",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "1 scoop (32.4g)",
    warningMessage:
      "Philippine FDA registration FR-4000014471625 is approved, active, and valid through June 2, 2031, but this food supplement has no approved therapeutic claims. For healthy adults only. Not intended for children or for pregnant or breastfeeding women. Consult a physician before use if managing a medical condition. Contains milk and soy lecithin.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "124",
      protein: "24g",
      carbohydrates: "3g",
      totalFat: "2g",
      saturatedFat: "1g",
      totalSugars: "1g",
      sodium: "104mg",
    },

    ingredients: [
      {
        name: "Whey Protein Concentrate",
        isAllergen: true,
      },
      {
        name: "Cocoa",
        isAllergen: false,
      },
      {
        name: "Lecithin",
        isAllergen: true,
      },
      {
        name: "Iodized Salt",
        isAllergen: false,
      },
      {
        name: "Sucralose",
        isAllergen: false,
      },
    ],

    allergens: ["Milk", "Soy"],

    alternatives: [
      "Protein-rich whole foods selected for your dietary needs and allergens",
      "Another FDA-registered protein supplement recommended by a physician or dietitian",
    ],
  },

  // Caution reflects the supplement's adult-use precautions and milk/soy
  // allergens; its Philippine FDA registration remains approved and active.
  {
    slug: "athlene-active-whey-protein-vanilla-454g",
    barcode: "0745125547060",
    name: "Athlene Active Whey Protein Vanilla 454g",
    brand: "Athlene",
    category: "Food Supplement",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered — No Approved Therapeutic Claims",
    registrationNumber: "FR-4000014732971",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "1 scoop (31.5g)",
    warningMessage:
      "Philippine FDA registration FR-4000014732971 is approved, active, and valid through June 30, 2031, but this food supplement has no approved therapeutic claims. For healthy adults only. Not intended for children or for pregnant or breastfeeding women. Consult a physician before use if managing a medical condition. Contains milk and soy.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "120",
      protein: "24g",
      carbohydrates: "2g",
      totalFat: "2g",
      saturatedFat: "1g",
      totalSugars: "1g",
      sodium: "101mg",
    },

    ingredients: [
      {
        name: "Whey Protein Concentrate",
        isAllergen: true,
      },
      {
        name: "Lecithin",
        isAllergen: true,
      },
      {
        name: "Salt",
        isAllergen: false,
      },
      {
        name: "Sucralose",
        isAllergen: false,
      },
      {
        name: "Vanillin",
        isAllergen: false,
      },
    ],

    allergens: ["Milk", "Soy"],

    alternatives: [
      "Protein-rich whole foods selected for your dietary needs and allergens",
      "Another FDA-registered protein supplement recommended by a physician or dietitian",
    ],
  },

  // Caution reflects the supplement's label precautions and fish allergen;
  // the linked Philippine FDA registration remains approved and active.
  {
    slug: "atc-fish-oil-1000mg-30-softgels",
    barcode: "4806518900247",
    name: "ATC Fish Oil 1000mg 30 Softgel Capsules",
    brand: "ATC Healthcare",
    category: "Food Supplement",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered — No Approved Therapeutic Claims",
    registrationNumber: "FR-4000009275304",
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
      {
        name: "Fish Oil (1000mg)",
        isAllergen: true,
      },
      {
        name: "EPA / Eicosapentaenoic Acid (360mg)",
        isAllergen: false,
      },
      {
        name: "DHA / Docosahexaenoic Acid (240mg)",
        isAllergen: false,
      },
      {
        name: "Natural Vitamin E (1mg)",
        isAllergen: false,
      },
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

  // Caution reflects the supplement's label precautions; the Philippine FDA
  // registration remains approved and active through June 4, 2028.
  {
    slug: "pure-form-pre-probiotic-gut-health-90-capsules",
    barcode: "4809016479130",
    name: "Pure Form Pre+Probiotic for Gut Health 90 Capsules",
    brand: "Pure Form",
    category: "Food Supplement",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered — No Approved Therapeutic Claims",
    registrationNumber: "FR-4000014693821",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "1 capsule",
    warningMessage:
      "Philippine FDA registration FR-4000014693821 is approved, active, and valid through June 4, 2028, but this food supplement has no approved therapeutic claims. Take one capsule on an empty stomach one hour before a meal, or as recommended by a physician. Consult a physician before use if pregnant, breastfeeding, taking medication, or managing a medical condition.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "0",
      protein: "0g",
      carbohydrates: "0g",
      totalFat: "0g",
      saturatedFat: "0g",
      dietaryFiber: "0g",
      sodium: "0mg",
    },

    ingredients: [
      {
        name: "Gut Health Probiotic Blend (325mg)",
        isAllergen: false,
      },
      {
        name: "Lactobacillus Acidophilus JYLA-191",
        isAllergen: false,
      },
      {
        name: "Lactobacillus Rhamnosus JYLR-127",
        isAllergen: false,
      },
      {
        name: "Lactobacillus Reuteri JYLB-291",
        isAllergen: false,
      },
      {
        name: "Lactobacillus Plantarum JYLP-002",
        isAllergen: false,
      },
      {
        name: "Bifidobacterium Lactis BLG-19",
        isAllergen: false,
      },
      {
        name: "Prebiotic Fiber (Inulin) (175mg)",
        isAllergen: false,
      },
      {
        name: "Prebiotic Fructooligosaccharides (200mg)",
        isAllergen: false,
      },
      {
        name: "100% Vegan HPMC Capsule Shell",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "Probiotic foods such as yogurt or fermented foods, if appropriate",
      "Another FDA-registered probiotic recommended by a physician or pharmacist",
    ],
  },

  {
    slug: "dvdc-acai-berry-beauty-35g",
    barcode: "FDA-2026-0830",
    name: "DVDC Acai Berry Beauty 35g",
    brand: "DVDC",
    category: "Food Supplement",
    status: "FDA_ADVISORY",
    fdaStatusLabel: "Not Approved",
    registrationNumber: "No Certificate of Product Registration issued",
    servingSize: "5g sachet (7 sachets per 35g pack)",
    warningMessage:
      "FDA Advisory No. 2026-0830 warns the public not to purchase or consume this unregistered food supplement. No Certificate of Product Registration has been issued, so the Philippine FDA cannot assure its quality and safety.",
    imageUrl:
      "https://www.fda.gov.ph/wp-content/uploads/2026/07/FDA-Advisory-No.2026-0830.png",
    verificationUrl:
      "https://www.fda.gov.ph/fda-advisory-no-2026-0830-public-health-warning-against-the-purchase-and-consumption-of-the-unregistered-food-supplement-dvdc-acai-berry-beauty-acai-raspberry-cranberry-cherry-strawberry-el/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Acai", isAllergen: false },
      { name: "Raspberry", isAllergen: false },
      { name: "Cranberry", isAllergen: false },
      { name: "Cherry", isAllergen: false },
      { name: "Strawberry", isAllergen: false },
      { name: "Elderberry", isAllergen: false },
      { name: "Blackberry", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Choose only food supplements with a valid Philippine FDA registration",
      "Use whole fruit or a balanced diet instead of an unregistered supplement",
    ],
  },

  {
    slug: "nescafe-tradicao-forte-200g",
    barcode: "7891000304808",
    name: "Nescafé Tradição Forte 200g",
    brand: "Nescafé",
    category: "Instant Coffee",
    status: "FDA_ADVISORY",
    fdaStatusLabel: "FDA Advisory No. 2026-0463",
    registrationNumber: "No Certificate of Product Registration issued",
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
    slug: "kirkland-signature-fish-oil-1000mg-400-softgels",
    barcode: "096619926626",
    name: "Kirkland Signature Fish Oil 1000mg 400 Softgels",
    brand: "Kirkland Signature",
    category: "Food Supplement",
    status: "UNVERIFIED",
    fdaStatusLabel: "Not Verified",
    registrationNumber: "No matching Philippine FDA record",
    servingSize: "1 softgel; suggested use: 1 softgel twice daily",
    warningMessage:
      "No exact Philippine FDA registration or advisory was found for barcode 096619926626. The bottle is labeled as a U.S. Costco product and does not show a Philippine FDA registration or local importer. The USP Verified seal is separate from Philippine FDA product registration. Verify this exact imported product before purchase or use, especially if pregnant, nursing, taking medication, planning a medical procedure, or managing a medical condition.",

    nutrition: {
      calories: "10",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "1g",
      sodium: "N/A",
    },

    ingredients: [
      {
        name: "Fish Oil (1,000mg)",
        isAllergen: true,
      },
      {
        name: "Total Omega-3 Fatty Acids (300mg)",
        isAllergen: false,
      },
      {
        name: "EPA and DHA Omega-3 Fatty Acids (250mg)",
        isAllergen: false,
      },
      {
        name: "Gelatin (Porcine)",
        isAllergen: false,
      },
      {
        name: "Glycerin",
        isAllergen: false,
      },
      {
        name: "Water",
        isAllergen: false,
      },
      {
        name: "Tocopherols",
        isAllergen: false,
      },
    ],

    allergens: ["Fish"],

    alternatives: [
      "A fish-oil supplement with a matching active Philippine FDA registration",
      "Omega-3 food sources recommended for your dietary and medical needs",
    ],
  },

  {
    slug: "cowhead-pure-milk-1l",
    barcode: "8888440000048",
    name: "Cowhead Pure Milk 1L",
    brand: "Cowhead",
    category: "UHT Full Cream Milk",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000012611623",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 250,
      servingUnit: "g",
      caloriesPerServing: 158,
      saturatedFatGramsPerServing: 6.4,
      totalSugarsGramsPerServing: 12,
      sodiumMilligramsPerServing: 100,
    },
    servingSize: "250mL (about 4 servings per 1L carton)",
    warningMessage:
      "Philippine FDA registration FR-4000012611623 lists Cowhead Pure Milk by Sabrosa Foods, Inc. as approved, active, and valid through September 23, 2029. The company matches the Philippine distributor printed on the carton; the FDA portal does not publish retail barcodes. One 250mL serving contains 6.4g saturated fat and 12g naturally occurring milk sugar. Contains milk.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "158",
      protein: "8.3g",
      carbohydrates: "12g",
      totalFat: "8.5g",
      saturatedFat: "6.4g",
      totalSugars: "12g",
      dietaryFiber: "0g",
      sodium: "100mg",
    },

    ingredients: [
      {
        name: "100% Natural Fresh Cow's Milk",
        isAllergen: true,
      },
    ],

    allergens: ["Milk"],

    alternatives: [
      "A lower-saturated-fat milk after comparing nutrition labels",
      "A lactose-free or non-dairy option that matches your dietary needs",
    ],
  },

  {
    slug: "nestle-non-fat-milk-1l",
    barcode: "4800361381581",
    name: "Nestlé Non-Fat Milk 1L",
    brand: "Nestlé",
    category: "UHT Non-Fat Milk",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000014732317",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 250,
      servingUnit: "g",
      caloriesPerServing: 90,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 12.5,
      sodiumMilligramsPerServing: 100,
    },
    servingSize: "250mL (about 4 servings per 1L carton)",
    warningMessage:
      "Philippine FDA registration FR-4000014732317 lists Nestlé Non-Fat Milk by Nestlé Philippines, Inc. as approved, active, and valid through July 3, 2028. The product name, brand, company, 1L retail barcode, and New Zealand UHT packaging match the photographed carton. One 250mL serving contains 90 calories, less than 1g fat, 9g protein, and 350mg calcium. Contains milk.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "90",
      protein: "9g",
      carbohydrates: "12.5g",
      totalFat: "Less than 1g",
      saturatedFat: "0g",
      totalSugars: "12.5g",
      dietaryFiber: "0g",
      sodium: "100mg",
    },

    ingredients: [
      {
        name: "100% Fresh Cow's Milk",
        isAllergen: true,
      },
    ],

    allergens: ["Milk"],

    alternatives: [
      "Another FDA-registered non-fat milk",
      "A lactose-free or non-dairy option that matches your dietary needs",
    ],
  },

  {
    slug: "selecta-fortified-milk-1l",
    barcode: "4800110093888",
    name: "Selecta Fortified Milk 1L",
    brand: "Selecta",
    category: "Sterilized Filled Milk",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000012481347",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 245,
      servingUnit: "g",
      caloriesPerServing: 160,
      saturatedFatGramsPerServing: 6,
      totalSugarsGramsPerServing: 13,
      sodiumMilligramsPerServing: 135,
    },
    servingSize: "245mL (about 4 servings per 1L carton)",
    warningMessage:
      "Philippine FDA registration FR-4000012481347 lists Selecta Fortified Sterilized Filled Milk by RFM Corporation as approved, active, and valid through March 14, 2029. The FDA product and company match the photographed 1L carton and barcode. One 245mL serving contains 6g saturated fat, 13g total sugar, and 135mg sodium. Contains milk and is manufactured in a facility that processes soy products.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "160",
      protein: "7g",
      carbohydrates: "16g",
      totalFat: "8g",
      saturatedFat: "6g",
      totalSugars: "13g",
      dietaryFiber: "0g",
      sodium: "135mg",
    },

    ingredients: [
      {
        name: "Reconstituted Milk Powder (Skimmed Milk and Buttermilk)",
        isAllergen: true,
      },
      {
        name: "Refined Vegetable Oil (Coconut and Corn Oil)",
        isAllergen: false,
      },
      {
        name: "Refined Sugar",
        isAllergen: false,
      },
      {
        name: "Carrageenan (E407, Food Stabilizer)",
        isAllergen: false,
      },
      {
        name: "Mono- and Diglycerides (E471, Emulsifier)",
        isAllergen: false,
      },
      {
        name: "Nature-Identical Flavor",
        isAllergen: false,
      },
      {
        name: "Maltodextrin",
        isAllergen: false,
      },
      {
        name: "Vitamins A, D3, B1, B2, B3, B6, and B12",
        isAllergen: false,
      },
    ],

    allergens: ["Milk", "Soy"],

    alternatives: [
      "A lower-saturated-fat milk after comparing nutrition labels",
      "An unsweetened milk option that matches your allergen preferences",
    ],
  },

  // Package data: Products 2 (7).pdf. FDA portal checked September 8, 2026.
  {
    slug: "selecta-adult-active-vanilla-1l",
    barcode: "4800110098210",
    name: "Selecta Adult Active Vanilla Nutritional Supplement Drink 1L",
    brand: "Selecta",
    category: "Adult Nutritional Supplement Drink",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000011217178",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "245mL (about 4 servings per 1L carton)",
    warningMessage:
      "Philippine FDA registration FR-4000011217178 lists Selecta Adult Active Adult Nutritional Supplement Drink - Vanilla Flavor by RFM Corporation, valid through September 19, 2028. The name, flavor, and manufacturer match the photographed 1L carton; the portal does not list retail barcodes or pack sizes. One 245mL serving contains 150 calories, 8g protein, 4g saturated fat, 5g total sugar, and 240mg sodium. RFM's official product listing identifies it as a milk drink. The submitted photos omit the ingredient and allergen panels, so the full formula and any additional allergens remain unverified. No health score is assigned to this adult nutritional supplement.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "150",
      protein: "8g",
      carbohydrates: "8g",
      totalFat: "9g",
      saturatedFat: "4g",
      totalSugars: "5g",
      dietaryFiber: "0g",
      sodium: "240mg",
    },

    // RFM Foods identifies this exact product as a milk drink:
    // https://shopee.ph/Selecta-Adult-Active-Nutritional-Supplement-Milk-Drink-1L-i.269960745.28715879733
    // Do not copy the different Selecta Fortified Milk ingredient formula.
    ingredients: [],

    allergens: ["Milk"],

    alternatives: [
      "An adult nutritional drink with a complete ingredient and allergen label",
      "A milk or non-dairy drink that matches your nutritional and allergen needs",
    ],
  },

  {
    slug: "gardenia-high-fiber-whole-wheat-bread-600g",
    barcode: "4806502720301",
    name: "Gardenia High Fiber Whole Wheat Bread 600g",
    brand: "Gardenia",
    category: "Whole Wheat Bread",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000011480835",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 64,
      servingUnit: "g",
      caloriesPerServing: 161,
      saturatedFatGramsPerServing: 1,
      totalSugarsGramsPerServing: 4,
      sodiumMilligramsPerServing: 192,
    },
    servingSize: "2 slices (64g)",
    warningMessage:
      "Philippine FDA registration FR-4000011480835 for Gardenia High Fiber Whole Wheat Bread is valid through December 4, 2028. The submitted package is the 600g retail variant. It contains wheat and milk ingredients, so check the label if you have food allergies.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "161 kcal",
      protein: "7g",
      carbohydrates: "31g",
      totalFat: "1g",
      saturatedFat: "1g",
      totalSugars: "4g",
      dietaryFiber: "5g",
      sodium: "192mg",
    },

    ingredients: [
      { name: "High Protein Wheat Flour", isAllergen: true },
      { name: "Water", isAllergen: false },
      { name: "Whole Wheat Flour", isAllergen: true },
      { name: "Wheat Gluten", isAllergen: true },
      { name: "Honey", isAllergen: false },
      { name: "Refined Sugar", isAllergen: false },
      { name: "Whey Powder", isAllergen: true },
      { name: "Inulin Fiber", isAllergen: false },
      { name: "Oat Fiber", isAllergen: false },
      { name: "Baker's Yeast", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Pure Vegetable Shortening (Palm Oil)", isAllergen: false },
      { name: "Skimmed Milk Powder", isAllergen: true },
      { name: "Calcium Propionate", isAllergen: false },
    ],

    allergens: ["Wheat / Gluten", "Milk"],

    alternatives: [
      "A lower-sodium whole-grain bread after comparing nutrition labels",
      "A gluten-free bread if wheat or gluten must be avoided",
    ],
  },

  {
    slug: "cindys-delisoft-jumbo-sandwich-loaf-785g",
    barcode: "2077102376157",
    name: "Cindy's Delisoft Jumbo Sandwich Loaf 785g",
    brand: "Cindy's Bakery",
    category: "Sandwich Bread",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000009914872",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 50,
      servingUnit: "g",
      caloriesPerServing: 150,
      saturatedFatGramsPerServing: 0.5,
      totalSugarsGramsPerServing: 5,
      sodiumMilligramsPerServing: 220,
    },
    servingSize: "2 pieces (50g)",
    warningMessage:
      "Philippine FDA registration FR-4000009914872 for Delisoft Jumbo Sandwich Loaf under Cindy's Bakery is valid through December 18, 2026. The submitted package is the 785g retail variant. The ingredient and allergen panel was not included in the submitted reference, so check the physical package before use if you have allergies.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "150 kcal",
      protein: "4g",
      carbohydrates: "28g",
      totalFat: "2g",
      saturatedFat: "0.5g",
      totalSugars: "5g",
      dietaryFiber: "1g",
      sodium: "220mg",
    },

    ingredients: [],
    allergens: [],

    alternatives: [
      "A lower-sodium sandwich bread after comparing nutrition labels",
      "A bread with a complete allergen label that matches your dietary needs",
    ],
  },

  {
    slug: "lemon-square-choo-choo-cake-bites-choco-vanilla-380g",
    barcode: "4806018403866",
    name: "Lemon Square ChooChoo Cake Bites Choco Vanilla 380g",
    brand: "Lemon Square",
    category: "Filled Cake Bites",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000011136754",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 38,
      servingUnit: "g",
      caloriesPerServing: 180,
      saturatedFatGramsPerServing: 4.5,
      totalSugarsGramsPerServing: 11,
      sodiumMilligramsPerServing: 95,
    },
    servingSize: "1 cake bite (38g)",
    warningMessage:
      "Philippine FDA registration FR-4000011136754 for Choo Choo Cake Bites Choco Vanilla with creamy filling is valid through May 29, 2028. This is an FDA-registered product, but its nutrition score reflects the submitted label's sugar, saturated fat, and energy values. Contains wheat, milk, egg, and soy.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "180 kcal",
      protein: "3g",
      carbohydrates: "22g",
      totalFat: "9g",
      saturatedFat: "4.5g",
      totalSugars: "11g",
      dietaryFiber: "3g",
      sodium: "95mg",
    },

    ingredients: [
      { name: "Wheat Flour", isAllergen: true },
      { name: "Sugar", isAllergen: false },
      { name: "Vegetable Fat (Palm Oil)", isAllergen: false },
      { name: "Eggs", isAllergen: true },
      { name: "Water", isAllergen: false },
      { name: "Cocoa Powder", isAllergen: false },
      { name: "Buttermilk", isAllergen: true },
      { name: "Milk Powder", isAllergen: true },
      { name: "Soy Lecithin", isAllergen: true },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Leavening Agents", isAllergen: false },
      { name: "Vanilla Flavor", isAllergen: false },
    ],

    allergens: ["Wheat / Gluten", "Milk", "Eggs", "Soy"],

    alternatives: [
      "Fresh fruit with no added sugar",
      "A lower-sugar snack checked against your allergen preferences",
    ],
  },

  {
    slug: "lemon-square-lava-cake-matcha-latte-380g",
    barcode: "4806018408298",
    name: "Lemon Square Lava Cake Matcha Latte 380g",
    brand: "Lemon Square",
    category: "Filled Cake Bar",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000015674360",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 38,
      servingUnit: "g",
      caloriesPerServing: 140,
      saturatedFatGramsPerServing: 3,
      totalSugarsGramsPerServing: 11,
      sodiumMilligramsPerServing: 120,
    },
    servingSize: "1 cake bar (38g)",
    warningMessage:
      "Philippine FDA registration FR-4000015674360 for Lava Cake Matcha Latte Flavored Cake is valid through January 14, 2031. This is an FDA-registered product, but its nutrition score reflects the submitted label's sugar, saturated fat, sodium, and energy values. Contains wheat, milk, egg, and soy.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "140 kcal",
      protein: "2g",
      carbohydrates: "21g",
      totalFat: "6g",
      saturatedFat: "3g",
      totalSugars: "11g",
      dietaryFiber: "0g",
      sodium: "120mg",
    },

    ingredients: [
      { name: "Wheat Flour", isAllergen: true },
      { name: "Dextrose", isAllergen: false },
      { name: "Condensed Milk", isAllergen: true },
      { name: "Margarine (Coconut Oil and Palm Oil)", isAllergen: false },
      { name: "Eggs", isAllergen: true },
      { name: "Corn Syrup", isAllergen: false },
      { name: "Vegetable Fat (Palm Oil)", isAllergen: false },
      { name: "Soy Lecithin", isAllergen: true },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Potassium Sorbate", isAllergen: false },
      { name: "Matcha Latte Flavor", isAllergen: false },
    ],

    allergens: ["Wheat / Gluten", "Milk", "Eggs", "Soy"],

    alternatives: [
      "Fresh fruit with no added sugar",
      "A lower-sugar snack checked against your allergen preferences",
    ],
  },

  {
    slug: "ufc-tamis-anghang-banana-catsup-530g",
    barcode: "014285000075",
    name: "UFC Tamis Anghang Banana Catsup 530g",
    brand: "UFC",
    category: "Banana Catsup",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000014912252",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 32,
      servingUnit: "g",
      caloriesPerServing: 18,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 2,
      sodiumMilligramsPerServing: 295,
    },
    servingSize: "2 tablespoons (32g)",
    warningMessage:
      "Philippine FDA registration FR-4000014912252 lists UFC Tamis Anghang Banana Catsup by NutriAsia, Inc. in glass-bottle packaging as valid through November 28, 2028. The submitted 530g bottle provides 295mg sodium per 32g serving. Contains wheat, milk, and soybeans.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "18 kcal",
      protein: "0g",
      carbohydrates: "4g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "2g",
      dietaryFiber: "0g",
      sodium: "295mg",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Banana", isAllergen: false },
      { name: "Modified Starch (Stabilizer)", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Spices", isAllergen: false },
      { name: "Vinegar", isAllergen: false },
      { name: "Sodium Benzoate (Preservative)", isAllergen: false },
      { name: "Artificial Colors", isAllergen: false },
      { name: "Artificial Flavor", isAllergen: false },
    ],

    allergens: ["Wheat / Gluten", "Milk", "Soy"],

    alternatives: [
      "A lower-sodium catsup after comparing nutrition labels",
      "A tomato-based condiment that matches your allergen preferences",
    ],
  },

  {
    slug: "mang-tomas-all-around-sarsa-siga-hot-spicy-325g",
    barcode: "4801668100288",
    name: "Mang Tomas All-Around Sarsa Siga Hot & Spicy 325g",
    brand: "Mang Tomas Siga",
    category: "All-Around Sauce",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000012759350",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 32,
      servingUnit: "g",
      caloriesPerServing: 30,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 4,
      sodiumMilligramsPerServing: 320,
    },
    servingSize: "2 tablespoons (32g)",
    warningMessage:
      "Philippine FDA registration FR-4000012759350 lists Mang Tomas Siga All-Around Sarsa Hot & Spicy by Nutri-Asia, Inc. in glass-bottle packaging as valid through May 9, 2029. The 325g bottle provides 320mg sodium per 32g serving. Contains wheat/gluten and soy. Contains aspartame, a source of phenylalanine.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "30 kcal",
      protein: "0g",
      carbohydrates: "8g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "4g",
      dietaryFiber: "0g",
      sodium: "320mg",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Breadcrumbs (Wheat)", isAllergen: true },
      { name: "Pork Liver Flavor", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Modified Starch", isAllergen: false },
      { name: "Spices", isAllergen: false },
      { name: "Vinegar", isAllergen: false },
      { name: "Palm Oil", isAllergen: false },
      { name: "Hydrolyzed Soy Protein", isAllergen: true },
      { name: "Sodium Benzoate (Preservative)", isAllergen: false },
      { name: "Aspartame", isAllergen: false },
      { name: "Caramel Color", isAllergen: false },
      { name: "BHA and TBHQ (Antioxidants)", isAllergen: false },
    ],

    allergens: ["Wheat / Gluten", "Soy"],

    alternatives: [
      "A lower-sodium sauce after comparing nutrition labels",
      "A wheat- and soy-free condiment if those allergens must be avoided",
    ],
  },

  {
    slug: "surf-active-clean-sun-fresh-detergent-bar-120g",
    barcode: "4800888136770",
    name: "Surf Active Clean Sun Fresh Detergent Bar 120g",
    brand: "Surf",
    category: "Laundry Detergent Bar",
    status: "CAUTION",
    fdaStatusLabel: "FDA HUHS Registration Not Verified",
    registrationNumber: "No matching Philippine FDA HUHS record",
    servingSize: "120g detergent bar",
    warningMessage:
      "The submitted package identifies UPC 4800888136770 as the 120g Surf Active Clean Sun Fresh detergent bar distributed by Unilever Philippines. No exact product registration was found in the current Philippine FDA Household/Urban Hazardous Substances search. For laundry use only. Keep out of reach of children, do not ingest, avoid eye contact and prolonged skin contact, and rinse thoroughly with water if exposed.",
    verificationUrl: "https://verification.fda.gov.ph/",

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
      "A fragrance-free laundry detergent for fragrance-sensitive users",
      "A milder detergent used with protective gloves if skin irritation occurs",
    ],
  },

  {
    slug: "ariel-powder-detergent-downy-floral-passion-555g",
    barcode: "4902430473538",
    name: "Ariel Powder Detergent with Downy Floral Passion 555g",
    brand: "Ariel",
    category: "Powder Laundry Detergent",
    status: "CAUTION",
    fdaStatusLabel: "FDA HUHS Registration Not Verified",
    registrationNumber: "No matching Philippine FDA HUHS record",
    servingSize: "555g package",
    warningMessage:
      "The photographed package and UPC 4902430473538 identify the 555g Ariel Powder Detergent with Downy Floral Passion; the PDF's typed 2kg description does not match the photographed pack. No exact product registration was found in the current Philippine FDA Household/Urban Hazardous Substances search. The label warns that it causes skin irritation and serious eye irritation. Keep out of reach of children, do not ingest, avoid breathing detergent dust, and rinse exposed eyes or skin thoroughly with water.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Linear Alkylbenzene Sulfonate", isAllergen: false },
      {
        name: "Mono-C12-14-Alkyl Esters Sulfonic Acids, Sodium Salts",
        isAllergen: false,
      },
      { name: "Sodium Silicate", isAllergen: false },
      { name: "Sodium Sulfate", isAllergen: false },
      { name: "Sodium Carbonate", isAllergen: false },
      { name: "Carboxymethyl Cellulose", isAllergen: false },
      { name: "Amylase", isAllergen: false },
      { name: "Lipase", isAllergen: false },
      { name: "Protease", isAllergen: false },
      { name: "Fragrance", isAllergen: false },
      {
        name: "Disodium Distyrylbiphenyl Disulfonate",
        isAllergen: false,
      },
    ],

    allergens: [],

    alternatives: [
      "A fragrance-free laundry detergent for fragrance-sensitive users",
      "A liquid detergent that produces less airborne powder during handling",
    ],
  },

  {
    slug: "domex-classic-multi-purpose-cleaner-250ml",
    barcode: "4800888112958",
    name: "Domex Classic Multi-Purpose Cleaner 250mL",
    brand: "Domex",
    category: "Multi-Purpose Cleaner",
    status: "CAUTION",
    fdaStatusLabel: "FDA HUHS Registration Not Verified",
    registrationNumber: "No matching Philippine FDA HUHS record",
    servingSize: "250mL bottle",
    warningMessage:
      "The submitted 250mL bottle identifies UPC 4800888112958 and Unilever Philippines. No exact product registration was found in the current Philippine FDA Household/Urban Hazardous Substances search. DANGER: corrosive cleaner that may cause severe skin burns and eye damage. Never mix it with muriatic or hydrochloric acid, ammonia, bleach, toilet cleaner, or any other household cleaner. Use only as directed with ventilation, keep tightly closed and out of reach of children, and do not transfer it to another container.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sodium Hypochlorite", isAllergen: false },
      { name: "Sodium Laureth Sulfate", isAllergen: false },
      { name: "Sodium Hydroxide", isAllergen: false },
      { name: "Cocamine Oxide", isAllergen: false },
      { name: "Fragrance", isAllergen: false },
      { name: "Sodium Silicate", isAllergen: false },
      { name: "Sodium Polyacrylate", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "A non-chlorine cleaner suitable for the intended surface",
      "Soap and water for routine cleaning when disinfection is not required",
    ],
  },

  {
    slug: "zonrox-lemon-bleach-500ml",
    barcode: "4800047840272",
    name: "Zonrox Lemon Bleach 500mL",
    brand: "Zonrox",
    category: "Chlorine Bleach",
    status: "CAUTION",
    fdaStatusLabel: "FDA HUHS Registration Not Verified",
    registrationNumber: "No matching Philippine FDA HUHS record",
    servingSize: "500mL bottle",
    warningMessage:
      "The submitted bottle and manufacturer information identify UPC 4800047840272 as Zonrox Lemon Bleach 500mL by Green Cross, Inc. No exact product registration was found in the current Philippine FDA Household/Urban Hazardous Substances search. DANGER: chlorine bleach. Never mix with acids, ammonia, toilet cleaners, Domex, or other household chemicals because toxic gas may form. Use only as directed in a ventilated area, avoid skin and eye contact, do not ingest, and keep out of reach of children.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Sodium Hypochlorite", isAllergen: false },
      { name: "Lemon Fragrance", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "An oxygen-based color-safe bleach for compatible colored fabrics",
      "Soap and water for routine cleaning when chlorine disinfection is not required",
    ],
  },

  {
    slug: "nestle-creamy-yogurt-110g",
    barcode: "4800361067621",
    name: "Nestlé Creamy Yogurt 110g",
    brand: "Nestlé",
    category: "Plain Yogurt",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000010260517",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "110g cup (1 serving)",
    warningMessage:
      "Philippine FDA product registration FR-4000010260517 lists NESTLE CREAMY YOGURT under FRONERI PHILIPPINES, INC, valid through 27 November 2030. This is a product-name match; the portal does not specify individual package sizes. One 110g cup contains 63 calories, 1.5g saturated fat, 4g sugar, and 62mg sodium. Contains milk and must be kept refrigerated.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "63 kcal",
      protein: "3g",
      carbohydrates: "7g",
      totalFat: "2.6g",
      saturatedFat: "1.5g",
      totalSugars: "4g",
      dietaryFiber: "0g",
      sodium: "62mg",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Skimmed Milk Powder", isAllergen: true },
      { name: "Milk Fat", isAllergen: true },
      { name: "Stabilizer", isAllergen: false },
      {
        name: "Lactobacillus bulgaricus and Streptococcus thermophilus (Live Yogurt Cultures)",
        isAllergen: false,
      },
    ],

    allergens: ["Milk"],

    alternatives: [
      "A plain yogurt with a matching active Philippine FDA registration",
      "A lower-saturated-fat or dairy-free yogurt that matches your dietary needs",
    ],
  },

  {
    slug: "magnolia-cheezee-milky-white-160g",
    barcode: "4805358425880",
    name: "Magnolia Cheezee Milky White 160g",
    brand: "Magnolia",
    category: "Processed Cheese",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000007845990",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 30,
      servingUnit: "g",
      caloriesPerServing: 100,
      saturatedFatGramsPerServing: 4.5,
      totalSugarsGramsPerServing: 1,
      sodiumMilligramsPerServing: 330,
    },
    servingSize: "30g (about 5 servings per 160g pack)",
    warningMessage:
      "Philippine FDA registration FR-4000007845990 lists Cheezee Milky White Pasteurized Processed Cheese Product by Magnolia, Inc. as active through September 7, 2033. One 30g serving contains 4.5g saturated fat and 330mg sodium, so compare portions if limiting either nutrient. Contains milk. The submitted photos do not show the ingredient statement, so check the physical pack before use if you have additional food allergies.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "100 kcal",
      protein: "4g",
      carbohydrates: "3g",
      totalFat: "8g",
      saturatedFat: "4.5g",
      totalSugars: "1g",
      dietaryFiber: "0g",
      sodium: "330mg",
    },

    ingredients: [],

    allergens: ["Milk"],

    alternatives: [
      "A lower-sodium cheese after comparing nutrition labels",
      "A reduced-saturated-fat cheese that matches your allergen preferences",
    ],
  },

  {
    slug: "anchor-rich-creamy-buttery-unsalted-200g",
    barcode: "4806501599878",
    name: "Anchor Rich & Creamy Buttery Unsalted 200g",
    brand: "Anchor",
    category: "Dairy and Vegetable Oil Spread",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000011722267",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "1 tablespoon (15g; about 13 servings per pack)",
    warningMessage:
      "Philippine FDA product registration FR-4000011722267 lists ANCHOR BUTTERY (VEGETABLE OIL & DAIRY FAT BLEND SPREAD) - UNSALTED under FONTERRA BRANDS PHILS., INC., valid through 10 October 2028. This is a product-name match; the portal does not specify individual package sizes. One 15g serving contains 10g saturated fat. Contains milk and must be kept refrigerated.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "113 kcal",
      protein: "0g",
      carbohydrates: "0g",
      totalFat: "12g",
      saturatedFat: "10g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "2mg",
    },

    ingredients: [
      { name: "Blend of Vegetable Oils", isAllergen: false },
      { name: "Dairy Fat", isAllergen: true },
      {
        name: "Emulsifiers (Distilled Monoglycerides and Polyglycerol Esters)",
        isAllergen: false,
      },
      { name: "Preservative", isAllergen: false },
      { name: "Citric Acid (Acidity Regulator)", isAllergen: false },
    ],

    allergens: ["Milk"],

    alternatives: [
      "A spread with a matching active Philippine FDA registration",
      "A lower-saturated-fat spread that matches your allergen preferences",
    ],
  },

  {
    slug: "alaska-crema-whipped-cream-250g",
    barcode: "4800575142541",
    name: "Alaska Créma Whipped Cream 250g",
    brand: "Alaska Créma",
    category: "Whipped Cream",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000008665131",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 10,
      servingUnit: "g",
      caloriesPerServing: 29,
      saturatedFatGramsPerServing: 2,
      totalSugarsGramsPerServing: 1,
      sodiumMilligramsPerServing: 4,
    },
    servingSize: "10g (about 25 portions per can)",
    warningMessage:
      "Philippine FDA registration FR-4000008665131 lists Alaska Créma UHT Processed Whipped Cream by Alaska Milk Corporation as active through November 27, 2028. One 10g serving contains 2g saturated fat. Contains milk. Keep refrigerated at 2–7°C and do not freeze. The can is pressurized: keep it away from heat and never pierce or burn it.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "29 kcal",
      protein: "0.2g",
      carbohydrates: "1g",
      totalFat: "3g",
      saturatedFat: "2g",
      totalSugars: "1g",
      dietaryFiber: "0g",
      sodium: "4mg",
    },

    ingredients: [
      { name: "Cream", isAllergen: true },
      { name: "Sugar", isAllergen: false },
      {
        name: "Propellants (Nitrous Oxide and Nitrogen)",
        isAllergen: false,
      },
      {
        name: "Mono- and Diglycerides of Fatty Acids (Emulsifier)",
        isAllergen: false,
      },
      { name: "Carrageenan (Stabilizer)", isAllergen: false },
      { name: "Natural Flavor", isAllergen: false },
    ],

    allergens: ["Milk"],

    alternatives: [
      "A smaller portion of whipped cream when limiting saturated fat",
      "A lower-saturated-fat topping that matches your allergen preferences",
    ],
  },

  {
    slug: "jack-n-jill-vcut-spicy-barbecue-25g",
    barcode: "4800016622533",
    name: "Jack 'n Jill V-Cut Spicy Barbecue Potato Chips 25g",
    brand: "Jack 'n Jill V-Cut",
    category: "Potato Chips",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "Multiple matching active Philippine FDA records",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 30,
      servingUnit: "g",
      caloriesPerServing: 180,
      saturatedFatGramsPerServing: 6,
      totalSugarsGramsPerServing: 1,
      sodiumMilligramsPerServing: 85,
    },
    servingSize:
      "1 cup (30g), about 1 serving per package; the package net weight is 25g",
    warningMessage:
      "The Philippine FDA portal lists multiple active food registrations matching Jack 'n Jill V-Cut Potato Chips Spicy Barbecue Flavor by Universal Robina Corporation, but it does not publish enough package detail to assign one CPR confidently to barcode 4800016622533. The label's 30g serving contains 6g saturated fat. Contains soy, wheat/gluten, and mustard, and may contain milk; check the current packet if you have allergies.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "180 kcal",
      protein: "2g",
      carbohydrates: "14g",
      totalFat: "12g",
      saturatedFat: "6g",
      totalSugars: "Less than 1g",
      dietaryFiber: "2g",
      sodium: "85mg",
    },

    ingredients: [
      { name: "Potatoes", isAllergen: false },
      { name: "Vegetable Oil (Palm Oil)", isAllergen: false },
      {
        name: "Spicy Barbecue Seasoning (includes Yeast, Monosodium Glutamate, Salt, Sugar, Paprika, Maltodextrin, Hydrolyzed Corn and Soy Proteins, Wheat Rusk Powder, Flavors, Spices, Mustard Seeds, Anticaking Agents, Caramel Color, Disodium Inosinate, and Disodium Guanylate)",
        isAllergen: true,
      },
      { name: "Dextrose", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Cayenne Pepper", isAllergen: false },
      { name: "Antioxidant", isAllergen: false },
    ],

    allergens: ["Soy", "Wheat / Gluten", "Mustard", "Milk"],

    alternatives: [
      "Plain potato chips with less saturated fat and a shorter ingredient list",
      "A baked snack that matches your allergen preferences",
    ],
  },

  {
    slug: "jack-n-jill-piattos-cheese-40g",
    barcode: "4800016644801",
    name: "Jack 'n Jill Piattos Cheese Potato Crisps 40g",
    brand: "Jack 'n Jill Piattos",
    category: "Potato Crisps",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "Multiple matching active Philippine FDA records",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 30,
      servingUnit: "g",
      caloriesPerServing: 150,
      saturatedFatGramsPerServing: 3.5,
      totalSugarsGramsPerServing: 2,
      sodiumMilligramsPerServing: 170,
    },
    servingSize:
      "1 cup (30g), 1 serving per container; the package net weight is 40g",
    warningMessage:
      "The Philippine FDA portal lists multiple active food registrations matching Jack 'n Jill Piattos Cheese Flavored Potato Crisps by Universal Robina Corporation, but it does not publish enough package detail to assign one CPR confidently to barcode 4800016644801. The label's 30g serving contains 170mg sodium and 3.5g saturated fat. Contains milk and soy; the package may also contain wheat, shrimp, egg, and fish, so verify the current packet if you have allergies.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "150 kcal",
      protein: "2g",
      carbohydrates: "19g",
      totalFat: "7g",
      saturatedFat: "3.5g",
      totalSugars: "2g",
      dietaryFiber: "1g",
      sodium: "170mg",
    },

    ingredients: [
      { name: "Dehydrated Potatoes", isAllergen: false },
      { name: "Potato Starch", isAllergen: false },
      {
        name: "Vegetable Oil (Palm Olein and Palm Oil with TBHQ)",
        isAllergen: false,
      },
      {
        name: "Cheese Powder (includes Maltodextrin, Whey, Vegetable Oil, Cheddar Cheese, Salt, Cheese Flavor, Disodium Phosphate, Annatto and Turmeric Colors, and Silicon Dioxide)",
        isAllergen: true,
      },
      { name: "Sugar", isAllergen: false },
      { name: "Monosodium Glutamate", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Potassium Chloride", isAllergen: false },
      { name: "Natural and Artificial Flavors", isAllergen: false },
      { name: "Lactose", isAllergen: true },
      {
        name: "Disodium Inosinate and Disodium Guanylate",
        isAllergen: false,
      },
      { name: "Onion and Garlic Powders", isAllergen: false },
      { name: "Mono- and Diglycerides", isAllergen: false },
      { name: "Citric Acid", isAllergen: false },
    ],

    allergens: [
      "Milk",
      "Soy",
      "Wheat / Gluten",
      "Crustaceans",
      "Eggs",
      "Fish",
    ],

    alternatives: [
      "Plain potato crisps with less sodium and saturated fat",
      "A baked snack that matches your allergen preferences",
    ],
  },

  {
    slug: "lays-stax-sour-cream-onion-100g",
    barcode: "8850718804573",
    name: "Lay's Stax Sour Cream & Onion Potato Chips 100g",
    brand: "Lay's Stax",
    category: "Potato Chips",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000015763792",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "30g (about 3 servings per 100g package)",
    warningMessage:
      "Philippine FDA product registration FR-4000015763792 lists LAY'S STAX POTATO CHIPS SOUR CREAM & ONION FLAVORED, valid through 12 February 2029. This is a product-name match; the portal does not specify individual package sizes. One 30g serving contains 3.5g saturated fat and 137mg sodium. Contains wheat/gluten, milk, and soy.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "156 kcal",
      protein: "2.2g",
      carbohydrates: "18.5g",
      totalFat: "8g",
      saturatedFat: "3.5g",
      totalSugars: "0.9g",
      dietaryFiber: "1.1g",
      sodium: "137mg",
    },

    ingredients: [
      { name: "Potatoes (approximately 53%)", isAllergen: false },
      { name: "Vegetable Oil", isAllergen: false },
      { name: "Wheat Starch", isAllergen: true },
      {
        name: "Sour Cream and Onion Seasoning (includes Full-Fat Dried Milk, Iodized Salt, Onion Powder, Whey Powder, Modified Starch, Mono- and Diglycerides, Lecithin, Monosodium Glutamate, Disodium 5'-Ribonucleotide, Citric Acid, Paprika Color, and Flavors)",
        isAllergen: true,
      },
      { name: "Nitrogen (Packaging Gas)", isAllergen: false },
    ],

    allergens: ["Wheat / Gluten", "Milk", "Soy"],

    alternatives: [
      "A locally FDA-registered potato snack with an identifiable CPR",
      "A lower-sodium snack that matches your allergen preferences",
    ],
  },

  {
    slug: "doritos-nacho-cheese-65g",
    barcode: "6924743926547",
    name: "Doritos Nacho Cheese Tortilla Chips 65g",
    brand: "Doritos",
    category: "Tortilla Chips",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000015981518",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "30g (about 2 servings per 65g package)",
    warningMessage:
      "Philippine FDA product registration FR-4000015981518 lists DORITOS NACHO CHEESE FLAVORED TORTILLA CHIPS under BENBY ENTERPRISES, INCORPORATED, valid through 30 May 2029. This is a product-name match; the portal does not specify individual package sizes. One 30g serving contains 192mg sodium and 3.2g saturated fat. Contains milk.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "149 kcal",
      protein: "2.2g",
      carbohydrates: "18.1g",
      totalFat: "7.3g",
      saturatedFat: "3.2g",
      totalSugars: "0.5g",
      dietaryFiber: "1.3g",
      sodium: "192mg",
    },

    ingredients: [
      { name: "Corn (68%)", isAllergen: false },
      { name: "Palm Olein", isAllergen: false },
      {
        name: "Nacho Cheese Seasoning (includes Maltodextrin, Cheese Powder, Iodized Salt, Monosodium Glutamate, Disodium 5'-Ribonucleotide, Whey Protein, and Onion Powder)",
        isAllergen: true,
      },
      { name: "Acidity Regulator", isAllergen: false },
      { name: "Black Pepper", isAllergen: false },
    ],

    allergens: ["Milk"],

    alternatives: [
      "A locally FDA-registered corn chip with an identifiable CPR",
      "A lower-sodium corn snack without milk ingredients",
    ],
  },

  {
    slug: "great-taste-white-sugar-free-23g",
    barcode: "4800016024948",
    name: "Great Taste White Sugar Free Coffee Mix 23g",
    brand: "Great Taste White",
    category: "Coffee Mix",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "Multiple matching active Philippine FDA records",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 23,
      servingUnit: "g",
      caloriesPerServing: 70,
      saturatedFatGramsPerServing: 4.5,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 50,
    },
    servingSize:
      "23g sachet prepared with 200mL hot water; the label also prints 11.5g/100mL and 2 servings per pack",
    warningMessage:
      "The Philippine FDA portal lists multiple active registrations matching Great Taste White Coffee Mix by Universal Robina Corporation, including twin-pack records, but it does not publish enough package detail to assign one CPR confidently to barcode 4800016024948. The package's 200mL nutrition column lists 4.5g saturated fat. Contains milk; may contain wheat/gluten, soy, and sulphites. Although labeled sugar free, it contains acesulfame-K and sucralose.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "70 kcal",
      protein: "Less than 1g",
      carbohydrates: "4g",
      totalFat: "6g",
      saturatedFat: "4.5g",
      totalSugars: "0g",
      dietaryFiber: "Less than 1g",
      sodium: "50mg",
    },

    ingredients: [
      {
        name: "Creamer (Hydrogenated Palm Fat, Glucose Syrup, Milk Protein, Dipotassium Phosphate, Sodium Polyphosphate, Mono- and Diglycerides of Fatty Acids, Diacetyl Tartaric Acid Esters of Mono- and Diglycerides, Silicon Dioxide, Artificial Flavors, and Beta Carotene)",
        isAllergen: true,
      },
      { name: "Coffee", isAllergen: false },
      {
        name: "Thickeners (Cellulose Gum and Modified Starch)",
        isAllergen: false,
      },
      { name: "Artificial Flavors", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      {
        name: "Sweeteners (Acesulfame-K and Sucralose)",
        isAllergen: false,
      },
    ],

    allergens: ["Milk", "Wheat / Gluten", "Soy", "Sulphites"],

    alternatives: [
      "Black coffee without creamer when limiting saturated fat",
      "A coffee mix that matches your milk, gluten, soy, and sulphite preferences",
    ],
  },

  {
    slug: "kopiko-brown-coffee-20g",
    barcode: "8996001410547",
    name: "Kopiko Brown Coffee Mix 20g",
    brand: "Kopiko Brown",
    category: "Coffee Mix",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "Multiple matching active Philippine FDA records",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 20,
      servingUnit: "g",
      caloriesPerServing: 100,
      saturatedFatGramsPerServing: 3.5,
      totalSugarsGramsPerServing: 8,
      sodiumMilligramsPerServing: 160,
    },
    servingSize: "1 sachet (20g), prepared with 150mL hot water",
    warningMessage:
      "The Philippine FDA portal lists multiple active registrations matching Kopiko Brown Just Right Blend Coffee Mix, including records for the photographed Philippine importer Ecossential Foods Corp., but it does not publish enough package detail to assign one CPR confidently to barcode 8996001410547. One 20g sachet contains 8g sugar, 3.5g saturated fat, and 160mg sodium. Contains milk and malt/gluten.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "100 kcal",
      protein: "1g",
      carbohydrates: "14g",
      totalFat: "4g",
      saturatedFat: "3.5g",
      totalSugars: "8g",
      dietaryFiber: "0g",
      sodium: "160mg",
    },

    ingredients: [
      {
        name: "Non-Dairy Creamer (Glucose Syrup, Fully Hydrogenated Palm Kernel Oil, Sodium Caseinate, Dipotassium Phosphate, Sodium Polyphosphate, Mono- and Diglycerides of Fatty Acids, Salt, and Silicon Dioxide)",
        isAllergen: true,
      },
      { name: "Sugar", isAllergen: false },
      { name: "Instant Coffee", isAllergen: false },
      {
        name: "Foaming Creamer (Glucose Syrup Solids, Fully Hydrogenated Palm Kernel Oil, Milk Solids, Dipotassium Phosphate, Sodium Stearoyl-2-Lactylate, and Silicon Dioxide)",
        isAllergen: true,
      },
      { name: "Malt Extract Powder", isAllergen: true },
      { name: "Skim Milk Powder", isAllergen: true },
      { name: "Cellulose Gum", isAllergen: false },
      { name: "Brown Sugar", isAllergen: false },
      { name: "Cocoa Powder", isAllergen: false },
      { name: "Salt", isAllergen: false },
      { name: "Artificial Flavor", isAllergen: false },
      { name: "Caramel Color 150d", isAllergen: false },
      {
        name: "Sweeteners (Acesulfame-K and Sucralose)",
        isAllergen: false,
      },
    ],

    allergens: ["Milk", "Malt / Gluten"],

    alternatives: [
      "Black coffee or coffee with less sugar and saturated fat",
      "A coffee mix without milk or gluten ingredients",
    ],
  },

  {
    slug: "goya-everyday-milk-chocolate-26g",
    barcode: "4806517043457",
    name: "Goya Everyday Milk Chocolate Drink 26g",
    brand: "Goya Everyday",
    category: "Chocolate Drink Mix",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000009074767",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 26,
      servingUnit: "g",
      caloriesPerServing: 101,
      saturatedFatGramsPerServing: 1,
      totalSugarsGramsPerServing: 15,
      sodiumMilligramsPerServing: 70,
    },
    servingSize: "1 sachet (26g), prepares about 165mL chocolate drink",
    warningMessage:
      "Philippine FDA registration FR-4000009074767 lists Goya Everyday Instant Powdered Milk Chocolate Drink by Delfi Foods, Inc. as active through November 25, 2027. One 26g sachet contains 15g sugar. Contains milk and may contain traces of peanuts, tree nuts, soy, and wheat/gluten.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "101 kcal",
      protein: "3g",
      carbohydrates: "20g",
      totalFat: "1g",
      saturatedFat: "1g",
      totalSugars: "15g",
      dietaryFiber: "3g",
      sodium: "70mg",
    },

    ingredients: [
      { name: "Sugar", isAllergen: false },
      { name: "Buttermilk Powder", isAllergen: true },
      { name: "Cocoa Powder", isAllergen: false },
      { name: "Carrageenan (Stabilizer)", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Nature-Identical Flavor", isAllergen: false },
    ],

    allergens: [
      "Milk",
      "Peanuts",
      "Tree Nuts",
      "Soy",
      "Wheat / Gluten",
    ],

    alternatives: [
      "An unsweetened cocoa drink when limiting added sugar",
      "A milk-free chocolate drink mix that matches your allergen preferences",
    ],
  },

  {
    slug: "boss-max-3-mangosteen-coffee-12g",
    barcode: "4806504653393",
    name: "Boss Max 3 Creamy Coffee with Mangosteen 12g",
    brand: "Boss Max 3",
    category: "Coffee Mix",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000008512440",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 12,
      servingUnit: "g",
      caloriesPerServing: 52,
      saturatedFatGramsPerServing: 1,
      totalSugarsGramsPerServing: 2,
      sodiumMilligramsPerServing: 17,
    },
    servingSize: "1 sachet (12g), prepared with 150mL hot water",
    warningMessage:
      "Philippine FDA registration FR-4000008512440 lists Boss Max3 Creamy Coffee Drink Mix with Mangosteen Powder by Corbridge Group Phils., Inc. as active through November 2, 2028. The package states that it is not recommended for children or for pregnant or lactating women. Its creamer contains milk protein despite being described as non-dairy. Do not use this beverage as a substitute for medical treatment.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "52 kcal",
      protein: "0g",
      carbohydrates: "9g",
      totalFat: "2g",
      saturatedFat: "1g",
      totalSugars: "2g",
      dietaryFiber: "1g",
      sodium: "17mg",
    },

    ingredients: [
      {
        name: "Non-Dairy Creamer (Glucose Syrup Solids, Hydrogenated Vegetable Fat, Dipotassium Phosphate, Sodium Tripolyphosphate, Milk Protein, Mono- and Diglycerides of Fatty Acids, Diacetyl Tartaric and Fatty Acid Esters of Glycerol, Silicon Dioxide, and Beta Carotene)",
        isAllergen: true,
      },
      { name: "Mangosteen (Garcinia mangostana) Powder", isAllergen: false },
      { name: "Steviol Glycosides (Sweetener)", isAllergen: false },
    ],

    allergens: ["Milk"],

    alternatives: [
      "Plain coffee without creamer when limiting saturated fat",
      "A milk-free coffee mix without special-use restrictions",
    ],
  },

  {
    slug: "similac-gain-two-milk-supplement-400g",
    barcode: "4800221242632",
    name: "Similac Gain Two Milk Supplement 400g",
    brand: "Similac Gain",
    category: "Infant Milk Supplement",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "Multiple matching active Philippine FDA records",
    servingSize:
      "3 level scoops (approximately 30.9g), prepared with 180mL cooled previously boiled drinking water",
    warningMessage:
      "Multiple active Philippine FDA records match Similac Gain Two for infants 6–12 months, but the FDA portal does not identify which record belongs to this exact barcode and 400g pack. Breastmilk is best for babies up to 2 years and beyond. Use this milk supplement only on a health professional's advice; introducing it before 6 months or preparing it improperly may be dangerous. It is not suitable for infants with galactosemia. Contains milk and soy. Never microwave prepared formula, discard unfinished formula within 1 hour, and refrigerate unused prepared formula for no more than 24 hours.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "150 kcal",
      protein: "4.54g",
      carbohydrates: "17.3g",
      totalFat: "7.11g",
      sodium: "73mg",
    },

    ingredients: [
      { name: "Nonfat Milk", isAllergen: true },
      { name: "Lactose", isAllergen: true },
      {
        name: "Vegetable Oils (High Oleic Sunflower Oil, Soy Oil, and Coconut Oil)",
        isAllergen: true,
      },
      { name: "Buttermilk Powder", isAllergen: true },
      { name: "Fructo-Oligosaccharides (FOS)", isAllergen: false },
      {
        name: "Minerals (Potassium Citrate, Calcium Carbonate, Sodium Chloride, Magnesium Chloride, Ferrous Sulfate, Zinc Sulfate, Manganese Sulfate, Calcium Chloride, Potassium Hydroxide, Potassium Phosphate, Copper Sulfate, Sodium Selenate, and Potassium Iodide)",
        isAllergen: false,
      },
      {
        name: "Oligosaccharide Blend (2'-Fucosyllactose, Lacto-N-Tetraose, 3-Fucosyllactose, 6'-Sialyllactose, and 3'-Sialyllactose)",
        isAllergen: false,
      },
      {
        name: "Arachidonic Acid from Mortierella Alpina Oil",
        isAllergen: false,
      },
      {
        name: "Vitamin Blend",
        isAllergen: false,
      },
      { name: "Soy Lecithin", isAllergen: true },
      {
        name: "DHA from Schizochytrium sp. Microalgae Oil",
        isAllergen: false,
      },
      { name: "Choline Bitartrate", isAllergen: false },
      { name: "Myo-Inositol", isAllergen: false },
      { name: "Nucleotides", isAllergen: false },
      { name: "Taurine", isAllergen: false },
      { name: "Choline Chloride", isAllergen: false },
      { name: "Ascorbyl Palmitate", isAllergen: false },
      { name: "Mixed Tocopherols", isAllergen: false },
      { name: "Carotenoids (Lutein and Beta-Carotene)", isAllergen: false },
    ],

    allergens: ["Milk", "Soy"],

    alternatives: [
      "A health-professional-recommended milk supplement appropriate for the child's exact age and medical needs",
    ],
  },

  {
    slug: "nestle-cerelac-mixed-vegetables-soya-120g",
    barcode: "9556001132222",
    name: "Nestlé Cerelac Mixed Vegetables & Soya 120g",
    brand: "Nestlé Cerelac",
    category: "Infant Cereal",
    status: "UNVERIFIED",
    fdaStatusLabel: "Exact Variant Not Verified",
    registrationNumber: "No matching Philippine FDA food registration found",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "50g (approximately 2 servings per 120g pack)",
    warningMessage:
      "No exact current match for Nestlé Cerelac Mixed Vegetables & Soya was found in the Philippine FDA verification portal; this does not by itself establish that the product is unsafe. Verify the current package and registration before use. This complementary food is intended for children from 6 months up to 2 years and is not a breastmilk substitute. Continue breastfeeding, follow age-appropriate preparation guidance, and check the package's complete ingredient and allergen statement because the available images do not show the full ingredient panel.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "205 kcal",
      protein: "7.5g",
      carbohydrates: "32.8g",
      totalFat: "4.8g",
      saturatedFat: "1g",
      totalSugars: "7.5g",
      dietaryFiber: "1.88g",
      sodium: "5mg",
    },

    ingredients: [
      { name: "Rice / Cereal Flour", isAllergen: false },
      { name: "Soya Flour or Protein", isAllergen: true },
      { name: "Spinach, Carrots, and Squash", isAllergen: false },
      { name: "Skimmed Milk Powder", isAllergen: true },
      { name: "Sugar", isAllergen: false },
      { name: "Vegetable Oils", isAllergen: false },
      { name: "Vitamin and Mineral Premix", isAllergen: false },
      { name: "Fish Oil (DHA)", isAllergen: true },
      { name: "Soya Lecithin", isAllergen: true },
      { name: "Bifidobacterium Lactis Culture", isAllergen: false },
      { name: "Nature-Identical Vanilla Flavor", isAllergen: false },
    ],

    allergens: ["Soy", "Milk", "Fish", "Wheat / Gluten"],

    alternatives: [
      "Another age-appropriate complementary food recommended by the child's healthcare professional",
    ],
  },

  {
    slug: "nestle-cerelac-nutripuffs-banana-strawberry-50g",
    barcode: "9556001233967",
    name: "Nestlé Cerelac NutriPuffs Banana & Strawberry 50g",
    brand: "Nestlé Cerelac NutriPuffs",
    category: "Infant Snack",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000013790215",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "7g (approximately 1/2 cup; 7 servings per 50g pack)",
    warningMessage:
      "Philippine FDA registration FR-4000013790215 for Nestlé Cerelac NutriPuffs Banana & Strawberry is active through January 7, 2030. This complementary snack is intended for children from 9 months and is not a breastmilk substitute. Only feed it to a seated, supervised child who is developmentally ready for finger foods. Contains wheat/gluten and soy, may contain milk, and should not be used for a child with cow's-milk-protein allergy unless a healthcare professional advises otherwise.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "29.6 kcal",
      protein: "0.8g",
      carbohydrates: "4.7g",
      totalFat: "0.9g",
      saturatedFat: "0.2g",
      totalSugars: "0.6g",
      dietaryFiber: "0.2g",
      sodium: "1.4mg",
    },

    ingredients: [
      { name: "Rice Flour", isAllergen: false },
      { name: "Wheat Flour (Gluten)", isAllergen: true },
      { name: "Soy Flour", isAllergen: true },
      { name: "Palm Olein", isAllergen: false },
      { name: "Sucrose", isAllergen: false },
      { name: "Banana Flakes", isAllergen: false },
      {
        name: "Mineral Premix (Potassium Citrate, Calcium Phosphate, Calcium Carbonate, Magnesium Compound, and Potassium Iodide)",
        isAllergen: false,
      },
      { name: "Strawberry Powder", isAllergen: false },
      {
        name: "Vitamin Premix",
        isAllergen: false,
      },
    ],

    allergens: ["Wheat / Gluten", "Soy", "Milk"],

    alternatives: [
      "Another age-appropriate supervised finger food that matches the child's allergen needs",
    ],
  },

  {
    slug: "nestle-cerelac-rice-soya-250g",
    barcode: "9556001132291",
    name: "Nestlé Cerelac Rice & Soya 250g",
    brand: "Nestlé Cerelac",
    category: "Infant Cereal",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "Multiple matching active Philippine FDA records",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "50g (5 servings per 250g pack)",
    warningMessage:
      "Multiple active Philippine FDA records match Nestlé Cerelac Rice & Soya, but the FDA portal does not identify which record belongs to this exact barcode and 250g pack. This complementary food is intended for children from 6 months up to 2 years and is not a breastmilk substitute. Continue breastfeeding and follow age-appropriate preparation guidance. Contains soy, milk, and fish and may contain wheat/gluten.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "208 kcal",
      protein: "7.5g",
      carbohydrates: "33.8g",
      totalFat: "4.8g",
      saturatedFat: "0.5g",
      totalSugars: "9g",
      dietaryFiber: "1g",
      sodium: "5mg",
    },

    ingredients: [
      { name: "Rice Flour", isAllergen: false },
      { name: "Soya Flour", isAllergen: true },
      { name: "Sucrose", isAllergen: false },
      { name: "Skimmed Milk Powder", isAllergen: true },
      { name: "Vegetable Oil", isAllergen: false },
      {
        name: "Minerals (Calcium Carbonate, Magnesium Phosphate, Ferrous Fumarate, Sodium Chloride, Zinc Sulfate, and Potassium Iodide)",
        isAllergen: false,
      },
      { name: "Soya Lecithin (Emulsifier)", isAllergen: true },
      { name: "Potassium Phosphate (Acidity Regulator)", isAllergen: false },
      { name: "Fish Oil (DHA)", isAllergen: true },
      { name: "Vitamin Premix", isAllergen: false },
      { name: "Bifidobacterium Lactis (Probiotic)", isAllergen: false },
      { name: "Nature-Identical Flavor (Vanillin)", isAllergen: false },
    ],

    allergens: ["Soy", "Milk", "Fish", "Wheat / Gluten"],

    alternatives: [
      "Another age-appropriate complementary food recommended by the child's healthcare professional",
    ],
  },

  {
    // Label data: Products 2 (4).pdf, page 1. FDA record checked September 7, 2026.
    slug: "jufran-sriracha-hot-chili-sauce-515g",
    barcode: "4801668606957",
    name: "Jufran Sriracha Hot Chili Sauce 515g",
    brand: "Jufran",
    category: "Hot Chili Sauce",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000011392884",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 6,
      servingUnit: "g",
      caloriesPerServing: 0,
      saturatedFatGramsPerServing: 0,
      // Use the label's upper bound conservatively; retain "Less than 1g" below.
      totalSugarsGramsPerServing: 1,
      sodiumMilligramsPerServing: 150,
    },
    servingSize: "1 teaspoon (6g); about 86 servings per 515g bottle",
    warningMessage:
      "Published Philippine FDA record FR-4000011392884 lists Jufran Sriracha Hot Chili Sauce by Nutri-Asia, Inc. in PET/sachet packaging with an expiry date of July 26, 2028. It does not list retail barcodes or pack weights; the submitted 515g bottle identifies the same importer and Thai origin. The live portal was unavailable on September 7, 2026, so current status could not be rechecked. One 6g serving contains 150mg sodium. Contains sulfites. Shake well before using.",
    verificationUrl:
      "https://verification.fda.gov.ph/All_FoodProductsview.php?ACCOUNTCODE=FR-4000011392884&export=pdf",

    nutrition: {
      calories: "0 kcal",
      protein: "0g",
      carbohydrates: "Less than 1g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "Less than 1g",
      dietaryFiber: "0g",
      sodium: "150mg",
    },

    ingredients: [
      { name: "Chili", isAllergen: false },
      { name: "Water", isAllergen: false },
      { name: "Sugar", isAllergen: false },
      { name: "Garlic", isAllergen: false },
      { name: "Salt", isAllergen: false },
      { name: "Modified Tapioca Starch (Thickener)", isAllergen: false },
      {
        name: "Flavor Enhancers (Monosodium Glutamate, Disodium 5'-Inosinate, and Disodium 5'-Guanylate)",
        isAllergen: false,
      },
      { name: "Vinegar", isAllergen: false },
      { name: "Paprika Extract", isAllergen: false },
      { name: "Sodium Benzoate (Preservative)", isAllergen: false },
      { name: "Sodium Metabisulfite (Preservative)", isAllergen: true },
    ],

    allergens: ["Sulphites"],

    alternatives: [
      "A lower-sodium chili sauce after comparing nutrition labels",
      "A chili condiment without sulfites if those must be avoided",
    ],
  },

  {
    // Label data: Products 2 (4).pdf, page 1. Current FDA renewal checked September 12, 2026.
    slug: "reno-liver-spread-230g",
    barcode: "4805885172004",
    name: "Reno Liver Spread 230g",
    brand: "Reno",
    category: "Liver Spread",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000011823898",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "2 tablespoons (40g); about 6 servings per 230g can",
    warningMessage:
      "Philippine FDA product registration FR-4000011823898 lists RENO BRAND® LIVER SPREAD under RENO FOODS, INC., valid through 31 October 2030. This is a product-name match; the portal does not specify individual package sizes. One 40g serving contains 262mg sodium and 2g saturated fat. The package declares poultry meat, wheat, and soy as allergens and says to consume completely after opening.",
    verificationUrl:
      "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "70 kcal",
      protein: "3g",
      carbohydrates: "7g",
      totalFat: "3g",
      saturatedFat: "2g",
      totalSugars: "2g",
      dietaryFiber: "2g",
      sodium: "262mg",
    },

    ingredients: [
      { name: "Pork Livers, Offals and Trimmings", isAllergen: false },
      { name: "Poultry Meat", isAllergen: true },
      { name: "Wheat", isAllergen: true },
      { name: "Palm Oil", isAllergen: false },
      { name: "Soy Protein", isAllergen: true },
      { name: "Sugar", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Spices", isAllergen: false },
      { name: "Monosodium Glutamate (Flavor Enhancer)", isAllergen: false },
      { name: "Sodium Nitrite (Color Retention Agent)", isAllergen: false },
    ],

    allergens: ["Poultry Meat", "Wheat / Gluten", "Soy"],

    alternatives: [
      "A liver spread with a current, verifiable Philippine FDA registration",
      "A lower-sodium sandwich filling that matches your allergen preferences",
    ],
  },

  {
    // Label data: Products 2 (4).pdf, page 2 (Australian 170g variant).
    slug: "cadbury-dairy-milk-biscoff-170g",
    barcode: "9300617310822",
    name: "Cadbury Dairy Milk Biscoff 170g",
    brand: "Cadbury Dairy Milk",
    category: "Milk Chocolate with Biscuit Pieces",
    status: "UNVERIFIED",
    fdaStatusLabel: "Exact Variant Not Verified",
    registrationNumber: "Philippine FDA registration not verified",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "25g (approximately 4 squares); 6.8 servings per 170g bar",
    warningMessage:
      "The photographed barcode identifies an Australian-made Cadbury Dairy Milk Biscoff 170g bar. No exact Philippine FDA registration was found in indexed records, and the live portal was unavailable on September 7, 2026; Philippine authorization remains unverified. The label provides 550kJ (approximately 131 kcal), 13.2g sugar, and 4.1g saturated fat per 25g serving, and displays a 0.5-star Health Star Rating. Contains milk, wheat/gluten, and soy; may contain peanuts and tree nuts. Store in cool, dry conditions.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      // The package declares energy in kJ: 550 / 4.184, rounded to whole kcal.
      calories: "131 kcal",
      protein: "1.7g",
      carbohydrates: "14.9g",
      totalFat: "7.1g",
      saturatedFat: "4.1g",
      totalSugars: "13.2g",
      dietaryFiber: "N/A",
      sodium: "33mg",
    },

    ingredients: [
      { name: "Full Cream Milk", isAllergen: true },
      { name: "Sugar", isAllergen: false },
      {
        name: "Caramelised Biscuit Pieces (Wheat Flour, Sugar, Vegetable Oils, Candy Sugar Syrup, Raising Agent 500, Cinnamon, and Salt)",
        isAllergen: true,
      },
      { name: "Cocoa Butter", isAllergen: false },
      { name: "Cocoa Mass", isAllergen: false },
      { name: "Milk Solids", isAllergen: true },
      { name: "Soy Lecithin (Emulsifier)", isAllergen: true },
      { name: "Emulsifier 476", isAllergen: false },
      { name: "Flavours", isAllergen: false },
    ],

    allergens: ["Milk", "Wheat / Gluten", "Soy", "Peanuts", "Tree Nuts"],

    alternatives: [
      "A milk chocolate bar with a matching Philippine FDA registration",
      "A lower-sugar snack that matches your milk, wheat, soy, and nut preferences",
    ],
  },

  {
    // Label data: Products 2 (4).pdf, page 3. FDA record checked September 7, 2026.
    slug: "monde-walter-no-sugar-added-wheat-bread-350g",
    barcode: "4806533169605",
    name: "Monde Walter No Sugar Added Wheat Bread 350g",
    brand: "Monde Walter",
    category: "Wheat Bread",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000014213544",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 44,
      servingUnit: "g",
      caloriesPerServing: 110,
      saturatedFatGramsPerServing: 1,
      totalSugarsGramsPerServing: 1,
      sodiumMilligramsPerServing: 159,
    },
    servingSize: "44g; about 8 servings per 350g loaf",
    warningMessage:
      "The indexed Philippine FDA record FR-4000014213544 lists Monde Walter No Sugar Added Wheat Bread by Sarimonde Foods Corporation with an expiry date of April 4, 2028, matching the photographed product and manufacturer. It does not list retail barcodes or pack weights, and the live portal was unavailable on September 7, 2026. No sugar added does not mean sugar free: one 44g serving contains 1g sugar and 20g carbohydrates. Contains wheat and milk; may contain soy. Sweetened with isomaltitol and acesulfame potassium.",
    verificationUrl:
      "https://verification.fda.gov.ph/FoodProduct_Lowriskview.php?ACCOUNTCODE=FR-4000014213544&export=pdf",

    nutrition: {
      calories: "110 kcal",
      protein: "5g",
      carbohydrates: "20g",
      totalFat: "1g",
      saturatedFat: "1g",
      totalSugars: "1g",
      dietaryFiber: "2.8g",
      sodium: "159mg",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Wheat Flour", isAllergen: true },
      { name: "Whole Wheat Flour", isAllergen: true },
      { name: "Cracked Whole Wheat", isAllergen: true },
      {
        name: "Vegetable Shortening (Non-Hydrogenated Palm Oil, Palm Stearin, Palm Olein, Palm Kernel Oil, Coconut Oil, and Mixed Tocopherol Concentrate as Antioxidant)",
        isAllergen: false,
      },
      { name: "Yeast", isAllergen: false },
      { name: "Citrus Fiber", isAllergen: false },
      { name: "Isomaltitol", isAllergen: false },
      { name: "Iodized Salt", isAllergen: false },
      { name: "Milk Permeate Powder", isAllergen: true },
      { name: "Calcium Propionate (Preservative)", isAllergen: false },
      { name: "Lactic Acid (Acidity Regulator)", isAllergen: false },
      { name: "Sodium Stearoyl-2-Lactylate (Emulsifier)", isAllergen: false },
      { name: "Fumaric Acid (Acidity Regulator)", isAllergen: false },
      { name: "Acesulfame Potassium (Sweetener)", isAllergen: false },
    ],

    allergens: ["Wheat / Gluten", "Milk", "Soy"],

    alternatives: [
      "A whole-grain bread without added sweeteners after checking its label",
      "A bread that matches your wheat, milk, and soy preferences",
    ],
  },

  {
    slug: "biogesic-paracetamol-500mg-tablet",
    barcode: "DR-XY39670",
    name: "Biogesic Paracetamol 500mg Tablet",
    brand: "Biogesic",
    category: "OTC Medicine",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered OTC Medicine",
    registrationNumber: "DR-XY39670",
    servingSize:
      "500mg tablet; blister x10 (box of 10) or blister x20 (box of 500)",
    warningMessage:
      "Philippine FDA registration DR-XY39670 is valid through June 22, 2031. The exact retail-package barcode is not yet cataloged. This medicine contains paracetamol. Do not take it with another medicine containing paracetamol or acetaminophen, do not exceed the label dose, and ask a doctor or pharmacist if you have liver or kidney problems, take other medicines, or are pregnant or breastfeeding.",
    verificationUrl:
      "https://verification.fda.gov.ph/ALL_DrugProductslist.php/api/api/ALL_DrugProductsview.php?registration_number=DR-XY39670&showdetail=",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [{ name: "Paracetamol 500mg", isAllergen: false }],
    allergens: [],
    alternatives: [],
  },

  {
    slug: "neozep-forte-tablet",
    barcode: "DR-XY29559",
    name: "Neozep Forte Tablet",
    brand: "Neozep Forte",
    category: "OTC Medicine",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered OTC Medicine",
    registrationNumber: "DR-XY29559",
    servingSize: "tablet; Alu/PVC blister pack x10 tablets",
    warningMessage:
      "Philippine FDA registration DR-XY29559 is valid through May 3, 2029. The exact retail-package barcode is not yet cataloged. Contains paracetamol; do not combine it with Biogesic, Bioflu, or another medicine containing paracetamol or acetaminophen unless instructed by a healthcare professional. Chlorphenamine may cause drowsiness. Follow the label and ask a doctor or pharmacist before use if you have high blood pressure, heart, liver, or kidney problems, take other medicines, or are pregnant or breastfeeding.",
    verificationUrl:
      "https://verification.fda.gov.ph/drug_productsview.php?export=pdf&registration_number=DR-XY29559",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Phenylephrine Hydrochloride 10mg", isAllergen: false },
      { name: "Chlorphenamine Maleate 2mg", isAllergen: false },
      { name: "Paracetamol 500mg", isAllergen: false },
    ],
    allergens: [],
    alternatives: [],
  },

  {
    slug: "bioflu-tablet",
    barcode: "DR-XY34482",
    name: "Bioflu Tablet",
    brand: "Bioflu",
    category: "OTC Medicine",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered OTC Medicine",
    registrationNumber: "DR-XY34482",
    servingSize:
      "film-coated tablet; blister x10 (box of 100) or blister x5 (envelope of 5)",
    warningMessage:
      "Philippine FDA registration DR-XY34482 is valid through April 30, 2030. The exact retail-package barcode is not yet cataloged. Contains paracetamol; do not combine it with Biogesic, Neozep Forte, or another medicine containing paracetamol or acetaminophen unless instructed by a healthcare professional. Chlorphenamine may cause drowsiness. Follow the label and ask a doctor or pharmacist before use if you have high blood pressure, heart, liver, or kidney problems, take other medicines, or are pregnant or breastfeeding.",
    verificationUrl:
      "https://verification.fda.gov.ph/ALL_DrugProductsview.php?registration_number=DR-XY34482&showdetail=",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Phenylephrine Hydrochloride 10mg", isAllergen: false },
      { name: "Chlorphenamine Maleate 2mg", isAllergen: false },
      { name: "Paracetamol 500mg", isAllergen: false },
    ],
    allergens: [],
    alternatives: [],
  },

  {
    slug: "nescafe-classic-190g-brazil-algeria",
    barcode: "7891000361917",
    name: "Nescafé Classic 190g",
    brand: "Nescafé",
    category: "Instant Coffee",
    status: "UNVERIFIED",
    fdaStatusLabel: "Exact Variant Not Verified",
    registrationNumber: "No matching Philippine FDA record",
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

  // Package data: user-supplied front/back photos, reviewed September 18, 2026.
  // FDA portal checked September 18, 2026 via https://verification.fda.gov.ph/.
  {
    slug: "casino-ethyl-alcohol-femme-dual-moisturizer-500ml",
    barcode: "4800112122236",
    name: "Casino Ethyl Alcohol Femme with Dual Moisturizer 500mL",
    brand: "Casino",
    category: "Rubbing Alcohol",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered (Household Remedy)",
    registrationNumber: "DRHR-2024",
    servingSize: "500mL bottle",
    warningMessage:
      "Philippine FDA household-remedy registration DRHR-2024, printed on the package, lists Casino Femme with Dual Moisturizer by International Pharmaceuticals, Inc. — the same brand and manufacturer shown on this bottle. The portal record does not list a concentration, package size, or barcode, so the 500mL bottle and its 70% v/v strength are not independently confirmed beyond the brand and manufacturer match; a separate FDA cosmetic notification for a 40% solution under the same brand and company also exists but is a different, unrelated variant. Each 100mL contains 70mL ethyl alcohol, dexpanthenol (pro-vitamin B5), and aloe vera leaf extract. Flammable; for external use only.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Ethyl Alcohol (70% v/v)", isAllergen: false },
      { name: "Dexpanthenol (Pro-Vitamin B5)", isAllergen: false },
      { name: "Aloe Vera Leaf Extract", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Wash hands with soap and water when available",
      "Another FDA-registered rubbing alcohol suitable for the user",
    ],
  },

  {
    slug: "colgate-total-active-prevention-charcoal-clean-toothpaste-2x150g",
    barcode: "6920354814792",
    name: "Colgate Total Active Prevention+ Charcoal Clean Toothpaste 2x150g",
    brand: "Colgate",
    category: "Fluoride Toothpaste",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "NN-1000015184897",
    servingSize: "2 x 150g tubes (300g total; pea-sized amount per brushing)",
    warningMessage:
      "Philippine FDA cosmetic notification NN-1000015184897 lists Colgate Total Charcoal Clean Toothpaste by Colgate-Palmolive Philippines, Inc., valid through 19 August 2028. This is a product-name and variant match (\"Charcoal Clean\"); the FDA record does not include the \"Active Prevention+\" marketing name shown on this box, and the portal does not specify the x2 value-pack configuration or barcode. A second, earlier registration for the same \"Charcoal Clean\" variant (NN-1000013636602) also exists; the more recent record was selected. Contains stannous fluoride and sodium fluoride. Do not swallow; children 2-6 years old should be supervised, and children under 2 should use only as directed by a dentist or doctor.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Sorbitol", isAllergen: false },
      { name: "Water", isAllergen: false },
      { name: "Hydrated Silica", isAllergen: false },
      { name: "Glycerin", isAllergen: false },
      { name: "Flavor", isAllergen: false },
      { name: "Sodium Lauryl Sulfate", isAllergen: false },
      { name: "Cellulose Gum", isAllergen: false },
      { name: "Tetrasodium Pyrophosphate", isAllergen: false },
      { name: "Potassium Nitrate", isAllergen: false },
      { name: "Xanthan Gum", isAllergen: false },
      { name: "Stannous Fluoride", isAllergen: false },
      { name: "Sodium Saccharin", isAllergen: false },
      { name: "Cocamidopropyl Betaine", isAllergen: false },
      { name: "Charcoal Powder", isAllergen: false },
      { name: "Sodium Fluoride", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "A Philippine FDA-notified fluoride toothpaste with matching local packaging",
      "A dentist-recommended toothpaste suitable for the user's age and oral-health needs",
    ],
  },

  {
    slug: "mountain-dew-zero-sugar-1-5l",
    barcode: "4803925153648",
    name: "Mountain Dew Zero Sugar Citrus Flavour Drink 1.5L",
    brand: "Mountain Dew",
    category: "Zero-Sugar Carbonated Drink",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered Product Name",
    registrationNumber: "FR-4000013418036",
    nutritionRating: {
      category: "NON_DAIRY_BEVERAGE",
      servingQuantity: 200,
      servingUnit: "mL",
      caloriesPerServing: 2,
      totalSugarsGramsPerServing: 0,
      proteinGramsPerServing: 0,
      fibreGramsPerServing: 0,
    },
    servingSize: "200mL (7.5 servings per 1.5L bottle)",
    warningMessage:
      "Philippine FDA registration FR-4000013418036 lists a carbonated citrus-flavour drink with zero sugar under the Mountain Dew Zero Sugar brand, manufactured for Pepsi-Cola Products Philippines, Inc., valid through 30 September 2029. This is a product-name match; the portal does not specify individual package sizes, and several similarly worded registrations exist for the same brand and company — this one was selected for its exact product-name wording and most recent validity date. Contains phenylalanine (from aspartame); people with phenylketonuria should follow the package warning. Contains caffeine.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "2",
      protein: "0g",
      carbohydrates: "0g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "6mg",
    },

    ingredients: [
      { name: "Carbonated Water", isAllergen: false },
      { name: "Acidity Regulators (Citric Acid, Potassium Citrate)", isAllergen: false },
      { name: "Natural Flavor", isAllergen: false },
      { name: "Artificial Sweeteners (Aspartame, Acesulfame Potassium, Sucralose)", isAllergen: false },
      { name: "Emulsifiers (Citrus Pectin, Gum Arabic, Glycerol Ester of Wood Rosin)", isAllergen: false },
      { name: "Preservative (Sodium Benzoate)", isAllergen: false },
      { name: "Caffeine", isAllergen: false },
      { name: "Artificial Color (Tartrazine)", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Plain drinking water",
      "Unsweetened sparkling water",
    ],
  },

  {
    slug: "the-originote-low-ph-cicamide-facial-cleanser-150ml",
    barcode: "6976789131690",
    name: "The Originote Low pH Cicamide Facial Cleanser 150mL",
    brand: "The Originote",
    category: "Facial Cleanser",
    status: "APPROVED",
    fdaStatusLabel: "FDA Notified",
    registrationNumber: "NN-1000013514731",
    servingSize: "150mL tube (dime-sized amount per use)",
    warningMessage:
      "Philippine FDA cosmetic notification NN-1000013514731 lists The Originote Cicamide Facial Cleanser by GoodSale Tech Co., Inc., valid through 19 October 2027. The product name, brand, and importer/distributor match the submitted 150mL tube; the portal record omits the \"Low pH\" wording shown on the package and does not list barcodes or pack sizes. Made in the People's Republic of China. For external use only; avoid contact with eyes and discontinue use if irritation occurs.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Aqua", isAllergen: false },
      { name: "Glycerin", isAllergen: false },
      { name: "Cocamidopropyl Betaine", isAllergen: false },
      { name: "Sodium Chloride", isAllergen: false },
      { name: "Disodium Laureth Sulfosuccinate", isAllergen: false },
      { name: "Phenoxyethanol", isAllergen: false },
      { name: "Laureth-2", isAllergen: false },
      { name: "Michelia Alba Flower Oil", isAllergen: false },
      { name: "Chlorphenesin", isAllergen: false },
      { name: "Niacinamide", isAllergen: false },
      { name: "Butylene Glycol", isAllergen: false },
      { name: "Ethylhexylglycerin", isAllergen: false },
      { name: "Paeonia Suffruticosa Root Extract", isAllergen: false },
      { name: "Dianthus Chinensis Extract", isAllergen: false },
      { name: "1,2-Hexanediol", isAllergen: false },
      { name: "Hydroxyacetophenone", isAllergen: false },
      { name: "Propylene Glycol", isAllergen: false },
      { name: "Centella Asiatica Extract", isAllergen: false },
      { name: "Hydrogenated Lecithin", isAllergen: false },
      { name: "Cholesterol", isAllergen: false },
      { name: "Ceramide NP", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "A fragrance-free facial cleanser for sensitive skin",
      "Another FDA-notified facial cleanser suited to the user's skin type",
    ],
  },

  {
    slug: "avon-feelin-fresh-quelch-crystal-tawas-antiperspirant-50g",
    barcode: "15551801",
    name: "Avon Feelin Fresh Quelch Natural Brightening Crystal Tawas Antiperspirant Deodorant Cream 50g",
    brand: "Avon",
    category: "Antiperspirant Cream",
    status: "APPROVED",
    fdaStatusLabel: "FDA Notified",
    registrationNumber: "NN-1000013626089",
    servingSize: "50g tube (pea-sized amount per underarm)",
    warningMessage:
      "Philippine FDA cosmetic notification NN-1000013626089 lists Avon Feelin Fresh Quelch Natural Brightening Crystal Tawas Antiperspirant Deodorant Cream by Avon Products Mfg., Inc., valid through 15 October 2027. The product name, brand, and manufacturer match the submitted 50g tube; the portal does not list barcodes or pack sizes. One ingredient on the package photo (an acid following \"Fragrance\") was partially obscured and is recorded here as unconfirmed. Contains aluminum chlorohydrate. For external use only; do not use on broken or irritated skin.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Water", isAllergen: false },
      { name: "Aluminum Chlorohydrate", isAllergen: false },
      { name: "Glycerin", isAllergen: false },
      { name: "Stearate SE", isAllergen: false },
      { name: "Steareth-2", isAllergen: false },
      { name: "Isopropyl Palmitate", isAllergen: false },
      { name: "PPG-15 Stearyl Ether", isAllergen: false },
      { name: "Steareth-20", isAllergen: false },
      { name: "Thiodipropionic Acid", isAllergen: false },
      { name: "Fragrance", isAllergen: false },
      { name: "Acid (partially obscured in package photo, unconfirmed)", isAllergen: false },
      { name: "Aluminum Potassium Sulfate", isAllergen: false },
      { name: "Glutathione", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "A fragrance-free antiperspirant if perfume must be avoided",
      "Another FDA-notified underarm product suitable for the user's skin",
    ],
  },

  // Package data: user-supplied front/back photos, reviewed September 18, 2026.
  // FDA portal checked September 18, 2026 via https://verification.fda.gov.ph/.
  {
    slug: "nescafe-ice-roast-instant-coffee-10-sticks-19g",
    barcode: "4800361432054",
    name: "Nescafé Ice Roast Instant Coffee 10 Sticks 19g",
    brand: "Nescafé",
    category: "Instant Coffee",
    status: "UNVERIFIED",
    fdaStatusLabel: "Exact Variant Not Verified",
    registrationNumber: "No matching Philippine FDA record",
    servingSize: "1 stick (1.9g); 10 sticks per 19g box",
    warningMessage:
      "No exact Philippine FDA food registration was found for \"Nescafé Ice Roast\" by product name; the portal lists several active \"Nescafé Classic\" instant coffee registrations under Nestlé Philippines, Inc., but none matching the \"Ice Roast\" variant name. The ingredient panel was not visible in the supplied photos, so it is not transcribed here. Manufactured for Nestlé Philippines, Inc., Km. 46 Brgy. Niugan, Cabuyao, Laguna, Philippines, under license of Société des Produits Nestlé S.A., Vevey, Switzerland.",
    verificationUrl: "https://verification.fda.gov.ph/",

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
      "Philippine-market Nescafé instant coffee with a matching FDA registration",
    ],
  },

  // Caution reflects the supplement's adult-use precautions; the Philippine
  // FDA registration, printed on the package, remains approved and active.
  {
    slug: "pure-form-creatine-monohydrate-300g",
    barcode: "4809016479000",
    name: "Pure Form 100% Ultra-Micronized Creatine Monohydrate Unflavored Powder 300g",
    brand: "Pure Form",
    category: "Food Supplement",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered — No Approved Therapeutic Claims",
    registrationNumber: "FR-4000012097911",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "5g (1 scoop); 60 servings per 300g pack",
    warningMessage:
      "Philippine FDA registration FR-4000012097911, printed on the package, lists Creatine Monohydrate Food Supplement Powder by Pure Form Ventures Inc. as approved and active through December 9, 2030. This food supplement has no approved therapeutic claims. For healthy adults 18 years and older only. Consult a physician before use if pregnant, breastfeeding, managing a medical condition, or taking medication.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "0",
      protein: "0g",
      carbohydrates: "0g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "0mg",
    },

    ingredients: [
      { name: "100% Ultra-Micronized Creatine Monohydrate", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Creatine-rich foods such as meat or fish",
      "Professional nutrition guidance before another supplement",
    ],
  },

  {
    slug: "st-ives-renewing-moisturizer-collagen-elastin-283g",
    barcode: "077043104736",
    name: "St. Ives Renewing Moisturizer Collagen & Elastin 10oz (283g)",
    brand: "St. Ives",
    category: "Facial Moisturizer",
    status: "UNVERIFIED",
    fdaStatusLabel: "Exact Variant Not Verified",
    registrationNumber: "No confirmed matching Philippine FDA notification",
    servingSize: "283g (10 oz) jar; apply to face and neck as needed",
    warningMessage:
      "No exact Philippine FDA cosmetic notification was found for this jar. The portal lists a similarly named \"St Ives Renewing Body Lotion Collagen & Elastin\" (NN-1000012286460) registered by Grand Dragon Enterprises Inc., but that record describes a body lotion, not the face-and-neck moisturizer printed on this 283g jar, and its registrant differs from Unilever, the manufacturer address printed on this package (Trumbull, CT, USA). This is treated as an unconfirmed variant rather than a match. For external use only; avoid direct contact with eyes and rinse thoroughly with water if contact occurs.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      sodium: "N/A",
    },

    ingredients: [
      { name: "Water (Aqua)", isAllergen: false },
      { name: "Mineral Oil", isAllergen: false },
      { name: "Propylene Glycol", isAllergen: false },
      { name: "Glyceryl Stearate", isAllergen: false },
      { name: "PEG-100 Stearate", isAllergen: false },
      { name: "Stearic Acid", isAllergen: false },
      { name: "Phenoxyethanol", isAllergen: false },
      { name: "Carthamus Tinctorius (Safflower) Seed Oil", isAllergen: false },
      { name: "Triethanolamine", isAllergen: false },
      { name: "Carbomer", isAllergen: false },
      { name: "Cetyl Alcohol", isAllergen: false },
      { name: "Dimethicone", isAllergen: false },
      { name: "Disodium EDTA", isAllergen: false },
      { name: "Fragrance (Parfum)", isAllergen: false },
      { name: "Ethylhexylglycerin", isAllergen: false },
      { name: "Hydrolyzed Collagen", isAllergen: false },
      { name: "Hydrolyzed Elastin", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "A fragrance-free moisturizer for sensitive skin",
      "Another FDA-notified facial moisturizer suited to the user's skin type",
    ],
  },

  // Caution reflects the supplement's adult-use precautions; the Philippine
  // FDA registration, printed on the package, remains approved and active.
  {
    slug: "pure-form-magnesium-ashwagandha-90-capsules",
    barcode: "4809016479086",
    name: "Pure Form Magnesium + Ashwagandha 90 Vegan Capsules",
    brand: "Pure Form",
    category: "Food Supplement",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered — No Approved Therapeutic Claims",
    registrationNumber: "FR-4000013013055",
    nutritionRating: {
      category: "FOOD",
    },
    servingSize: "2 capsules; 45 servings per 90-capsule bottle",
    warningMessage:
      "Philippine FDA registration FR-4000013013055, printed on the package, lists Magnesium Glycinate + Ashwagandha Root Extract Capsule Food Supplement by Pure Form Ventures Inc. as approved and active through July 25, 2031. This food supplement has no approved therapeutic claims. For healthy adults 18 years and older only. Consult a physician before use if pregnant, breastfeeding, managing a medical condition, or taking medication.",
    verificationUrl: "https://verification.fda.gov.ph/",

    nutrition: {
      calories: "0",
      protein: "0g",
      carbohydrates: "0g",
      totalFat: "0g",
      saturatedFat: "0g",
      totalSugars: "0g",
      dietaryFiber: "0g",
      sodium: "0mg",
    },

    ingredients: [
      { name: "Magnesium Glycinate (400mg)", isAllergen: false },
      { name: "Ashwagandha Root Extract (1,000mg; 5% withanolides)", isAllergen: false },
      { name: "100% Vegan HPMC Capsule Shell", isAllergen: false },
    ],

    allergens: [],

    alternatives: [
      "Magnesium-rich foods such as leafy greens or nuts",
      "A supplement and dose recommended by a physician or dietitian",
    ],
  },
];

async function seedDatabase() {
  const advisories = await loadSeedAdvisories();

  console.log("");
  console.log("Seeding Codify demo products...");
  console.log("");

  const removedDemoProducts = await prisma.product.deleteMany({
    where: {
      slug: {
        in: [
          "energy-drink-x",
          "pureglow-facial-care",
          "milk-chocolate-bar",
        ],
      },
    },
  });

  if (removedDemoProducts.count > 0) {
    console.log("Removed obsolete fictional demo products.");
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },

      update: {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: product.category,
        status: product.status,
        fdaStatusLabel: product.fdaStatusLabel,
        registrationNumber: product.registrationNumber,
        servingSize: product.servingSize,
        warningMessage: product.warningMessage,
        imageUrl: product.imageUrl ?? null,
        verificationUrl: product.verificationUrl ?? null,

        nutrition: {
          upsert: {
            create: {
              calories: product.nutrition.calories,
              protein: product.nutrition.protein,
              carbohydrates: product.nutrition.carbohydrates,
              totalFat: product.nutrition.totalFat,
              saturatedFat: product.nutrition.saturatedFat ?? "N/A",
              totalSugars: product.nutrition.totalSugars ?? "N/A",
              dietaryFiber: product.nutrition.dietaryFiber ?? "N/A",
              sodium: product.nutrition.sodium,
            },

            update: {
              calories: product.nutrition.calories,
              protein: product.nutrition.protein,
              carbohydrates: product.nutrition.carbohydrates,
              totalFat: product.nutrition.totalFat,
              saturatedFat: product.nutrition.saturatedFat ?? "N/A",
              totalSugars: product.nutrition.totalSugars ?? "N/A",
              dietaryFiber: product.nutrition.dietaryFiber ?? "N/A",
              sodium: product.nutrition.sodium,
            },
          },
        },

        ...(product.nutritionRating
          ? {
              nutritionRating: {
                upsert: {
                  create: buildNutritionRatingData(product.nutritionRating),
                  update: buildNutritionRatingData(product.nutritionRating),
                },
              },
            }
          : {}),

        ingredients: {
          deleteMany: {},

          create: product.ingredients.map((ingredient, index) => ({
            name: ingredient.name,
            isAllergen: ingredient.isAllergen,
            position: index + 1,
          })),
        },

        allergens: {
          deleteMany: {},

          create: product.allergens.map((allergen, index) => ({
            name: allergen,
            position: index + 1,
          })),
        },

        alternatives: {
          deleteMany: {},

          create: product.alternatives.map((alternative, index) => ({
            name: alternative,
            position: index + 1,
          })),
        },
      },

      create: {
        slug: product.slug,
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: product.category,
        status: product.status,
        fdaStatusLabel: product.fdaStatusLabel,
        registrationNumber: product.registrationNumber,
        servingSize: product.servingSize,
        warningMessage: product.warningMessage,
        imageUrl: product.imageUrl ?? null,
        verificationUrl: product.verificationUrl ?? null,

        nutrition: {
          create: {
            calories: product.nutrition.calories,
            protein: product.nutrition.protein,
            carbohydrates: product.nutrition.carbohydrates,
            totalFat: product.nutrition.totalFat,
            saturatedFat: product.nutrition.saturatedFat ?? "N/A",
            totalSugars: product.nutrition.totalSugars ?? "N/A",
            dietaryFiber: product.nutrition.dietaryFiber ?? "N/A",
            sodium: product.nutrition.sodium,
          },
        },

        ...(product.nutritionRating
          ? {
              nutritionRating: {
                create: buildNutritionRatingData(product.nutritionRating),
              },
            }
          : {}),

        ingredients: {
          create: product.ingredients.map((ingredient, index) => ({
            name: ingredient.name,
            isAllergen: ingredient.isAllergen,
            position: index + 1,
          })),
        },

        allergens: {
          create: product.allergens.map((allergen, index) => ({
            name: allergen,
            position: index + 1,
          })),
        },

        alternatives: {
          create: product.alternatives.map((alternative, index) => ({
            name: alternative,
            position: index + 1,
          })),
        },
      },
    });

    console.log(`Seeded product: ${product.name}`);
  }

  const productCount = await prisma.product.count();

  const advisoryBatchSize = 200;

  for (let index = 0; index < advisories.length; index += advisoryBatchSize) {
    const batch = advisories.slice(index, index + advisoryBatchSize);

    // Advisory numbers are immutable FDA records. Insert only missing rows so
    // Render startup does not re-run hundreds of upserts in transactions that
    // can exceed Prisma's five-second transaction timeout on a cold database.
    await prisma.fdaAdvisory.createMany({
      data: batch.map((advisory) => ({
        advisoryNumber: advisory.advisoryNumber,
        title: advisory.title,
        category: advisory.category,
        type: advisory.type,
        status: advisory.status,
        publishedAt: new Date(`${advisory.publishedAt}T00:00:00.000Z`),
        sourceUrl: advisory.sourceUrl,
        filipinoSourceUrl: advisory.filipinoSourceUrl,
        isActive: advisory.isActive,
      })),
      skipDuplicates: true,
    });
  }

  const advisoryCount = await prisma.fdaAdvisory.count();

  console.log("");
  console.log("Codify product seed completed.");
  console.log(`Products currently stored: ${productCount}`);
  console.log(`FDA advisories currently stored: ${advisoryCount}`);
  console.log("");
}

seedDatabase()
  .catch((error: unknown) => {
    console.error("");
    console.error("Codify product seed failed:");
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
