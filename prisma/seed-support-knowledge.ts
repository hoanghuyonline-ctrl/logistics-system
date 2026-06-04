/**
 * Standalone SupportKnowledge import script.
 * Safe for production — upserts by title, no demo/order/user data.
 *
 * Usage: npm run seed:knowledge
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { supportKnowledgeEntries } from "./support-knowledge-data";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`[seed:knowledge] Starting — ${supportKnowledgeEntries.length} entries to process`);

  let created = 0;
  let skipped = 0;

  for (const entry of supportKnowledgeEntries) {
    const existing = await prisma.supportKnowledge.findFirst({
      where: { title: entry.title },
    });

    if (existing) {
      skipped++;
    } else {
      await prisma.supportKnowledge.create({ data: entry });
      created++;
    }
  }

  console.log(`[seed:knowledge] Done — created=${created} skipped=${skipped} total=${supportKnowledgeEntries.length}`);
}

main()
  .catch((e) => {
    console.error("[seed:knowledge] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
