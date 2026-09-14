import { z } from "zod";
import { productCodeSchema } from "./product-code.js";

const text = (max = 200) => z.string().trim().min(1).max(max);
const optionalUrl = z.union([z.url().refine(value => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS URL"), z.null()]);
const names = z.array(text()).max(100).refine(values => new Set(values.map(v => v.toLowerCase())).size === values.length, "Remove duplicate names");
export const reportStatusSchema = z.enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"]);
export const reviewSchema = z.object({
  status: reportStatusSchema,
  resolutionNote: z.string().trim().max(2000),
  updatedAt: z.iso.datetime(),
}).strict().refine(value => !["RESOLVED", "REJECTED"].includes(value.status) || value.resolutionNote.length > 0, {
  message: "A response is required when resolving or rejecting a report.", path: ["resolutionNote"],
});
export const productSchema = z.object({
  slug: z.string().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  barcode: productCodeSchema,
  name: text(), brand: text(120), category: text(120),
  status: z.enum(["APPROVED", "CAUTION", "FDA_ADVISORY", "UNVERIFIED"]),
  fdaStatusLabel: text(), registrationNumber: text(),
  healthScore: z.number().int().min(0).max(100).nullable(),
  servingSize: text(), warningMessage: text(8000),
  imageUrl: optionalUrl, verificationUrl: optionalUrl,
  isArchived: z.boolean(),
  nutrition: z.object({
    calories: text(80), protein: text(80), carbohydrates: text(80), totalFat: text(80),
    saturatedFat: text(80), totalSugars: text(80), dietaryFiber: text(80), sodium: text(80),
  }).strict(),
  ingredients: z.array(z.object({ name: text(), isAllergen: z.boolean() }).strict()).max(150),
  allergens: names, alternatives: names,
}).strict();
export const advisorySchema = z.object({
  advisoryNumber: z.string().regex(/^\d{4}-\d{3,4}(?:-[A-Z])?$/),
  title: text(1000),
  category: z.enum(["FOOD", "DRUG", "COSMETIC"]),
  type: z.enum(["PUBLIC_HEALTH_WARNING", "RECALL", "QUALITY_HOLD", "SAFETY_ALERT", "LIFTING"]),
  status: z.enum(["NOT_APPROVED", "CAUTION", "LIFTED"]),
  publishedAt: z.iso.date(),
  sourceUrl: z.url().refine(value => /^https?:\/\//i.test(value)),
  filipinoSourceUrl: optionalUrl, isActive: z.boolean(),
}).strict();

export function equivalentBarcode(barcode: string) {
  if (/^\d{12}$/.test(barcode)) return `0${barcode}`;
  if (/^0\d{12}$/.test(barcode)) return barcode.slice(1);
  return barcode;
}
