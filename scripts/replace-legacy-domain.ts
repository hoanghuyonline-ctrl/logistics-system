import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Scanning database for legacy domain 'thue.eu.cc'...");

  // 1. Scan SupportKnowledge
  const supportEntries = await prisma.supportKnowledge.findMany();
  let supportUpdatedCount = 0;
  for (const entry of supportEntries) {
    const hasLegacy = 
      entry.content.includes("thue.eu.cc") || 
      (entry.keywords && entry.keywords.includes("thue.eu.cc")) || 
      entry.title.includes("thue.eu.cc");

    if (hasLegacy) {
      const updatedContent = entry.content.replace(/thue\.eu\.cc/gi, "bactrunghai.vn");
      const updatedKeywords = entry.keywords ? entry.keywords.replace(/thue\.eu\.cc/gi, "bactrunghai.vn") : null;
      const updatedTitle = entry.title.replace(/thue\.eu\.cc/gi, "bactrunghai.vn");
      
      await prisma.supportKnowledge.update({
        where: { id: entry.id },
        data: {
          content: updatedContent,
          keywords: updatedKeywords,
          title: updatedTitle,
        }
      });
      supportUpdatedCount++;
      console.log(`[supportKnowledge] Updated ID: ${entry.id} | Title: ${entry.title}`);
    }
  }
  console.log(`[supportKnowledge] Completed. Updated ${supportUpdatedCount} entries.`);

  // 2. Scan SystemConfig
  const configEntries = await prisma.systemConfig.findMany();
  let configUpdatedCount = 0;
  for (const config of configEntries) {
    if (config.value.includes("thue.eu.cc")) {
      const updatedValue = config.value.replace(/thue\.eu\.cc/gi, "bactrunghai.vn");
      await prisma.systemConfig.update({
        where: { id: config.id },
        data: { value: updatedValue }
      });
      configUpdatedCount++;
      console.log(`[systemConfig] Updated Key: ${config.key}`);
    }
  }
  console.log(`[systemConfig] Completed. Updated ${configUpdatedCount} configs.`);

  console.log("Domain replacement migration finished successfully!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
