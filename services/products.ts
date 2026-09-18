import type { DemoProduct } from "@/constants/MockData";
import {
  cacheProduct,
  getCachedProduct,
  getCachedProducts,
  removeCachedProduct,
  replaceCachedProducts,
} from "@/services/offline-catalog";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

type ProductCatalogResponse = {
  message?: string;
  products?: DemoProduct[];
};

type ProductDetailResponse = {
  message?: string;
  product?: DemoProduct;
};

export type ProductLoadResult = {
  product: DemoProduct | null;
  source: "online" | "offline";
  notFound?: boolean;
};

function apiUrl() {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is missing.");
  return API_URL;
}

function isProduct(value: unknown): value is DemoProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<DemoProduct>;
  return (
    typeof product.id === "string" &&
    typeof product.barcode === "string" &&
    typeof product.name === "string" &&
    typeof product.brand === "string" &&
    typeof product.category === "string" &&
    typeof product.fdaStatusLabel === "string" &&
    typeof product.registrationNumber === "string" &&
    typeof product.servingSize === "string" &&
    typeof product.warningMessage === "string" &&
    typeof product.createdAt === "string" &&
    "nutritionRating" in product &&
    Boolean(product.nutrition) &&
    Array.isArray(product.ingredients) &&
    Array.isArray(product.allergens) &&
    Array.isArray(product.alternatives)
  );
}

export async function loadCachedProductCatalog() {
  return getCachedProducts();
}

export async function refreshProductCatalog(signal?: AbortSignal) {
  const response = await fetch(`${apiUrl()}/api/products`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  const body = (await response.json().catch(() => ({}))) as ProductCatalogResponse;
  if (!response.ok) {
    throw new Error(body.message || `Unable to load products (${response.status}).`);
  }
  const products = Array.isArray(body.products)
    ? body.products.filter(isProduct)
    : [];
  if (products.length > 0) {
    await replaceCachedProducts(products);
  }
  return products;
}

export async function loadProduct(
  barcode: string,
  signal?: AbortSignal,
  allowNetwork = true,
): Promise<ProductLoadResult> {
  const cachedProduct = await getCachedProduct(barcode);

  if (!allowNetwork) {
    if (cachedProduct) {
      return { product: cachedProduct, source: "offline" };
    }
    throw new Error("This product has not been saved for offline use yet.");
  }

  try {
    const response = await fetch(
      `${apiUrl()}/api/products/${encodeURIComponent(barcode)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      },
    );
    const body = (await response.json().catch(() => ({}))) as ProductDetailResponse;
    if (response.status === 404) {
      await removeCachedProduct(barcode);
      return { product: null, source: "online", notFound: true };
    }
    if (!response.ok) {
      throw new Error(
        body.message || `Product request failed with status ${response.status}.`,
      );
    }
    if (!isProduct(body.product)) {
      throw new Error("The backend returned an invalid product response.");
    }
    await cacheProduct(body.product);
    return { product: body.product, source: "online" };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    if (cachedProduct) {
      return { product: cachedProduct, source: "offline" };
    }
    throw error;
  }
}
