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

interface DriveConfig {
  credentials: Record<string, unknown>;
  folderId?: string;
}

async function getDriveConfig(): Promise<DriveConfig | null> {
  const keys = ["GCS_CREDENTIALS", "GDRIVE_FOLDER_ID"];
  const rows = await prisma.systemConfig.findMany({ where: { key: { in: keys } } });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const credsRaw = map.get("GCS_CREDENTIALS") || process.env.GCS_CREDENTIALS || "";
  if (!credsRaw) return null;

  try {
    const credentials = JSON.parse(credsRaw) as Record<string, unknown>;
    const folderId = map.get("GDRIVE_FOLDER_ID") || process.env.GDRIVE_FOLDER_ID || undefined;
    return { credentials, folderId };
  } catch {
    console.error("[storage/gdrive] Failed to parse credentials JSON");
    return null;
  }
}

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export class GoogleDriveStorageProvider implements StorageProvider {
  private drive: ReturnType<typeof createDrive>;
  private folderId: string | undefined;

  constructor(credentials: Record<string, unknown>, folderId?: string) {
    const authClient = new driveAuth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
    this.drive = createDrive({ version: "v3", auth: authClient });
    this.folderId = folderId;
  }

  private async ensureFolder(): Promise<string> {
    if (this.folderId) return this.folderId;

    const dbFolder = await prisma.systemConfig
      .findUnique({ where: { key: "GDRIVE_FOLDER_ID" } })
      .catch(() => null);
    if (dbFolder?.value) {
      this.folderId = dbFolder.value;
      return this.folderId;
    }

    const folder = await this.drive.files.create({
      requestBody: {
        name: "Bắc Trung Hải Logistics Uploads",
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });

    const newFolderId = folder.data.id!;

    await this.drive.permissions.create({
      fileId: newFolderId,
      requestBody: { role: "reader", type: "anyone" },
    });

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
    if (admin) {
      await prisma.systemConfig
        .upsert({
          where: { key: "GDRIVE_FOLDER_ID" },
          update: { value: newFolderId, updatedBy: admin.id },
          create: { key: "GDRIVE_FOLDER_ID", value: newFolderId, updatedBy: admin.id },
        })
        .catch(() => {});
    }

    console.log(`[storage/gdrive] Created root folder id=${newFolderId}`);
    this.folderId = newFolderId;
    return newFolderId;
  }

  async upload(buffer: Buffer, key: string): Promise<string> {
    const folderId = await this.ensureFolder();

    const ext = key.split(".").pop()?.toLowerCase() || "";
    const mimeType = MIME_MAP[ext] || "application/octet-stream";

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);

    const res = await this.drive.files.create({
      requestBody: {
        name: key.split("/").pop() || key,
        parents: [folderId],
      },
      media: { mimeType, body: readable },
      fields: "id",
    });

    const fileId = res.data.id!;

    await this.drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    return this.getUrl(fileId);
  }

  async delete(key: string): Promise<void> {
    try {
      await this.drive.files.delete({ fileId: key });
    } catch {
      // file may already be deleted
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
      const config = await getDriveConfig();
      if (!config) {
        console.warn("[storage] Google Drive configured but credentials missing — falling back to local");
        cachedProvider = createLocalProvider();
        cachedProviderType = "local";
        return cachedProvider;
      }
      console.log("[storage] Using Google Drive API");
      cachedProvider = new GoogleDriveStorageProvider(config.credentials, config.folderId);
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
    "/uploads",
  );
}

/** @deprecated Use getStorage() instead for dynamic DB config support */
export const storage = createLocalProvider();
