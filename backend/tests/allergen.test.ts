import assert from "node:assert/strict";
import { test } from "node:test";

import type { getAuth } from "@clerk/express";
import type { prisma } from "../src/lib/prisma.js";
import { createAllergenRouter } from "../src/routes/allergen.routes.js";
import { startTestServer } from "./test-helpers.js";

function fakeAuth(userId: string | null) {
  return (() => ({
    isAuthenticated: userId !== null,
    userId,
  })) as unknown as typeof getAuth;
}

async function withRouter(
  userId: string | null,
  overrides: Record<string, unknown> = {},
) {
  const db = { ...overrides } as unknown as typeof prisma;
  const server = await startTestServer(
    "/api",
    createAllergenRouter(db, fakeAuth(userId)),
  );
  return server;
}

test("allergen preference routes reject unauthenticated requests", async () => {
  const server = await withRouter(null);
  try {
    assert.equal((await server.request("/api/allergen-preferences")).status, 401);
    assert.equal(
      (await server.request("/api/allergen-preferences", "PUT", { allergenIds: [] }))
        .status,
      401,
    );
  } finally {
    await server.close();
  }
});

test("GET /allergen-preferences returns the saved preferences", async () => {
  const server = await withRouter("user_1", {
    user: { upsert: async () => ({ allergenIds: ["peanuts", "shellfish"] }) },
  });
  try {
    const result = await server.request("/api/allergen-preferences");
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.allergenIds, ["peanuts", "shellfish"]);
  } finally {
    await server.close();
  }
});

test("PUT /allergen-preferences rejects malformed allergen IDs", async () => {
  const server = await withRouter("user_1");
  try {
    const result = await server.request("/api/allergen-preferences", "PUT", {
      allergenIds: ["Not Valid!"],
    });
    assert.equal(result.status, 400);
  } finally {
    await server.close();
  }
});

test("PUT /allergen-preferences deduplicates IDs before saving", async () => {
  let saved: string[] | undefined;
  const server = await withRouter("user_1", {
    user: {
      upsert: async ({ update }: { update: { allergenIds: string[] } }) => {
        saved = update.allergenIds;
        return { allergenIds: update.allergenIds };
      },
    },
  });
  try {
    const result = await server.request("/api/allergen-preferences", "PUT", {
      allergenIds: ["peanuts", "peanuts", "gluten"],
    });
    assert.equal(result.status, 200);
    assert.deepEqual(saved, ["peanuts", "gluten"]);
  } finally {
    await server.close();
  }
});
