import { z } from "zod";

export const INVALID_PRODUCT_CODE_MESSAGE =
  "Invalid product code. Scan a retail barcode or QR code with up to 1,024 characters.";

export const productCodeSchema = z
  .string()
  .trim()
  .min(1, {
    message: "Product code cannot be empty.",
  })
  .max(1024, {
    message: "Product code cannot exceed 1,024 characters.",
  })
  .refine((value) => !/[\u0000-\u001F\u007F]/u.test(value), {
    message: "Product code cannot contain control characters.",
  });
