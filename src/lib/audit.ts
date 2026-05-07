export type AuditAction =
  | "ORDER_STATUS_CHANGE"
  | "PACKAGE_STATUS_CHANGE"
  | "WAREHOUSE_SCAN_LOOKUP"
  | "WAREHOUSE_SCAN_UPDATE"
  | "WAREHOUSE_RECEIVE_CN"
  | "WAREHOUSE_RECEIVE_VN"
  | "WAREHOUSE_DELIVERY";

export interface AuditEntry {
  action: AuditAction;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  entityType: "order" | "package";
  entityId: string;
  entityCode: string;
  details?: Record<string, unknown>;
}

export function auditLog(entry: AuditEntry): void {
  const log = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  console.log(`[audit] ${JSON.stringify(log)}`);
}
