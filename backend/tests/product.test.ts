import assert from "node:assert/strict";
import { test } from "node:test";

import type { prisma } from "../src/lib/prisma.js";
import { createProductRouter } from "../src/routes/product.routes.js";
import { startTestServer } from "./test-helpers.js";

const baseProduct = {
  slug: "sample-product",
  barcode: "012345678905",
  name: "Sample Product",
  brand: "Sample Brand",
  category: "Food",
  status: "APPROVED" as const,
  fdaStatusLabel: "Approved",
  registrationNumber: "FR-12345",
  healthScore: 82,
  servingSize: "100g",
  warningMessage: "None",
  imageUrl: null,
  verificationUrl: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  isArchived: false,
  nutrition: null,
  ingredients: [],
  allergens: [],
  alternatives: [],
};

async function withRouter(overrides: Record<string, unknown> = {}) {
  const db = { ...overrides } as unknown as typeof prisma;
  const server = await startTestServer("/api", createProductRouter(db));
  return server;
}

test("GET /products only returns non-archived catalog entries with default nutrition", async () => {
  let query: any;
  const server = await withRouter({
    product: {
      findMany: async (input: unknown) => {
        query = input;
        return [baseProduct];
      },
    },
  });
  try {
    const result = await server.request("/api/products");
    assert.equal(result.status, 200);
    assert.deepEqual(query.where, { isArchived: false });
    assert.equal(result.body.products[0].status, "Approved");
    assert.equal(
      result.body.products[0].createdAt,
      "2026-01-01T00:00:00.000Z",
    );
    assert.deepEqual(result.body.products[0].nutrition, {
      calories: "N/A",
      protein: "N/A",
      carbohydrates: "N/A",
      totalFat: "N/A",
      saturatedFat: "N/A",
      totalSugars: "N/A",
      dietaryFiber: "N/A",
      sodium: "N/A",
    });
  } finally {
    await server.close();
  }
});

test("GET /products/:barcode rejects an empty barcode", async () => {
  const server = await withRouter();
  try {
    const result = await server.request("/api/products/%20");
    assert.equal(result.status, 400);
  } finally {
    await server.close();
  }
});

test("GET /products/:barcode returns 404 for a missing or archived product", async () => {
  const server = await withRouter({
    product: { findUnique: async () => null },
  });
  try {
    const result = await server.request("/api/products/000000000000");
    assert.equal(result.status, 404);
  } finally {
    await server.close();
  }

  const archivedServer = await withRouter({
    product: { findUnique: async () => ({ ...baseProduct, isArchived: true }) },
  });
  try {
    const result = await archivedServer.request("/api/products/012345678905");
    assert.equal(result.status, 404);
  } finally {
    await archivedServer.close();
  }
});

test("GET /products/:barcode falls back to the UPC/EAN equivalent barcode", async () => {
  const lookups: string[] = [];
  const server = await withRouter({
    product: {
      findUnique: async ({ where }: { where: { barcode: string } }) => {
        lookups.push(where.barcode);
        return where.barcode === "0012345678905" ? baseProduct : null;
      },
    },
  });
  try {
    const result = await server.request("/api/products/012345678905");
    assert.equal(result.status, 200);
    assert.deepEqual(lookups, ["012345678905", "0012345678905"]);
    assert.equal(result.body.product.barcode, "012345678905");
  } finally {
    await server.close();
  }
});
