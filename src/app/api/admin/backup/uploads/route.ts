export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

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

  // Check uploads directory exists and has content
  if (!fs.existsSync(uploadsDir)) {
    return errorResponse("Thư mục uploads không tồn tại — không có gì để backup", 404);
  }

  let hasFiles = false;
  try {
    const entries = fs.readdirSync(uploadsDir);
    hasFiles = entries.length > 0;
  } catch {
    return errorResponse("Không đọc được thư mục uploads", 500);
  }

  if (!hasFiles) {
    return errorResponse("Thư mục uploads trống — không có gì để backup", 404);
  }

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
    } catch {
      return errorResponse("Không thể tạo thư mục backup uploads", 500);
    }
  }

  // Strategy 1: Try existing .bat script on Windows
  if (isWindows && fs.existsSync(scriptPath)) {
    try {
      const output = execSync(`cmd /c "${scriptPath}"`, {
        timeout: 180000,
        encoding: "utf-8",
        cwd: projectRoot,
      });

      // Find the latest file after script ran
      const files = fs.readdirSync(backupDir).filter((f) => /^uploads-.*\.zip$/i.test(f));
      if (files.length === 0) {
        return errorResponse("Script chạy xong nhưng không tìm thấy file backup", 500);
      }

      let latestFile = files[0];
      let latestMtime = 0;
      for (const f of files) {
        const stat = fs.statSync(path.join(backupDir, f));
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
          latestFile = f;
        }
      }

      const stat = fs.statSync(path.join(backupDir, latestFile));
      if (stat.size === 0) {
        return errorResponse("Script tạo file backup trống (0 bytes)", 500);
      }

      const sizeMB = Math.round((stat.size / (1024 * 1024)) * 10) / 10;
      const summary = output.split("\n").filter((l) => l.includes("[OK]") || l.includes("[INFO]") || l.includes("[LOI]")).map((l) => l.trim()).join(" | ").slice(0, 300);

      return jsonResponse({
        success: true,
        message: "Backup uploads thành công (via script)",
        filename: latestFile,
        sizeMB,
        createdAt: new Date(latestMtime).toISOString(),
        method: "script",
        summary: summary || "Script hoàn tất",
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return errorResponse(`Script backup-uploads.bat thất bại: ${errMsg.slice(0, 200)}. Script path: scripts\\backup-uploads.bat`, 500);
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
      const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${uploadsDir}\\*' -DestinationPath '${filepath}'"`;
      execSync(psCmd, { timeout: 120000 });
    } else {
      execSync(`zip -r "${filepath}" .`, {
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
      ? `Backup uploads thất bại. Script không tìm thấy tại: scripts\\backup-uploads.bat. Lỗi: ${errMsg.slice(0, 150)}`
      : `Backup uploads thất bại: ${errMsg.slice(0, 200)}`;
    return errorResponse(hint, 500);
  }
});
