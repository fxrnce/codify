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
    slug: "pureglow-facial-care",
    barcode: "4800017654321",
    name: "PureGlow Facial Care",
    brand: "PureGlow",
    category: "Cosmetics",
    status: "CAUTION",
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
      {
        name: "Water",
        isAllergen: false,
      },
      {
        name: "Glycerin",
        isAllergen: false,
      },
      {
        name: "Fragrance",
        isAllergen: true,
      },
      {
        name: "Alcohol",
        isAllergen: false,
      },
      {
        name: "Preservatives",
        isAllergen: false,
      },
    ],

    allergens: ["Fragrance"],

    alternatives: ["Fragrance-Free Facial Wash", "Sensitive Skin Cleanser"],
  },

  {
    slug: "energy-drink-x",
    barcode: "0000000000000",
    name: "Energy Drink X",
    brand: "Unknown Brand",
    category: "Beverage",
    status: "UNVERIFIED",
    fdaStatusLabel: "Unverified",
    registrationNumber: "No FDA record found",
    healthScore: 20,
    servingSize: "250ml",
    warningMessage:
      "This product is not found in the demo FDA database. Avoid purchasing until verified.",

    nutrition: {
      calories: "180",
      protein: "0g",
      carbohydrates: "44g",
      totalFat: "0g",
      sodium: "120mg",
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
        name: "Caffeine",
        isAllergen: false,
      },
      {
        name: "Artificial Flavor",
        isAllergen: true,
      },
      {
        name: "Coloring",
        isAllergen: false,
      },
    ],

    allergens: ["Artificial Flavor"],

    alternatives: ["FDA Registered Energy Drink", "Low Sugar Sports Drink"],
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
      "No exact Philippine FDA record was found for this barcode. The photographed jar was produced in Brazil and labeled for the Algerian market, so verify this exact imported variant before purchase or use.",

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
