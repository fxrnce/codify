import { z } from "zod";
import { HSR_CATEGORIES } from "./nutrition-score.js";
import { productCodeSchema } from "./product-code.js";

const requiredText = (label: string, max = 200) => z.string().trim()
  .min(1, `Enter ${label}.`)
  .max(max, `${label[0].toUpperCase()}${label.slice(1)} must be ${max.toLocaleString()} characters or fewer.`);
const isHttpUrl = (value: string) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};
const httpUrl = (label: string) => z.string().trim().refine(isHttpUrl, {
  message: `Enter a valid ${label} beginning with http:// or https://.`,
});
const optionalUrl = (label: string) => httpUrl(label).nullable();
const names = z.array(requiredText("a name")).max(100, "Add no more than 100 items.").refine(values => new Set(values.map(v => v.toLowerCase())).size === values.length, "Remove duplicate names.");
export const reportStatusSchema = z.enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"], { error: "Choose a valid report status." });
export const reviewSchema = z.object({
  status: reportStatusSchema,
  resolutionNote: z.string().trim().max(2000, "The response must be 2,000 characters or fewer."),
  updatedAt: z.iso.datetime({ error: "Reload the report before saving." }),
}).strict().refine(value => !["RESOLVED", "REJECTED"].includes(value.status) || value.resolutionNote.length > 0, {
  message: "A response is required when resolving or rejecting a report.", path: ["resolutionNote"],
});
const nonNegativeNumber = (label: string) =>
  z.number().finite(`Enter a valid number for ${label}.`).min(0, `${label} cannot be negative.`);

// Administrators enter verified nutrition-label values and a calculation
// category; the backend (see nutrition-score.ts) always derives the actual
// star rating from these values. There is no field here for submitting a
// rating or score directly.
export const nutritionRatingInputSchema = z.object({
  category: z.enum(HSR_CATEGORIES, { error: "Choose a valid HSR calculation category." }),
  servingQuantity: z.number().finite().positive("Serving quantity must be greater than 0.").optional(),
  servingUnit: z.enum(["g", "mL"], { error: "Serving unit must be g or mL." }).optional(),
  caloriesPerServing: nonNegativeNumber("Calories").optional(),
  saturatedFatGramsPerServing: nonNegativeNumber("Saturated fat").optional(),
  totalSugarsGramsPerServing: nonNegativeNumber("Total sugars").optional(),
  sodiumMilligramsPerServing: nonNegativeNumber("Sodium").optional(),
  proteinGramsPerServing: nonNegativeNumber("Protein").optional(),
  fibreGramsPerServing: nonNegativeNumber("Fibre").optional(),
  fvnlPercent: z.number().min(0, "FVNL percent cannot be negative.").max(100, "FVNL percent cannot exceed 100.").optional(),
  containsFruitOrVegetable: z.boolean().optional(),
  containsNutsOrLegumes: z.boolean().optional(),
}).strict();

export const productSchema = z.object({
  slug: z.string().trim()
    .min(1, "Enter a catalog ID.")
    .max(180, "The catalog ID must be 180 characters or fewer.")
    .refine(value => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), "Use lowercase letters, numbers, and single hyphens, for example coca-cola-320ml."),
  barcode: productCodeSchema,
  name: requiredText("the product name and package size"),
  brand: requiredText("the brand", 120),
  category: requiredText("the category", 120),
  status: z.enum(["APPROVED", "CAUTION", "FDA_ADVISORY", "UNVERIFIED"], { error: "Choose a valid FDA status." }),
  fdaStatusLabel: requiredText("the FDA status label"),
  registrationNumber: requiredText("the registration or notification number"),
  // null means "not applicable" (e.g. a cosmetic or medicine): no
  // NutritionRating row is created and the product-result screen hides the
  // nutrition rating card entirely.
  nutritionRating: nutritionRatingInputSchema.nullable(),
  servingSize: requiredText("the serving size"),
  warningMessage: requiredText("product guidance", 8000),
  imageUrl: optionalUrl("product image URL"),
  verificationUrl: optionalUrl("verification URL"),
  isArchived: z.boolean(),
  nutrition: z.object({
    calories: requiredText("a calories value or N/A", 80), protein: requiredText("a protein value or N/A", 80), carbohydrates: requiredText("a carbohydrates value or N/A", 80), totalFat: requiredText("a total fat value or N/A", 80),
    saturatedFat: requiredText("a saturated fat value or N/A", 80), totalSugars: requiredText("a total sugars value or N/A", 80), dietaryFiber: requiredText("a dietary fiber value or N/A", 80), sodium: requiredText("a sodium value or N/A", 80),
  }).strict(),
  ingredients: z.array(z.object({ name: requiredText("the ingredient name"), isAllergen: z.boolean() }).strict()).max(150, "Add no more than 150 ingredients."),
  allergens: names, alternatives: names,
}).strict();
export const advisorySchema = z.object({
  advisoryNumber: z.string().trim().regex(/^\d{4}-\d{3,4}(?:-[A-Z])?$/, "Use YYYY-NNN or YYYY-NNNN, with an optional letter suffix, for example 2026-001."),
  title: requiredText("the advisory title", 1000),
  category: z.enum(["FOOD", "DRUG", "COSMETIC"], { error: "Choose a valid advisory category." }),
  type: z.enum(["PUBLIC_HEALTH_WARNING", "RECALL", "QUALITY_HOLD", "SAFETY_ALERT", "LIFTING"], { error: "Choose a valid advisory type." }),
  status: z.enum(["NOT_APPROVED", "CAUTION", "LIFTED"], { error: "Choose a valid advisory status." }),
  publishedAt: z.iso.date({ error: "Enter a real publication date in YYYY-MM-DD format." }),
  sourceUrl: httpUrl("official source URL"),
  filipinoSourceUrl: optionalUrl("Filipino source URL"), isActive: z.boolean(),
}).strict();

export function equivalentBarcode(barcode: string) {
  if (/^\d{12}$/.test(barcode)) return `0${barcode}`;
  if (/^0\d{12}$/.test(barcode)) return barcode.slice(1);
  return barcode;
}
