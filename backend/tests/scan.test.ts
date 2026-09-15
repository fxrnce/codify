import assert from "node:assert/strict";
import { test } from "node:test";

import type { getAuth } from "@clerk/express";
import type { prisma } from "../src/lib/prisma.js";
import { createScanRouter } from "../src/routes/scan.routes.js";
import { startTestServer } from "./test-helpers.js";

const userId = "00000000-0000-4000-8000-000000000009";

function fakeAuth(authenticated: boolean) {
  return (() => ({
    isAuthenticated: authenticated,
    userId: authenticated ? "user_1" : null,
  })) as unknown as typeof getAuth;
}

async function withRouter(
  authenticated: boolean,
  overrides: Record<string, unknown> = {},
) {
  const db = {
    user: { upsert: async () => ({ id: userId }) },
    ...overrides,
  } as unknown as typeof prisma;
  const server = await startTestServer(
    "/api",
    createScanRouter(db, fakeAuth(authenticated)),
  );
  return server;
}

test("scan routes reject unauthenticated requests", async () => {
  const server = await withRouter(false);
  try {
    assert.equal((await server.request("/api/scans")).status, 401);
    assert.equal(
      (await server.request("/api/scans", "POST", { barcode: "012345678905" }))
        .status,
      401,
    );
    assert.equal((await server.request("/api/scans", "DELETE")).status, 401);
  } finally {
    await server.close();
  }
});

test("POST /scans rejects a missing barcode", async () => {
  const server = await withRouter(true);
  try {
    const result = await server.request("/api/scans", "POST", {});
    assert.equal(result.status, 400);
  } finally {
    await server.close();
  }
});

test("POST /scans links a matching product and generates a client scan ID", async () => {
  let created: any;
  const server = await withRouter(true, {
    product: { findUnique: async () => ({ id: "product-1" }) },
    scan: {
      upsert: async (input: unknown) => {
        created = input;
        return {
          id: "scan-1",
          clientScanId: created.create.clientScanId,
          barcode: "012345678905",
          scannedAt: new Date("2026-09-15T00:00:00.000Z"),
          product: {
            name: "Sample",
            brand: "Brand",
            category: "Food",
            status: "APPROVED",
            fdaStatusLabel: "Approved",
          },
        };
      },
    },
  });
  try {
    const result = await server.request("/api/scans", "POST", {
      barcode: "012345678905",
    });
    assert.equal(result.status, 201);
    assert.equal(created.create.productId, "product-1");
    assert.equal(typeof created.create.clientScanId, "string");
    assert.equal(result.body.scan.status, "Approved");
  } finally {
    await server.close();
  }
});

test("POST /scans records an unmatched barcode as an unknown product", async () => {
  const server = await withRouter(true, {
    product: { findUnique: async () => null },
    scan: {
      upsert: async () => ({
        id: "scan-2",
        clientScanId: "client-2",
        barcode: "999999999999",
        scannedAt: new Date("2026-09-15T00:00:00.000Z"),
        product: null,
      }),
    },
  });
  try {
    const result = await server.request("/api/scans", "POST", {
      barcode: "999999999999",
      clientScanId: "client-2",
    });
    assert.equal(result.status, 201);
    assert.equal(result.body.scan.name, "Unknown Product");
    assert.equal(result.body.scan.status, "Unverified");
  } finally {
    await server.close();
  }
});

test("GET /scans deduplicates repeated barcodes, keeping the most recent", async () => {
  const server = await withRouter(true, {
    scan: {
      findMany: async () => [
        {
          id: "scan-recent",
          clientScanId: "c1",
          barcode: "012345678905",
          scannedAt: new Date("2026-09-15T02:00:00.000Z"),
          product: null,
        },
        {
          id: "scan-older",
          clientScanId: "c0",
          barcode: "012345678905",
          scannedAt: new Date("2026-09-15T01:00:00.000Z"),
          product: null,
        },
      ],
    },
  });
  try {
    const result = await server.request("/api/scans");
    assert.equal(result.status, 200);
    assert.equal(result.body.scans.length, 1);
    assert.equal(result.body.scans[0].id, "scan-recent");
  } finally {
    await server.close();
  }
});

test("DELETE /scans clears the user's scan history", async () => {
  let deletedWhere: unknown;
  const server = await withRouter(true, {
    scan: {
      deleteMany: async (input: { where: unknown }) => {
        deletedWhere = input.where;
        return { count: 3 };
      },
    },
  });
  try {
    const result = await server.request("/api/scans", "DELETE");
    assert.equal(result.status, 200);
    assert.equal(result.body.deletedCount, 3);
    assert.deepEqual(deletedWhere, { userId });
  } finally {
    await server.close();
  }
});
