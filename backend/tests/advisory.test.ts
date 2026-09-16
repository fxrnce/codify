import assert from "node:assert/strict";
import { test } from "node:test";

import type { prisma } from "../src/lib/prisma.js";
import { createAdvisoryRouter } from "../src/routes/advisory.routes.js";
import { startTestServer } from "./test-helpers.js";

const advisoryRow = {
  advisoryNumber: "2026-001",
  title: "Sample Advisory",
  category: "FOOD" as const,
  type: "RECALL" as const,
  status: "NOT_APPROVED" as const,
  publishedAt: new Date("2026-01-15"),
  sourceUrl: "https://fda.gov.ph/example",
  filipinoSourceUrl: null,
  isActive: true,
};

async function withRouter(overrides: Record<string, unknown> = {}) {
  const db = {
    fdaAdvisory: {
      aggregate: async () => ({ _max: { publishedAt: advisoryRow.publishedAt } }),
      ...(overrides.fdaAdvisory as object),
    },
  } as unknown as typeof prisma;
  const server = await startTestServer("/api", createAdvisoryRouter(db));
  return server;
}

test("GET /advisories rejects invalid filters", async () => {
  const server = await withRouter();
  try {
    const result = await server.request("/api/advisories?category=NOT_A_CATEGORY");
    assert.equal(result.status, 400);
  } finally {
    await server.close();
  }
});

test("GET /advisories paginates and serializes labels", async () => {
  const server = await withRouter({
    fdaAdvisory: {
      findMany: async () => [advisoryRow],
      count: async () => 1,
    },
  });
  try {
    const result = await server.request("/api/advisories");
    assert.equal(result.status, 200);
    assert.equal(result.body.advisories[0].categoryLabel, "Food");
    assert.equal(result.body.advisories[0].typeLabel, "Product Recall");
    assert.equal(result.body.updatedThrough, "2026-01-15");
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

test("GET /advisories uses prefix matching for one character and broad matching for longer searches", async () => {
  const capturedWhere: unknown[] = [];
  const server = await withRouter({
    fdaAdvisory: {
      findMany: async ({ where }: { where: unknown }) => {
        capturedWhere.push(where);
        return [];
      },
      count: async () => 0,
    },
  });

  try {
    assert.equal((await server.request("/api/advisories?q=b")).status, 200);
    assert.equal((await server.request("/api/advisories?q=be")).status, 200);
    assert.deepEqual(capturedWhere, [
      {
        OR: [
          { advisoryNumber: { startsWith: "b", mode: "insensitive" } },
          { title: { startsWith: "b", mode: "insensitive" } },
        ],
      },
      {
        OR: [
          { advisoryNumber: { contains: "be", mode: "insensitive" } },
          { title: { contains: "be", mode: "insensitive" } },
        ],
      },
    ]);
  } finally {
    await server.close();
  }
});

test("GET /advisories/:advisoryNumber rejects a malformed advisory number", async () => {
  const server = await withRouter();
  try {
    const result = await server.request("/api/advisories/not-a-number");
    assert.equal(result.status, 400);
  } finally {
    await server.close();
  }
});

test("GET /advisories/:advisoryNumber returns 404 when not found", async () => {
  const server = await withRouter({
    fdaAdvisory: { findUnique: async () => null },
  });
  try {
    const result = await server.request("/api/advisories/2026-999");
    assert.equal(result.status, 404);
  } finally {
    await server.close();
  }
});

test("GET /advisories/:advisoryNumber returns the serialized advisory", async () => {
  const server = await withRouter({
    fdaAdvisory: { findUnique: async () => advisoryRow },
  });
  try {
    const result = await server.request("/api/advisories/2026-001");
    assert.equal(result.status, 200);
    assert.equal(result.body.advisory.statusLabel, "Not Approved");
  } finally {
    await server.close();
  }
});
