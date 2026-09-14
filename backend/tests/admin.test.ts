import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import type { getAuth } from "@clerk/express";
import type { prisma } from "../src/lib/prisma.js";
import { createAdminRouter } from "../src/routes/admin.routes.js";
import { createReportRouter } from "../src/routes/report.routes.js";
import { equivalentBarcode, reviewSchema, productSchema } from "../src/lib/admin-validation.js";

const id = "00000000-0000-4000-8000-000000000001";
const timestamp = "2026-09-14T00:00:00.000Z";
const original = { id, status: "PENDING", resolutionNote: "", updatedAt: new Date(timestamp) };

async function request(role: "ADMIN" | "USER" | null, path: string, method = "GET", body?: unknown, overrides: Record<string, unknown> = {}, factory = createAdminRouter) {
  const db = {
    user: { findUnique: async () => role ? { id, role } : null },
    ...overrides,
  } as unknown as typeof prisma;
  const auth = (() => ({ isAuthenticated: role !== null, userId: role ? "user_test" : null })) as unknown as typeof getAuth;
  const app = express();
  app.use(express.json());
  app.use("/api/admin", factory(db, auth));
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
    for (const [path, method] of [["/session", "GET"], ["/reports", "GET"], [`/reports/${id}`, "GET"], [`/reports/${id}`, "PATCH"], ["/products", "GET"], [`/products/${id}`, "GET"], ["/products", "POST"], [`/products/${id}`, "PUT"], ["/advisories", "GET"], [`/advisories/${id}`, "GET"], ["/advisories", "POST"], [`/advisories/${id}`, "PUT"]]) {
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
const product = {
  slug: "sample-product", barcode: "012345678905", name: "Sample", brand: "Sample", category: "Food", status: "UNVERIFIED", fdaStatusLabel: "Pending", registrationNumber: "Not verified", healthScore: null, servingSize: "100g", warningMessage: "Awaiting verification", imageUrl: null, verificationUrl: "https://verification.fda.gov.ph/", isArchived: false,
  nutrition: { calories: "N/A", protein: "N/A", carbohydrates: "N/A", totalFat: "N/A", saturatedFat: "N/A", totalSugars: "N/A", dietaryFiber: "N/A", sodium: "N/A" }, ingredients: [], allergens: [], alternatives: [],
};
test("catalog rejects duplicate UPC/EAN forms and unsafe fields", async () => {
  assert.equal(equivalentBarcode("012345678905"), "0012345678905");
  assert.equal(equivalentBarcode("0012345678905"), "012345678905");
  assert.equal(productSchema.safeParse({ ...product, verificationUrl: "javascript:alert(1)" }).success, false);
  assert.equal(productSchema.safeParse({ ...product, healthScore: 101 }).success, false);
  let query: any;
  const result = await request("ADMIN", "/products", "POST", product, {
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({ product: { findFirst: async (input: unknown) => { query = input; return { id }; }, create: () => assert.fail("Duplicate must not be created") } }),
  });
  assert.equal(result.status, 409);
  assert.deepEqual(query.where.OR[1].barcode.in, ["012345678905", "0012345678905"]);
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
