import { fileTypeFromBuffer } from "file-type";

// The client always re-encodes evidence photos to JPEG (see
// services/report-evidence.ts), but the allowlist stays a little wider so a
// PNG or WEBP taken through a different path is not needlessly rejected.
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const MAX_EVIDENCE_FILES = 3;
export const MAX_EVIDENCE_FILE_BYTES = 6 * 1024 * 1024;

export type EvidenceValidationError = {
  index: number;
  reason: "unsupported-type" | "too-large";
};

export type ValidatedEvidenceFile = {
  index: number;
  buffer: Buffer;
  mimeType: string;
  extension: string;
  byteSize: number;
};

// Never trust the filename or the client-supplied Content-Type: sniff the
// real file signature from the bytes themselves.
export async function validateEvidenceFiles(
  files: { buffer: Buffer }[],
): Promise<
  | { ok: true; files: ValidatedEvidenceFile[] }
  | { ok: false; errors: EvidenceValidationError[] }
> {
  const errors: EvidenceValidationError[] = [];
  const validated: ValidatedEvidenceFile[] = [];

  for (const [index, file] of files.entries()) {
    if (file.buffer.byteLength > MAX_EVIDENCE_FILE_BYTES) {
      errors.push({ index, reason: "too-large" });
      continue;
    }

    const detected = await fileTypeFromBuffer(file.buffer);

    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
      errors.push({ index, reason: "unsupported-type" });
      continue;
    }

    validated.push({
      index,
      buffer: file.buffer,
      mimeType: detected.mime,
      extension: detected.ext,
      byteSize: file.buffer.byteLength,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, files: validated };
}
