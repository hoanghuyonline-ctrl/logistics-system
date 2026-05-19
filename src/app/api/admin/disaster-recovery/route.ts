export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import * as fs from "fs";
import * as path from "path";

interface BackupFileInfo {
  exists: boolean;
  latestFile: string | null;
  latestTime: string | null;
  ageHours: number | null;
  status: "ok" | "warning" | "danger" | "missing";
}

function checkBackupDir(
  folderPath: string,
  pattern: RegExp,
  warningHours: number,
  dangerHours: number,
): BackupFileInfo {
  if (!fs.existsSync(folderPath)) {
    return { exists: false, latestFile: null, latestTime: null, ageHours: null, status: "missing" };
  }

  let files: string[];
  try {
    files = fs.readdirSync(folderPath).filter((f) => pattern.test(f));
  } catch {
    return { exists: false, latestFile: null, latestTime: null, ageHours: null, status: "missing" };
  }

  if (files.length === 0) {
    return { exists: true, latestFile: null, latestTime: null, ageHours: null, status: "danger" };
  }

  let latestFile: string | null = null;
  let latestMtime = 0;
  for (const f of files) {
    try {
      const stat = fs.statSync(path.join(folderPath, f));
      if (stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        latestFile = f;
      }
    } catch {
      // skip unreadable files
    }
  }

  const ageHours = latestMtime > 0 ? Math.floor((Date.now() - latestMtime) / (1000 * 60 * 60)) : null;

  let status: "ok" | "warning" | "danger";
  if (ageHours === null) {
    status = "danger";
  } else if (ageHours >= dangerHours) {
    status = "danger";
  } else if (ageHours >= warningHours) {
    status = "warning";
  } else {
    status = "ok";
  }

  return {
    exists: true,
    latestFile,
    latestTime: latestMtime > 0 ? new Date(latestMtime).toISOString() : null,
    ageHours,
    status,
  };
}

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const projectRoot = path.resolve(/* turbopackIgnore: true */ process.cwd());
  const dbBackupDir = path.join(projectRoot, "backups", "postgres");
  const uploadsBackupDir = path.join(projectRoot, "backups", "uploads");

  const dbInfo = checkBackupDir(dbBackupDir, /^postgres-.*\.sql$/i, 24, 48);
  const uploadsInfo = checkBackupDir(uploadsBackupDir, /^uploads-.*\.zip$/i, 24, 48);

  // Determine overall readiness
  const dbOk = dbInfo.exists && dbInfo.latestFile !== null && dbInfo.status !== "danger" && dbInfo.status !== "missing";
  const uploadsOk = uploadsInfo.exists && uploadsInfo.latestFile !== null && uploadsInfo.status !== "danger" && uploadsInfo.status !== "missing";
  const dbBackupExists = dbInfo.exists && dbInfo.latestFile !== null;
  const uploadsBackupExists = uploadsInfo.exists && uploadsInfo.latestFile !== null;
  const backupAgeAcceptable = dbOk; // DB age is the primary signal

  let readiness: "READY" | "PARTIAL" | "WARNING";
  if (dbOk && uploadsOk) {
    readiness = "READY";
  } else if (dbBackupExists) {
    readiness = "PARTIAL";
  } else {
    readiness = "WARNING";
  }

  // Check for recovery guide
  const recoveryGuidePath = path.join(projectRoot, "docs", "BACKUP_AND_RECOVERY.md");
  const hasRecoveryGuide = fs.existsSync(recoveryGuidePath);

  // Check for restore scripts
  const hasRestoreDbScript = fs.existsSync(path.join(projectRoot, "scripts", "restore-db.bat"));
  const hasRestoreUploadsScript = fs.existsSync(path.join(projectRoot, "scripts", "restore-uploads.bat"));

  // Restore checklist
  const checklist = [
    {
      key: "restore_db",
      label: "Khôi phục PostgreSQL",
      command: hasRestoreDbScript
        ? "scripts\\restore-db.bat"
        : "docker exec -i logistics-postgres psql -U postgres logistics_db < backups/postgres/<FILE>.sql",
      available: dbBackupExists,
      hint: dbBackupExists
        ? `File mới nhất: ${dbInfo.latestFile}`
        : "Không có file backup database",
    },
    {
      key: "restore_uploads",
      label: "Khôi phục uploads",
      command: hasRestoreUploadsScript
        ? "scripts\\restore-uploads.bat"
        : "Giải nén file backup uploads vào thư mục uploads/",
      available: uploadsBackupExists,
      hint: uploadsBackupExists
        ? `File mới nhất: ${uploadsInfo.latestFile}`
        : "Không có file backup uploads",
    },
    {
      key: "prisma_generate",
      label: "Chạy prisma generate",
      command: "npx prisma generate",
      available: true,
      hint: "Tạo lại Prisma client sau khi khôi phục",
    },
    {
      key: "restart_pm2",
      label: "Khởi động lại PM2",
      command: "pm2 restart logistics-system",
      available: true,
      hint: "Restart ứng dụng sau khi khôi phục xong",
    },
  ];

  return jsonResponse({
    readiness,
    database: {
      backupExists: dbBackupExists,
      latestFile: dbInfo.latestFile,
      latestTime: dbInfo.latestTime,
      ageHours: dbInfo.ageHours,
      status: dbInfo.status,
    },
    uploads: {
      backupExists: uploadsBackupExists,
      latestFile: uploadsInfo.latestFile,
      latestTime: uploadsInfo.latestTime,
      ageHours: uploadsInfo.ageHours,
      status: uploadsInfo.status,
    },
    backupAgeAcceptable,
    checklist,
    hasRecoveryGuide,
    hasRestoreDbScript,
    hasRestoreUploadsScript,
  });
});
