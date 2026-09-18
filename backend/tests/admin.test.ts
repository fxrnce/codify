import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import type { getAuth } from "@clerk/express";
import type { prisma } from "../src/lib/prisma.js";
import { createAdminRouter } from "../src/routes/admin.routes.js";
import { createReportRouter } from "../src/routes/report.routes.js";
import { advisorySchema, equivalentBarcode, reviewSchema, productSchema } from "../src/lib/admin-validation.js";

const id = "00000000-0000-4000-8000-000000000001";
const timestamp = "2026-09-14T00:00:00.000Z";
const original = { id, status: "PENDING", resolutionNote: "", updatedAt: new Date(timestamp) };

async function request(role: "ADMIN" | "USER" | null, path: string, method = "GET", body?: unknown, overrides: Record<string, unknown> = {}, factory = createAdminRouter, storage?: unknown) {
  const db = {
    user: { findUnique: async () => role ? { id, role } : null },
    ...overrides,
  } as unknown as typeof prisma;
  const auth = (() => ({ isAuthenticated: role !== null, userId: role ? "user_test" : null })) as unknown as typeof getAuth;
  const app = express();
  app.use(express.json());
  app.use("/api/admin", (factory as typeof createAdminRouter)(db, auth, storage as never));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.on("listening", resolve));
  try {
    const address = server.address();
    assert(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/admin${path}`, { method, ...(body ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}) });
    return { status: response.status, body: await response.json() };
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}

test("all admin routes reject unauthenticated users and ordinary users", async () => {
  for (const role of [null, "USER"] as const) {
    for (const [path, method] of [["/session", "GET"], ["/reports", "GET"], [`/reports/${id}`, "GET"], [`/reports/${id}`, "PATCH"], [`/reports/${id}`, "DELETE"], ["/products", "GET"], [`/products/${id}`, "GET"], ["/products", "POST"], [`/products/${id}`, "PUT"], [`/products/${id}`, "DELETE"], ["/advisories", "GET"], [`/advisories/${id}`, "GET"], ["/advisories", "POST"], [`/advisories/${id}`, "PUT"], [`/advisories/${id}`, "DELETE"]]) {
      assert.equal((await request(role, path, method, method === "GET" ? undefined : { role: "ADMIN" })).status, role === null ? 401 : 403, `${role} ${method} ${path}`);
    }
  }
});
test("authorized admin can open session; current database role is authoritative", async () => {
  assert.equal((await request("ADMIN", "/session")).status, 200);
  assert.equal((await request("ADMIN", "/session", "GET", undefined, { user: { findUnique: async () => ({ id, role: "USER" }) } })).status, 403);
});
test("review validation rejects blank decisions, malformed IDs, and mass assignment", async () => {
  for (const status of ["RESOLVED", "REJECTED"]) assert.equal(reviewSchema.safeParse({ status, resolutionNote: "  ", updatedAt: timestamp }).success, false);
  assert.equal((await request("ADMIN", `/reports/${id}`, "PATCH", { status: "RESOLVED", resolutionNote: "Done", updatedAt: timestamp, userId: "someone-else" })).status, 400);
  assert.equal((await request("ADMIN", "/reports/not-a-uuid")).status, 400);
  assert.equal((await request("ADMIN", "/reports?limit=9999")).status, 400);
});
test("admin inbox includes reports hidden from personal history and paginates", async () => {
  let captured: unknown;
  const result = await request("ADMIN", "/reports?status=PENDING&page=2&limit=5", "GET", undefined, {
    productReport: {
      findMany: async (query: unknown) => { captured = query; return []; },
      count: async () => 8,
      groupBy: async () => [{ status: "PENDING", _count: 8 }],
    },
  });
  assert.equal(result.status, 200);
  assert.deepEqual(captured, { where: { status: "PENDING" }, orderBy: [{ submittedAt: "desc" }, { id: "desc" }], skip: 5, take: 5 });
  assert.equal(result.body.pagination.totalPages, 2);
});
test("single-character admin searches match the start of searchable fields", async () => {
  let reportsWhere: unknown;
  let productsWhere: unknown;
  let advisoriesWhere: unknown;

  assert.equal((await request("ADMIN", "/reports?q=b", "GET", undefined, {
    productReport: {
      findMany: async ({ where }: { where: unknown }) => { reportsWhere = where; return []; },
      count: async () => 0,
      groupBy: async () => [],
    },
  })).status, 200);
  assert.equal((await request("ADMIN", "/products?q=b", "GET", undefined, {
    product: {
      findMany: async ({ where }: { where: unknown }) => { productsWhere = where; return []; },
      count: async () => 0,
    },
  })).status, 200);
  assert.equal((await request("ADMIN", "/advisories?q=b", "GET", undefined, {
    fdaAdvisory: {
      findMany: async ({ where }: { where: unknown }) => { advisoriesWhere = where; return []; },
      count: async () => 0,
    },
  })).status, 200);

  const startsWith = (field: string) => ({
    [field]: { startsWith: "b", mode: "insensitive" },
  });
  assert.deepEqual(reportsWhere, {
    OR: ["productName", "brand", "barcode"].map(startsWith),
  });
  assert.deepEqual(productsWhere, {
    OR: ["name", "brand", "barcode"].map(startsWith),
  });
  assert.deepEqual(advisoriesWhere, {
    OR: ["title", "advisoryNumber"].map(startsWith),
  });
});
test("review saves a user-visible response and an audit entry in one transaction", async () => {
  let audit: any; let mutation: any; let transactional = false;
  const result = await request("ADMIN", `/reports/${id}`, "PATCH", { status: "RESOLVED", resolutionNote: "Corrected the ingredient list.", updatedAt: timestamp }, {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
      transactional = true;
      return callback({
        productReport: {
          findUnique: async () => original,
          updateMany: async (input: unknown) => { mutation = input; return { count: 1 }; },
          findUniqueOrThrow: async () => ({ ...original, ...mutation.data }),
        },
        adminAuditLog: { create: async (input: unknown) => { audit = input; } },
      });
    },
  });
  assert.equal(result.status, 200);
  assert(transactional);
  assert.deepEqual(mutation.where, { id, updatedAt: new Date(timestamp) });
  assert.equal(result.body.report.resolutionNote, "Corrected the ingredient list.");
  assert.equal(audit.data.actorId, id);
  assert.equal(audit.data.before.status, "PENDING");
  assert.equal(audit.data.after.status, "RESOLVED");
});
test("stale review returns conflict without writing an audit entry", async () => {
  const result = await request("ADMIN", `/reports/${id}`, "PATCH", { status: "UNDER_REVIEW", resolutionNote: "Checking", updatedAt: timestamp }, {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({ productReport: { findUnique: async () => original, updateMany: async () => ({ count: 0 }) }, adminAuditLog: { create: () => assert.fail("Must not audit a failed update") } }),
  });
  assert.equal(result.status, 409);
});
test("deleting a report logs an audit entry before removing the expected version", async () => {
  let audit: any; let deletedId: string | undefined; let transactional = false;
  let deleteWhere: any;
  const operations: string[] = [];
  const result = await request("ADMIN", `/reports/${id}`, "DELETE", { updatedAt: timestamp }, {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
      transactional = true;
      return callback({
        productReport: {
          findUnique: async () => original,
          deleteMany: async ({ where }: { where: { id: string; updatedAt: Date } }) => { operations.push("delete"); deleteWhere = where; deletedId = where.id; return { count: 1 }; },
        },
        reportEvidence: { findMany: async () => [] },
        adminAuditLog: { create: async (input: unknown) => { operations.push("audit"); audit = input; } },
      });
    },
  });
  assert.equal(result.status, 200);
  assert(transactional);
  assert.equal(audit.data.actorId, id);
  assert.equal(audit.data.action, "DELETE");
  assert.equal(audit.data.before.status, "PENDING");
  assert.equal(deletedId, id);
  assert.deepEqual(deleteWhere, { id, updatedAt: new Date(timestamp) });
  assert.deepEqual(operations, ["audit", "delete"]);
});
test("deleting a missing report returns 404 without writing an audit entry", async () => {
  const result = await request("ADMIN", `/reports/${id}`, "DELETE", { updatedAt: timestamp }, {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({
      productReport: { findUnique: async () => null },
      adminAuditLog: { create: () => assert.fail("Must not audit a delete of a missing report") },
    }),
  });
  assert.equal(result.status, 404);
});
test("admin can view a report's photo evidence with signed URLs, in display order", async () => {
  const evidenceRows = [
    { id: "ev-1", storageKey: "report-evidence/x/1.jpg", mimeType: "image/jpeg", byteSize: 1000, width: null, height: null, position: 1, createdAt: new Date(timestamp) },
    { id: "ev-0", storageKey: "report-evidence/x/0.jpg", mimeType: "image/jpeg", byteSize: 900, width: null, height: null, position: 0, createdAt: new Date(timestamp) },
  ];
  const storage = { getSignedGetUrl: async (key: string) => `https://cdn.test/${key}` };
  const result = await request("ADMIN", `/reports/${id}`, "GET", undefined, {
    productReport: { findUnique: async () => original },
    reportEvidence: { findMany: async () => evidenceRows },
    adminAuditLog: { findMany: async () => [] },
  }, createAdminRouter, storage);
  assert.equal(result.status, 200);
  assert.equal(result.body.report.evidence.length, 2);
  assert.equal(result.body.report.evidence[0].position, 0);
  assert.equal(result.body.report.evidence[0].url, "https://cdn.test/report-evidence/x/0.jpg");
  assert.equal(result.body.report.evidence[1].position, 1);
});
test("admin report evidence shows a null URL (not an error) when storage is not configured", async () => {
  const result = await request("ADMIN", `/reports/${id}`, "GET", undefined, {
    productReport: { findUnique: async () => original },
    reportEvidence: { findMany: async () => [{ id: "ev-0", storageKey: "k", mimeType: "image/jpeg", byteSize: 1, width: null, height: null, position: 0, createdAt: new Date(timestamp) }] },
    adminAuditLog: { findMany: async () => [] },
  }, createAdminRouter, null);
  assert.equal(result.status, 200);
  assert.equal(result.body.report.evidence[0].url, null);
});
test("deleting a report removes its stored evidence objects and audits their metadata, never the binary", async () => {
  const evidenceRows = [
    { id: "ev-0", storageKey: "report-evidence/x/0.jpg", mimeType: "image/jpeg", byteSize: 900, width: null, height: null, position: 0, createdAt: new Date(timestamp) },
  ];
  let audit: any;
  const deletedKeys: string[] = [];
  const storage = {
    deleteObject: async (key: string) => { deletedKeys.push(key); },
  };
  const result = await request("ADMIN", `/reports/${id}`, "DELETE", { updatedAt: timestamp }, {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({
      productReport: {
        findUnique: async () => original,
        deleteMany: async () => ({ count: 1 }),
      },
      reportEvidence: { findMany: async () => evidenceRows },
      adminAuditLog: { create: async (input: unknown) => { audit = input; } },
    }),
  }, createAdminRouter, storage);
  assert.equal(result.status, 200);
  assert.deepEqual(deletedKeys, ["report-evidence/x/0.jpg"]);
  assert.equal(audit.data.before.evidence[0].storageKey, "report-evidence/x/0.jpg");
  assert.equal(audit.data.before.evidence[0].mimeType, "image/jpeg");
  assert.equal("buffer" in audit.data.before.evidence[0], false);
});
test("a storage failure while deleting a report records a cleanup task instead of losing track of the object", async () => {
  const evidenceRows = [
    { id: "ev-0", storageKey: "report-evidence/x/0.jpg", mimeType: "image/jpeg", byteSize: 900, width: null, height: null, position: 0, createdAt: new Date(timestamp) },
  ];
  const cleanupTasks: { storageKey: string; reason: string }[] = [];
  const storage = {
    deleteObject: async () => { throw new Error("storage unreachable"); },
  };
  const result = await request("ADMIN", `/reports/${id}`, "DELETE", { updatedAt: timestamp }, {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({
      productReport: {
        findUnique: async () => original,
        deleteMany: async () => ({ count: 1 }),
      },
      reportEvidence: { findMany: async () => evidenceRows },
      adminAuditLog: { create: async () => {} },
    }),
    storageCleanupTask: { create: async ({ data }: { data: { storageKey: string; reason: string } }) => { cleanupTasks.push(data); } },
  }, createAdminRouter, storage);
  assert.equal(result.status, 200);
  assert.equal(cleanupTasks.length, 1);
  assert.equal(cleanupTasks[0].storageKey, "report-evidence/x/0.jpg");
  assert.equal(cleanupTasks[0].reason, "deleted-report");
});
const product = {
  slug: "sample-product", barcode: "012345678905", name: "Sample", brand: "Sample", category: "Food", status: "UNVERIFIED", fdaStatusLabel: "Pending", registrationNumber: "Not verified", nutritionRating: null, servingSize: "100g", warningMessage: "Awaiting verification", imageUrl: null, verificationUrl: "https://verification.fda.gov.ph/", isArchived: false,
  nutrition: { calories: "N/A", protein: "N/A", carbohydrates: "N/A", totalFat: "N/A", saturatedFat: "N/A", totalSugars: "N/A", dietaryFiber: "N/A", sodium: "N/A" }, ingredients: [], allergens: [], alternatives: [],
};
test("catalog validation returns structured nested field paths", async () => {
  const result = await request("ADMIN", `/products/${id}`, "PUT", {
    updatedAt: timestamp,
    product: { ...product, slug: "Invalid Slug" },
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.errors[0].path, "product.slug");
  assert.match(result.body.errors[0].message, /lowercase|Invalid/i);
});
test("advisory validation uses concise administrator-facing messages", () => {
  const result = advisorySchema.safeParse({
    advisoryNumber: "2",
    title: "",
    category: "FOOD",
    type: "PUBLIC_HEALTH_WARNING",
    status: "NOT_APPROVED",
    publishedAt: "2026-99-99",
    sourceUrl: "",
    filipinoSourceUrl: null,
    isActive: true,
  });
  assert.equal(result.success, false);
  if (result.success) return;
  const sourceIssues = result.error.issues.filter(issue => issue.path.join(".") === "sourceUrl");
  assert.equal(sourceIssues.length, 1);
  assert.equal(sourceIssues[0].message, "Enter a valid official source URL beginning with http:// or https://.");
  assert.equal(result.error.issues.find(issue => issue.path.join(".") === "advisoryNumber")?.message.includes("2026-001"), true);
  assert.equal(result.error.issues.find(issue => issue.path.join(".") === "publishedAt")?.message, "Enter a real publication date in YYYY-MM-DD format.");
});
test("catalog rejects duplicate UPC/EAN forms and unsafe fields", async () => {
  assert.equal(equivalentBarcode("012345678905"), "0012345678905");
  assert.equal(equivalentBarcode("0012345678905"), "012345678905");
  assert.equal(productSchema.safeParse({ ...product, verificationUrl: "javascript:alert(1)" }).success, false);
  assert.equal(productSchema.safeParse({ ...product, nutritionRating: { category: "NOT_A_CATEGORY" } }).success, false);
  assert.equal(productSchema.safeParse({ ...product, nutritionRating: { category: "FOOD", servingQuantity: -1 } }).success, false);
  let query: any;
  const result = await request("ADMIN", "/products", "POST", product, {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({ product: { findFirst: async (input: unknown) => { query = input; return { id }; }, create: () => assert.fail("Duplicate must not be created") } }),
  });
  assert.equal(result.status, 409);
  assert.deepEqual(query.where.OR[1].barcode.in, ["012345678905", "0012345678905"]);
});

test("nutritionRating input schema rejects a directly-submitted score or rating", () => {
  // There is no field for a star rating, point total, or 0-100 score at all;
  // .strict() rejects any such extra key outright.
  const withInjectedScore = productSchema.safeParse({
    ...product,
    nutritionRating: { category: "FOOD", servingQuantity: 100, servingUnit: "g", starRatingHalfSteps: 10 },
  });
  assert.equal(withInjectedScore.success, false);

  const withInjectedPoints = productSchema.safeParse({
    ...product,
    nutritionRating: { category: "FOOD", servingQuantity: 100, servingUnit: "g", finalPoints: -99 },
  });
  assert.equal(withInjectedPoints.success, false);
});

test("creating a product always computes its nutrition rating server-side from verified inputs", async () => {
  let createdNutritionRating: any;
  const created = { id, ...product, updatedAt: new Date(timestamp) };
  const result = await request("ADMIN", "/products", "POST", {
    ...product,
    slug: "brownie-bites-test",
    barcode: "4800365881315",
    nutritionRating: {
      category: "FOOD",
      servingQuantity: 14,
      servingUnit: "g",
      caloriesPerServing: 60,
      saturatedFatGramsPerServing: 1,
      totalSugarsGramsPerServing: 6,
      sodiumMilligramsPerServing: 40,
    },
  }, {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({
      product: {
        findFirst: async () => null,
        create: async () => created,
        findUniqueOrThrow: async () => ({ ...created, nutritionRating: createdNutritionRating }),
      },
      nutritionRating: {
        upsert: async ({ create }: { create: unknown }) => { createdNutritionRating = create; },
      },
      adminAuditLog: { create: async () => {} },
    }),
  });
  assert.equal(result.status, 201);
  // The client never sends a star rating or point total; the server derives
  // both from the verified per-serving inputs using the HSR estimator.
  assert.equal(createdNutritionRating.confidence, "CONSERVATIVE");
  assert.equal(createdNutritionRating.baselinePoints, 25);
  assert.equal(createdNutritionRating.finalPoints, 25);
  assert.equal(createdNutritionRating.starRatingHalfSteps, 1);
});

test("deleting a product audits its full catalog snapshot and expected version", async () => {
  let audit: any;
  let deleteWhere: any;
  const before = { id, ...product, updatedAt: new Date(timestamp) };
  const result = await request("ADMIN", `/products/${id}`, "DELETE", { updatedAt: timestamp }, {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({
      product: {
        findUnique: async () => before,
        deleteMany: async ({ where }: { where: unknown }) => { deleteWhere = where; return { count: 1 }; },
      },
      adminAuditLog: { create: async (input: unknown) => { audit = input; } },
    }),
  });
  assert.equal(result.status, 200);
  assert.deepEqual(deleteWhere, { id, updatedAt: new Date(timestamp) });
  assert.equal(audit.data.entityType, "PRODUCT");
  assert.equal(audit.data.action, "DELETE");
  assert.equal(audit.data.before.barcode, product.barcode);
  assert.deepEqual(audit.data.after, { deleted: true });
});

test("deleting an advisory audits its snapshot and expected version", async () => {
  let audit: any;
  let deleteWhere: any;
  const before = { id, advisoryNumber: "2026-001", title: "Sample advisory", updatedAt: new Date(timestamp) };
  const result = await request("ADMIN", `/advisories/${id}`, "DELETE", { updatedAt: timestamp }, {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({
      fdaAdvisory: {
        findUnique: async () => before,
        deleteMany: async ({ where }: { where: unknown }) => { deleteWhere = where; return { count: 1 }; },
      },
      adminAuditLog: { create: async (input: unknown) => { audit = input; } },
    }),
  });
  assert.equal(result.status, 200);
  assert.deepEqual(deleteWhere, { id, updatedAt: new Date(timestamp) });
  assert.equal(audit.data.entityType, "ADVISORY");
  assert.equal(audit.data.action, "DELETE");
  assert.equal(audit.data.before.advisoryNumber, "2026-001");
  assert.deepEqual(audit.data.after, { deleted: true });
});

test("user report listing is owner-scoped and includes the admin response", async () => {
  let query: any;
  const result = await request("USER", "/reports", "GET", undefined, {
    user: { upsert: async () => ({ id }) },
    productReport: { findMany: async (input: unknown) => { query = input; return [{ ...original, barcode: null, submittedAt: new Date(timestamp), reviewedAt: new Date(timestamp), status: "RESOLVED", resolutionNote: "Details corrected.", clientReportId: null }]; } },
  }, createReportRouter);
  assert.equal(result.status, 200);
  assert.deepEqual(query.where, { userId: id, hiddenByReporter: false });
  assert.equal(result.body.reports[0].resolutionNote, "Details corrected.");
  assert.equal(result.body.reports[0].status, "RESOLVED");
});
test("clearing personal history hides reports without deleting admin evidence", async () => {
  let query: any;
  const result = await request("USER", "/reports", "DELETE", undefined, {
    user: { upsert: async () => ({ id }) },
    productReport: { updateMany: async (input: unknown) => { query = input; return { count: 1 }; }, deleteMany: () => assert.fail("Reports must be retained") },
  }, createReportRouter);
  assert.equal(result.status, 200);
  assert.deepEqual(query, { where: { userId: id }, data: { hiddenByReporter: true } });
});
test("retries use a stable user-scoped report ID and cannot submit an admin decision", async () => {
  let input: any;
  const result = await request("USER", "/reports", "POST", { productName: "Test", brand: "Test", category: "Food", reason: "Other concern", notes: "Please check", clientReportId: "stable-client-id", status: "RESOLVED", resolutionNote: "Fake decision" }, {
    user: { upsert: async () => ({ id }) },
    productReport: { upsert: async (query: unknown) => { input = query; return { ...original, barcode: null, submittedAt: new Date(timestamp), reviewedAt: null, clientReportId: "stable-client-id" }; } },
  }, createReportRouter);
  assert.equal(result.status, 201);
  assert.deepEqual(input.where, { userId_clientReportId: { userId: id, clientReportId: "stable-client-id" } });
  assert.deepEqual(input.update, {});
  assert.equal(input.create.status, undefined);
  assert.equal(input.create.resolutionNote, undefined);
});
