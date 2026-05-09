import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LocalStorageProvider } from "@/lib/storage";
import { mkdtemp, rm, readFile, stat } from "fs/promises";
import path from "path";
import os from "os";

describe("LocalStorageProvider", () => {
  let tmpDir: string;
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "storage-test-"));
    provider = new LocalStorageProvider(tmpDir, "/uploads");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("upload saves file and returns correct URL", async () => {
    const content = Buffer.from("test image data");
    const key = "packages/pkg-123-photo.jpg";

    const url = await provider.upload(content, key);

    expect(url).toBe("/uploads/packages/pkg-123-photo.jpg");

    const saved = await readFile(path.join(tmpDir, key));
    expect(saved).toEqual(content);
  });

  it("upload creates nested directories", async () => {
    const content = Buffer.from("nested file");
    const key = "packages/deep/nested/file.png";

    await provider.upload(content, key);

    const saved = await readFile(path.join(tmpDir, key));
    expect(saved).toEqual(content);
  });

  it("delete removes an uploaded file", async () => {
    const content = Buffer.from("to be deleted");
    const key = "packages/pkg-456-delete.jpg";

    await provider.upload(content, key);

    const beforeDelete = await stat(path.join(tmpDir, key)).catch(() => null);
    expect(beforeDelete).not.toBeNull();

    await provider.delete(key);

    const afterDelete = await stat(path.join(tmpDir, key)).catch(() => null);
    expect(afterDelete).toBeNull();
  });

  it("delete does not throw for missing file", async () => {
    await expect(
      provider.delete("packages/nonexistent.jpg"),
    ).resolves.toBeUndefined();
  });

  it("getUrl returns URL with prefix and key", () => {
    expect(provider.getUrl("packages/img.png")).toBe(
      "/uploads/packages/img.png",
    );
  });
});
