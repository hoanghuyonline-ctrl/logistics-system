import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { Storage as GCSClient } from "@google-cloud/storage";
import { drive as createDrive, auth as driveAuth } from "@googleapis/drive";
import { prisma } from "@/lib/prisma";

export interface StorageProvider {
  upload(buffer: Buffer, key: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private urlPrefix: string;

  constructor(basePath: string, urlPrefix: string) {
    this.basePath = basePath;
    this.urlPrefix = urlPrefix;
  }

  async upload(buffer: Buffer, key: string): Promise<string> {
    const dir = path.dirname(path.join(this.basePath, key));
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(this.basePath, key), buffer);
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(path.join(this.basePath, key));
    } catch {
      // file may already be deleted
    }
  }

  getUrl(key: string): string {
    return `${this.urlPrefix}/${key}`;
  }
}

// --------------- Google Cloud Storage ---------------

interface GCSConfig {
  bucket: string;
  credentials: Record<string, unknown>;
}

async function getGCSConfig(): Promise<GCSConfig | null> {
  const keys = ["GCS_BUCKET", "GCS_CREDENTIALS"];
  const rows = await prisma.systemConfig.findMany({ where: { key: { in: keys } } });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const bucket = map.get("GCS_BUCKET") || process.env.GCS_BUCKET || "";
  const credsRaw = map.get("GCS_CREDENTIALS") || process.env.GCS_CREDENTIALS || "";

  if (!bucket || !credsRaw) return null;

  try {
    const credentials = JSON.parse(credsRaw) as Record<string, unknown>;
    return { bucket, credentials };
  } catch {
    console.error("[storage/gcs] Failed to parse GCS_CREDENTIALS JSON");
    return null;
  }
}

export class GCSStorageProvider implements StorageProvider {
  private client: GCSClient;
  private bucketName: string;

  constructor(credentials: Record<string, unknown>, bucketName: string) {
    this.client = new GCSClient({ credentials });
    this.bucketName = bucketName;
  }

  async upload(buffer: Buffer, key: string): Promise<string> {
    const bucket = this.client.bucket(this.bucketName);
    const file = bucket.file(key);
    await file.save(buffer, { resumable: false, public: true });
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    try {
      const bucket = this.client.bucket(this.bucketName);
      await bucket.file(key).delete();
    } catch {
      // file may already be deleted
    }
  }

  getUrl(key: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${key}`;
  }
}

// --------------- Google Drive ---------------

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const GDRIVE_FALLBACK_FOLDER_ID = "1jtPybzjZfvhkfe4YAFSrOQv0yQfqB95q";

export class GoogleDriveStorageProvider implements StorageProvider {
  /**
   * Resolve OAuth2 credentials + folderId dynamically at the moment of
   * each operation.  Reads GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET,
   * GDRIVE_REFRESH_TOKEN, and GDRIVE_FOLDER_ID from DB → process.env.
   */
  private async resolveConfig(): Promise<{
    drive: ReturnType<typeof createDrive>;
    folderId: string;
  }> {
    const keys = [
      "GDRIVE_CLIENT_ID",
      "GDRIVE_CLIENT_SECRET",
      "GDRIVE_REFRESH_TOKEN",
      "GDRIVE_FOLDER_ID",
    ];
    const rows = await prisma.systemConfig
      .findMany({ where: { key: { in: keys } } })
      .catch((dbErr) => {
        console.error("[storage/gdrive] DB read failed:", dbErr);
        return [] as { key: string; value: string }[];
      });
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const clientId =
      map.get("GDRIVE_CLIENT_ID") || process.env.GDRIVE_CLIENT_ID || "";
    const clientSecret =
      map.get("GDRIVE_CLIENT_SECRET") || process.env.GDRIVE_CLIENT_SECRET || "";
    const refreshToken =
      map.get("GDRIVE_REFRESH_TOKEN") || process.env.GDRIVE_REFRESH_TOKEN || "";

    if (!clientId || !clientSecret || !refreshToken) {
      const missing = [
        !clientId && "GDRIVE_CLIENT_ID",
        !clientSecret && "GDRIVE_CLIENT_SECRET",
        !refreshToken && "GDRIVE_REFRESH_TOKEN",
      ].filter(Boolean);
      throw new Error(
        `[storage/gdrive] Missing OAuth2 config: ${missing.join(", ")}. Set them in Admin Settings or environment.`,
      );
    }

    const folderId =
      map.get("GDRIVE_FOLDER_ID") ||
      process.env.GDRIVE_FOLDER_ID ||
      GDRIVE_FALLBACK_FOLDER_ID;

    const oauth2Client = new driveAuth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = createDrive({ version: "v3", auth: oauth2Client });

    console.log(
      `[storage/gdrive] OAuth2 config resolved — folderId=${folderId}, clientId=${clientId.slice(0, 12)}...`,
    );
    return { drive, folderId };
  }

  async upload(buffer: Buffer, key: string): Promise<string> {
    try {
      const { drive, folderId } = await this.resolveConfig();

      const ext = key.split(".").pop()?.toLowerCase() || "";
      const mimeType = MIME_MAP[ext] || "application/octet-stream";

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);

      console.log(`[storage/gdrive] Uploading file="${key}" to folder=${folderId}`);

      const res = await drive.files.create({
        requestBody: {
          name: key.split("/").pop() || key,
          parents: [folderId],
        },
        media: { mimeType, body: readable },
        fields: "id",
        supportsAllDrives: true,
      });

      const fileId = res.data.id!;

      await drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
        supportsAllDrives: true,
      });

      console.log(`[storage/gdrive] Upload OK fileId=${fileId}`);
      return this.getUrl(fileId);
    } catch (err) {
      console.error("[storage/gdrive] ❌ UPLOAD FAILED", err);
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { drive } = await this.resolveConfig();
      await drive.files.delete({ fileId: key, supportsAllDrives: true });
    } catch (err) {
      console.error(`[storage/gdrive] Delete failed for fileId=${key}`, err);
    }
  }

  getUrl(key: string): string {
    return `https://drive.google.com/uc?export=view&id=${key}`;
  }
}

/** Extract the Google Drive file ID from a Drive viewable URL. */
export function extractDriveFileId(url: string): string | null {
  const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// --------------- Factory ---------------

let cachedProvider: StorageProvider | null = null;
let cachedProviderType: string | null = null;

/**
 * Returns the active storage provider.
 * Reads STORAGE_PROVIDER from DB (SystemConfig) first, falls back to process.env.
 * Supports: "local" (default), "gcs" (Google Cloud Storage), "gdrive" (Google Drive).
 * Call resetStorageCache() if admin changes config at runtime.
 */
export async function getStorage(): Promise<StorageProvider> {
  const dbProvider = await prisma.systemConfig
    .findUnique({ where: { key: "STORAGE_PROVIDER" } })
    .catch(() => null);
  const providerType = dbProvider?.value || process.env.STORAGE_PROVIDER || "local";

  if (cachedProvider && cachedProviderType === providerType) {
    return cachedProvider;
  }

  switch (providerType) {
    case "gcs": {
      const config = await getGCSConfig();
      if (!config) {
        console.warn("[storage] GCS configured but credentials missing — falling back to local");
        cachedProvider = createLocalProvider();
        cachedProviderType = "local";
        return cachedProvider;
      }
      console.log(`[storage] Using Google Cloud Storage bucket=${config.bucket}`);
      cachedProvider = new GCSStorageProvider(config.credentials, config.bucket);
      cachedProviderType = providerType;
      return cachedProvider;
    }
    case "gdrive": {
      console.log("[storage] Using Google Drive API (config resolved dynamically per operation)");
      cachedProvider = new GoogleDriveStorageProvider();
      cachedProviderType = providerType;
      return cachedProvider;
    }
    case "local":
    default: {
      cachedProvider = createLocalProvider();
      cachedProviderType = "local";
      return cachedProvider;
    }
  }
}

export function resetStorageCache(): void {
  cachedProvider = null;
  cachedProviderType = null;
}

function createLocalProvider(): LocalStorageProvider {
  return new LocalStorageProvider(
    path.join(process.cwd(), "public", "uploads"),
    "/api/uploads",
  );
}

/** @deprecated Use getStorage() instead for dynamic DB config support */
export const storage = createLocalProvider();
