import { prisma } from "../src/lib/prisma.js";

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
    sodium: string;
  };

  ingredients: {
    name: string;
    isAllergen: boolean;
  }[];

  allergens: string[];
  alternatives: string[];
};

const products: SeedProduct[] = [
  {
    slug: "milk-chocolate-bar",
    barcode: "4800011234567",
    name: "Milk Chocolate Bar",
    brand: "Sweet Delights",
    category: "Confectionery",
    status: "APPROVED",
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
      {
        name: "Sugar",
        isAllergen: false,
      },
      {
        name: "Cocoa Mass",
        isAllergen: false,
      },
      {
        name: "Milk Powder",
        isAllergen: true,
      },
      {
        name: "Cocoa Butter",
        isAllergen: false,
      },
      {
        name: "Soy Lecithin",
        isAllergen: true,
      },
      {
        name: "Vanilla Extract",
        isAllergen: false,
      },
    ],

    allergens: ["Milk", "Soy"],

    alternatives: ["Dark Chocolate Bar (85% Cocoa)", "Organic Milk Chocolate"],
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
    verificationUrl:
      "https://verification.fda.gov.ph/All_FoodProductslist.php/All_FoodProductsview.php?ACCOUNTCODE=FR-4000009873654&showdetail=",

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
  console.log("");
  console.log("Seeding Codify demo products...");
  console.log("");

  const removedDemoProducts = await prisma.product.deleteMany({
    where: {
      slug: {
        in: ["energy-drink-x", "pureglow-facial-care"],
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
              sodium: product.nutrition.sodium,
            },

            update: {
              calories: product.nutrition.calories,
              protein: product.nutrition.protein,
              carbohydrates: product.nutrition.carbohydrates,
              totalFat: product.nutrition.totalFat,
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

  console.log("");
  console.log("Codify product seed completed.");
  console.log(`Products currently stored: ${productCount}`);
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
