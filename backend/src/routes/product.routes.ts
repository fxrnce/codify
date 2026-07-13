import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";

export const productRouter = Router();

const barcodeParamsSchema = z.object({
  barcode: z
    .string()
    .trim()
    .regex(/^\d{8,14}$/, {
      message: "Barcode must contain 8 to 14 digits.",
    }),
});

const productStatusLabels = {
  APPROVED: "Approved",
  CAUTION: "Caution",
  NOT_APPROVED: "Not Approved",
} as const;

productRouter.get(
  "/products/:barcode",
  async (request: Request, response: Response, next: NextFunction) => {
    const parsedParams = barcodeParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      response.status(400).json({
        success: false,
        message: "Invalid barcode. Barcode must contain 8 to 14 digits.",
      });

      return;
    }

    try {
      const product = await prisma.product.findUnique({
        where: {
          barcode: parsedParams.data.barcode,
        },

        include: {
          nutrition: true,

          ingredients: {
            orderBy: {
              position: "asc",
            },
          },

          allergens: {
            orderBy: {
              position: "asc",
            },
          },

          alternatives: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      if (!product) {
        response.status(404).json({
          success: false,
          message: "Product not found",
          barcode: parsedParams.data.barcode,
        });

        return;
      }

      response.status(200).json({
        success: true,

        product: {
          id: product.slug,
          barcode: product.barcode,
          name: product.name,
          brand: product.brand,
          category: product.category,
          status: productStatusLabels[product.status],
          fdaStatusLabel: product.fdaStatusLabel,
          registrationNumber: product.registrationNumber,
          healthScore: product.healthScore,
          servingSize: product.servingSize,
          warningMessage: product.warningMessage,

          nutrition: product.nutrition
            ? {
                calories: product.nutrition.calories,
                protein: product.nutrition.protein,
                carbohydrates: product.nutrition.carbohydrates,
                totalFat: product.nutrition.totalFat,
                sodium: product.nutrition.sodium,
              }
            : {
                calories: "N/A",
                protein: "N/A",
                carbohydrates: "N/A",
                totalFat: "N/A",
                sodium: "N/A",
              },

          ingredients: product.ingredients.map((ingredient) => ({
            name: ingredient.name,
            isAllergen: ingredient.isAllergen,
          })),

          allergens: product.allergens.map((allergen) => allergen.name),

          alternatives: product.alternatives.map(
            (alternative) => alternative.name,
          ),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);
