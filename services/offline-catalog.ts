import * as SQLite from "expo-sqlite";

import { demoProducts, type DemoProduct } from "@/constants/MockData";
import type {
  FdaAdvisory,
  FdaAdvisoryCategory,
  FdaAdvisoryStatus,
} from "@/types/fda-advisory";

const DATABASE_NAME = "codify-offline.db";
const DATABASE_VERSION = 1;

type CachedPayload = { payload: string };
type CountRow = { count: number };
type MetadataRow = { value: string };

export type CachedAdvisoryFilters = {
  query?: string;
  category?: FdaAdvisoryCategory;
  status?: FdaAdvisoryStatus;
  page?: number;
  limit?: number;
};

export type OfflineCacheStatus = {
  productsUpdatedAt: string | null;
  advisoriesUpdatedAt: string | null;
  advisoriesUpdatedThrough: string | null;
  lastSyncedAt: string | null;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function equivalentBarcode(barcode: string) {
  if (/^\d{12}$/.test(barcode)) return `0${barcode}`;
  if (/^0\d{12}$/.test(barcode)) return barcode.slice(1);
  return barcode;
}

function parseProduct(payload: string): DemoProduct | null {
  try {
    const product = JSON.parse(payload) as Partial<DemoProduct>;
    if (
      typeof product.id !== "string" ||
      typeof product.barcode !== "string" ||
      typeof product.name !== "string" ||
      typeof product.brand !== "string" ||
      !Array.isArray(product.ingredients) ||
      !Array.isArray(product.allergens) ||
      !Array.isArray(product.alternatives)
    ) {
      return null;
    }
    return product as DemoProduct;
  } catch {
    return null;
  }
}

function parseAdvisory(payload: string): FdaAdvisory | null {
  try {
    const advisory = JSON.parse(payload) as Partial<FdaAdvisory>;
    if (
      typeof advisory.advisoryNumber !== "string" ||
      typeof advisory.title !== "string" ||
      typeof advisory.publishedAt !== "string" ||
      typeof advisory.sourceUrl !== "string"
    ) {
      return null;
    }
    return advisory as FdaAdvisory;
  } catch {
    return null;
  }
}

async function insertProducts(
  database: Pick<SQLite.SQLiteDatabase, "prepareAsync">,
  products: DemoProduct[],
) {
  const statement = await database.prepareAsync(`
    INSERT OR REPLACE INTO cached_products
      (barcode, equivalent_barcode, name, brand, category, payload)
    VALUES ($barcode, $equivalentBarcode, $name, $brand, $category, $payload)
  `);
  try {
    for (const product of products) {
      await statement.executeAsync({
        $barcode: product.barcode,
        $equivalentBarcode: equivalentBarcode(product.barcode),
        $name: product.name,
        $brand: product.brand,
        $category: product.category,
        $payload: JSON.stringify(product),
      });
    }
  } finally {
    await statement.finalizeAsync();
  }
}

async function initializeDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS cached_products (
      barcode TEXT PRIMARY KEY NOT NULL,
      equivalent_barcode TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS cached_products_name_idx
      ON cached_products(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS cached_products_equivalent_barcode_idx
      ON cached_products(equivalent_barcode);
    CREATE TABLE IF NOT EXISTS cached_advisories (
      advisory_number TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      published_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS cached_advisories_published_idx
      ON cached_advisories(published_at DESC, advisory_number DESC);
    CREATE TABLE IF NOT EXISTS cache_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const version = await database.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  if ((version?.user_version ?? 0) < DATABASE_VERSION) {
    await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }

  const count = await database.getFirstAsync<CountRow>(
    "SELECT COUNT(*) AS count FROM cached_products",
  );
  if ((count?.count ?? 0) === 0) {
    await insertProducts(database, demoProducts);
  }
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(
      async (database) => {
        await initializeDatabase(database);
        return database;
      },
    );
  }
  return databasePromise;
}

export async function getCachedProducts() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<CachedPayload>(
    "SELECT payload FROM cached_products ORDER BY name COLLATE NOCASE, brand COLLATE NOCASE",
  );
  return rows
    .map((row) => parseProduct(row.payload))
    .filter((product): product is DemoProduct => product !== null);
}

export async function getCachedProduct(barcode: string) {
  const database = await getDatabase();
  const normalized = barcode.trim();
  const row = await database.getFirstAsync<CachedPayload>(
    `SELECT payload FROM cached_products
     WHERE barcode = ? OR equivalent_barcode = ? OR barcode = ?
     LIMIT 1`,
    normalized,
    normalized,
    equivalentBarcode(normalized),
  );
  return row ? parseProduct(row.payload) : null;
}

export async function replaceCachedProducts(products: DemoProduct[]) {
  if (products.length === 0) return;
  const database = await getDatabase();
  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync("DELETE FROM cached_products");
    await insertProducts(transaction, products);
    await transaction.runAsync(
      "INSERT OR REPLACE INTO cache_metadata (key, value) VALUES (?, ?)",
      "productsUpdatedAt",
      new Date().toISOString(),
    );
  });
}

export async function cacheProduct(product: DemoProduct) {
  const database = await getDatabase();
  await insertProducts(database, [product]);
}

export async function removeCachedProduct(barcode: string) {
  const database = await getDatabase();
  const normalized = barcode.trim();
  await database.runAsync(
    "DELETE FROM cached_products WHERE barcode = ? OR equivalent_barcode = ? OR barcode = ?",
    normalized,
    normalized,
    equivalentBarcode(normalized),
  );
}

async function insertAdvisories(
  database: Pick<SQLite.SQLiteDatabase, "prepareAsync">,
  advisories: FdaAdvisory[],
) {
  const statement = await database.prepareAsync(`
    INSERT OR REPLACE INTO cached_advisories
      (advisory_number, title, category, status, published_at, payload)
    VALUES ($advisoryNumber, $title, $category, $status, $publishedAt, $payload)
  `);
  try {
    for (const advisory of advisories) {
      await statement.executeAsync({
        $advisoryNumber: advisory.advisoryNumber,
        $title: advisory.title,
        $category: advisory.category,
        $status: advisory.status,
        $publishedAt: advisory.publishedAt,
        $payload: JSON.stringify(advisory),
      });
    }
  } finally {
    await statement.finalizeAsync();
  }
}

export async function cacheAdvisories(
  advisories: FdaAdvisory[],
  updatedThrough: string,
) {
  const database = await getDatabase();
  await database.withExclusiveTransactionAsync(async (transaction) => {
    await insertAdvisories(transaction, advisories);
    if (updatedThrough) {
      await transaction.runAsync(
        "INSERT OR REPLACE INTO cache_metadata (key, value) VALUES (?, ?)",
        "advisoriesUpdatedThrough",
        updatedThrough,
      );
    }
  });
}

export async function replaceCachedAdvisories(
  advisories: FdaAdvisory[],
  updatedThrough: string,
) {
  const database = await getDatabase();
  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync("DELETE FROM cached_advisories");
    await insertAdvisories(transaction, advisories);
    if (updatedThrough) {
      await transaction.runAsync(
        "INSERT OR REPLACE INTO cache_metadata (key, value) VALUES (?, ?)",
        "advisoriesUpdatedThrough",
        updatedThrough,
      );
    }
    await transaction.runAsync(
      "INSERT OR REPLACE INTO cache_metadata (key, value) VALUES (?, ?)",
      "advisoriesUpdatedAt",
      new Date().toISOString(),
    );
  });
}

export async function getOfflineCacheStatus(): Promise<OfflineCacheStatus> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM cache_metadata
     WHERE key IN (?, ?, ?)`,
    "productsUpdatedAt",
    "advisoriesUpdatedAt",
    "advisoriesUpdatedThrough",
  );
  const metadata = new Map(rows.map((row) => [row.key, row.value]));
  const productsUpdatedAt = metadata.get("productsUpdatedAt") ?? null;
  const advisoriesUpdatedAt = metadata.get("advisoriesUpdatedAt") ?? null;
  const validTimestamps = [productsUpdatedAt, advisoriesUpdatedAt].filter(
    (value): value is string =>
      typeof value === "string" && !Number.isNaN(new Date(value).getTime()),
  );
  const lastSyncedAt =
    validTimestamps.length > 0
      ? validTimestamps.sort(
          (first, second) =>
            new Date(second).getTime() - new Date(first).getTime(),
        )[0]
      : null;

  return {
    productsUpdatedAt,
    advisoriesUpdatedAt,
    advisoriesUpdatedThrough:
      metadata.get("advisoriesUpdatedThrough") ?? null,
    lastSyncedAt,
  };
}

export async function getCachedAdvisory(advisoryNumber: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<CachedPayload>(
    "SELECT payload FROM cached_advisories WHERE advisory_number = ?",
    advisoryNumber.trim().toUpperCase(),
  );
  return row ? parseAdvisory(row.payload) : null;
}

export async function removeCachedAdvisory(advisoryNumber: string) {
  const database = await getDatabase();
  await database.runAsync(
    "DELETE FROM cached_advisories WHERE advisory_number = ?",
    advisoryNumber.trim().toUpperCase(),
  );
}

export async function queryCachedAdvisories(
  filters: CachedAdvisoryFilters = {},
) {
  const database = await getDatabase();
  const where: string[] = [];
  const values: (string | number)[] = [];
  const query = filters.query?.trim();
  if (query) {
    where.push("(advisory_number LIKE ? COLLATE NOCASE OR title LIKE ? COLLATE NOCASE)");
    values.push(`%${query}%`, `%${query}%`);
  }
  if (filters.category) {
    where.push("category = ?");
    values.push(filters.category);
  }
  if (filters.status) {
    where.push("status = ?");
    values.push(filters.status);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.max(1, Math.min(filters.limit ?? 20, 50));
  const countRow = await database.getFirstAsync<CountRow>(
    `SELECT COUNT(*) AS count FROM cached_advisories ${whereSql}`,
    values,
  );
  const total = countRow?.count ?? 0;
  const rows = await database.getAllAsync<CachedPayload>(
    `SELECT payload FROM cached_advisories ${whereSql}
     ORDER BY published_at DESC, advisory_number DESC LIMIT ? OFFSET ?`,
    [...values, limit, (page - 1) * limit],
  );
  const metadata = await database.getFirstAsync<MetadataRow>(
    "SELECT value FROM cache_metadata WHERE key = ?",
    "advisoriesUpdatedThrough",
  );
  return {
    advisories: rows
      .map((row) => parseAdvisory(row.payload))
      .filter((advisory): advisory is FdaAdvisory => advisory !== null),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    updatedThrough: metadata?.value ?? "",
  };
}
