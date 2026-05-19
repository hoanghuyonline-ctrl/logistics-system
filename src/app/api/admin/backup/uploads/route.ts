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

  // Generate timestamped filename
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `uploads-${timestamp}.zip`;
  const filepath = path.join(backupDir, filename);

  // Check if file already exists
  if (fs.existsSync(filepath)) {
    return errorResponse("File backup đã tồn tại, vui lòng thử lại sau", 409);
  }

  const isWindows = process.platform === "win32";

  try {
    if (isWindows) {
      // Windows: use PowerShell Compress-Archive (same as backup-uploads.bat)
      const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${uploadsDir}\\*' -DestinationPath '${filepath}'"`;
      execSync(psCmd, { timeout: 120000 });
    } else {
      // Linux: use zip command
      execSync(`zip -r "${filepath}" .`, {
        cwd: uploadsDir,
        timeout: 120000,
      });
    }

    // Verify zip was created and is not empty
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
      message: `Backup uploads thành công`,
      filename,
      sizeMB,
      createdAt: now.toISOString(),
    });
  } catch (err) {
    // Clean up partial file
    if (fs.existsSync(filepath)) {
      try { fs.unlinkSync(filepath); } catch { /* ignore */ }
    }

    const errMsg = err instanceof Error ? err.message : String(err);
    return errorResponse(`Backup uploads thất bại: ${errMsg.slice(0, 200)}`, 500);
  }
});
