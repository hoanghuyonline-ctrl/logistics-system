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

/**
 * Capture and store customer's phone number as a highly-valuable lead.
 * Auto-creates or updates Lead in CRM database for immediate sales team notification.
 */
export async function capturePhoneLead(
  phone: string,
  senderId: string,
  channel: "ZALO" | "FACEBOOK" | "TELEGRAM"
): Promise<boolean> {
  try {
    console.log(`[lead-intake/phone] CAPTURING | channel=${channel} senderId=${senderId} phone=${phone}`);
    
    if (channel === "ZALO") {
      const existing = await prisma.lead.findUnique({
        where: { zaloSenderId: senderId },
      });

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: { phone, status: "INTERESTED", lastContactedAt: new Date() },
        });
        recordLeadActivity(existing.id, "CONTACTED", `Phone captured via Zalo Chatbot: ${phone}`).catch(() => {});
        console.log(`[lead-intake/phone] updated existing | leadId=${existing.id} phone=${phone}`);
        return true;
      }

      const lead = await prisma.lead.create({
        data: {
          fullName: `Zalo Lead ${phone}`,
          phone,
          zaloSenderId: senderId,
          source: "ZALO",
          status: "NEW",
          isAutoCreated: true,
          lastContactedAt: new Date(),
        },
      });
      recordLeadActivity(lead.id, "AUTO_CREATED", `New lead via Zalo phone capture: ${phone}`).catch(() => {});
      console.log(`[lead-intake/phone] created new Zalo lead | leadId=${lead.id} phone=${phone}`);
      return true;
    } else if (channel === "FACEBOOK") {
      const existing = await prisma.lead.findUnique({
        where: { facebookSenderId: senderId },
      });

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: { phone, status: "INTERESTED", lastContactedAt: new Date() },
        });
        recordLeadActivity(existing.id, "CONTACTED", `Phone captured via FB Messenger: ${phone}`).catch(() => {});
        console.log(`[lead-intake/phone] updated existing FB | leadId=${existing.id} phone=${phone}`);
        return true;
      }

      const lead = await prisma.lead.create({
        data: {
          fullName: `Facebook Lead ${phone}`,
          phone,
          facebookSenderId: senderId,
          source: "FACEBOOK",
          status: "NEW",
          isAutoCreated: true,
          lastContactedAt: new Date(),
        },
      });
      recordLeadActivity(lead.id, "AUTO_CREATED", `New lead via FB phone capture: ${phone}`).catch(() => {});
      console.log(`[lead-intake/phone] created new FB lead | leadId=${lead.id} phone=${phone}`);
      return true;
    } else {
      // TELEGRAM or other channels
      const lead = await prisma.lead.create({
        data: {
          fullName: `Telegram Lead ${phone}`,
          phone,
          source: "OTHER",
          status: "NEW",
          isAutoCreated: true,
          notes: `Telegram Chat ID: ${senderId}`,
          lastContactedAt: new Date(),
        },
      });
      recordLeadActivity(lead.id, "AUTO_CREATED", `New lead via Telegram capture: ${phone}`).catch(() => {});
      console.log(`[lead-intake/phone] created new Telegram/Other lead | leadId=${lead.id} phone=${phone}`);
      return true;
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[lead-intake/phone] ERROR | channel=${channel} senderId=${senderId} reason=${reason}`);
    return false;
  }
}
