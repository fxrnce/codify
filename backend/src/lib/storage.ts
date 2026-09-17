import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../config/env.js";

// A small provider-agnostic abstraction over object storage, so report
// evidence photos can live in any S3-compatible bucket (Cloudflare R2,
// Supabase Storage, AWS S3, Backblaze B2, MinIO, ...) without the rest of
// the backend knowing which provider is configured.
export interface ObjectStorage {
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
  getSignedGetUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}

const SIGNED_URL_TTL_SECONDS = 15 * 60;

class S3CompatibleStorage implements ObjectStorage {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async putObject(key: string, body: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getSignedGetUrl(key: string, expiresInSeconds = SIGNED_URL_TTL_SECONDS) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  async deleteObject(key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}

let cachedStorage: ObjectStorage | null | undefined;

// Returns null (rather than throwing) when storage credentials are not
// configured, so evidence upload/view routes can respond with a clear,
// retryable "not configured" error instead of the whole server failing to
// boot. Report text submission never depends on this.
export function getObjectStorage(): ObjectStorage | null {
  if (cachedStorage !== undefined) {
    return cachedStorage;
  }

  const bucket = env.STORAGE_S3_BUCKET;
  const accessKeyId = env.STORAGE_S3_ACCESS_KEY_ID;
  const secretAccessKey = env.STORAGE_S3_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    cachedStorage = null;
    return cachedStorage;
  }

  const client = new S3Client({
    region: env.STORAGE_S3_REGION || "auto",
    endpoint: env.STORAGE_S3_ENDPOINT || undefined,
    forcePathStyle: env.STORAGE_S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  cachedStorage = new S3CompatibleStorage(client, bucket);
  return cachedStorage;
}

// Test-only escape hatch: the cached singleton is convenient in the running
// server but would leak configuration between unit tests.
export function resetObjectStorageCacheForTests() {
  cachedStorage = undefined;
}
