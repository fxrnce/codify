import { getAuth } from "@clerk/express";
import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { advisorySchema, equivalentBarcode, productSchema, reportStatusSchema, reviewSchema } from "../lib/admin-validation.js";
import { buildTextSearch } from "../lib/search.js";
import type { Prisma } from "../generated/prisma/client.js";

const querySchema = z.object({
  q: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: reportStatusSchema.optional(),
});
const productUpdateSchema = z.object({ updatedAt: z.iso.datetime(), product: productSchema }).strict();
const advisoryUpdateSchema = z.object({ updatedAt: z.iso.datetime(), advisory: advisorySchema }).strict();
const deleteSchema = z.object({ updatedAt: z.iso.datetime() }).strict();
const includeProduct = {
  nutrition: true,
  ingredients: { orderBy: { position: "asc" as const } },
  allergens: { orderBy: { position: "asc" as const } },
  alternatives: { orderBy: { position: "asc" as const } },
};
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));
type AdminFieldError = { path: string; message: string };
class AdminError extends Error {
  constructor(public status: number, message: string, public fieldErrors?: AdminFieldError[]) { super(message); }
}
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const fieldErrors = result.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message }));
    throw new AdminError(400, fieldErrors.map(issue => `${issue.path}: ${issue.message}`).join("; "), fieldErrors);
  }
  return result.data;
}
function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

// Dependency injection permits authorization tests without a live database or Clerk session.
export function createAdminRouter(db = prisma, authenticate = getAuth) {
  const router = Router();
  router.use(async (request, response, next) => {
    try {
      const auth = authenticate(request);
      if (!auth.isAuthenticated || !auth.userId) throw new AdminError(401, "Sign in to continue.");
      const user = await db.user.findUnique({ where: { clerkUserId: auth.userId } });
      if (user?.role !== "ADMIN") throw new AdminError(403, "This account does not have administrator access.");
      response.locals.adminId = user.id;
      next();
    } catch (error) { next(error); }
  });

  router.get("/session", (_request, response) => {
    response.json({ success: true, role: "ADMIN" });
  });
  router.get("/reports", async (request, response) => {
    const { q, status, page, limit } = parse(querySchema, request.query);
    const where: Prisma.ProductReportWhereInput = {
      ...(status ? { status } : {}),
      ...(q ? { OR: buildTextSearch(["productName", "brand", "barcode"], q) } : {}),
    };
    const reports = await db.productReport.findMany({ where, orderBy: [{ submittedAt: "desc" }, { id: "desc" }], skip: (page - 1) * limit, take: limit });
    const total = await db.productReport.count({ where });
    const counts = await db.productReport.groupBy({ by: ["status"], _count: true });
    response.json({ reports, counts: Object.fromEntries(counts.map(row => [row.status, row._count])), pagination: pagination(page, limit, total) });
  });
  router.get("/reports/:id", async (request, response) => {
    const id = parse(z.uuid(), request.params.id);
    const report = await db.productReport.findUnique({ where: { id } });
    if (!report) throw new AdminError(404, "Report not found.");
    const history = await db.adminAuditLog.findMany({ where: { entityType: "REPORT", entityId: id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, actorId: true, action: true, after: true, createdAt: true } });
    response.json({ report, history });
  });
  router.patch("/reports/:id", async (request, response) => {
    const id = parse(z.uuid(), request.params.id);
    const { updatedAt, ...review } = parse(reviewSchema, request.body);
    const report = await db.$transaction(async tx => {
      const before = await tx.productReport.findUnique({ where: { id } });
      if (!before) throw new AdminError(404, "Report not found.");
      const result = await tx.productReport.updateMany({ where: { id, updatedAt: new Date(updatedAt) }, data: { ...review, reviewedAt: new Date() } });
      if (result.count !== 1) throw new AdminError(409, "This report changed. Reload it before saving your review.");
      const after = await tx.productReport.findUniqueOrThrow({ where: { id } });
      await tx.adminAuditLog.create({ data: { actorId: response.locals.adminId, entityType: "REPORT", entityId: id, action: "REVIEW", before: json({ status: before.status, resolutionNote: before.resolutionNote }), after: json(review) } });
      return after;
    });
    response.json({ report });
  });
  router.delete("/reports/:id", async (request, response) => {
    const id = parse(z.uuid(), request.params.id);
    const { updatedAt } = parse(deleteSchema, request.body);
    await db.$transaction(async tx => {
      const before = await tx.productReport.findUnique({ where: { id } });
      if (!before) throw new AdminError(404, "Report not found.");
      // Log what was deleted before removing it, so there is still an accountability
      // trail even though the report row itself is gone.
      await tx.adminAuditLog.create({ data: { actorId: response.locals.adminId, entityType: "REPORT", entityId: id, action: "DELETE", before: json(before), after: json({ deleted: true }) } });
      const deleted = await tx.productReport.deleteMany({
        where: { id, updatedAt: new Date(updatedAt) },
      });
      if (deleted.count !== 1) throw new AdminError(409, "This report changed. Reload it before deleting.");
    });
    response.json({ success: true });
  });

  router.get("/products", async (request, response) => {
    const { q, page, limit } = parse(querySchema, request.query);
    const where: Prisma.ProductWhereInput = q ? { OR: buildTextSearch(["name", "brand", "barcode"], q) } : {};
    const products = await db.product.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit, select: { id: true, name: true, brand: true, barcode: true, category: true, status: true, isArchived: true, updatedAt: true } });
    response.json({ products, pagination: pagination(page, limit, await db.product.count({ where })) });
  });
  router.get("/products/:id", async (request, response) => {
    const id = parse(z.uuid(), request.params.id);
    const product = await db.product.findUnique({ where: { id }, include: includeProduct });
    if (!product) throw new AdminError(404, "Product not found.");
    response.json({ product });
  });
  async function saveProduct(request: Request, response: Response, create: boolean) {
    const id = create ? undefined : parse(z.uuid(), request.params.id);
    const input = create ? { product: parse(productSchema, request.body), updatedAt: null } : parse(productUpdateSchema, request.body);
    const { nutrition, ingredients, allergens, alternatives, ...fields } = input.product;
    const product = await db.$transaction(async tx => {
      const duplicate = await tx.product.findFirst({ where: { ...(id ? { id: { not: id } } : {}), OR: [{ slug: fields.slug }, { barcode: { in: [fields.barcode, equivalentBarcode(fields.barcode)] } }] } });
      if (duplicate) throw new AdminError(409, "A product already uses this barcode (or its UPC/EAN equivalent) or slug.");
      const before = id ? await tx.product.findUnique({ where: { id }, include: includeProduct }) : null;
      if (id && !before) throw new AdminError(404, "Product not found.");
      if (id) {
        const result = await tx.product.updateMany({ where: { id, updatedAt: new Date(input.updatedAt!) }, data: fields });
        if (result.count !== 1) throw new AdminError(409, "This product changed. Reload it before saving.");
      }
      const childData = {
        ingredients: { create: ingredients.map((item, position) => ({ ...item, position })) },
        allergens: { create: allergens.map((name, position) => ({ name, position })) },
        alternatives: { create: alternatives.map((name, position) => ({ name, position })) },
      };
      const after = id ? await tx.product.update({ where: { id }, data: {
        nutrition: { upsert: { create: nutrition, update: nutrition } },
        ingredients: { deleteMany: {}, ...childData.ingredients },
        allergens: { deleteMany: {}, ...childData.allergens },
        alternatives: { deleteMany: {}, ...childData.alternatives },
      }, include: includeProduct }) : await tx.product.create({ data: { ...fields, nutrition: { create: nutrition }, ...childData }, include: includeProduct });
      await tx.adminAuditLog.create({ data: { actorId: response.locals.adminId, entityType: "PRODUCT", entityId: after.id, action: create ? "CREATE" : "UPDATE", ...(before ? { before: json(before) } : {}), after: json(after) } });
      return after;
    }, { isolationLevel: "Serializable", timeout: 20000 });
    response.status(create ? 201 : 200).json({ product });
  }
  router.post("/products", (request, response) => saveProduct(request, response, true));
  router.put("/products/:id", (request, response) => saveProduct(request, response, false));
  router.delete("/products/:id", async (request, response) => {
    const id = parse(z.uuid(), request.params.id);
    const { updatedAt } = parse(deleteSchema, request.body);
    await db.$transaction(async tx => {
      const before = await tx.product.findUnique({ where: { id }, include: includeProduct });
      if (!before) throw new AdminError(404, "Product not found.");
      await tx.adminAuditLog.create({ data: { actorId: response.locals.adminId, entityType: "PRODUCT", entityId: id, action: "DELETE", before: json(before), after: json({ deleted: true }) } });
      const deleted = await tx.product.deleteMany({
        where: { id, updatedAt: new Date(updatedAt) },
      });
      if (deleted.count !== 1) throw new AdminError(409, "This product changed. Reload it before deleting.");
    });
    response.json({ success: true });
  });

  router.get("/advisories", async (request, response) => {
    const { q, page, limit } = parse(querySchema, request.query);
    const where: Prisma.FdaAdvisoryWhereInput = q ? { OR: buildTextSearch(["title", "advisoryNumber"], q) } : {};
    const advisories = await db.fdaAdvisory.findMany({ where, orderBy: [{ publishedAt: "desc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit });
    response.json({ advisories, pagination: pagination(page, limit, await db.fdaAdvisory.count({ where })) });
  });
  router.get("/advisories/:id", async (request, response) => {
    const id = parse(z.uuid(), request.params.id);
    const advisory = await db.fdaAdvisory.findUnique({ where: { id } });
    if (!advisory) throw new AdminError(404, "Advisory not found.");
    const history = await db.adminAuditLog.findMany({
      where: { entityType: "ADVISORY", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, actorId: true, action: true, after: true, createdAt: true },
    });
    response.json({ advisory, history });
  });
  async function saveAdvisory(request: Request, response: Response, create: boolean) {
    const id = create ? undefined : parse(z.uuid(), request.params.id);
    const input = create ? { advisory: parse(advisorySchema, request.body), updatedAt: null } : parse(advisoryUpdateSchema, request.body);
    const data = { ...input.advisory, publishedAt: new Date(input.advisory.publishedAt) };
    const advisory = await db.$transaction(async tx => {
      const before = id ? await tx.fdaAdvisory.findUnique({ where: { id } }) : null;
      if (id && !before) throw new AdminError(404, "Advisory not found.");
      if (id) {
        const result = await tx.fdaAdvisory.updateMany({ where: { id, updatedAt: new Date(input.updatedAt!) }, data });
        if (result.count !== 1) throw new AdminError(409, "This advisory changed. Reload it before saving.");
      }
      const after = id ? await tx.fdaAdvisory.findUniqueOrThrow({ where: { id } }) : await tx.fdaAdvisory.create({ data });
      await tx.adminAuditLog.create({ data: { actorId: response.locals.adminId, entityType: "ADVISORY", entityId: after.id, action: create ? "CREATE" : "UPDATE", ...(before ? { before: json(before) } : {}), after: json(after) } });
      return after;
    });
    response.status(create ? 201 : 200).json({ advisory });
  }
  router.post("/advisories", (request, response) => saveAdvisory(request, response, true));
  router.put("/advisories/:id", (request, response) => saveAdvisory(request, response, false));
  router.delete("/advisories/:id", async (request, response) => {
    const id = parse(z.uuid(), request.params.id);
    const { updatedAt } = parse(deleteSchema, request.body);
    await db.$transaction(async tx => {
      const before = await tx.fdaAdvisory.findUnique({ where: { id } });
      if (!before) throw new AdminError(404, "Advisory not found.");
      await tx.adminAuditLog.create({ data: { actorId: response.locals.adminId, entityType: "ADVISORY", entityId: id, action: "DELETE", before: json(before), after: json({ deleted: true }) } });
      const deleted = await tx.fdaAdvisory.deleteMany({
        where: { id, updatedAt: new Date(updatedAt) },
      });
      if (deleted.count !== 1) throw new AdminError(409, "This advisory changed. Reload it before deleting.");
    });
    response.json({ success: true });
  });

  router.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (error instanceof AdminError) { response.status(error.status).json({ message: error.message, errors: error.fieldErrors }); return; }
    if (error && typeof error === "object" && "code" in error && ["P2002", "P2034"].includes(String(error.code))) {
      response.status(409).json({ message: "A duplicate or concurrent change was detected. Reload the record before retrying." }); return;
    }
    next(error);
  });
  return router;
}
export const adminRouter = createAdminRouter();
