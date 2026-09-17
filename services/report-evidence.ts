import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export const MAX_EVIDENCE_IMAGES = 3;

// Keep the longest side readable for a barcode/label while trimming a
// typical modern phone photo (often 3000-4000px) down to a practical
// upload size.
const MAX_DIMENSION = 1800;
const JPEG_QUALITY_PRIMARY = 0.82;
const JPEG_QUALITY_FALLBACK = 0.55;
const CLIENT_MAX_BYTES = 6 * 1024 * 1024;

export type PendingEvidenceImage = {
  localUri: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  position: number;
};

export type EvidencePickOutcome =
  | { status: "picked"; images: PendingEvidenceImage[]; skippedOversized: number }
  | { status: "cancelled" }
  | { status: "permission-denied" }
  | { status: "error"; message: string };

function evidenceDirectory(draftId: string) {
  return new Directory(Paths.document, "report-evidence", draftId);
}

function randomFileToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function compressForUpload(asset: {
  uri: string;
  width: number;
  height: number;
}) {
  const context = ImageManipulator.manipulate(asset.uri);

  if (asset.width > 0 && asset.height > 0) {
    const longestSide = Math.max(asset.width, asset.height);

    if (longestSide > MAX_DIMENSION) {
      if (asset.width >= asset.height) {
        context.resize({ width: MAX_DIMENSION });
      } else {
        context.resize({ height: MAX_DIMENSION });
      }
    }
  }

  const rendered = await context.renderAsync();
  let result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY_PRIMARY,
  });
  let file = new File(result.uri);

  if (file.size > CLIENT_MAX_BYTES) {
    // A very detailed photo can still be large at quality 0.82; one more
    // pass at a lower quality keeps barcodes/text readable while getting
    // well under the limit for the overwhelming majority of photos.
    result = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: JPEG_QUALITY_FALLBACK,
    });
    file = new File(result.uri);
  }

  return { uri: result.uri, width: result.width, height: result.height, byteSize: file.size };
}

// Copies a processed (already resized/compressed) image out of the cache
// directory into durable app document storage, so it survives even if the
// OS reclaims cache space before the report finishes syncing.
async function copyToDurableStorage(sourceUri: string, draftId: string) {
  const directory = evidenceDirectory(draftId);
  directory.create({ intermediates: true, idempotent: true });

  const destination = new File(directory, `${randomFileToken()}.jpg`);
  const source = new File(sourceUri);

  await source.copy(destination);

  return destination;
}

async function processAndStoreAsset(
  asset: { uri: string; width: number; height: number },
  draftId: string,
  position: number,
): Promise<{ image: PendingEvidenceImage; oversized: boolean }> {
  const compressed = await compressForUpload(asset);

  if (compressed.byteSize > CLIENT_MAX_BYTES) {
    return {
      oversized: true,
      image: {
        localUri: "",
        mimeType: "image/jpeg",
        byteSize: compressed.byteSize,
        width: compressed.width,
        height: compressed.height,
        position,
      },
    };
  }

  const durableFile = await copyToDurableStorage(compressed.uri, draftId);

  return {
    oversized: false,
    image: {
      localUri: durableFile.uri,
      mimeType: "image/jpeg",
      byteSize: durableFile.size,
      width: compressed.width,
      height: compressed.height,
      position,
    },
  };
}

async function processPickedAssets(
  assets: ImagePicker.ImagePickerAsset[],
  draftId: string,
  startingPosition: number,
): Promise<EvidencePickOutcome> {
  const images: PendingEvidenceImage[] = [];
  let skippedOversized = 0;

  for (const [index, asset] of assets.entries()) {
    const processed = await processAndStoreAsset(
      { uri: asset.uri, width: asset.width || 0, height: asset.height || 0 },
      draftId,
      startingPosition + index,
    );

    if (processed.oversized) {
      skippedOversized += 1;
      continue;
    }

    images.push(processed.image);
  }

  return { status: "picked", images, skippedOversized };
}

export async function pickEvidenceFromLibrary(
  draftId: string,
  remainingSlots: number,
): Promise<EvidencePickOutcome> {
  if (remainingSlots <= 0) {
    return { status: "picked", images: [], skippedOversized: 0 };
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return { status: "permission-denied" };
  }

  try {
    const selection = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 1,
    });

    if (selection.canceled || selection.assets.length === 0) {
      return { status: "cancelled" };
    }

    return await processPickedAssets(selection.assets, draftId, 0);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not read the selected photo.",
    };
  }
}

export async function captureEvidenceFromCamera(
  draftId: string,
): Promise<EvidencePickOutcome> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    return { status: "permission-denied" };
  }

  try {
    const capture = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (capture.canceled || capture.assets.length === 0) {
      return { status: "cancelled" };
    }

    return await processPickedAssets(capture.assets, draftId, 0);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not use the camera.",
    };
  }
}

// Deletes a single durable local evidence file (the user removed or is
// replacing one photo before submitting).
export function deleteLocalEvidenceFile(uri: string) {
  try {
    const file = new File(uri);

    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.log("Failed to delete a local report evidence file:", error);
  }
}

// Deletes every durable local copy queued for a report (successful sync,
// permanent removal by the user, or a fresh draft being discarded).
export function deleteLocalEvidence(draftId: string) {
  try {
    const directory = evidenceDirectory(draftId);

    if (directory.exists) {
      directory.delete();
    }
  } catch (error) {
    console.log("Failed to delete local report evidence files:", error);
  }
}

export type ReportEvidenceMeta = {
  id: string;
  url: string | null;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  position: number;
  createdAt: string;
};

// Uploads (and atomically replaces) the full evidence set for a report that
// already exists on the backend. Safe to retry: replaying the same set of
// local files converges on the same server-side result instead of creating
// duplicates.
export async function uploadReportEvidence(
  apiUrl: string,
  token: string,
  reportId: string,
  images: PendingEvidenceImage[],
): Promise<ReportEvidenceMeta[]> {
  const formData = new FormData();

  for (const image of [...images].sort((a, b) => a.position - b.position)) {
    // Expo's fetch/FormData implementation does not support the classic RN
    // `{ uri, name, type }` part shape ("uri is not supported"); it needs a
    // real Blob/File-like value with a `.bytes()` method, which expo-file-
    // system's `File` provides.
    formData.append("images", new File(image.localUri) as unknown as Blob);
  }

  const response = await fetch(`${apiUrl}/api/reports/${reportId}/evidence`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    report?: { evidence?: ReportEvidenceMeta[] };
  };

  if (!response.ok) {
    throw new Error(
      body.message || `Failed to upload photo evidence (${response.status}).`,
    );
  }

  return body.report?.evidence ?? [];
}
