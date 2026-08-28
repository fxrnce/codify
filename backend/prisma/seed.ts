import { readFile } from "node:fs/promises";

import { z } from "zod";

import { prisma } from "../src/lib/prisma.js";
import {
  calculateConservativeCategory1NutritionScore,
  calculateConservativeCategory2NutritionScore,
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
  {
    slug: "green-cross-total-defense-hand-spray-40ml",
    barcode: "4800047865152",
    name: "Green Cross Total Defense Antibacterial Hand Spray 40mL",
    brand: "Green Cross",
    category: "Hand Sanitizer",
    status: "APPROVED",
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
    healthScore: null,
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
    healthScore: null,
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
    slug: "super-delights-brownie-bites-14g",
    barcode: "4800365881315",
    name: "Super Delights Brownie Bites 14g",
    brand: "Super Delights",
    category: "Baked Snack",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000010589283",
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 14,
      caloriesPerServing: 60,
      saturatedFatGramsPerServing: 1,
      totalSugarsGramsPerServing: 6,
      sodiumMilligramsPerServing: 40,
    }),
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
    healthScore: 100,
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
    healthScore: 100,
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

  {
    slug: "coca-cola-original-taste-can-320ml",
    barcode: "4801981110001",
    name: "Coca-Cola Original Taste 320mL Can",
    brand: "Coca-Cola",
    category: "Carbonated Soft Drink",
    status: "CAUTION",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000008139975",
    healthScore: calculateConservativeCategory1NutritionScore({
      servingSizeMilliliters: 320,
      caloriesPerServing: 134,
      totalSugarsGramsPerServing: 33.5,
    }),
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
    healthScore: calculateConservativeCategory1NutritionScore({
      servingSizeMilliliters: 200,
      caloriesPerServing: 1,
      totalSugarsGramsPerServing: 0,
    }),
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
    healthScore: calculateConservativeCategory1NutritionScore({
      servingSizeMilliliters: 250,
      caloriesPerServing: 20,
      totalSugarsGramsPerServing: 3,
    }),
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
    slug: "gardenia-classic-white-bread-regular-slice-600g",
    barcode: "4806502720615",
    name: "Gardenia Classic White Bread 600g",
    brand: "Gardenia",
    category: "White Bread",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered",
    registrationNumber: "FR-4000015595825",
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 56,
      caloriesPerServing: 153,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 5,
      sodiumMilligramsPerServing: 215,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 30,
      caloriesPerServing: 110,
      saturatedFatGramsPerServing: 6,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 350,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 30,
      caloriesPerServing: 90,
      saturatedFatGramsPerServing: 6,
      totalSugarsGramsPerServing: 1,
      sodiumMilligramsPerServing: 450,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 2.8,
      caloriesPerServing: 6,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 476,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 3,
      caloriesPerServing: 6,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 470,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 56,
      caloriesPerServing: 100,
      saturatedFatGramsPerServing: 3,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 380,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 85,
      caloriesPerServing: 50,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 342,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 55,
      caloriesPerServing: 50,
      saturatedFatGramsPerServing: 1,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 240,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 30,
      caloriesPerServing: 114,
      saturatedFatGramsPerServing: 0.2,
      totalSugarsGramsPerServing: 2.9,
      sodiumMilligramsPerServing: 134,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 30,
      caloriesPerServing: 114,
      saturatedFatGramsPerServing: 0.3,
      totalSugarsGramsPerServing: 8,
      sodiumMilligramsPerServing: 50,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 35,
      caloriesPerServing: 133,
      saturatedFatGramsPerServing: 0.6,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 2,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 30,
      caloriesPerServing: 120,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 7,
      sodiumMilligramsPerServing: 85,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 15,
      caloriesPerServing: 98,
      saturatedFatGramsPerServing: 1.5,
      totalSugarsGramsPerServing: 0,
      sodiumMilligramsPerServing: 82,
    }),
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
    healthScore: null,
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
    slug: "athlene-active-creatine-monohydrate-300g",
    barcode: "0745125547008",
    name: "Athlene Active Creatine Monohydrate 300g",
    brand: "Athlene",
    category: "Food Supplement",
    status: "CAUTION",
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
    healthScore: null,
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
    healthScore: null,
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
    healthScore: null,
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
    healthScore: null,
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
    healthScore: null,
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
    slug: "kirkland-signature-fish-oil-1000mg-400-softgels",
    barcode: "096619926626",
    name: "Kirkland Signature Fish Oil 1000mg 400 Softgels",
    brand: "Kirkland Signature",
    category: "Food Supplement",
    status: "UNVERIFIED",
    fdaStatusLabel: "Not Verified",
    registrationNumber: "No matching Philippine FDA record",
    healthScore: null,
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 250,
      caloriesPerServing: 158,
      saturatedFatGramsPerServing: 6.4,
      totalSugarsGramsPerServing: 12,
      sodiumMilligramsPerServing: 100,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 250,
      caloriesPerServing: 90,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 12.5,
      sodiumMilligramsPerServing: 100,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 245,
      caloriesPerServing: 160,
      saturatedFatGramsPerServing: 6,
      totalSugarsGramsPerServing: 13,
      sodiumMilligramsPerServing: 135,
    }),
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

  {
    slug: "gardenia-high-fiber-whole-wheat-bread-600g",
    barcode: "4806502720301",
    name: "Gardenia High Fiber Whole Wheat Bread 600g",
    brand: "Gardenia",
    category: "Whole Wheat Bread",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered Food Product",
    registrationNumber: "FR-4000011480835",
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 64,
      caloriesPerServing: 161,
      saturatedFatGramsPerServing: 1,
      totalSugarsGramsPerServing: 4,
      sodiumMilligramsPerServing: 192,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 50,
      caloriesPerServing: 150,
      saturatedFatGramsPerServing: 0.5,
      totalSugarsGramsPerServing: 5,
      sodiumMilligramsPerServing: 220,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 38,
      caloriesPerServing: 180,
      saturatedFatGramsPerServing: 4.5,
      totalSugarsGramsPerServing: 11,
      sodiumMilligramsPerServing: 95,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 38,
      caloriesPerServing: 140,
      saturatedFatGramsPerServing: 3,
      totalSugarsGramsPerServing: 11,
      sodiumMilligramsPerServing: 120,
    }),
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
    healthScore: calculateConservativeCategory2NutritionScore({
      servingSizeGrams: 32,
      caloriesPerServing: 18,
      saturatedFatGramsPerServing: 0,
      totalSugarsGramsPerServing: 2,
      sodiumMilligramsPerServing: 295,
    }),
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
    slug: "biogesic-paracetamol-500mg-tablet",
    barcode: "DR-XY39670",
    name: "Biogesic Paracetamol 500mg Tablet",
    brand: "Biogesic",
    category: "OTC Medicine",
    status: "APPROVED",
    fdaStatusLabel: "FDA Registered OTC Medicine",
    registrationNumber: "DR-XY39670",
    healthScore: null,
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
    healthScore: null,
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
    healthScore: null,
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
        healthScore: product.healthScore,
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
        healthScore: product.healthScore,
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
