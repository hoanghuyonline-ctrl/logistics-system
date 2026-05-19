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
  const backupDir = path.join(projectRoot, "backups", "postgres");
  const scriptPath = path.join(projectRoot, "scripts", "backup-db.bat");
  const isWindows = process.platform === "win32";

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
    } catch {
      return errorResponse("Không thể tạo thư mục backup", 500);
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
      const files = fs.readdirSync(backupDir).filter((f) => /^postgres-.*\.sql$/i.test(f));
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
      const sizeMB = Math.round((stat.size / (1024 * 1024)) * 10) / 10;
      const summary = output.split("\n").filter((l) => l.includes("[OK]") || l.includes("[INFO]") || l.includes("[LOI]")).map((l) => l.trim()).join(" | ").slice(0, 300);

      return jsonResponse({
        success: true,
        message: "Backup database thành công (via script)",
        filename: latestFile,
        sizeMB,
        createdAt: new Date(latestMtime).toISOString(),
        method: "script",
        summary: summary || "Script hoàn tất",
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return errorResponse(`Script backup-db.bat thất bại: ${errMsg.slice(0, 200)}`, 500);
    }
  }

  // Strategy 2: Direct docker pg_dump (fallback or Linux)
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `postgres-${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);

  if (fs.existsSync(filepath)) {
    return errorResponse("File backup đã tồn tại, vui lòng thử lại sau", 409);
  }

  const containerName = "logistics-postgres";
  const dbUser = "postgres";
  const dbName = "logistics_db";

  try {
    const cmd = `docker exec ${containerName} pg_dump -U ${dbUser} ${dbName}`;
    const output = execSync(cmd, {
      timeout: 120000,
      maxBuffer: 100 * 1024 * 1024,
      encoding: "utf-8",
    });

    if (!output || output.length === 0) {
      return errorResponse("Backup trống — database có thể trống hoặc container lỗi", 500);
    }

    fs.writeFileSync(filepath, output, "utf-8");
    const stat = fs.statSync(filepath);
    const sizeMB = Math.round((stat.size / (1024 * 1024)) * 10) / 10;

    return jsonResponse({
      success: true,
      message: "Backup database thành công",
      filename,
      sizeMB,
      createdAt: now.toISOString(),
      method: "docker",
      summary: `pg_dump via Docker container ${containerName}`,
    });
  } catch (err) {
    if (fs.existsSync(filepath)) {
      try { fs.unlinkSync(filepath); } catch { /* ignore */ }
    }

    const errMsg = err instanceof Error ? err.message : String(err);

    if (errMsg.includes("not found") || errMsg.includes("not recognized") || errMsg.includes("ENOENT")) {
      const hint = isWindows
        ? `Docker không khả dụng. Script backup cũng không tìm thấy tại: scripts\\backup-db.bat`
        : "Docker không khả dụng — không thể backup database";
      return errorResponse(hint, 500);
    }

    if (errMsg.includes("No such container") || errMsg.includes("is not running")) {
      return errorResponse(`Container "${containerName}" không chạy. Chạy: docker start ${containerName}`, 500);
    }

    return errorResponse(`Backup thất bại: ${errMsg.slice(0, 200)}`, 500);
  }
});
