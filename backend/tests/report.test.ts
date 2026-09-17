import assert from "node:assert/strict";
import { test } from "node:test";

import type { getAuth } from "@clerk/express";
import type { prisma } from "../src/lib/prisma.js";
import { createReportRouter } from "../src/routes/report.routes.js";
import type { ObjectStorage } from "../src/lib/storage.js";
import { startTestServer } from "./test-helpers.js";

const userId = "00000000-0000-4000-8000-000000000001";
const otherUserId = "00000000-0000-4000-8000-000000000002";
const reportId = "00000000-0000-4000-8000-0000000000aa";

// A minimal, valid JPEG signature (SOI + APP0 + JFIF marker) followed by
// filler bytes. `file-type` sniffs real magic bytes, not the declared
// Content-Type or filename, so this is enough to pass as a real photo.
function jpegBytes(size = 256) {
  const header = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);
  return Buffer.concat([header, Buffer.alloc(Math.max(size - header.length, 0), 0)]);
}

function fakeAuth(id: string | null) {
  return (() =>
    id
      ? { isAuthenticated: true, userId: id, sessionId: "sess_1" }
      : { isAuthenticated: false, userId: null }) as unknown as typeof getAuth;
}

function fakeStorage(overrides: Partial<ObjectStorage> = {}) {
  const puts: { key: string; contentType: string; byteLength: number }[] = [];
  const deletes: string[] = [];

  return {
    puts,
    deletes,
    async putObject(key: string, body: Buffer, contentType: string) {
      puts.push({ key, contentType, byteLength: body.byteLength });
    },
    async getSignedGetUrl(key: string) {
      return `https://storage.example.test/${key}?signed=1`;
    },
    async deleteObject(key: string) {
      deletes.push(key);
    },
    ...overrides,
  } satisfies ObjectStorage & { puts: typeof puts; deletes: typeof deletes };
}

// A tiny in-memory stand-in for the report_evidence table so tests can
// observe real create/delete/find behavior (including idempotent replace
// semantics) without a live database.
function makeEvidenceStore(
  initial: { id: string; reportId: string; storageKey: string; mimeType: string; byteSize: number; position: number }[] = [],
) {
  let rows = initial.map((row) => ({ ...row, createdAt: new Date() }));

  return {
    rows: () => rows,
    async findMany({ where }: { where: { reportId: string } }) {
      return rows
        .filter((row) => row.reportId === where.reportId)
        .sort((a, b) => a.position - b.position);
    },
    async deleteMany({ where }: { where: { reportId: string } }) {
      rows = rows.filter((row) => row.reportId !== where.reportId);
    },
    async createMany({ data }: { data: { reportId: string; storageKey: string; mimeType: string; byteSize: number; position: number }[] }) {
      rows.push(
        ...data.map((item, index) => ({
          id: `evidence-${rows.length + index}`,
          createdAt: new Date(),
          ...item,
        })),
      );
    },
  };
}

function makeDb(options: {
  reportRow?: { id: string; userId: string } | null;
  evidenceStore?: ReturnType<typeof makeEvidenceStore>;
  storageCleanupTasks?: { storageKey: string; reason: string }[];
} = {}) {
  const evidenceStore = options.evidenceStore ?? makeEvidenceStore();
  const storageCleanupTasks = options.storageCleanupTasks ?? [];

  return {
    user: { upsert: async () => ({ id: userId }) },
    product: { findUnique: async () => null },
    productReport: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: reportId,
        barcode: null,
        productName: "",
        brand: "",
        category: "",
        reason: "Other concern",
        notes: "",
        submittedAt: new Date(),
        status: "PENDING",
        resolutionNote: "",
        reviewedAt: null,
        updatedAt: new Date(),
        clientReportId: null,
        ...data,
      }),
      upsert: async ({ create }: { create: Record<string, unknown> }) => ({
        id: reportId,
        barcode: null,
        productName: "",
        brand: "",
        category: "",
        reason: "Other concern",
        notes: "",
        submittedAt: new Date(),
        status: "PENDING",
        resolutionNote: "",
        reviewedAt: null,
        updatedAt: new Date(),
        clientReportId: null,
        ...create,
      }),
      findMany: async () => [],
      findUnique: async () =>
        options.reportRow === undefined
          ? {
              id: reportId,
              userId,
              barcode: null,
              productName: "Test Product",
              brand: "Test Brand",
              category: "Food",
              reason: "Other concern",
              notes: "",
              submittedAt: new Date(),
              status: "PENDING",
              resolutionNote: "",
              reviewedAt: null,
              updatedAt: new Date(),
              clientReportId: null,
            }
          : options.reportRow,
    },
    reportEvidence: evidenceStore,
    storageCleanupTask: {
      create: async ({ data }: { data: { storageKey: string; reason: string } }) => {
        storageCleanupTasks.push(data);
      },
    },
    async $transaction<T>(callback: (tx: ReturnType<typeof makeDb>) => Promise<T>) {
      return callback(this as unknown as ReturnType<typeof makeDb>);
    },
  } as unknown as typeof prisma;
}

async function startReportServer(
  db: typeof prisma,
  storage: ObjectStorage | null,
  authUserId: string | null = userId,
) {
  return startTestServer("/api", createReportRouter(db, fakeAuth(authUserId), storage));
}

async function putEvidence(
  port: number,
  id: string,
  files: { bytes: Buffer; type: string; name: string }[],
) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", new Blob([file.bytes], { type: file.type }), file.name);
  }

  const response = await fetch(`http://127.0.0.1:${port}/api/reports/${id}/evidence`, {
    method: "PUT",
    body: formData,
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

test("POST /reports without a photo creates a report with an empty evidence array", async () => {
  const db = makeDb();
  const server = await startReportServer(db, fakeStorage());
  try {
    const result = await server.request("/api/reports", "POST", {
      productName: "Test Product",
      brand: "Test Brand",
      category: "Food",
      reason: "Other concern",
      notes: "",
    });
    assert.equal(result.status, 201);
    assert.deepEqual(result.body.report.evidence, []);
  } finally {
    await server.close();
  }
});

test("PUT /reports/:id/evidence uploads valid photos and returns signed evidence metadata in order", async () => {
  const db = makeDb();
  const storage = fakeStorage();
  const server = await startReportServer(db, storage);
  try {
    const result = await putEvidence(server.port, reportId, [
      { bytes: jpegBytes(), type: "image/jpeg", name: "front.jpg" },
      { bytes: jpegBytes(), type: "image/jpeg", name: "barcode.jpg" },
    ]);

    assert.equal(result.status, 200);
    assert.equal(result.body.report.evidence.length, 2);
    assert.equal(result.body.report.evidence[0].position, 0);
    assert.equal(result.body.report.evidence[1].position, 1);
    assert.equal(result.body.report.evidence[0].mimeType, "image/jpeg");
    assert(result.body.report.evidence[0].url.startsWith("https://storage.example.test/"));
    assert.equal(storage.puts.length, 2);
    assert.equal(storage.deletes.length, 0);
  } finally {
    await server.close();
  }
});

test("PUT /reports/:id/evidence rejects more than three photos without uploading anything", async () => {
  const db = makeDb();
  const storage = fakeStorage();
  const server = await startReportServer(db, storage);
  try {
    const result = await putEvidence(server.port, reportId, [
      { bytes: jpegBytes(), type: "image/jpeg", name: "1.jpg" },
      { bytes: jpegBytes(), type: "image/jpeg", name: "2.jpg" },
      { bytes: jpegBytes(), type: "image/jpeg", name: "3.jpg" },
      { bytes: jpegBytes(), type: "image/jpeg", name: "4.jpg" },
    ]);

    assert.equal(result.status, 400);
    assert.equal(storage.puts.length, 0);
  } finally {
    await server.close();
  }
});

test("PUT /reports/:id/evidence rejects a file whose real bytes are not a supported image, even with a spoofed type", async () => {
  const db = makeDb();
  const storage = fakeStorage();
  const server = await startReportServer(db, storage);
  try {
    const notActuallyAnImage = Buffer.from(
      "this is plain text pretending to be a photo".repeat(4),
    );
    const result = await putEvidence(server.port, reportId, [
      { bytes: notActuallyAnImage, type: "image/jpeg", name: "fake.jpg" },
    ]);

    assert.equal(result.status, 400);
    assert.equal(result.body.errors[0].reason, "unsupported-type");
    assert.equal(storage.puts.length, 0);
  } finally {
    await server.close();
  }
});

test("PUT /reports/:id/evidence rejects an oversized photo", async () => {
  const db = makeDb();
  const storage = fakeStorage();
  const server = await startReportServer(db, storage);
  try {
    const oversized = jpegBytes(7 * 1024 * 1024);
    const result = await putEvidence(server.port, reportId, [
      { bytes: oversized, type: "image/jpeg", name: "big.jpg" },
    ]);

    assert.equal(result.status, 400);
    assert.equal(storage.puts.length, 0);
  } finally {
    await server.close();
  }
});

test("PUT /reports/:id/evidence returns 404 for a report owned by a different user", async () => {
  const db = makeDb({ reportRow: { id: reportId, userId: otherUserId } });
  const storage = fakeStorage();
  const server = await startReportServer(db, storage);
  try {
    const result = await putEvidence(server.port, reportId, [
      { bytes: jpegBytes(), type: "image/jpeg", name: "front.jpg" },
    ]);

    assert.equal(result.status, 404);
    assert.equal(storage.puts.length, 0);
  } finally {
    await server.close();
  }
});

test("PUT /reports/:id/evidence responds 503 when storage is not configured, without touching the report", async () => {
  const db = makeDb();
  const server = await startReportServer(db, null);
  try {
    const result = await putEvidence(server.port, reportId, [
      { bytes: jpegBytes(), type: "image/jpeg", name: "front.jpg" },
    ]);

    assert.equal(result.status, 503);
  } finally {
    await server.close();
  }
});

test("PUT /reports/:id/evidence is idempotent: replaying the same upload converges on two images, not four", async () => {
  const evidenceStore = makeEvidenceStore();
  const db = makeDb({ evidenceStore });
  const storage = fakeStorage();
  const server = await startReportServer(db, storage);
  try {
    const files = [
      { bytes: jpegBytes(), type: "image/jpeg", name: "front.jpg" },
      { bytes: jpegBytes(), type: "image/jpeg", name: "barcode.jpg" },
    ];

    const first = await putEvidence(server.port, reportId, files);
    assert.equal(first.status, 200);
    assert.equal(evidenceStore.rows().length, 2);

    // Simulate the client retrying after never seeing the first response
    // (e.g. the connection dropped after the server had already replied).
    const second = await putEvidence(server.port, reportId, files);
    assert.equal(second.status, 200);
    assert.equal(evidenceStore.rows().length, 2);
    assert.equal(second.body.report.evidence.length, 2);
  } finally {
    await server.close();
  }
});

test("a failed upload leaves existing evidence untouched and cleans up the partial attempt", async () => {
  const evidenceStore = makeEvidenceStore([
    {
      id: "existing",
      reportId,
      storageKey: "report-evidence/existing.jpg",
      mimeType: "image/jpeg",
      byteSize: 256,
      position: 0,
    },
  ]);
  const db = makeDb({ evidenceStore });

  let putCount = 0;
  const partiallyUploadedKeys: string[] = [];
  const storage = fakeStorage({
    async putObject(key: string) {
      putCount += 1;
      if (putCount === 2) {
        throw new Error("simulated network drop");
      }
      partiallyUploadedKeys.push(key);
    },
  });

  const server = await startReportServer(db, storage);
  try {
    const result = await putEvidence(server.port, reportId, [
      { bytes: jpegBytes(), type: "image/jpeg", name: "1.jpg" },
      { bytes: jpegBytes(), type: "image/jpeg", name: "2.jpg" },
    ]);

    assert(result.status >= 500);
    // The one file that did upload before the failure must be cleaned up...
    assert.deepEqual(storage.deletes, partiallyUploadedKeys);
    // ...and the report's existing evidence must be completely unaffected,
    // so the failed attempt is safely retryable.
    assert.equal(evidenceStore.rows().length, 1);
    assert.equal(evidenceStore.rows()[0].id, "existing");
  } finally {
    await server.close();
  }
});

test("GET /reports scopes evidence to the authenticated owner and includes signed URLs", async () => {
  const db = makeDb();
  db.productReport.findMany = (async () => [
    {
      id: reportId,
      barcode: null,
      productName: "Test Product",
      brand: "Test Brand",
      category: "Food",
      reason: "Other concern",
      notes: "",
      submittedAt: new Date(),
      status: "PENDING",
      resolutionNote: "",
      reviewedAt: null,
      updatedAt: new Date(),
      clientReportId: null,
      evidence: [
        {
          id: "evidence-0",
          storageKey: "report-evidence/x.jpg",
          mimeType: "image/jpeg",
          byteSize: 256,
          width: null,
          height: null,
          position: 0,
          createdAt: new Date(),
        },
      ],
    },
  ]) as unknown as typeof db.productReport.findMany;

  const server = await startReportServer(db, fakeStorage());
  try {
    const result = await server.request("/api/reports");
    assert.equal(result.status, 200);
    assert.equal(result.body.reports[0].evidence.length, 1);
    assert(result.body.reports[0].evidence[0].url.includes("report-evidence/x.jpg"));
  } finally {
    await server.close();
  }
});
