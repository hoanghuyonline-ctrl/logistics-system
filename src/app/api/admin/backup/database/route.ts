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

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
    } catch {
      return errorResponse("Không thể tạo thư mục backup", 500);
    }
  }

  // Generate timestamped filename
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `postgres-${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);

  // Check if file already exists
  if (fs.existsSync(filepath)) {
    return errorResponse("File backup đã tồn tại, vui lòng thử lại sau", 409);
  }

  const isWindows = process.platform === "win32";
  const containerName = "logistics-postgres";
  const dbUser = "postgres";
  const dbName = "logistics_db";

  try {
    // Try docker pg_dump first (production path)
    const cmd = isWindows
      ? `docker exec ${containerName} pg_dump -U ${dbUser} ${dbName}`
      : `docker exec ${containerName} pg_dump -U ${dbUser} ${dbName}`;

    const output = execSync(cmd, {
      timeout: 120000, // 2 minute timeout
      maxBuffer: 100 * 1024 * 1024, // 100MB
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
      message: `Backup database thành công`,
      filename,
      sizeMB,
      createdAt: now.toISOString(),
    });
  } catch (err) {
    // Clean up empty/partial file
    if (fs.existsSync(filepath)) {
      try { fs.unlinkSync(filepath); } catch { /* ignore */ }
    }

    const errMsg = err instanceof Error ? err.message : String(err);

    // Check if Docker is not available
    if (errMsg.includes("not found") || errMsg.includes("not recognized") || errMsg.includes("ENOENT")) {
      return errorResponse("Docker không khả dụng — không thể backup database. Chạy backup thủ công: scripts\\backup-db.bat", 500);
    }

    // Check if container is not running
    if (errMsg.includes("No such container") || errMsg.includes("is not running")) {
      return errorResponse(`Container "${containerName}" không chạy. Chạy: docker start ${containerName}`, 500);
    }

    return errorResponse(`Backup thất bại: ${errMsg.slice(0, 200)}`, 500);
  }
});
