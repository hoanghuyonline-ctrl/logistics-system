import { prisma } from "@/lib/prisma";

export type LeadAction =
  | "CREATED"
  | "STATUS_CHANGED"
  | "NOTE_UPDATED"
  | "ASSIGNED"
  | "CONTACTED"
  | "FOLLOW_UP_SET"
  | "CONVERTED"
  | "AUTO_CREATED"
  | "MESSAGE_RECEIVED";

export async function recordLeadActivity(
  leadId: string,
  action: LeadAction,
  detail?: string,
  actorId?: string,
): Promise<void> {
  try {
    await prisma.leadActivity.create({
      data: { leadId, action, detail: detail || null, actorId: actorId || null },
    });
  } catch (err) {
    console.error(`[lead-activity] ERROR | leadId=${leadId} action=${action}`, err);
  }
}
