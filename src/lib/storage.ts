import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export interface StorageProvider {
  upload(buffer: Buffer, key: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

class LocalStorageProvider implements StorageProvider {
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

function createStorage(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || "local";

  switch (provider) {
    case "local":
    default:
      return new LocalStorageProvider(
        path.join(process.cwd(), "public", "uploads"),
        "/uploads",
      );
  }
}

export const storage = createStorage();
