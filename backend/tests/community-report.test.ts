import assert from "node:assert/strict";
import { test } from "node:test";

import type { prisma } from "../src/lib/prisma.js";
import { createCommunityReportRouter } from "../src/routes/community-report.routes.js";
import { startTestServer } from "./test-helpers.js";

const id = "00000000-0000-4000-8000-000000000001";

// What the database select returns. Private columns are included on purpose:
// a select that forgot to exclude them must still not leak them.
const reportRow = {
  id,
  barcode: "4800000000001",
  productName: "Sample Product",
  brand: "Sample Brand",
  category: "Food",
  reason: "Wrong product information",
  notes: "Label lists a different net weight.",
  resolutionNote: "We corrected the product details.",
  submittedAt: new Date("2026-10-01T00:00:00.000Z"),
  reviewedAt: new Date("2026-10-02T00:00:00.000Z"),
  userId: "private-user-id",
  clientReportId: "private-client-id",
  hiddenByReporter: false,
  evidence: [{ storageKey: "report-evidence/private.jpg" }],
};

async function withRouter(productReport: Record<string, unknown>) {
  const db = { productReport } as unknown as typeof prisma;
  return startTestServer("/api", createCommunityReportRouter(db));
}

test("GET /community-reports lists only resolved, published reports with an allow-listed shape", async () => {
  let findArgs: any;
  let countArgs: any;
  const server = await withRouter({
    findMany: async (args: unknown) => {
      findArgs = args;
      return [reportRow];
    },
    count: async (args: unknown) => {
      countArgs = args;
      return 1;
    },
  });

  try {
    const result = await server.request("/api/community-reports");
    assert.equal(result.status, 200);
    assert.deepEqual(findArgs.where, { isPublic: true, status: "RESOLVED" });
    assert.deepEqual(countArgs.where, findArgs.where);
    assert.equal(findArgs.select.userId, undefined);
    assert.equal(findArgs.select.evidence, undefined);
    assert.deepEqual(result.body.reports, [
      {
        id,
        barcode: "4800000000001",
        productName: "Sample Product",
        brand: "Sample Brand",
        category: "Food",
        reason: "Wrong product information",
        notes: "Label lists a different net weight.",
        response: "We corrected the product details.",
        submittedAt: "2026-10-01T00:00:00.000Z",
        reviewedAt: "2026-10-02T00:00:00.000Z",
      },
    ]);
    assert.deepEqual(result.body.pagination, {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  } finally {
    await server.close();
  }
});

test("GET /community-reports?barcode matches the report or linked product, including the UPC/EAN twin", async () => {
  let where: any;
  const server = await withRouter({
    findMany: async (args: { where: unknown }) => {
      where = args.where;
      return [];
    },
    count: async () => 0,
  });

  try {
    const result = await server.request("/api/community-reports?barcode=012345678905");
    assert.equal(result.status, 200);
    const barcodes = ["012345678905", "0012345678905"];
    assert.deepEqual(where, {
      isPublic: true,
      status: "RESOLVED",
      OR: [
        { barcode: { in: barcodes } },
        { product: { barcode: { in: barcodes } } },
      ],
    });
  } finally {
    await server.close();
  }
});

test("GET /community-reports rejects invalid paging", async () => {
  const server = await withRouter({
    findMany: () => assert.fail("Must not query with invalid filters"),
  });

  try {
    assert.equal((await server.request("/api/community-reports?limit=500")).status, 400);
    assert.equal((await server.request("/api/community-reports?page=0")).status, 400);
  } finally {
    await server.close();
  }
});

test("GET /community-reports/:id returns a published report and 404s for anything else", async () => {
  let where: any;
  const server = await withRouter({
    findFirst: async (args: { where: { id: string } }) => {
      where = args.where;
      return args.where.id === id ? reportRow : null;
    },
  });

  try {
    const found = await server.request(`/api/community-reports/${id}`);
    assert.equal(found.status, 200);
    assert.deepEqual(where, { id, isPublic: true, status: "RESOLVED" });
    assert.equal(found.body.report.response, "We corrected the product details.");
    assert.equal(found.body.report.userId, undefined);
    assert.equal(found.body.report.evidence, undefined);

    const missing = await server.request(
      "/api/community-reports/00000000-0000-4000-8000-000000000002",
    );
    assert.equal(missing.status, 404);
    assert.equal((await server.request("/api/community-reports/not-a-uuid")).status, 400);
  } finally {
    await server.close();
  }
});
