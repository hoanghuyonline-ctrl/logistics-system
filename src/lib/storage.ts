import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { Storage as GCSClient } from "@google-cloud/storage";
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

let cachedProvider: StorageProvider | null = null;
let cachedProviderType: string | null = null;

/**
 * Returns the active storage provider.
 * Reads STORAGE_PROVIDER from DB (SystemConfig) first, falls back to process.env.
 * GCS credentials are fetched from DB/env on first call and cached.
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
