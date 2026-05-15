import { prisma } from "@/lib/prisma";
import { recordLeadActivity } from "@/lib/lead-activity";

type LeadChannel = "ZALO" | "FACEBOOK";

interface LeadIntakeParams {
  channel: LeadChannel;
  senderId: string;
  senderName?: string;
}

/**
 * Create or update a CRM lead from an incoming Zalo/Messenger message.
 * Deduplicates by sender ID (zaloSenderId / facebookSenderId).
 * Fire-and-forget — errors are logged but never thrown to callers.
 */
export async function upsertLeadFromChannel(params: LeadIntakeParams): Promise<void> {
  const { channel, senderId, senderName } = params;

  try {
    if (channel === "ZALO") {
      const existing = await prisma.lead.findUnique({
        where: { zaloSenderId: senderId },
      });

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: { lastContactedAt: new Date() },
        });
        recordLeadActivity(existing.id, "MESSAGE_RECEIVED", "Zalo").catch(() => {});
        console.log(`[lead-intake] updated | channel=ZALO senderId=${senderId} leadId=${existing.id}`);
        return;
      }

      const lead = await prisma.lead.create({
        data: {
          fullName: senderName || `Zalo ${senderId.slice(-6)}`,
          zaloName: senderName || null,
          zaloSenderId: senderId,
          source: "ZALO",
          isAutoCreated: true,
          lastContactedAt: new Date(),
        },
      });
      recordLeadActivity(lead.id, "AUTO_CREATED", "Zalo").catch(() => {});
      console.log(`[lead-intake] created | channel=ZALO senderId=${senderId} leadId=${lead.id}`);
    } else {
      const existing = await prisma.lead.findUnique({
        where: { facebookSenderId: senderId },
      });

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: { lastContactedAt: new Date() },
        });
        recordLeadActivity(existing.id, "MESSAGE_RECEIVED", "Facebook").catch(() => {});
        console.log(`[lead-intake] updated | channel=FACEBOOK senderId=${senderId} leadId=${existing.id}`);
        return;
      }

      const lead = await prisma.lead.create({
        data: {
          fullName: senderName || `FB ${senderId.slice(-6)}`,
          facebookName: senderName || null,
          facebookSenderId: senderId,
          source: "FACEBOOK",
          isAutoCreated: true,
          lastContactedAt: new Date(),
        },
      });
      recordLeadActivity(lead.id, "AUTO_CREATED", "Facebook").catch(() => {});
      console.log(`[lead-intake] created | channel=FACEBOOK senderId=${senderId} leadId=${lead.id}`);
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[lead-intake] ERROR | channel=${channel} senderId=${senderId} reason=${reason}`);
  }
}
