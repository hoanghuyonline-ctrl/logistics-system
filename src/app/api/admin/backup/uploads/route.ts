export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";

function findLatestFile(dir: string, pattern: RegExp): { name: string; mtimeMs: number } | null {
  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((f) => pattern.test(f));
  } catch {
    return null;
  }
  if (files.length === 0) return null;

  let latest = files[0];
  let latestMtime = 0;
  for (const f of files) {
    try {
      const stat = fs.statSync(path.join(dir, f));
      if (stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        latest = f;
      }
    } catch { /* skip */ }
  }
  return { name: latest, mtimeMs: latestMtime };
}

function summarizeOutput(output: string): string {
  return output.split("\n")
    .filter((l) => l.includes("[OK]") || l.includes("[INFO]") || l.includes("[LOI]") || l.includes("ERROR"))
    .map((l) => l.trim())
    .join(" | ")
    .slice(0, 300) || "Script hoàn tất";
}

export const POST = withErrorHandler(async function POST() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const projectRoot = path.resolve(/* turbopackIgnore: true */ process.cwd());
  const uploadsDir = path.join(projectRoot, "uploads");
  const backupDir = path.join(projectRoot, "backups", "uploads");
  const scriptPath = path.join(projectRoot, "scripts", "backup-uploads.bat");
  const isWindows = process.platform === "win32";

  // If uploads/ does not exist, create it and return friendly message
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch { /* ignore */ }
    return jsonResponse({
      success: false,
      message: "Thư mục uploads chưa tồn tại — đã tạo thư mục trống. Chưa có file nào để backup.",
      created: true,
    });
  }

  // Check if uploads has content
  let hasFiles = false;
  try {
    const entries = fs.readdirSync(uploadsDir);
    hasFiles = entries.length > 0;
  } catch {
    return errorResponse("Không đọc được thư mục uploads", 500);
  }

  if (!hasFiles) {
    return jsonResponse({
      success: false,
      message: "Thư mục uploads trống — chưa có file nào để backup. Upload file trước khi backup.",
    });
  }

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
    } catch {
      return errorResponse("Không thể tạo thư mục backup uploads", 500);
    }
  }

  // Strategy 1: Try existing .bat script on Windows using execFileSync
  if (isWindows && fs.existsSync(scriptPath)) {
    try {
      const output = execFileSync("cmd.exe", ["/c", scriptPath], {
        timeout: 180000,
        encoding: "utf-8",
        cwd: projectRoot,
        windowsHide: true,
      });

      const latest = findLatestFile(backupDir, /^uploads-.*\.zip$/i);
      if (!latest) {
        return errorResponse("Script chạy xong nhưng không tìm thấy file backup trong backups/uploads/", 500);
      }

      const stat = fs.statSync(path.join(backupDir, latest.name));
      if (stat.size === 0) {
        return errorResponse("Script tạo file backup trống (0 bytes)", 500);
      }

      const sizeMB = Math.round((stat.size / (1024 * 1024)) * 10) / 10;

      return jsonResponse({
        success: true,
        message: "Backup uploads thành công (via script)",
        filename: latest.name,
        sizeMB,
        createdAt: new Date(latest.mtimeMs).toISOString(),
        method: "script",
        summary: summarizeOutput(output),
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const stderr = (err as { stderr?: string }).stderr;
      const detail = stderr ? stderr.trim().slice(0, 150) : errMsg.slice(0, 200);
      return errorResponse(`Backup uploads thất bại khi chạy scripts\\backup-uploads.bat: ${detail}`, 500);
    }
  }

  // Strategy 2: Direct compression (fallback or Linux)
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `uploads-${timestamp}.zip`;
  const filepath = path.join(backupDir, filename);

  if (fs.existsSync(filepath)) {
    return errorResponse("File backup đã tồn tại, vui lòng thử lại sau", 409);
  }

  try {
    if (isWindows) {
      execFileSync("powershell.exe", [
        "-NoProfile", "-Command",
        `Compress-Archive -Path '${uploadsDir}\\*' -DestinationPath '${filepath}'`,
      ], { timeout: 120000, windowsHide: true });
    } else {
      execFileSync("zip", ["-r", filepath, "."], {
        cwd: uploadsDir,
        timeout: 120000,
      });
    }

    if (!fs.existsSync(filepath)) {
      return errorResponse("File backup không được tạo", 500);
    }

    const stat = fs.statSync(filepath);
    if (stat.size === 0) {
      try { fs.unlinkSync(filepath); } catch { /* ignore */ }
      return errorResponse("File backup trống (0 bytes)", 500);
    }

    const sizeMB = Math.round((stat.size / (1024 * 1024)) * 10) / 10;

    return jsonResponse({
      success: true,
      message: "Backup uploads thành công",
      filename,
      sizeMB,
      createdAt: now.toISOString(),
      method: isWindows ? "powershell" : "zip",
      summary: isWindows ? "Compress-Archive via PowerShell" : "zip command",
    });
  } catch (err) {
    if (fs.existsSync(filepath)) {
      try { fs.unlinkSync(filepath); } catch { /* ignore */ }
    }

    const errMsg = err instanceof Error ? err.message : String(err);
    const hint = isWindows
      ? `Backup uploads thất bại. Lỗi: ${errMsg.slice(0, 200)}`
      : `Backup uploads thất bại: ${errMsg.slice(0, 200)}`;
    return errorResponse(hint, 500);
  }
});
