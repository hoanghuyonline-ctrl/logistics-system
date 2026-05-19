export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import * as fs from "fs";
import * as path from "path";

interface BackupInfo {
  exists: boolean;
  folderPath: string;
  latestFile: string | null;
  latestTime: string | null;
  ageHours: number | null;
  fileCount: number;
  totalSizeMB: number;
  status: "ok" | "warning" | "danger" | "missing";
  statusLabel: string;
}

function checkBackupFolder(
  folderPath: string,
  pattern: RegExp,
  warningHours: number,
  dangerHours: number,
): BackupInfo {
  const displayPath = folderPath.replace(/\\/g, "/").replace(/.*logistics-system\//, "");

  if (!fs.existsSync(folderPath)) {
    return {
      exists: false,
      folderPath: displayPath,
      latestFile: null,
      latestTime: null,
      ageHours: null,
      fileCount: 0,
      totalSizeMB: 0,
      status: "missing",
      statusLabel: "Không tìm thấy thư mục backup",
    };
  }

  let files: string[];
  try {
    files = fs.readdirSync(folderPath).filter((f) => pattern.test(f));
  } catch {
    return {
      exists: false,
      folderPath: displayPath,
      latestFile: null,
      latestTime: null,
      ageHours: null,
      fileCount: 0,
      totalSizeMB: 0,
      status: "missing",
      statusLabel: "Không đọc được thư mục backup",
    };
  }

  if (files.length === 0) {
    return {
      exists: true,
      folderPath: displayPath,
      latestFile: null,
      latestTime: null,
      ageHours: null,
      fileCount: 0,
      totalSizeMB: 0,
      status: "danger",
      statusLabel: "Chưa có file backup nào",
    };
  }

  let latestFile: string | null = null;
  let latestMtime = 0;
  let totalSize = 0;

  for (const f of files) {
    try {
      const stat = fs.statSync(path.join(folderPath, f));
      totalSize += stat.size;
      if (stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        latestFile = f;
      }
    } catch {
      // skip unreadable files
    }
  }

  const now = Date.now();
  const ageHours = latestMtime > 0 ? Math.floor((now - latestMtime) / (1000 * 60 * 60)) : null;

  let status: "ok" | "warning" | "danger";
  let statusLabel: string;

  if (ageHours === null) {
    status = "danger";
    statusLabel = "Không xác định được thời gian backup";
  } else if (ageHours >= dangerHours) {
    status = "danger";
    statusLabel = `Backup cũ ${ageHours}h — cần backup ngay!`;
  } else if (ageHours >= warningHours) {
    status = "warning";
    statusLabel = `Backup ${ageHours}h trước — nên backup sớm`;
  } else {
    status = "ok";
    statusLabel = `Backup ${ageHours}h trước — bình thường`;
  }

  return {
    exists: true,
    folderPath: displayPath,
    latestFile,
    latestTime: latestMtime > 0 ? new Date(latestMtime).toISOString() : null,
    ageHours,
    fileCount: files.length,
    totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 10) / 10,
    status,
    statusLabel,
  };
}

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  // Resolve project root — works on both Windows production and Linux dev
  const projectRoot = path.resolve(/* turbopackIgnore: true */ process.cwd());
  const dbBackupDir = path.join(projectRoot, "backups", "postgres");
  const uploadsBackupDir = path.join(projectRoot, "backups", "uploads");

  const database = checkBackupFolder(dbBackupDir, /^postgres-.*\.sql$/i, 24, 48);
  const uploads = checkBackupFolder(uploadsBackupDir, /^uploads-.*\.zip$/i, 24, 48);

  // Overall health
  const statuses = [database.status, uploads.status];
  const overallStatus: "ok" | "warning" | "danger" | "missing" =
    statuses.includes("danger") || statuses.includes("missing")
      ? "danger"
      : statuses.includes("warning")
        ? "warning"
        : "ok";

  const overallLabel =
    overallStatus === "danger"
      ? "Cần kiểm tra backup ngay!"
      : overallStatus === "warning"
        ? "Backup cần cập nhật"
        : "Backup bình thường";

  const hasRecoveryGuide = fs.existsSync(
    path.join(projectRoot, "docs", "BACKUP_AND_RECOVERY.md"),
  );

  return jsonResponse({
    database,
    uploads,
    overall: {
      status: overallStatus,
      label: overallLabel,
    },
    hasRecoveryGuide,
    retentionDays: 7,
  });
});
