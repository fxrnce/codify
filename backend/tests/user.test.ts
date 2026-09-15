import assert from "node:assert/strict";
import { test } from "node:test";

import type { getAuth } from "@clerk/express";
import type { prisma } from "../src/lib/prisma.js";
import { createUserRouter } from "../src/routes/user.routes.js";
import { startTestServer } from "./test-helpers.js";

function fakeAuth(authenticated: boolean) {
  return (() =>
    authenticated
      ? { isAuthenticated: true, userId: "user_1", sessionId: "sess_1" }
      : { isAuthenticated: false, userId: null }) as unknown as typeof getAuth;
}

test("GET /me rejects an unauthenticated request", async () => {
  const server = await startTestServer(
    "/api",
    createUserRouter(undefined, fakeAuth(false)),
  );
  try {
    const result = await server.request("/api/me");
    assert.equal(result.status, 401);
  } finally {
    await server.close();
  }
});

test("GET /me upserts the database user and returns their role", async () => {
  const db = {
    user: {
      upsert: async () => ({
        id: "00000000-0000-4000-8000-000000000001",
        clerkUserId: "user_1",
        role: "ADMIN",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-02"),
      }),
    },
  } as unknown as typeof prisma;
  const server = await startTestServer("/api", createUserRouter(db, fakeAuth(true)));
  try {
    const result = await server.request("/api/me");
    assert.equal(result.status, 200);
    assert.equal(result.body.user.role, "ADMIN");
    assert.equal(result.body.user.sessionId, "sess_1");
  } finally {
    await server.close();
  }
});
